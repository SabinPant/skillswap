<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\SkillRequestStatus;
use App\Models\Skill;
use App\Models\SkillRequest;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SkillRequest>
 */
class SkillRequestFactory extends Factory
{
    protected $model = SkillRequest::class;

    public function definition(): array
    {
        return [
            'learner_id'  => User::factory(),
            'teacher_id'  => User::factory(),
            'skill_id'    => Skill::factory(),
            'status'      => SkillRequestStatus::PENDING,
            'message'     => fake()->sentence(),
            'proposed_at' => Carbon::now()->addDays(7),
            'expires_at'  => Carbon::now()->addHours(72),
        ];
    }

    public function pending(): static
    {
        return $this->state(fn () => ['status' => SkillRequestStatus::PENDING]);
    }

    public function accepted(): static
    {
        return $this->state(fn () => ['status' => SkillRequestStatus::ACCEPTED]);
    }

    public function rejected(): static
    {
        return $this->state(fn () => ['status' => SkillRequestStatus::REJECTED]);
    }

    public function completed(): static
    {
        return $this->state(fn () => [
            'status'       => SkillRequestStatus::COMPLETED,
            'completed_at' => Carbon::now(),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn () => [
            'status'              => SkillRequestStatus::CANCELLED,
            'cancellation_reason' => fake()->sentence(),
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn () => [
            'status'     => SkillRequestStatus::EXPIRED,
            'expires_at' => Carbon::now()->subHour(),
        ]);
    }
}