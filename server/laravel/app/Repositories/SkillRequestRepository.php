<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Enums\SkillRequestStatus;
use App\Models\SkillRequest;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;

class SkillRequestRepository
{
    /**
     * Find a skill request by ID with a row lock, scoped to a participant.
     * Returns null if the request doesn't exist or the user is not a participant.
     */
    public function findByIdForUpdateAsParticipant(string $id, string $userId): ?SkillRequest
    {
        return SkillRequest::where('id', $id)
            ->where(function ($q) use ($userId) {
                $q->where('learner_id', $userId)
                  ->orWhere('teacher_id', $userId);
            })
            ->lockForUpdate()
            ->first();
    }

    /**
     * Find a skill request by ID, scoped to a participant (learner or teacher).
     * Returns null if the request doesn't exist or the user is not a participant.
     */
    public function findByIdForParticipant(string $id, string $userId): ?SkillRequest
    {
        return SkillRequest::where('id', $id)
            ->where(function ($q) use ($userId) {
                $q->where('learner_id', $userId)
                  ->orWhere('teacher_id', $userId);
            })
            ->first();
    }

    /**
     * Create a new skill request.
     */
    public function create(array $data): SkillRequest
    {
        return SkillRequest::create($data);
    }

    /**
     * Update the status and related fields of a skill request.
     * Used for all state transitions — only the provided fields are updated.
     */
    public function updateStatus(SkillRequest $skillRequest, array $data): SkillRequest
    {
        $skillRequest->update($data);

        return $skillRequest;
    }

    /**
     * Get incoming requests for a user (where they are the teacher).
     */
    public function findIncoming(string $userId, ?SkillRequestStatus $status = null): Collection
    {
        return SkillRequest::where('teacher_id', $userId)
            ->when($status, fn ($q) => $q->where('status', $status->value))
            ->with(['learner', 'skill'])
            ->latest()
            ->get();
    }

    /**
     * Get outgoing requests for a user (where they are the learner).
     */
    public function findOutgoing(string $userId, ?SkillRequestStatus $status = null): Collection
    {
        return SkillRequest::where('learner_id', $userId)
            ->when($status, fn ($q) => $q->where('status', $status->value))
            ->with(['teacher', 'skill'])
            ->latest()
            ->get();
    }

    /**
     * Get IDs of all pending requests whose expiry time has passed.
     * Used by the scheduled expiry job.
     */
    public function findExpiredPendingIds(): array
    {
        return SkillRequest::where('status', SkillRequestStatus::PENDING->value)
            ->where('expires_at', '<', Carbon::now())
            ->pluck('id')
            ->toArray();
    }
}