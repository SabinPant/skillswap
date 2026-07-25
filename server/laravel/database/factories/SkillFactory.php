<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\SkillCategory;
use App\Models\Skill;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Skill>
 */
class SkillFactory extends Factory
{
    protected $model = Skill::class;

    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);

        return [
            'name'     => $name,
            'slug'     => Str::slug($name),
            'category' => fake()->randomElement(SkillCategory::cases())->value,
        ];
    }
}