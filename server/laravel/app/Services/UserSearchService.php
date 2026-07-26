<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ProficiencyLevel;
use App\Enums\SkillCategory;
use App\Models\Skill;
use App\Repositories\UserSearchRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class UserSearchService
{
    public function __construct(
        private readonly UserSearchRepository $searchRepository,
    ) {}

    /**
     * Search for teachers matching the given criteria.
     *
     * Returns one row per teacher-skill pair. An empty result is returned
     * if the skill name matches no entries in the taxonomy.
     *
     * @return LengthAwarePaginator
     */
    public function search(array $validated): LengthAwarePaginator
    {
        // Resolve skill name to IDs (small taxonomy, ILIKE scan is cheap).
        $skillIds = Skill::where('name', 'ilike', "%{$validated['skill']}%")
            ->pluck('id')
            ->toArray();

        // No matching skills → empty paginated result.
        if (empty($skillIds)) {
            return new \Illuminate\Pagination\LengthAwarePaginator([], 0, 20);
        }

        // Expand min_proficiency to the set of qualifying levels.
        $proficiencyLevels = isset($validated['min_proficiency'])
            ? ProficiencyLevel::atLeast(ProficiencyLevel::from($validated['min_proficiency']))
            : ProficiencyLevel::atLeast(ProficiencyLevel::BEGINNER);

        // Wrap single category into an array for the repository.
        $categories = isset($validated['category'])
            ? [SkillCategory::from($validated['category'])]
            : null;

        return $this->searchRepository->searchTeachers(
            skillIds:          $skillIds,
            categories:        $categories,
            lat:               $validated['lat'] ?? null,
            lng:               $validated['lng'] ?? null,
            radiusKm:          isset($validated['radius_km']) ? (int) $validated['radius_km'] : null,
            proficiencyLevels: $proficiencyLevels,
            perPage:           20,
        );
    }
}