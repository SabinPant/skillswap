<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ProficiencyLevel;
use App\Models\Skill;
use App\Models\User;
use App\Models\UserSkill;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<UserSkill>
 */
class UserSkillFactory extends Factory
{
    protected $model = UserSkill::class;

    public function definition(): array
    {
        return [
            'user_id'           => User::factory(),
            'skill_id'          => Skill::factory(),
            'proficiency_level' => fake()->randomElement(ProficiencyLevel::cases())->value,
            'can_teach'         => true,
            'wants_to_learn'    => false,
        ];
    }

    /**
     * The user wants to learn this skill (only).
     */
    public function learning(): static
    {
        return $this->state(fn () => [
            'can_teach'      => false,
            'wants_to_learn' => true,
        ]);
    }

    /**
     * The user both teaches and wants to learn this skill.
     */
    public function teachingAndLearning(): static
    {
        return $this->state(fn () => [
            'can_teach'      => true,
            'wants_to_learn' => true,
        ]);
    }
}