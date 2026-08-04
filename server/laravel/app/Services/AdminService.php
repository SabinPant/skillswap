<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use App\Models\Skill;
use App\Models\SkillRequest;
use App\Models\Review;

class AdminService
{
    /**
     * Suspend a user account.
     * Sets is_suspended = true and records the timestamp.
     */
    public function suspendUser(User $user): void
    {
        $user->is_suspended = true;
        $user->suspended_at = now();
        $user->save();
    }

    /**
     * Unsuspend a user account.
     * Clears is_suspended and the timestamp.
     */
    public function unsuspendUser(User $user): void
    {
        $user->is_suspended = false;
        $user->suspended_at = null;
        $user->save();
    }

    /**
     * Platform-wide summary statistics.
     *
     * @return array<string, mixed>
     */
    public function getStats(): array
    {
        $totalRequests = SkillRequest::count();
        $completed     = SkillRequest::where('status', 'completed')->count();

        return [
            'users'             => User::count(),
            'skills'            => Skill::count(),
            'total_requests'    => $totalRequests,
            'completed_requests'=> $completed,
            'completion_rate'   => $totalRequests > 0
                ? round(($completed / $totalRequests) * 100, 1)
                : 0,
            'average_rating'    => round((float) Review::avg('rating'), 1),
        ];
    }
}