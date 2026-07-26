<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Enums\SkillCategory;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class UserSearchRepository
{
    /**
     * Search for teachers by skill, category, location, and proficiency.
     *
     * @param string[] $skillIds          Skill UUIDs to search for.
     * @param SkillCategory[]|null $categories Skill categories to filter by.
     * @param float|null $lat             User's latitude for radius search.
     * @param float|null $lng             User's longitude for radius search.
     * @param int|null $radiusKm          Search radius in kilometers.
     * @param string[] $proficiencyLevels Proficiency levels to include.
     * @param int $perPage                Results per page.
     *
     * @return LengthAwarePaginator
     */
    public function searchTeachers(
        array $skillIds,
        ?array $categories,
        ?float $lat,
        ?float $lng,
        ?int $radiusKm,
        array $proficiencyLevels,
        int $perPage = 20,
    ): LengthAwarePaginator {
        $query = User::query()
            ->join('user_skills', 'users.id', '=', 'user_skills.user_id')
            ->join('skills', 'user_skills.skill_id', '=', 'skills.id')
            ->where('user_skills.can_teach', true)
            ->whereIn('user_skills.skill_id', $skillIds)
            ->whereIn('user_skills.proficiency_level', $proficiencyLevels)
            ->select(
                'users.id',
                'users.name',
                'users.bio',
                'users.location',
                'users.avatar_public_id',
                'users.latitude',
                'users.longitude',
                'users.created_at',
                'user_skills.proficiency_level',
                'user_skills.can_teach',
                'user_skills.wants_to_learn',
                'skills.name as skill_name',
                'skills.id as skill_id',
            );

        if (! empty($categories)) {
            $query->whereIn('skills.category', $categories);
        }

        if ($lat !== null && $lng !== null && $radiusKm !== null) {
            $haversine = DB::raw(
                "(6371 * acos(cos(radians(?)) * cos(radians(users.latitude)) * cos(radians(users.longitude) - radians(?)) + sin(radians(?)) * sin(radians(users.latitude))))"
            );

            $query->selectRaw("{$haversine} as distance_km", [$lat, $lng, $lat])
                ->whereRaw("({$haversine}) <= ?", [$lat, $lng, $lat, $radiusKm])
                ->orderBy('distance_km');
        }

        $query->distinct('users.id');

        return $query->paginate($perPage);
    }
}