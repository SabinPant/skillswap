<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Enums\SkillCategory;
use App\Models\SkillRequest;
use App\Models\UserSkill;

class Skill extends Model
{
    use HasFactory, HasUuids;

    /**
     * UUIDs are strings, not auto-incrementing integers.
     */
    protected $keyType = 'string';
    public $incrementing = false;

    /**
     * Columns safe for mass assignment (admin-managed taxonomy).
     */
    protected $fillable = [
        'name',
        'slug',
        'category',
        'description',
    ];

    /**
     * Native attribute casting.
     */
    protected function casts(): array
    {
        return [
            'category' => SkillCategory::class,
        ];
    }

    /**
     * Users who have listed this skill (teach or learn).
     */
    public function userSkills(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(UserSkill::class);
    }

    /**
     * Skill requests that reference this skill.
     */
    public function skillRequests(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(SkillRequest::class);
    }

}