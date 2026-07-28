<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\ProficiencyLevel;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Skill;
use App\Models\User;
use App\Models\UserSkill;
use App\Services\ConversationService;
use Tests\TestCase;

class MessageTest extends TestCase
{
    private User $learner;
    private User $teacher;
    private User $otherUser;
    private Skill $skill;
    private Conversation $conversation;

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

        $service = app(ConversationService::class);
        $this->conversation = $service->getOrCreate($this->learner->id, $this->teacher->id, null);
    }

    // ── Send ────────────────────────────────────────────────────────

    public function test_participant_can_send_message(): void
    {
        $response = $this->actingAs($this->learner)->postJson(
            "/api/v1/conversations/{$this->conversation->id}/messages",
            ['content' => 'Hello, can you teach me Java?']
        );

        $response->assertStatus(201)
            ->assertJsonPath('data.content', 'Hello, can you teach me Java?');

        $this->assertDatabaseHas('messages', [
            'conversation_id' => $this->conversation->id,
            'sender_id'       => $this->learner->id,
            'content'         => 'Hello, can you teach me Java?',
        ]);

        // Conversation metadata should be updated
        $fresh = $this->conversation->fresh();
        $this->assertNotNull($fresh->last_message_at);
        $this->assertEquals('Hello, can you teach me Java?', $fresh->last_message_preview);
    }

    // ── Authorization ───────────────────────────────────────────────

    public function test_non_participant_cannot_send_message(): void
    {
        $response = $this->actingAs($this->otherUser)->postJson(
            "/api/v1/conversations/{$this->conversation->id}/messages",
            ['content' => 'Interloper!']
        );

        $response->assertStatus(404);
    }

    public function test_non_participant_cannot_list_messages(): void
    {
        $response = $this->actingAs($this->otherUser)->getJson(
            "/api/v1/conversations/{$this->conversation->id}/messages"
        );

        $response->assertStatus(404);
    }

    public function test_non_participant_cannot_mark_read(): void
    {
        $response = $this->actingAs($this->otherUser)->putJson(
            "/api/v1/conversations/{$this->conversation->id}/messages/read"
        );

        $response->assertStatus(404);
    }

    // ── List & Pagination ───────────────────────────────────────────

    public function test_can_list_messages(): void
    {
        Message::factory()->create([
            'conversation_id' => $this->conversation->id,
            'sender_id'       => $this->learner->id,
            'content'         => 'Message 1',
        ]);
        Message::factory()->create([
            'conversation_id' => $this->conversation->id,
            'sender_id'       => $this->teacher->id,
            'content'         => 'Message 2',
        ]);

        $response = $this->actingAs($this->learner)->getJson(
            "/api/v1/conversations/{$this->conversation->id}/messages"
        );

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data.data');
    }

    public function test_cursor_pagination_returns_cursor_structure(): void
    {
        Message::factory()->count(3)->create([
            'conversation_id' => $this->conversation->id,
            'sender_id'       => $this->learner->id,
        ]);

        $response = $this->actingAs($this->learner)->getJson(
            "/api/v1/conversations/{$this->conversation->id}/messages"
        );

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'data',
                    'next_cursor',
                ],
            ]);
    }

    // ── Read Tracking ───────────────────────────────────────────────

    public function test_implicit_mark_read_only_affects_other_participant(): void
    {
        // Teacher sends a message — unread by learner
        $teacherMsg = Message::factory()->create([
            'conversation_id' => $this->conversation->id,
            'sender_id'       => $this->teacher->id,
            'content'         => 'Hello learner!',
            'is_read'         => false,
        ]);

        // Learner sends a message — learner's own, shouldn't be touched
        $learnerMsg = Message::factory()->create([
            'conversation_id' => $this->conversation->id,
            'sender_id'       => $this->learner->id,
            'content'         => 'Hello teacher!',
            'is_read'         => false,
        ]);

        // Learner views the conversation — triggers implicit mark-read
        $this->actingAs($this->learner)->getJson(
            "/api/v1/conversations/{$this->conversation->id}/messages"
        );

        // Teacher's message is now read
        $this->assertTrue($teacherMsg->fresh()->is_read);
        // Learner's own message remains untouched
        $this->assertFalse($learnerMsg->fresh()->is_read);
    }

    public function test_explicit_mark_all_read(): void
    {
        Message::factory()->create([
            'conversation_id' => $this->conversation->id,
            'sender_id'       => $this->teacher->id,
            'content'         => 'Unread message',
            'is_read'         => false,
        ]);

        $response = $this->actingAs($this->learner)->putJson(
            "/api/v1/conversations/{$this->conversation->id}/messages/read"
        );

        $response->assertStatus(200);

        $this->assertDatabaseMissing('messages', [
            'conversation_id' => $this->conversation->id,
            'sender_id'       => $this->teacher->id,
            'is_read'         => false,
        ]);
    }

    // ── Validation ──────────────────────────────────────────────────

    public function test_empty_message_rejected(): void
    {
        $response = $this->actingAs($this->learner)->postJson(
            "/api/v1/conversations/{$this->conversation->id}/messages",
            ['content' => '']
        );

        $response->assertStatus(422);
    }

    public function test_whitespace_only_message_rejected(): void
    {
        $response = $this->actingAs($this->learner)->postJson(
            "/api/v1/conversations/{$this->conversation->id}/messages",
            ['content' => '   ']
        );

        $response->assertStatus(422);
    }
}