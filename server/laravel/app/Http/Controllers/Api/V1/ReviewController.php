<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Review\StoreReviewRequest;
use App\Services\ReviewService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        private readonly ReviewService $reviewService,
    ) {}

    /**
     * Create a review for a completed skill request.
     * Participant-scoped — the Service validates the reviewer is a participant.
     */
    public function store(StoreReviewRequest $request): JsonResponse
    {
        $review = $this->reviewService->create($request->user(), $request->validated());

        return $this->successResponse($review, [], 201);
    }

    /**
     * List public reviews for a user.
     * Public — any authenticated user can view any user's reviews.
     */
    public function index(string $userId): JsonResponse
    {
        $reviews = $this->reviewService->getByReviewee($userId);

        return $this->successResponse($reviews);
    }
}