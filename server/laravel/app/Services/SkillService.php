<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\DomainValidationException;
use App\Models\Skill;
use App\Repositories\SkillRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SkillService
{
    public function __construct(
        private readonly SkillRepository $skillRepository,
    ) {}

    /**
     * Create a new skill with auto-generated slug.
     */
    public function create(array $data): Skill
    {
        $data['slug'] = Str::slug($data['name']);

        return $this->skillRepository->create($data);
    }

    /**
     * Update a skill. Regenerates slug if the name changed.
     */
    public function update(Skill $skill, array $data): Skill
    {
        if (isset($data['name']) && $data['name'] !== $skill->name) {
            $data['slug'] = Str::slug($data['name']);
        }

        return $this->skillRepository->update($skill, $data);
    }

    /**
     * Delete a skill if it is not referenced by any active data.
     *
     * @throws DomainValidationException If the skill is still in use.
     */
    public function delete(Skill $skill): void
    {
        DB::transaction(function () use ($skill) {
            $skill = $this->skillRepository->findById($skill->id);

            if ($this->skillRepository->isInUse($skill)) {
                throw new DomainValidationException(
                    'Cannot delete this skill — it is still in use.',
                    'SKILL_IN_USE',
                    409,
                );
            }

            $this->skillRepository->delete($skill);
        });
    }
}