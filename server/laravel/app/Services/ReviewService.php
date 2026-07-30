<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\DomainValidationException;
use App\Models\Review;
use App\Models\SkillRequest;
use App\Models\User;
use App\Repositories\ReviewRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Redis;

class ReviewService
{
    public function __construct(
        private readonly ReviewRepository $repository,
    ) {}

    /**
     * Create a review for a completed skill request.
     *
     * The duplicate-check is two-layered: guardNoDuplicate is a fast,
     * friendly pre-check for the common case. The repository's create()
     * returns null on 23505 (unique constraint violation), which is
     * translated to REVIEW_ALREADY_SUBMITTED here — matching the
     * "repository returns absence, service throws domain exception" pattern.
     *
     * @throws DomainValidationException If the request is not completed,
     *                                   the reviewer is not a participant,
     *                                   or a review was already submitted.
     */
    public function create(User $reviewer, array $data): Review
    {
        $skillRequest = SkillRequest::findOrFail($data['skill_request_id']);

        $this->guardRequestIsCompleted($skillRequest);
        $this->guardIsParticipant($skillRequest, $reviewer->id);
        $this->guardNoDuplicate($skillRequest->id, $reviewer->id);

        $revieweeId = $skillRequest->learner_id === $reviewer->id
            ? $skillRequest->teacher_id
            : $skillRequest->learner_id;

        $review = $this->repository->create([
            'skill_request_id' => $skillRequest->id,
            'reviewer_id'      => $reviewer->id,
            'reviewee_id'      => $revieweeId,
            'rating'           => $data['rating'],
            'comment'          => $data['comment'] ?? null,
        ]);

        if ($review === null) {
            throw new DomainValidationException(
                'You have already reviewed this request.',
                'REVIEW_ALREADY_SUBMITTED',
                409,
            );
        }

        // Invalidate the reviewee's average rating cache.
        try {
            Redis::del("rating:avg:{$revieweeId}");
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Rating cache invalidation failed.', [
                'reviewee_id' => $revieweeId,
                'exception'   => $e->getMessage(),
            ]);
        }

        return $review;
    }

    /**
     * Get public reviews for a user (page-based).
     */
    public function getByReviewee(string $userId): LengthAwarePaginator
    {
        return $this->repository->findByReviewee($userId);
    }

    /**
     * Get the average rating and review count for a user.
     * Reads from Redis cache, computes and caches on miss.
     */
    public function getAverageRating(string $userId): array
    {
        $cacheKey = "rating:avg:{$userId}";
        $cached   = Redis::get($cacheKey);

        if ($cached !== null) {
            $decoded = json_decode($cached, true);

            if (is_array($decoded) && isset($decoded['average'], $decoded['count'])) {
                return $decoded;
            }
            // Corrupt or malformed cache — fall through to recompute.
        }

        $result = $this->repository->averageRating($userId);

        try {
            Redis::setex(
                $cacheKey,
                (int) config('skillswap.rating_cache_ttl_minutes', 60) * 60,
                json_encode($result),
            );
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Rating cache write failed.', [
                'user_id'   => $userId,
                'exception' => $e->getMessage(),
            ]);
        }

        return $result;
    }

    // ── Guards ────────────────────────────────────────────────────────────

    private function guardRequestIsCompleted(SkillRequest $skillRequest): void
    {
        if ($skillRequest->status !== \App\Enums\SkillRequestStatus::COMPLETED) {
            throw new DomainValidationException(
                'Reviews can only be created for completed requests.',
                'REQUEST_NOT_COMPLETED',
                400,
            );
        }
    }

    private function guardIsParticipant(SkillRequest $skillRequest, string $userId): void
    {
        if ($skillRequest->learner_id !== $userId && $skillRequest->teacher_id !== $userId) {
            throw new DomainValidationException(
                'You are not a participant in this request.',
                'NOT_A_PARTICIPANT',
                403,
            );
        }
    }

    private function guardNoDuplicate(string $skillRequestId, string $reviewerId): void
    {
        if ($this->repository->existsForRequestAndReviewer($skillRequestId, $reviewerId)) {
            throw new DomainValidationException(
                'You have already reviewed this request.',
                'REVIEW_ALREADY_SUBMITTED',
                409,
            );
        }
    }
}