<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\User;

/**
 * Handles all Eloquent queries for the users table.
 * No business logic or validation — only database access.
 */
class UserRepository
{
    /**
     * Find a user by email address.
     */
    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    /**
     * Find a user by their UUID.
     */
    public function findById(string $id): ?User
    {
        return User::find($id);
    }

    /**
     * Create a new user and return the model.
     */
    public function create(array $data): User
    {
        return User::create($data);
    }
}