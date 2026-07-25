<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\SkillCategory;
use App\Models\Skill;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SkillSeeder extends Seeder
{
    /**
     * Seed the global skill taxonomy with initial skills.
     *
     * Idempotent — uses firstOrCreate to skip duplicates on re-runs.
     */
    public function run(): void
    {
        $skills = [
            // Programming
            ['name' => 'JavaScript', 'category' => SkillCategory::PROGRAMMING],
            ['name' => 'Python', 'category' => SkillCategory::PROGRAMMING],
            ['name' => 'Java', 'category' => SkillCategory::PROGRAMMING],
            ['name' => 'PHP', 'category' => SkillCategory::PROGRAMMING],
            ['name' => 'C++', 'category' => SkillCategory::PROGRAMMING],
            ['name' => 'React', 'category' => SkillCategory::PROGRAMMING],
            ['name' => 'HTML & CSS', 'category' => SkillCategory::PROGRAMMING],

            // Design
            ['name' => 'UI Design', 'category' => SkillCategory::DESIGN],
            ['name' => 'UX Design', 'category' => SkillCategory::DESIGN],
            ['name' => 'Graphic Design', 'category' => SkillCategory::DESIGN],
            ['name' => 'Illustration', 'category' => SkillCategory::DESIGN],
            ['name' => 'Motion Graphics', 'category' => SkillCategory::DESIGN],

            // Music
            ['name' => 'Guitar', 'category' => SkillCategory::MUSIC],
            ['name' => 'Piano', 'category' => SkillCategory::MUSIC],
            ['name' => 'Music Production', 'category' => SkillCategory::MUSIC],
            ['name' => 'Singing', 'category' => SkillCategory::MUSIC],
            ['name' => 'DJing', 'category' => SkillCategory::MUSIC],

            // Languages
            ['name' => 'English', 'category' => SkillCategory::LANGUAGES],
            ['name' => 'Spanish', 'category' => SkillCategory::LANGUAGES],
            ['name' => 'French', 'category' => SkillCategory::LANGUAGES],
            ['name' => 'Japanese', 'category' => SkillCategory::LANGUAGES],
            ['name' => 'Korean', 'category' => SkillCategory::LANGUAGES],
            ['name' => 'German', 'category' => SkillCategory::LANGUAGES],

            // Fitness
            ['name' => 'Yoga', 'category' => SkillCategory::FITNESS],
            ['name' => 'Weight Training', 'category' => SkillCategory::FITNESS],
            ['name' => 'Running', 'category' => SkillCategory::FITNESS],
            ['name' => 'Pilates', 'category' => SkillCategory::FITNESS],
            ['name' => 'Calisthenics', 'category' => SkillCategory::FITNESS],

            // Cooking
            ['name' => 'Italian Cooking', 'category' => SkillCategory::COOKING],
            ['name' => 'Baking', 'category' => SkillCategory::COOKING],
            ['name' => 'Indian Cuisine', 'category' => SkillCategory::COOKING],
            ['name' => 'Meal Prep', 'category' => SkillCategory::COOKING],
            ['name' => 'Plant-Based Cooking', 'category' => SkillCategory::COOKING],

            // Photography
            ['name' => 'Portrait Photography', 'category' => SkillCategory::PHOTOGRAPHY],
            ['name' => 'Landscape Photography', 'category' => SkillCategory::PHOTOGRAPHY],
            ['name' => 'Photo Editing', 'category' => SkillCategory::PHOTOGRAPHY],
            ['name' => 'Videography', 'category' => SkillCategory::PHOTOGRAPHY],

            // Marketing
            ['name' => 'Social Media Marketing', 'category' => SkillCategory::MARKETING],
            ['name' => 'SEO', 'category' => SkillCategory::MARKETING],
            ['name' => 'Content Marketing', 'category' => SkillCategory::MARKETING],
            ['name' => 'Email Marketing', 'category' => SkillCategory::MARKETING],
            ['name' => 'Google Ads', 'category' => SkillCategory::MARKETING],

            // Business
            ['name' => 'Project Management', 'category' => SkillCategory::BUSINESS],
            ['name' => 'Public Speaking', 'category' => SkillCategory::BUSINESS],
            ['name' => 'Negotiation', 'category' => SkillCategory::BUSINESS],
            ['name' => 'Entrepreneurship', 'category' => SkillCategory::BUSINESS],
            ['name' => 'Financial Literacy', 'category' => SkillCategory::BUSINESS],

            // Other
            ['name' => 'Creative Writing', 'category' => SkillCategory::OTHER],
            ['name' => 'Public Speaking', 'category' => SkillCategory::OTHER],
            ['name' => 'Woodworking', 'category' => SkillCategory::OTHER],
            ['name' => 'Gardening', 'category' => SkillCategory::OTHER],
            ['name' => 'Chess', 'category' => SkillCategory::OTHER],
        ];

        foreach ($skills as $skill) {
            Skill::firstOrCreate(
                ['name' => $skill['name']],
                [
                    'slug'        => Str::slug($skill['name']),
                    'category'    => $skill['category'],
                    'description' => null,
                ],
            );
        }
    }
}