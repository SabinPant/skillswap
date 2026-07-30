<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\Review;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ReviewRepository
{
    /**
     * Create a new review.
     * Uses forceFill to persist service-computed fields (reviewee_id)
     * that are excluded from $fillable.
     */
    public function create(array $data): Review
    {
        $review = new Review();
        $review->forceFill($data)->save();

        return $review;
    }

    /**
     * Check if a reviewer has already reviewed a specific request.
     */
    public function existsForRequestAndReviewer(string $skillRequestId, string $reviewerId): bool
    {
        return Review::where('skill_request_id', $skillRequestId)
            ->where('reviewer_id', $reviewerId)
            ->exists();
    }

    /**
     * Get public reviews received by a user (page-based, excludes hidden).
     */
    public function findByReviewee(string $userId, int $perPage = 20): LengthAwarePaginator
    {
        return Review::where('reviewee_id', $userId)
            ->where('is_hidden', false)
            ->with('reviewer:id,name,avatar_public_id')
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Compute the average rating and total review count for a user.
     * Includes hidden reviews for audit accuracy per SKILLSWAP.md.
     *
     * @return array{average: ?float, count: int}
     */
    public function averageRating(string $userId): array
    {
        $result = Review::where('reviewee_id', $userId)
            ->selectRaw('AVG(rating) as average, COUNT(*) as count')
            ->first();

        return [
            'average' => $result->average !== null ? round((float) $result->average, 1) : null,
            'count'   => (int) $result->count,
        ];
    }
}