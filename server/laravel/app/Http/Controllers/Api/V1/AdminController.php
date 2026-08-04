<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Review;
use App\Repositories\AdminRepository;
use App\Repositories\ReviewRepository;
use App\Services\AdminService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        private readonly AdminService $adminService,
        private readonly AdminRepository $adminRepository,
        private readonly ReviewRepository $reviewRepository,
    ) {}

    public function stats(): JsonResponse
    {
        return $this->successResponse($this->adminService->getStats());
    }

    public function users(Request $request): JsonResponse
    {
        return $this->successResponse(
            $this->adminRepository->getUsersPaginated()
        );
    }

    public function suspendUser(string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $this->adminService->suspendUser($user);

        return $this->successResponse($user);
    }

    public function unsuspendUser(string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $this->adminService->unsuspendUser($user);

        return $this->successResponse($user);
    }

    public function reviews(Request $request): JsonResponse
    {
        return $this->successResponse(
            $this->adminRepository->getReviewsPaginated()
        );
    }

    public function hideReview(string $id): JsonResponse
    {
        $review = Review::findOrFail($id);
        $this->reviewRepository->hide($review);

        return $this->successResponse($review);
    }
}