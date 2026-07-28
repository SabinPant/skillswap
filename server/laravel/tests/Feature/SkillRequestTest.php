<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\ProficiencyLevel;
use App\Enums\SkillRequestStatus;
use App\Models\Skill;
use App\Models\SkillRequest;
use App\Models\User;
use App\Models\UserSkill;
use Carbon\Carbon;
use Tests\TestCase;

class SkillRequestTest extends TestCase
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

        // Teacher offers this skill
        UserSkill::factory()->for($this->teacher)->for($this->skill)->create([
            'proficiency_level' => ProficiencyLevel::EXPERT->value,
            'can_teach'         => true,
            'wants_to_learn'    => false,
        ]);
    }

    // ── Creation ────────────────────────────────────────────────────

    public function test_learner_can_create_request(): void
    {
        $response = $this->actingAs($this->learner)->postJson('/api/v1/skill-requests', [
            'teacher_id'  => $this->teacher->id,
            'skill_id'    => $this->skill->id,
            'message'     => 'I want to learn Java!',
            'proposed_at' => Carbon::now()->addDays(3)->toIso8601String(),
            'timezone'    => 'Asia/Kathmandu',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('skill_requests', [
            'learner_id' => $this->learner->id,
            'teacher_id' => $this->teacher->id,
            'skill_id'   => $this->skill->id,
            'status'     => 'pending',
        ]);

        // Verify expires_at is set by the service
        $this->assertNotNull(SkillRequest::first()->expires_at);
    }

    public function test_cannot_request_own_skill(): void
    {
        $response = $this->actingAs($this->learner)->postJson('/api/v1/skill-requests', [
            'teacher_id' => $this->learner->id,
            'skill_id'   => $this->skill->id,
        ]);

        $response->assertStatus(400)
            ->assertJsonPath('code', 'CANNOT_REQUEST_OWN_SKILL');
    }

    public function test_cannot_request_skill_not_taught_by_teacher(): void
    {
        $nonTeacher = User::factory()->create(['email_verified_at' => now()]);

        $response = $this->actingAs($this->learner)->postJson('/api/v1/skill-requests', [
            'teacher_id' => $nonTeacher->id,
            'skill_id'   => $this->skill->id,
        ]);

        $response->assertStatus(400)
            ->assertJsonPath('code', 'SKILL_NOT_TAUGHT_BY_USER');
    }

    public function test_cannot_create_duplicate_pending_request(): void
    {
        SkillRequest::factory()->create([
            'learner_id' => $this->learner->id,
            'teacher_id' => $this->teacher->id,
            'skill_id'   => $this->skill->id,
            'status'     => SkillRequestStatus::PENDING,
        ]);

        $response = $this->actingAs($this->learner)->postJson('/api/v1/skill-requests', [
            'teacher_id' => $this->teacher->id,
            'skill_id'   => $this->skill->id,
        ]);

        $response->assertStatus(409)
            ->assertJsonPath('code', 'DUPLICATE_PENDING_REQUEST');
    }

    public function test_unverified_user_cannot_create_request(): void
    {
        $unverified = User::factory()->create(['email_verified_at' => null]);

        $response = $this->actingAs($unverified)->postJson('/api/v1/skill-requests', [
            'teacher_id' => $this->teacher->id,
            'skill_id'   => $this->skill->id,
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('code', 'EMAIL_NOT_VERIFIED');
    }

    public function test_suspended_user_cannot_create_request(): void
    {
        $suspended = User::factory()->create([
            'email_verified_at' => now(),
            'is_suspended'      => true,
        ]);

        $response = $this->actingAs($suspended)->postJson('/api/v1/skill-requests', [
            'teacher_id' => $this->teacher->id,
            'skill_id'   => $this->skill->id,
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('code', 'ACCOUNT_SUSPENDED');
    }

    // ── Legal Transitions ───────────────────────────────────────────

    public function test_teacher_can_accept_pending_request(): void
    {
        $request = SkillRequest::factory()->create([
            'learner_id' => $this->learner->id,
            'teacher_id' => $this->teacher->id,
            'skill_id'   => $this->skill->id,
            'status'     => SkillRequestStatus::PENDING,
        ]);

        $response = $this->actingAs($this->teacher)->putJson(
            "/api/v1/skill-requests/{$request->id}/accept"
        );

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'accepted');
    }

    public function test_teacher_can_reject_pending_request(): void
    {
        $request = SkillRequest::factory()->create([
            'learner_id' => $this->learner->id,
            'teacher_id' => $this->teacher->id,
            'skill_id'   => $this->skill->id,
            'status'     => SkillRequestStatus::PENDING,
        ]);

        $response = $this->actingAs($this->teacher)->putJson(
            "/api/v1/skill-requests/{$request->id}/reject"
        );

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'rejected');
    }

    public function test_either_party_can_cancel_accepted_request(): void
    {
        $request = SkillRequest::factory()->create([
            'learner_id' => $this->learner->id,
            'teacher_id' => $this->teacher->id,
            'skill_id'   => $this->skill->id,
            'status'     => SkillRequestStatus::ACCEPTED,
        ]);

        $response = $this->actingAs($this->learner)->putJson(
            "/api/v1/skill-requests/{$request->id}/cancel",
            ['reason' => 'No longer available.']
        );

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'cancelled')
            ->assertJsonPath('data.cancellation_reason', 'No longer available.');
    }

    public function test_either_party_can_complete_accepted_request(): void
    {
        $request = SkillRequest::factory()->create([
            'learner_id' => $this->learner->id,
            'teacher_id' => $this->teacher->id,
            'skill_id'   => $this->skill->id,
            'status'     => SkillRequestStatus::ACCEPTED,
        ]);

        $response = $this->actingAs($this->teacher)->putJson(
            "/api/v1/skill-requests/{$request->id}/complete"
        );

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.completed_by', $this->teacher->id);
    }

    public function test_cancellation_reason_required(): void
    {
        $request = SkillRequest::factory()->create([
            'learner_id' => $this->learner->id,
            'teacher_id' => $this->teacher->id,
            'skill_id'   => $this->skill->id,
            'status'     => SkillRequestStatus::ACCEPTED,
        ]);

        $response = $this->actingAs($this->learner)->putJson(
            "/api/v1/skill-requests/{$request->id}/cancel",
            []
        );

        $response->assertStatus(422);
    }

    // ── Illegal Transitions ─────────────────────────────────────────

    public function test_cannot_accept_already_accepted_request(): void
    {
        $request = SkillRequest::factory()->create([
            'learner_id' => $this->learner->id,
            'teacher_id' => $this->teacher->id,
            'skill_id'   => $this->skill->id,
            'status'     => SkillRequestStatus::ACCEPTED,
        ]);

        $response = $this->actingAs($this->teacher)->putJson(
            "/api/v1/skill-requests/{$request->id}/accept"
        );

        $response->assertStatus(409)
            ->assertJsonPath('code', 'INVALID_STATUS_TRANSITION');
    }

    public function test_cannot_accept_rejected_request(): void
    {
        $request = SkillRequest::factory()->create([
            'learner_id' => $this->learner->id,
            'teacher_id' => $this->teacher->id,
            'skill_id'   => $this->skill->id,
            'status'     => SkillRequestStatus::REJECTED,
        ]);

        $response = $this->actingAs($this->teacher)->putJson(
            "/api/v1/skill-requests/{$request->id}/accept"
        );

        $response->assertStatus(409)
            ->assertJsonPath('code', 'INVALID_STATUS_TRANSITION');
    }

    public function test_cannot_cancel_completed_request(): void
    {
        $request = SkillRequest::factory()->create([
            'learner_id' => $this->learner->id,
            'teacher_id' => $this->teacher->id,
            'skill_id'   => $this->skill->id,
            'status'     => SkillRequestStatus::COMPLETED,
        ]);

        $response = $this->actingAs($this->learner)->putJson(
            "/api/v1/skill-requests/{$request->id}/cancel",
            ['reason' => 'Too late.']
        );

        $response->assertStatus(409)
            ->assertJsonPath('code', 'INVALID_STATUS_TRANSITION');
    }

    public function test_cannot_complete_rejected_request(): void
    {
        $request = SkillRequest::factory()->create([
            'learner_id' => $this->learner->id,
            'teacher_id' => $this->teacher->id,
            'skill_id'   => $this->skill->id,
            'status'     => SkillRequestStatus::REJECTED,
        ]);

        $response = $this->actingAs($this->learner)->putJson(
            "/api/v1/skill-requests/{$request->id}/complete"
        );

        $response->assertStatus(409)
            ->assertJsonPath('code', 'INVALID_STATUS_TRANSITION');
    }

    public function test_learner_cannot_accept_own_request(): void
    {
        $request = SkillRequest::factory()->create([
            'learner_id' => $this->learner->id,
            'teacher_id' => $this->teacher->id,
            'skill_id'   => $this->skill->id,
            'status'     => SkillRequestStatus::PENDING,
        ]);

        $response = $this->actingAs($this->learner)->putJson(
            "/api/v1/skill-requests/{$request->id}/accept"
        );

        $response->assertStatus(403)
            ->assertJsonPath('code', 'INSUFFICIENT_PERMISSIONS');
    }

    public function test_non_participant_gets_404(): void
    {
        $request = SkillRequest::factory()->create([
            'learner_id' => $this->learner->id,
            'teacher_id' => $this->teacher->id,
            'skill_id'   => $this->skill->id,
            'status'     => SkillRequestStatus::PENDING,
        ]);

        $response = $this->actingAs($this->otherUser)->putJson(
            "/api/v1/skill-requests/{$request->id}/accept"
        );

        $response->assertStatus(404);
    }

    // ── Sequential Race Proxy ───────────────────────────────────────

    public function test_double_accept_fails(): void
    {
        $request = SkillRequest::factory()->create([
            'learner_id' => $this->learner->id,
            'teacher_id' => $this->teacher->id,
            'skill_id'   => $this->skill->id,
            'status'     => SkillRequestStatus::PENDING,
        ]);

        // First accept succeeds
        $this->actingAs($this->teacher)
            ->putJson("/api/v1/skill-requests/{$request->id}/accept")
            ->assertStatus(200);

        // Second accept fails — request is no longer PENDING
        $response = $this->actingAs($this->teacher)->putJson(
            "/api/v1/skill-requests/{$request->id}/accept"
        );

        $response->assertStatus(409)
            ->assertJsonPath('code', 'INVALID_STATUS_TRANSITION');
    }

    // ── Expiry ──────────────────────────────────────────────────────

    public function test_expiry_job_sets_status_to_expired(): void
    {
        $request = SkillRequest::factory()->create([
            'learner_id' => $this->learner->id,
            'teacher_id' => $this->teacher->id,
            'skill_id'   => $this->skill->id,
            'status'     => SkillRequestStatus::PENDING,
            'expires_at' => Carbon::now()->subMinute(),
        ]);

        dispatch_sync(new \App\Jobs\ExpireStaleSkillRequestsJob());

        $this->assertDatabaseHas('skill_requests', [
            'id'     => $request->id,
            'status' => SkillRequestStatus::EXPIRED->value,
        ]);
    }

    public function test_expired_request_cannot_be_accepted(): void
    {
        $request = SkillRequest::factory()->create([
            'learner_id' => $this->learner->id,
            'teacher_id' => $this->teacher->id,
            'skill_id'   => $this->skill->id,
            'status'     => SkillRequestStatus::EXPIRED,
        ]);

        $response = $this->actingAs($this->teacher)->putJson(
            "/api/v1/skill-requests/{$request->id}/accept"
        );

        $response->assertStatus(409)
            ->assertJsonPath('code', 'INVALID_STATUS_TRANSITION');
    }

    public function test_expiry_job_skips_non_pending_requests(): void
    {
        // Request already accepted — should be skipped by the expiry job
        $accepted = SkillRequest::factory()->create([
            'learner_id' => $this->learner->id,
            'teacher_id' => $this->teacher->id,
            'skill_id'   => $this->skill->id,
            'status'     => SkillRequestStatus::ACCEPTED,
            'expires_at' => Carbon::now()->subMinute(),
        ]);

        // Stale pending request — should be expired
        $pending = SkillRequest::factory()->create([
            'learner_id' => $this->learner->id,
            'teacher_id' => $this->teacher->id,
            'skill_id'   => $this->skill->id,
            'status'     => SkillRequestStatus::PENDING,
            'expires_at' => Carbon::now()->subMinute(),
        ]);

        dispatch_sync(new \App\Jobs\ExpireStaleSkillRequestsJob());

        $this->assertDatabaseHas('skill_requests', [
            'id'     => $accepted->id,
            'status' => SkillRequestStatus::ACCEPTED->value,
        ]);
        $this->assertDatabaseHas('skill_requests', [
            'id'     => $pending->id,
            'status' => SkillRequestStatus::EXPIRED->value,
        ]);
    }

    // ── Duplicate After Resolution ──────────────────────────────────

    public function test_can_request_same_skill_after_rejection(): void
    {
        SkillRequest::factory()->create([
            'learner_id' => $this->learner->id,
            'teacher_id' => $this->teacher->id,
            'skill_id'   => $this->skill->id,
            'status'     => SkillRequestStatus::REJECTED,
        ]);

        $response = $this->actingAs($this->learner)->postJson('/api/v1/skill-requests', [
            'teacher_id' => $this->teacher->id,
            'skill_id'   => $this->skill->id,
        ]);

        $response->assertStatus(201);
    }

    // ── List ────────────────────────────────────────────────────────

    public function test_incoming_requests(): void
    {
        SkillRequest::factory()->create([
            'learner_id' => $this->learner->id,
            'teacher_id' => $this->teacher->id,
            'skill_id'   => $this->skill->id,
            'status'     => SkillRequestStatus::PENDING,
        ]);

        $response = $this->actingAs($this->teacher)->getJson(
            '/api/v1/skill-requests?role=teacher'
        );

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_outgoing_requests(): void
    {
        SkillRequest::factory()->create([
            'learner_id' => $this->learner->id,
            'teacher_id' => $this->teacher->id,
            'skill_id'   => $this->skill->id,
            'status'     => SkillRequestStatus::PENDING,
        ]);

        $response = $this->actingAs($this->learner)->getJson(
            '/api/v1/skill-requests?role=learner'
        );

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }
}