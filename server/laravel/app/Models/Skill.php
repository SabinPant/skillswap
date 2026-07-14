<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Enums\SkillCategory;

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
}