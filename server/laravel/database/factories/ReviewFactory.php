<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\SkillRequestStatus;
use App\Models\Review;
use App\Models\SkillRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Review>
 */
class ReviewFactory extends Factory
{
    protected $model = Review::class;

    public function definition(): array
    {
        $learner = User::factory()->create();
        $teacher = User::factory()->create();

        $skillRequest = SkillRequest::factory()->create([
            'learner_id' => $learner->id,
            'teacher_id' => $teacher->id,
            'status'     => SkillRequestStatus::COMPLETED,
        ]);

        return [
            'skill_request_id' => $skillRequest->id,
            'reviewer_id'      => $learner->id,
            'reviewee_id'      => $teacher->id,
            'rating'           => fake()->numberBetween(1, 5),
            'comment'          => fake()->optional()->sentence(),
            'is_hidden'        => false,
        ];
    }

    /**
     * The teacher reviews the learner (reverse direction).
     */
    public function fromTeacher(): static
    {
        return $this->state(function (array $attributes) {
            $skillRequest = SkillRequest::find($attributes['skill_request_id']);

            return [
                'reviewer_id' => $skillRequest->teacher_id,
                'reviewee_id' => $skillRequest->learner_id,
            ];
        });
    }

    /**
     * Review is hidden from public listings (but still counts in averages).
     */
    public function hidden(): static
    {
        return $this->state(fn () => ['is_hidden' => true]);
    }

    /**
     * Set a specific user as the reviewee (teacher being reviewed).
     * Creates a fresh skill request with this user as teacher.
     */
    public function forReviewee(User $user): static
    {
        return $this->state(function () use ($user) {
            $learner = User::factory()->create();

            $skillRequest = SkillRequest::factory()->create([
                'learner_id' => $learner->id,
                'teacher_id' => $user->id,
                'status'     => SkillRequestStatus::COMPLETED,
            ]);

            return [
                'skill_request_id' => $skillRequest->id,
                'reviewer_id'      => $learner->id,
                'reviewee_id'      => $user->id,
            ];
        });
    }
}