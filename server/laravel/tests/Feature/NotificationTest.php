<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\NotificationType;
use App\Enums\SkillRequestStatus;
use App\Models\Notification;
use App\Models\SkillRequest;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Redis;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    private User $user;
    private User $otherUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user      = User::factory()->create();
        $this->otherUser = User::factory()->create();
    }

    // ── List ────────────────────────────────────────────────────────

    public function test_list_notifications(): void
    {
        Notification::factory()->count(3)->create([
            'user_id'      => $this->user->id,
            'type'         => 'request_received',
            'is_dismissed' => false,
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/v1/notifications');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data.data');
    }

    // ── Mark Read ───────────────────────────────────────────────────

    public function test_mark_read_ownership_scoping(): void
    {
        $notification = Notification::factory()->create([
            'user_id' => $this->user->id,
            'type'    => 'request_received',
        ]);

        $response = $this->actingAs($this->otherUser)->putJson(
            "/api/v1/notifications/{$notification->id}/read"
        );

        $response->assertStatus(404);
    }

    public function test_mark_read_sets_read_and_resets_count(): void
    {
        $notification = Notification::factory()->create([
            'user_id'      => $this->user->id,
            'type'         => 'message_received',
            'is_read'      => false,
            'unread_count' => 3,
        ]);

        $this->actingAs($this->user)->putJson(
            "/api/v1/notifications/{$notification->id}/read"
        );

        $fresh = $notification->fresh();
        $this->assertTrue($fresh->is_read);
        $this->assertEquals(0, $fresh->unread_count);
    }

    // ── Mark All Read ───────────────────────────────────────────────

    public function test_mark_all_read_excludes_message_received(): void
    {
        Notification::factory()->create([
            'user_id' => $this->user->id,
            'type'    => 'request_received',
            'is_read' => false,
        ]);
        Notification::factory()->create([
            'user_id' => $this->user->id,
            'type'    => 'message_received',
            'is_read' => false,
        ]);

        $response = $this->actingAs($this->user)->putJson('/api/v1/notifications/read-all');

        $response->assertStatus(200)
            ->assertJsonPath('data.marked', 1);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->user->id,
            'type'    => 'message_received',
            'is_read' => false,
        ]);
    }

    // ── Dismiss / Delete ────────────────────────────────────────────

    public function test_dismissed_notifications_excluded_from_list(): void
    {
        Notification::factory()->create([
            'user_id'      => $this->user->id,
            'type'         => 'request_received',
            'is_dismissed' => true,
        ]);
        Notification::factory()->create([
            'user_id'      => $this->user->id,
            'type'         => 'request_received',
            'is_dismissed' => false,
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/v1/notifications');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data.data');
    }

    public function test_delete_is_soft_delete(): void
    {
        $notification = Notification::factory()->create([
            'user_id' => $this->user->id,
            'type'    => 'request_received',
        ]);

        $this->actingAs($this->user)->deleteJson(
            "/api/v1/notifications/{$notification->id}"
        );

        $fresh = $notification->fresh();
        $this->assertTrue($fresh->is_dismissed);
        $this->assertNotNull($fresh); // Row still exists
    }

    public function test_delete_ownership_scoping(): void
    {
        $notification = Notification::factory()->create([
            'user_id' => $this->user->id,
            'type'    => 'request_received',
        ]);

        $response = $this->actingAs($this->otherUser)->deleteJson(
            "/api/v1/notifications/{$notification->id}"
        );

        $response->assertStatus(404);
    }

    // ── Session Reminder ────────────────────────────────────────────

    public function test_session_reminder_narrow_window(): void
    {
        $hoursBefore = (int) config('skillswap.session_reminder_hours_before', 24);

        // Request at 23.5h — should be reminded
        $inWindow = SkillRequest::factory()->create([
            'learner_id' => $this->user->id,
            'status'     => SkillRequestStatus::ACCEPTED,
            'proposed_at' => Carbon::now()->addHours($hoursBefore - 0.5),
        ]);

        // Request at 25h — outside window
        $outWindow = SkillRequest::factory()->create([
            'learner_id' => $this->user->id,
            'status'     => SkillRequestStatus::ACCEPTED,
            'proposed_at' => Carbon::now()->addHours($hoursBefore + 1),
        ]);

        dispatch_sync(new \App\Jobs\SessionReminderJob());

        $this->assertDatabaseHas('notifications', [
            'type' => 'session_reminder',
            'data->skill_request_id' => $inWindow->id,
        ]);

        $this->assertDatabaseMissing('notifications', [
            'type' => 'session_reminder',
            'data->skill_request_id' => $outWindow->id,
        ]);
    }

    public function test_session_reminder_dedup_backstop(): void
    {
        $hoursBefore = (int) config('skillswap.session_reminder_hours_before', 24);

        $request = SkillRequest::factory()->create([
            'learner_id'  => $this->user->id,
            'status'      => SkillRequestStatus::ACCEPTED,
            'proposed_at' => Carbon::now()->addHours($hoursBefore - 0.5),
        ]);

        // First run creates the notification
        dispatch_sync(new \App\Jobs\SessionReminderJob());

        // Second run should skip — dedup
        dispatch_sync(new \App\Jobs\SessionReminderJob());

        $this->assertEquals(1, Notification::where('type', 'session_reminder')
            ->where('data->skill_request_id', $request->id)
            ->count());
    }

    // ── Message Revival ─────────────────────────────────────────────

    public function test_message_received_creates_notification(): void
    {

    $this->markTestSkipped('Known issue: RefreshDatabase + listener FK edge case (Sprint 7 deferral).');
    
        $conversation = \App\Models\Conversation::create([
            'user_one_id' => min($this->user->id, $this->otherUser->id),
            'user_two_id' => max($this->user->id, $this->otherUser->id),
        ]);

        $message = \App\Models\Message::factory()->create([
            'conversation_id' => $conversation->id,
            'sender_id'       => $this->otherUser->id,
            'content'         => 'Hello!',
            'type'            => 'text',
        ]);
        $message->load(['conversation', 'sender']);

        $listener = new \App\Listeners\MessageSentListener();
        $listener->handle(new \App\Events\MessageSent($message));

        $this->assertDatabaseHas('notifications', [
            'type'    => 'message_received',
            'user_id' => $this->user->id,
        ]);
    }
}