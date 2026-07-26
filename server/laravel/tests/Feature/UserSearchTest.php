<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\ProficiencyLevel;
use App\Models\Skill;
use App\Models\User;
use App\Models\UserSkill;
use Tests\TestCase;

class UserSearchTest extends TestCase
{
    private User $teacher;
    private Skill $java;
    private Skill $python;

    protected function setUp(): void
    {
        parent::setUp();

        $this->teacher = User::factory()->create([
            'name'      => 'Sabin',
            'location'  => 'Kathmandu',
            'latitude'  => 27.7172,
            'longitude' => 85.3240,
        ]);

        $this->java = Skill::factory()->create(['name' => 'Java', 'slug' => 'java']);
        $this->python = Skill::factory()->create(['name' => 'Python', 'slug' => 'python']);

        UserSkill::factory()
            ->for($this->teacher)
            ->for($this->java)
            ->create([
                'proficiency_level' => ProficiencyLevel::EXPERT->value,
                'can_teach'         => true,
                'wants_to_learn'    => false,
            ]);

        UserSkill::factory()
            ->for($this->teacher)
            ->for($this->python)
            ->create([
                'proficiency_level' => ProficiencyLevel::INTERMEDIATE->value,
                'can_teach'         => true,
                'wants_to_learn'    => false,
            ]);
    }

    public function test_search_finds_teacher_by_skill_name(): void
    {
        $response = $this->actingAs($this->teacher)->getJson('/api/v1/users/search?skill=Java');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.skill_name', 'Java')
            ->assertJsonPath('data.data.0.name', 'Sabin');
    }

    public function test_search_returns_multiple_matches_for_partial_term(): void
    {
        $teacher2 = User::factory()->create(['name' => 'Pragya']);
        UserSkill::factory()
            ->for($teacher2)
            ->for($this->java)
            ->create([
                'proficiency_level' => ProficiencyLevel::BEGINNER->value,
                'can_teach'         => true,
                'wants_to_learn'    => false,
            ]);

        $response = $this->actingAs($this->teacher)->getJson('/api/v1/users/search?skill=Java');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data.data');
    }

    public function test_search_with_no_matching_skill_returns_empty(): void
    {
        $response = $this->actingAs($this->teacher)->getJson('/api/v1/users/search?skill=Ruby');

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data.data');
    }

    public function test_search_filtered_by_proficiency(): void
    {
        $response = $this->actingAs($this->teacher)->getJson(
            '/api/v1/users/search?skill=Java&min_proficiency=expert'
        );

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.skill_name', 'Java')
            ->assertJsonPath('data.data.0.proficiency_level', 'expert');
    }

    public function test_search_route_not_shadowed_by_show(): void
    {
        $response = $this->actingAs($this->teacher)->getJson('/api/v1/users/search?skill=Java');

        $response->assertStatus(200);
        $this->assertArrayHasKey('data', $response->json());
    }

    public function test_partial_skill_name_matches_via_substring(): void
    {
        $response = $this->actingAs($this->teacher)->getJson('/api/v1/users/search?skill=Jav');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.skill_name', 'Java');
    }

    public function test_wildcard_characters_are_escaped(): void
    {
        $response = $this->actingAs($this->teacher)->getJson('/api/v1/users/search?skill=%');

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data.data');
    }

    public function test_proficiency_filter_excludes_lower_levels(): void
    {
        $response = $this->actingAs($this->teacher)->getJson(
            '/api/v1/users/search?skill=Python&min_proficiency=advanced'
        );

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data.data');
    }
}