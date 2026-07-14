<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use App\Enums\UserRole;

class User extends Authenticatable
{
    use HasFactory, HasUuids, SoftDeletes;

    /**
     * UUIDs are strings, not auto-incrementing integers.
     */
    protected $keyType = 'string';
    public $incrementing = false;

    /**
     * Columns that are safe for mass assignment from user input.
     *
     * Any column not in this list cannot be mass-assigned — a deliberate
     * allow-list that fails closed if a new sensitive column is added later.
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'location',
        'latitude',
        'longitude',
        'bio',
        'avatar_public_id',
    ];

    /**
     * Attributes that should be hidden from array/JSON serialization.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Native attribute casting.
     */
    protected function casts(): array
    {
        return [
            'role'              => UserRole::class,
            'email_verified_at' => 'datetime',
            'suspended_at'      => 'datetime',
            'password'          => 'hashed',
        ];
    }
}