<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Skill;
use App\Models\User;
use App\Models\UserSkill;
use App\Enums\ProficiencyLevel;
use App\Services\ConversationService;
use Tests\TestCase;

class ConversationTest extends TestCase
{
    private User $learner;
    private User $teacher;
    private User $otherUser;
    private Skill $skill;

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
    }

    // ── Creation ────────────────────────────────────────────────────

    public function test_skill_request_creates_conversation(): void
    {
        $this->actingAs($this->learner)->postJson('/api/v1/skill-requests', [
            'teacher_id' => $this->teacher->id,
            'skill_id'   => $this->skill->id,
        ]);

        $this->assertDatabaseCount('conversations', 1);

        $conversation  = Conversation::first();
        $participants  = [$conversation->user_one_id, $conversation->user_two_id];

        $this->assertContains($this->learner->id, $participants);
        $this->assertContains($this->teacher->id, $participants);
    }

    public function test_conversation_is_idempotent(): void
    {
        $this->actingAs($this->learner)->postJson('/api/v1/skill-requests', [
            'teacher_id' => $this->teacher->id,
            'skill_id'   => $this->skill->id,
        ]);

        $this->actingAs($this->learner)->postJson('/api/v1/skill-requests', [
            'teacher_id' => $this->teacher->id,
            'skill_id'   => $this->skill->id,
        ]);

        $this->assertDatabaseCount('conversations', 1);
    }

    public function test_get_or_create_handles_race(): void
    {
        $service = app(ConversationService::class);

        $first = $service->getOrCreate($this->learner->id, $this->teacher->id, null);
        $second = $service->getOrCreate($this->learner->id, $this->teacher->id, null);

        $this->assertEquals($first->id, $second->id);
    }

    public function test_canonical_ordering_is_independent_of_argument_order(): void
    {
        $service = app(ConversationService::class);

        $conversation     = $service->getOrCreate($this->learner->id, $this->teacher->id, null);
        $sameConversation = $service->getOrCreate($this->teacher->id, $this->learner->id, null);

        $this->assertEquals($conversation->id, $sameConversation->id);
        $this->assertDatabaseCount('conversations', 1);
    }

    // ── Authorization ───────────────────────────────────────────────

    public function test_non_participant_cannot_see_conversation(): void
    {
        $service      = app(ConversationService::class);
        $conversation = $service->getOrCreate($this->learner->id, $this->teacher->id, null);

        $response = $this->actingAs($this->otherUser)->getJson(
            "/api/v1/conversations/{$conversation->id}"
        );

        $response->assertStatus(404);
    }

    // ── List & Show ─────────────────────────────────────────────────

    public function test_list_conversations(): void
    {
        $service = app(ConversationService::class);
        $service->getOrCreate($this->learner->id, $this->teacher->id, null);

        $response = $this->actingAs($this->learner)->getJson('/api/v1/conversations');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_show_conversation(): void
    {
        $service      = app(ConversationService::class);
        $conversation = $service->getOrCreate($this->learner->id, $this->teacher->id, null);

        $response = $this->actingAs($this->learner)->getJson(
            "/api/v1/conversations/{$conversation->id}"
        );

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $conversation->id);
    }
}