<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\DomainValidationException;
use App\Models\User;
use App\Models\UserSkill;
use App\Repositories\UserSkillRepository;
use Illuminate\Database\Eloquent\Collection;

class UserSkillService
{
    public function __construct(
        private readonly UserSkillRepository $userSkillRepository,
    ) {}

    /**
     * Add a skill to a user's profile.
     *
     * @throws DomainValidationException If the user already has this skill,
     *                                   or if neither teach nor learn intent is set.
     */
    public function add(User $user, array $data): UserSkill
    {
        if ($this->userSkillRepository->existsForUserAndSkill($user, $data['skill_id'])) {
            throw new DomainValidationException(
                'You already have this skill listed.',
                'SKILL_ALREADY_ADDED',
                409,
            );
        }

        $this->validateIntent($data);

        $data['user_id'] = $user->id;

        return $this->userSkillRepository->create($data);
    }

    /**
     * Update an existing UserSkill. Only the owner may update.
     *
     * Validates intent against the merged state of incoming data
     * and the existing row, so partial updates are safe by default.
     *
     * @throws DomainValidationException If the row belongs to a different user,
     *                                   or if neither teach nor learn intent is set.
     */
    public function update(string $id, User $user, array $data): UserSkill
    {
        $userSkill = $this->userSkillRepository->findByIdForUser($id, $user);

        if ($userSkill === null) {
            throw new DomainValidationException(
                'User skill not found.',
                'NOT_FOUND',
                404,
            );
        }

        $canTeach     = (bool) ($data['can_teach'] ?? $userSkill->can_teach);
        $wantsToLearn = (bool) ($data['wants_to_learn'] ?? $userSkill->wants_to_learn);

        if (! $canTeach && ! $wantsToLearn) {
            throw new DomainValidationException(
                'At least one of can_teach or wants_to_learn must be true.',
                'SKILL_INTENT_REQUIRED',
                422,
            );
        }

        return $this->userSkillRepository->update($userSkill, $data);
    }

    /**
     * Remove a skill from a user's profile. Only the owner may delete.
     *
     * @throws DomainValidationException If the row belongs to a different user.
     */
    public function delete(string $id, User $user): void
    {
        $userSkill = $this->userSkillRepository->findByIdForUser($id, $user);

        if ($userSkill === null) {
            throw new DomainValidationException(
                'User skill not found.',
                'NOT_FOUND',
                404,
            );
        }

        $this->userSkillRepository->delete($userSkill);
    }

    /**
     * Get all skills for a user.
     */
    public function list(User $user): Collection
    {
        return $this->userSkillRepository->findByUser($user);
    }

    /**
     * Validate that at least one of can_teach or wants_to_learn is true.
     *
     * The database has a raw CHECK constraint as a backstop, but
     * this service-level check provides a clean error before hitting the DB.
     *
     * @throws DomainValidationException If both intents are false.
     */
    private function validateIntent(array $data): void
    {
        $canTeach     = (bool) ($data['can_teach'] ?? false);
        $wantsToLearn = (bool) ($data['wants_to_learn'] ?? false);

        if (! $canTeach && ! $wantsToLearn) {
            throw new DomainValidationException(
                'At least one of can_teach or wants_to_learn must be true.',
                'SKILL_INTENT_REQUIRED',
                422,
            );
        }
    }
}