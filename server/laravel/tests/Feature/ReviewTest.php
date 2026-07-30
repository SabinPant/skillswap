<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\ProficiencyLevel;
use App\Enums\SkillRequestStatus;
use App\Models\Skill;
use App\Models\SkillRequest;
use App\Models\User;
use App\Models\UserSkill;
use App\Repositories\ReviewRepository;
use Illuminate\Support\Facades\Redis;
use Tests\TestCase;

class ReviewTest extends TestCase
{
    private User $learner;
    private User $teacher;
    private User $otherUser;
    private Skill $skill;
    private SkillRequest $completedRequest;

    protected function setUp(): void
    {
        parent::setUp();

        $this->learner   = User::factory()->create(['email_verified_at' => now()]);
        $this->teacher   = User::factory()->create(['email_verified_at' => now()]);
        $this->otherUser = User::factory()->create(['email_verified_at' => now()]);
        $this->skill     = Skill::factory()->create(['name' => 'Java', 'slug' => 'java']);

        UserSkill::factory()->for($this->teacher)->for($this->skill)->create([
            'proficiency_level' => ProficiencyLevel::EXPERT->value,
            'can_teach'         => true,
            'wants_to_learn'    => false,
        ]);

        $this->completedRequest = SkillRequest::factory()->create([
            'learner_id' => $this->learner->id,
            'teacher_id' => $this->teacher->id,
            'skill_id'   => $this->skill->id,
            'status'     => SkillRequestStatus::COMPLETED,
        ]);
    }

    // ── Creation ────────────────────────────────────────────────────

