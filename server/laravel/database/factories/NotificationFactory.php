<?php

namespace Database\Factories;

use App\Models\Notification;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Notification>
 */
class NotificationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id'      => \App\Models\User::factory(),
            'type'         => 'request_received',
            'title'        => fake()->sentence(),
            'message'      => fake()->sentence(),
            'data'         => [],
            'is_read'      => false,
            'is_dismissed' => false,
            'unread_count' => 0,
        ];
    }
}
