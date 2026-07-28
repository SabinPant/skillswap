<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\SkillRequestStatus;
use App\Exceptions\DomainValidationException;
use App\Models\SkillRequest;
use App\Models\User;
use App\Repositories\SkillRequestRepository;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SkillRequestService
{
    /**
     * Legal state transitions.
     */
    private const TRANSITIONS = [
        SkillRequestStatus::PENDING->value => [
            SkillRequestStatus::ACCEPTED->value,
            SkillRequestStatus::REJECTED->value,
            SkillRequestStatus::EXPIRED->value,
        ],
        SkillRequestStatus::ACCEPTED->value => [
            SkillRequestStatus::CANCELLED->value,
            SkillRequestStatus::COMPLETED->value,
        ],
    ];

    public function __construct(
        private readonly SkillRequestRepository $repository,
        private readonly \App\Repositories\UserSkillRepository $userSkillRepository,

    ) {}

    /**
     * Create a new skill request (learner action).
     */
    public function create(User $learner, array $data): SkillRequest
    {
        $teacherId = $data['teacher_id'];
        $skillId   = $data['skill_id'];

        $this->guardNotOwnSkill($learner->id, $teacherId);
        $this->guardSkillTaughtByTeacher($teacherId, $skillId);
        $this->guardEmailVerified($learner);
        $this->guardNotSuspended($learner);
        $this->guardNoDuplicatePending($learner->id, $teacherId, $skillId);

        $data['learner_id'] = $learner->id;
        $data['status']     = SkillRequestStatus::PENDING;
        $data['expires_at'] = Carbon::now()->addHours(
            (int) config('skillswap.request_expiry_hours', 72)
        );

        $request = $this->repository->create($data);

        event(new \App\Events\SkillRequestCreated($request));

        return $request;
    }

    /**
     * Teacher accepts a pending request.
     */
    public function accept(string $id, User $teacher): SkillRequest
    {
        return DB::transaction(function () use ($id, $teacher) {
            $request = $this->repository->findByIdForUpdateAsParticipant($id, $teacher->id);

            if ($request === null) {
                throw new DomainValidationException(
                    'Skill request not found.', 'NOT_FOUND', 404
                );
            }

            $this->guardTeacherOnly($request, $teacher);
            $this->guardCanTransition($request, SkillRequestStatus::ACCEPTED);

            $this->repository->updateStatus($request, [
                'status' => SkillRequestStatus::ACCEPTED,
            ]);

            event(new \App\Events\SkillRequestStatusChanged(
                $request,
                SkillRequestStatus::PENDING,
                $teacher
            ));

            return $request;
        });
    }

    /**
     * Teacher rejects a pending request.
     */
    public function reject(string $id, User $teacher): SkillRequest
    {
        return DB::transaction(function () use ($id, $teacher) {
            $request = $this->repository->findByIdForUpdateAsParticipant($id, $teacher->id);

            if ($request === null) {
                throw new DomainValidationException(
                    'Skill request not found.', 'NOT_FOUND', 404
                );
            }

            $this->guardTeacherOnly($request, $teacher);
            $this->guardCanTransition($request, SkillRequestStatus::REJECTED);

            $this->repository->updateStatus($request, [
                'status' => SkillRequestStatus::REJECTED,
            ]);

            event(new \App\Events\SkillRequestStatusChanged(
                $request,
                SkillRequestStatus::PENDING,
                $teacher
            ));

            return $request;
        });
    }

    /**
     * Either party cancels an accepted request.
     */
    public function cancel(string $id, User $actor, string $reason): SkillRequest
    {
        return DB::transaction(function () use ($id, $actor, $reason) {
            $request = $this->repository->findByIdForUpdateAsParticipant($id, $actor->id);

            if ($request === null) {
                throw new DomainValidationException(
                    'Skill request not found.', 'NOT_FOUND', 404
                );
            }

            $this->guardCanTransition($request, SkillRequestStatus::CANCELLED);

            $this->repository->updateStatus($request, [
                'status'              => SkillRequestStatus::CANCELLED,
                'cancelled_by'        => $actor->id,
                'cancellation_reason' => $reason,
            ]);

            event(new \App\Events\SkillRequestStatusChanged(
                $request,
                SkillRequestStatus::ACCEPTED,
                $actor
            ));

            return $request;
        });
    }

    /**
     * Either party marks an accepted request as completed.
     */
    public function complete(string $id, User $actor): SkillRequest
    {
        return DB::transaction(function () use ($id, $actor) {
            $request = $this->repository->findByIdForUpdateAsParticipant($id, $actor->id);

            if ($request === null) {
                throw new DomainValidationException(
                    'Skill request not found.', 'NOT_FOUND', 404
                );
            }

            $this->guardCanTransition($request, SkillRequestStatus::COMPLETED);

            $this->repository->updateStatus($request, [
                'status'       => SkillRequestStatus::COMPLETED,
                'completed_by' => $actor->id,
                'completed_at' => Carbon::now(),
            ]);

            event(new \App\Events\SkillRequestStatusChanged(
                $request,
                SkillRequestStatus::ACCEPTED,
                $actor
            ));

            return $request;
        });
    }

    /**
     * System expiry — called by the scheduled job.
     * Returns null if the request no longer exists or has already been resolved.
     */
    public function expire(string $id): ?SkillRequest
    {
        return DB::transaction(function () use ($id) {
            $request = $this->repository->findByIdForUpdateRaw($id);

            if ($request === null) {
                \Illuminate\Support\Facades\Log::info('Expiry job: request not found.', ['id' => $id]);
                return null;
            }

            if ($request->status !== SkillRequestStatus::PENDING) {
                \Illuminate\Support\Facades\Log::info('Expiry job: request already resolved.', [
                    'id'     => $id,
                    'status' => $request->status->value,
                ]);
                return null;
            }

            $this->guardCanTransition($request, SkillRequestStatus::EXPIRED);

            $this->repository->updateStatus($request, [
                'status' => SkillRequestStatus::EXPIRED,
            ]);

            event(new \App\Events\SkillRequestStatusChanged(
                $request,
                SkillRequestStatus::PENDING,
                null
            ));

            return $request;
        });
    }

    /**
     * List incoming or outgoing requests for a user.
     *
     * @throws DomainValidationException If the status filter value is invalid.
     */
    public function list(string $userId, string $role, ?string $status = null): \Illuminate\Database\Eloquent\Collection
    {
        $statusEnum = null;

        if ($status !== null) {
            $statusEnum = SkillRequestStatus::tryFrom($status);

            if ($statusEnum === null) {
                throw new DomainValidationException(
                    'The selected status is invalid.',
                    'INVALID_STATUS_FILTER',
                    422,
                );
            }
        }

        return $role === 'teacher'
            ? $this->repository->findIncoming($userId, $statusEnum)
            : $this->repository->findOutgoing($userId, $statusEnum);
    }

    // ── Guards ────────────────────────────────────────────────────────────

    private function guardNotOwnSkill(string $learnerId, string $teacherId): void
    {
        if ($learnerId === $teacherId) {
            throw new DomainValidationException(
                'You cannot request your own skill.',
                'CANNOT_REQUEST_OWN_SKILL',
                400,
            );
        }
    }

    private function guardSkillTaughtByTeacher(string $teacherId, string $skillId): void
    {
        if (! $this->userSkillRepository->userTeachesSkill($teacherId, $skillId)) {
            throw new DomainValidationException(
                'This teacher does not offer the requested skill.',
                'SKILL_NOT_TAUGHT_BY_USER',
                400,
            );
        }
    }

    private function guardEmailVerified(User $user): void
    {
        if ($user->email_verified_at === null) {
            throw new DomainValidationException(
                'You must verify your email before sending a skill request.',
                'EMAIL_NOT_VERIFIED',
                403,
            );
        }
    }

    private function guardNotSuspended(User $user): void
    {
        if ($user->is_suspended) {
            throw new DomainValidationException(
                'Your account is suspended.',
                'ACCOUNT_SUSPENDED',
                403,
            );
        }
    }

    private function guardNoDuplicatePending(string $learnerId, string $teacherId, string $skillId): void
    {
        if ($this->repository->existsPendingRequest($learnerId, $teacherId, $skillId)) {
            throw new DomainValidationException(
                'You already have a pending request for this skill with this teacher.',
                'DUPLICATE_PENDING_REQUEST',
                409,
            );
        }
    }

    private function guardCanTransition(SkillRequest $request, SkillRequestStatus $target): void
    {
        $allowed = self::TRANSITIONS[$request->status->value] ?? [];

        if (! in_array($target->value, $allowed, true)) {
            throw new DomainValidationException(
                'This action is not allowed for the current request status.',
                'INVALID_STATUS_TRANSITION',
                409,
            );
        }
    }

    private function guardTeacherOnly(SkillRequest $request, User $user): void
    {
        if ($request->teacher_id !== $user->id) {
            throw new DomainValidationException(
                'Only the teacher can perform this action.',
                'INSUFFICIENT_PERMISSIONS',
                403,
            );
        }
    }
}