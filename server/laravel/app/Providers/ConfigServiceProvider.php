<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use RuntimeException;

class ConfigServiceProvider extends ServiceProvider
{
    /**
     * Required environment variable names that must be set in non-local environments.
     */
    private const REQUIRED_ENV_VARS = [
        'SKILL_REQUEST_EXPIRY_HOURS',
        'SESSION_REMINDER_HOURS_BEFORE',
        'MAX_ACTIVE_REQUESTS_PER_USER',
        'AVATAR_MAX_SIZE_KB',
        'CHAT_ATTACHMENT_MAX_SIZE_KB',
        'RATING_CACHE_TTL_MINUTES',
    ];

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // In production/staging, refuse to boot if any required env var is missing.
        if (! $this->app->environment('local')) {
            $missing = [];

            foreach (self::REQUIRED_ENV_VARS as $var) {
                if (env($var) === null) {
                    $missing[] = $var;
                }
            }

            if (! empty($missing)) {
                throw new RuntimeException(
                    'Missing required environment variables: ' . implode(', ', $missing)
                );
            }
        }
    }
}