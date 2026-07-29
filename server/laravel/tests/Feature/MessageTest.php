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

        $response->assertStatus(400);
    }

    public function test_whitespace_only_message_rejected(): void
    {
        $response = $this->actingAs($this->learner)->postJson(
            "/api/v1/conversations/{$this->conversation->id}/messages",
            ['content' => '   ']
        );

        $response->assertStatus(400);
    }

    // ── Attachment Tests ──────────────────────────────────────────

    public function test_attachment_only_message_succeeds(): void
    {
        $file = \Illuminate\Http\UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

        $response = $this->actingAs($this->learner)->postJson(
            "/api/v1/conversations/{$this->conversation->id}/messages",
            ['attachment' => $file]
        );

        $response->assertStatus(201)
            ->assertJsonPath('data.type', 'file')
            ->assertJsonPath('data.content', null);

        $this->assertDatabaseHas('messages', [
            'conversation_id'      => $this->conversation->id,
            'sender_id'            => $this->learner->id,
            'type'                 => 'file',
            'content'              => null,
            'attachment_mime_type' => 'application/pdf',
        ]);
    }

    public function test_neither_content_nor_attachment_rejected(): void
    {
        $response = $this->actingAs($this->learner)->postJson(
            "/api/v1/conversations/{$this->conversation->id}/messages",
            []
        );

        $response->assertStatus(400)
            ->assertJsonPath('code', 'MESSAGE_EMPTY');
    }

    public function test_wrong_mime_type_rejected(): void
    {
        $file = \Illuminate\Http\UploadedFile::fake()->create('hack.exe', 100, 'application/x-msdownload');

        $response = $this->actingAs($this->learner)->postJson(
            "/api/v1/conversations/{$this->conversation->id}/messages",
            ['attachment' => $file]
        );

        $response->assertStatus(422)
            ->assertJsonPath('code', 'ATTACHMENT_TYPE_NOT_ALLOWED');

        // Nothing should be persisted
        $this->assertDatabaseCount('messages', 0);
    }

    public function test_oversized_file_rejected(): void
    {
        $maxSizeKb = (int) config('skillswap.chat_attachment_max_size_kb');
        $file = \Illuminate\Http\UploadedFile::fake()->create('large.pdf', $maxSizeKb + 1, 'application/pdf');

        $response = $this->actingAs($this->learner)->postJson(
            "/api/v1/conversations/{$this->conversation->id}/messages",
            ['attachment' => $file]
        );

        $response->assertStatus(422)
            ->assertJsonPath('code', 'VALIDATION_ERROR');

        $this->assertDatabaseCount('messages', 0);
    }

    public function test_attachment_preview_shows_placeholder(): void
    {
        $file = \Illuminate\Http\UploadedFile::fake()->create('notes.pdf', 100, 'application/pdf');

        $this->actingAs($this->learner)->postJson(
            "/api/v1/conversations/{$this->conversation->id}/messages",
            ['attachment' => $file]
        );

        $this->assertEquals('[Attachment]', $this->conversation->fresh()->last_message_preview);
    }

    public function test_broadcast_payload_includes_attachment_for_file_message(): void
    {
        $message = \App\Models\Message::factory()->create([
            'conversation_id'             => $this->conversation->id,
            'sender_id'                   => $this->learner->id,
            'type'                        => 'file',
            'content'                     => null,
            'attachment_public_id'        => 'chat-attachments/test123',
            'attachment_original_filename' => 'document.pdf',
            'attachment_mime_type'        => 'application/pdf',
            'attachment_size_bytes'       => 102400,
        ]);

        $event = new \App\Events\MessageSent($message);
        $payload = $event->broadcastWith();

        $this->assertArrayHasKey('attachment', $payload);
        $this->assertEquals('chat-attachments/test123', $payload['attachment']['public_id']);
        $this->assertEquals('document.pdf', $payload['attachment']['filename']);
        $this->assertEquals('application/pdf', $payload['attachment']['mime_type']);
        $this->assertEquals(102400, $payload['attachment']['size_bytes']);
    }

    public function test_broadcast_payload_omits_attachment_for_text_message(): void
    {
        $message = \App\Models\Message::factory()->create([
            'conversation_id' => $this->conversation->id,
            'sender_id'       => $this->learner->id,
            'type'            => 'text',
            'content'         => 'Hello!',
        ]);

        $event = new \App\Events\MessageSent($message);
        $payload = $event->broadcastWith();

        $this->assertArrayNotHasKey('attachment', $payload);
    }

    public function test_cache_invalidation_targets_recipient_not_sender(): void
    {
        \Illuminate\Support\Facades\Redis::set("conversation:unread:{$this->learner->id}", 'dummy');
        \Illuminate\Support\Facades\Redis::set("conversation:unread:{$this->teacher->id}", 'dummy');

        $this->actingAs($this->learner)->postJson(
            "/api/v1/conversations/{$this->conversation->id}/messages",
            ['content' => 'Hello!']
        );

        // Sender's cache should remain untouched
        $this->assertNotNull(\Illuminate\Support\Facades\Redis::get("conversation:unread:{$this->learner->id}"));
        // Recipient's cache should be invalidated
        $this->assertNull(\Illuminate\Support\Facades\Redis::get("conversation:unread:{$this->teacher->id}"));
    }
}