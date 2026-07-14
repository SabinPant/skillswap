<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Enums\ProficiencyLevel;

class UserSkill extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    /**
     * Columns safe for mass assignment (set by UserSkillService, not direct user input).
     */
    protected $fillable = [
        'user_id',
        'skill_id',
        'proficiency_level',
        'can_teach',
        'wants_to_learn',
    ];

    /**
     * Native attribute casting.
     */
    protected function casts(): array
    {
        return [
            'proficiency_level' => ProficiencyLevel::class,
            'can_teach'         => 'boolean',
            'wants_to_learn'    => 'boolean',
        ];
    }

    /**
     * The user who owns this skill entry.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The skill referenced by this entry.
     */
    public function skill(): BelongsTo
    {
        return $this->belongsTo(Skill::class);
    }
}