    public function test_participant_can_create_review(): void
    {
        $response = $this->actingAs($this->learner)->postJson('/api/v1/reviews', [
            'skill_request_id' => $this->completedRequest->id,
            'rating'           => 5,
            'comment'          => 'Great teacher!',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.rating', 5)
            ->assertJsonPath('data.reviewee_id', $this->teacher->id);

        $this->assertDatabaseHas('reviews', [
            'skill_request_id' => $this->completedRequest->id,
            'reviewer_id'      => $this->learner->id,
            'reviewee_id'      => $this->teacher->id,
            'rating'           => 5,
        ]);
    }

    public function test_cannot_review_uncompleted_request(): void
    {
        $pendingRequest = SkillRequest::factory()->create([
            'learner_id' => $this->learner->id,
            'teacher_id' => $this->teacher->id,
            'skill_id'   => $this->skill->id,
            'status'     => SkillRequestStatus::PENDING,
        ]);

        $response = $this->actingAs($this->learner)->postJson('/api/v1/reviews', [
            'skill_request_id' => $pendingRequest->id,
            'rating'           => 4,
        ]);

        $response->assertStatus(400)
            ->assertJsonPath('code', 'REQUEST_NOT_COMPLETED');
    }

    public function test_non_participant_cannot_review(): void
    {
        $response = $this->actingAs($this->otherUser)->postJson('/api/v1/reviews', [
            'skill_request_id' => $this->completedRequest->id,
            'rating'           => 3,
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('code', 'NOT_A_PARTICIPANT');
    }

    public function test_duplicate_review_rejected(): void
    {
        $this->actingAs($this->learner)->postJson('/api/v1/reviews', [
            'skill_request_id' => $this->completedRequest->id,
            'rating'           => 4,
        ]);

        $response = $this->actingAs($this->learner)->postJson('/api/v1/reviews', [
            'skill_request_id' => $this->completedRequest->id,
            'rating'           => 3,
        ]);

        $response->assertStatus(409)
            ->assertJsonPath('code', 'REVIEW_ALREADY_SUBMITTED');
    }

    // ── Race ────────────────────────────────────────────────────────

    public function test_duplicate_review_race_handled(): void
    {
        $repository = app(ReviewRepository::class);

        $data = [
            'skill_request_id' => $this->completedRequest->id,
            'reviewer_id'      => $this->learner->id,
            'reviewee_id'      => $this->teacher->id,
            'rating'           => 4,
        ];

        // First insert succeeds.
        $this->assertNotNull($repository->create($data));

        // Second insert hits 23505 — repository returns null.
        $this->assertNull($repository->create($data));
    }

    // ── Public Listing ──────────────────────────────────────────────

    public function test_public_listing_requires_no_participation(): void
    {
        \App\Models\Review::factory()->forReviewee($this->teacher)->create(['rating' => 5]);

        $response = $this->actingAs($this->otherUser)->getJson(
            "/api/v1/reviews/user/{$this->teacher->id}"
        );

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data.data');
    }

    public function test_hidden_reviews_excluded_from_listing(): void
    {
        \App\Models\Review::factory()->forReviewee($this->teacher)->create(['rating' => 5]);
        \App\Models\Review::factory()->forReviewee($this->teacher)->hidden()->create(['rating' => 1]);

        $response = $this->actingAs($this->otherUser)->getJson(
            "/api/v1/reviews/user/{$this->teacher->id}"
        );

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.rating', 5);
    }

    // ── Average Rating ──────────────────────────────────────────────

    public function test_average_rating_includes_hidden_reviews(): void
    {
        \App\Models\Review::factory()->forReviewee($this->teacher)->create(['rating' => 5]);
        \App\Models\Review::factory()->forReviewee($this->teacher)->hidden()->create(['rating' => 1]);

        // Average should be (5 + 1) / 2 = 3.0 — hidden counts for audit.
        Redis::del("rating:avg:{$this->teacher->id}");
        $service = app(\App\Services\ReviewService::class);
        $result  = $service->getAverageRating($this->teacher->id);

        $this->assertEquals(3.0, $result['average']);
        $this->assertEquals(2, $result['count']);
    }

    public function test_average_rating_cache_returns_cached_value_after_population(): void
    {
        \App\Models\Review::factory()->forReviewee($this->teacher)->create(['rating' => 4]);

        $cacheKey = "rating:avg:{$this->teacher->id}";
        Redis::del($cacheKey);

        // First call — populates cache.
        $service = app(\App\Services\ReviewService::class);
        $first   = $service->getAverageRating($this->teacher->id);

        // Verify the cache key now exists with the correct value.
        $cached = Redis::get($cacheKey);
        $this->assertNotNull($cached);
        $this->assertEquals($first, json_decode($cached, true));

        // Add another review — but the cache is still warm.
        \App\Models\Review::factory()->forReviewee($this->teacher)->create(['rating' => 2]);

        // Second call should return the stale cached value, not the new live average.
        $second = $service->getAverageRating($this->teacher->id);
        $this->assertEquals($first, $second);
    }

    public function test_average_rating_cache_invalidated_on_new_review(): void
    {
        $cacheKey = "rating:avg:{$this->teacher->id}";
        Redis::set($cacheKey, json_encode(['average' => 5.0, 'count' => 1]));

        // Creating a new review should delete the cache key.
        $this->actingAs($this->learner)->postJson('/api/v1/reviews', [
            'skill_request_id' => $this->completedRequest->id,
            'rating'           => 3,
        ]);

        $this->assertNull(Redis::get($cacheKey));
    }

    // ── Edge Cases ──────────────────────────────────────────────────

    public function test_review_with_comment_succeeds(): void
    {
        $response = $this->actingAs($this->learner)->postJson('/api/v1/reviews', [
            'skill_request_id' => $this->completedRequest->id,
            'rating'           => 5,
            'comment'          => 'Excellent session!',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.comment', 'Excellent session!');
    }

    public function test_review_without_comment_succeeds(): void
    {
        $response = $this->actingAs($this->learner)->postJson('/api/v1/reviews', [
            'skill_request_id' => $this->completedRequest->id,
            'rating'           => 4,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.comment', null);
    }
}