<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Skill;
use App\Models\User;
use App\Models\UserSkill;
use Tests\TestCase;

class UserSkillTest extends TestCase
{
    private User $user;
    private User $otherUser;
    private Skill $skill;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user      = User::factory()->create();
        $this->otherUser = User::factory()->create();
        $this->skill     = Skill::factory()->create(['name' => 'Laravel', 'slug' => 'laravel']);
    }

    public function test_user_can_add_skill(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/v1/user-skills', [
            'skill_id'          => $this->skill->id,
            'proficiency_level' => 'intermediate',
            'can_teach'         => true,
            'wants_to_learn'    => false,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.can_teach', true)
            ->assertJsonPath('data.wants_to_learn', false);
    }

    public function test_cannot_add_duplicate_skill(): void
    {
        UserSkill::factory()
            ->for($this->user)
            ->for($this->skill)
            ->create();

        $response = $this->actingAs($this->user)->postJson('/api/v1/user-skills', [
            'skill_id'          => $this->skill->id,
            'proficiency_level' => 'intermediate',
            'can_teach'         => true,
            'wants_to_learn'    => false,
        ]);

        $response->assertStatus(409)
            ->assertJsonPath('code', 'SKILL_ALREADY_ADDED');
    }

    public function test_cannot_add_with_both_intents_false(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/v1/user-skills', [
            'skill_id'          => $this->skill->id,
            'proficiency_level' => 'intermediate',
            'can_teach'         => false,
            'wants_to_learn'    => false,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('code', 'SKILL_INTENT_REQUIRED');
    }

    public function test_can_add_teaching_and_learning(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/v1/user-skills', [
            'skill_id'          => $this->skill->id,
            'proficiency_level' => 'expert',
            'can_teach'         => true,
            'wants_to_learn'    => true,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.can_teach', true)
            ->assertJsonPath('data.wants_to_learn', true);
    }

    public function test_user_can_update_own_skill(): void
    {
        $userSkill = UserSkill::factory()
            ->for($this->user)
            ->for($this->skill)
            ->create(['can_teach' => true, 'wants_to_learn' => false]);

        $response = $this->actingAs($this->user)->putJson("/api/v1/user-skills/{$userSkill->id}", [
            'proficiency_level' => 'advanced',
            'can_teach'         => true,
            'wants_to_learn'    => true,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.proficiency_level', 'advanced')
            ->assertJsonPath('data.wants_to_learn', true);
    }

    public function test_cannot_update_with_both_intents_false(): void
    {
        $userSkill = UserSkill::factory()
            ->for($this->user)
            ->for($this->skill)
            ->create(['can_teach' => true, 'wants_to_learn' => false]);

        $response = $this->actingAs($this->user)->putJson("/api/v1/user-skills/{$userSkill->id}", [
            'proficiency_level' => 'beginner',
            'can_teach'         => false,
            'wants_to_learn'    => false,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('code', 'SKILL_INTENT_REQUIRED');
    }

    public function test_cannot_access_other_users_skill(): void
    {
        $userSkill = UserSkill::factory()
            ->for($this->otherUser)
            ->for($this->skill)
            ->create();

        $response = $this->actingAs($this->user)->putJson("/api/v1/user-skills/{$userSkill->id}", [
            'proficiency_level' => 'advanced',
            'can_teach'         => true,
            'wants_to_learn'    => false,
        ]);

        $response->assertStatus(404);
    }

    public function test_user_can_delete_own_skill(): void
    {
        $userSkill = UserSkill::factory()
            ->for($this->user)
            ->for($this->skill)
            ->create();

        $response = $this->actingAs($this->user)->deleteJson("/api/v1/user-skills/{$userSkill->id}");

        $response->assertStatus(204);
    }

    public function test_cannot_delete_other_users_skill(): void
    {
        $userSkill = UserSkill::factory()
            ->for($this->otherUser)
            ->for($this->skill)
            ->create();

        $response = $this->actingAs($this->user)->deleteJson("/api/v1/user-skills/{$userSkill->id}");

        $response->assertStatus(404);
    }

    public function test_list_user_skills(): void
    {
        UserSkill::factory()
            ->for($this->user)
            ->for($this->skill)
            ->count(3)
            ->create();

        $response = $this->actingAs($this->user)->getJson('/api/v1/user-skills');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }
}