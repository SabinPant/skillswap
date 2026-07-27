<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\User;
use App\Models\UserSkill;
use Illuminate\Database\Eloquent\Collection;

class UserSkillRepository
{
    /**
     * Find a UserSkill by its UUID, scoped to the given user.
     * Returns null if not found or if the row belongs to a different user.
     */
    public function findByIdForUser(string $id, User $user): ?UserSkill
    {
        return $user->userSkills()->find($id);
    }

    /**
     * Check if a user already has a given skill listed.
     */
    public function existsForUserAndSkill(User $user, string $skillId): bool
    {
        return $user->userSkills()->where('skill_id', $skillId)->exists();
    }

    /**
     * Create a new UserSkill.
     */
    public function create(array $data): UserSkill
    {
        return UserSkill::create($data);
    }

    /**
     * Update an existing UserSkill.
     */
    public function update(UserSkill $userSkill, array $data): UserSkill
    {
        $userSkill->update($data);

        return $userSkill;
    }

    /**
     * Delete a UserSkill.
     */
    public function delete(UserSkill $userSkill): void
    {
        $userSkill->delete();
    }

    /**
     * Get all skills for a given user, with the skill relationship eager loaded.
     */
    public function findByUser(User $user): Collection
    {
        return $user->userSkills()->with('skill')->orderBy('created_at')->get();
    }

    /**
     * Check if a user teaches a specific skill.
     */
    public function userTeachesSkill(string $userId, string $skillId): bool
    {
        return \App\Models\UserSkill::where('user_id', $userId)
            ->where('skill_id', $skillId)
            ->where('can_teach', true)
            ->exists();
    }
}