<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Skill;
use App\Models\User;
use Tests\TestCase;

class SkillTest extends TestCase
{
    private User $admin;
    private User $regularUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $this->regularUser = User::factory()->create(['role' => UserRole::USER]);
    }

    public function test_admin_can_create_skill(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/api/v1/skills', [
            'name'     => 'Laravel',
            'category' => 'programming',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Laravel')
            ->assertJsonPath('data.slug', 'laravel');

        $this->assertDatabaseHas('skills', ['name' => 'Laravel']);
    }

    public function test_duplicate_name_returns_422(): void
    {
        Skill::factory()->create(['name' => 'Duplicate', 'slug' => 'duplicate']);

        $response = $this->actingAs($this->admin)->postJson('/api/v1/skills', [
            'name'     => 'Duplicate',
            'category' => 'programming',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('code', 'VALIDATION_ERROR');
    }

    public function test_slug_collision_returns_409(): void
    {
        Skill::factory()->create(['name' => 'Hello World', 'slug' => 'hello-world']);

        $response = $this->actingAs($this->admin)->postJson('/api/v1/skills', [
            'name'     => 'Hello - World',
            'category' => 'other',
        ]);

        $response->assertStatus(409)
            ->assertJsonPath('code', 'RESOURCE_ALREADY_EXISTS');
    }

    public function test_admin_can_update_skill(): void
    {
        $skill = Skill::factory()->create(['name' => 'Old Name', 'slug' => 'old-name']);

        $response = $this->actingAs($this->admin)->putJson("/api/v1/skills/{$skill->id}", [
            'name'     => 'New Name',
            'category' => 'design',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'New Name')
            ->assertJsonPath('data.slug', 'new-name');

        $this->assertDatabaseHas('skills', ['name' => 'New Name']);
    }

    public function test_admin_can_delete_unused_skill(): void
    {
        $skill = Skill::factory()->create();

        $response = $this->actingAs($this->admin)->deleteJson("/api/v1/skills/{$skill->id}");

        $response->assertStatus(204);

        $this->assertDatabaseMissing('skills', ['id' => $skill->id]);
    }

    public function test_non_admin_cannot_create_skill(): void
    {
        $response = $this->actingAs($this->regularUser)->postJson('/api/v1/skills', [
            'name'     => 'Hacker Skill',
            'category' => 'other',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('code', 'INSUFFICIENT_PERMISSIONS');
    }

    public function test_list_skills(): void
    {
        Skill::factory()->count(3)->create();

        $response = $this->actingAs($this->regularUser)->getJson('/api/v1/skills');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_show_skill(): void
    {
        $skill = Skill::factory()->create(['name' => 'TypeScript']);

        $response = $this->actingAs($this->regularUser)->getJson("/api/v1/skills/{$skill->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'TypeScript');
    }
}