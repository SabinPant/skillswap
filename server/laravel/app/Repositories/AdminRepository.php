<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\User;
use App\Models\Review;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class AdminRepository
{
    /**
     * Get all users (page-based, includes soft-deleted and suspended).
     */
    public function getUsersPaginated(int $perPage = 20): LengthAwarePaginator
    {
        return User::query()
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get all reviews (page-based, includes hidden).
     */
    public function getReviewsPaginated(int $perPage = 20): LengthAwarePaginator
    {
        return Review::with('reviewer:id,name,email')
            ->with('reviewee:id,name,email')
            ->latest()
            ->paginate($perPage);
    }
}