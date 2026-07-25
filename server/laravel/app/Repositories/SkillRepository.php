<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Enums\SkillRequestStatus;
use App\Models\Skill;

/**
 * Handles all Eloquent queries for the skills table.
 * No business logic or validation — only database access.
 */
class SkillRepository
{
    /**
     * Find a skill by its UUID.
     */
    public function findById(string $id): ?Skill
    {
        return Skill::find($id);
    }

     /**
     * Find a skill by its UUID with a row lock for update operations.
     * Used inside transactions to prevent race conditions during deletion.
     */
    public function findByIdForUpdate(string $id): ?Skill
    {
        return Skill::where('id', $id)->lockForUpdate()->first();
    }

    /**
     * Get all skills ordered alphabetically by name.
     */
    public function getAllOrderedByName(): \Illuminate\Database\Eloquent\Collection
    {
        return Skill::orderBy('name')->get();
    }

    /**
     * Create a new skill and return the model.
     */
    public function create(array $data): Skill
    {
        return Skill::create($data);
    }

    /**
     * Update an existing skill with the given data.
     */
    public function update(Skill $skill, array $data): Skill
    {
        $skill->update($data);

        return $skill;
    }

    /**
     * Check whether a skill is referenced by any user_skills
     * or non-terminal skill_requests — if so, deletion should be blocked.
     */
    public function isInUse(Skill $skill): bool
    {
        $hasUserSkills = $skill->userSkills()->exists();

        $hasActiveRequests = $skill->skillRequests()
            ->whereNotIn('status', [
                SkillRequestStatus::COMPLETED->value,
                SkillRequestStatus::REJECTED->value,
                SkillRequestStatus::CANCELLED->value,
                SkillRequestStatus::EXPIRED->value,
            ])
            ->exists();

        return $hasUserSkills || $hasActiveRequests;
    }

    /**
     * Delete a skill.
     */
    public function delete(Skill $skill): void
    {
        $skill->delete();
    }
}