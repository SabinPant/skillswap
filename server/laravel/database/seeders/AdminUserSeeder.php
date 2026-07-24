<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    /**
     * Seed the admin user from env-driven credentials.
     *
     * Idempotent — skips if an admin with the same email already exists.
     */
    public function run(): void
    {
        $email    = config('skillswap.admin_email');
        $password = config('skillswap.admin_password');

        $admin = User::firstOrCreate(
            ['email' => $email],
            [
                'name'     => 'Admin',
                'password' => $password,
            ],
        );

        // Only promote to Admin if we just created this user —
        // an existing account with this email must not be silently elevated.
        if ($admin->wasRecentlyCreated) {
            $admin->role = UserRole::ADMIN;
            $admin->save();
        }
    }
}