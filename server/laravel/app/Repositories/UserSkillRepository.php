<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\User;
use App\Models\UserSkill;
use Illuminate\Database\Eloquent\Collection;

class UserSkillRepository
{
    /**
     * Find a UserSkill by its UUID.
     */
    public function findById(string $id): ?UserSkill
    {
        return UserSkill::find($id);
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
        return $user->userSkills()->with('skill')->get();
    }
}