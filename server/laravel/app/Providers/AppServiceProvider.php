<?php

declare(strict_types=1);

namespace App\Providers;

use App\DTOs\CloudinaryConfig;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(CloudinaryConfig::class, function () {
            $config = config('services.cloudinary');

            return new CloudinaryConfig(
                cloudName: $config['cloud_name'],
                apiKey:    $config['api_key'],
                apiSecret: $config['api_secret'],
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->registerRateLimiters();
    }

    /**
     * Register all named rate limiters from config('skillswap.rate_limits').
     *
     * Public endpoints key by IP; authenticated endpoints key by user ID
     * (falling back to IP for unauthenticated requests that hit the middleware).
     */
    protected function registerRateLimiters(): void
    {
        $limits = config('skillswap.rate_limits');

        // Public endpoints — key by IP
        RateLimiter::for('login', fn (Request $request) =>
            Limit::perMinutes($limits['login']['decay_minutes'], $limits['login']['max_attempts'])
                ->by($request->ip() . '|login'));

        RateLimiter::for('register', fn (Request $request) =>
            Limit::perMinutes($limits['register']['decay_minutes'], $limits['register']['max_attempts'])
                ->by($request->ip() . '|register'));

        RateLimiter::for('forgot-password', fn (Request $request) =>
            Limit::perMinutes($limits['forgot_password']['decay_minutes'], $limits['forgot_password']['max_attempts'])
                ->by($request->ip() . '|forgot-password'));

        // Authenticated endpoints — key by user ID when available
        RateLimiter::for('resend-verification', fn (Request $request) =>
            Limit::perMinutes($limits['resend_verification']['decay_minutes'], $limits['resend_verification']['max_attempts'])
                ->by(($request->user()?->id ?? $request->ip()) . '|resend-verification'));

        RateLimiter::for('skill-request', fn (Request $request) =>
            Limit::perMinutes($limits['skill_request']['decay_minutes'], $limits['skill_request']['max_attempts'])
                ->by(($request->user()?->id ?? $request->ip()) . '|skill-request'));

        RateLimiter::for('review', fn (Request $request) =>
            Limit::perMinutes($limits['review']['decay_minutes'], $limits['review']['max_attempts'])
                ->by(($request->user()?->id ?? $request->ip()) . '|review'));

        RateLimiter::for('chat-message', fn (Request $request) =>
            Limit::perMinutes($limits['chat_message']['decay_minutes'], $limits['chat_message']['max_attempts'])
                ->by(($request->user()?->id ?? $request->ip()) . '|chat-message'));

        RateLimiter::for('avatar-upload', fn (Request $request) =>
            Limit::perMinutes($limits['avatar_upload']['decay_minutes'], $limits['avatar_upload']['max_attempts'])
                ->by(($request->user()?->id ?? $request->ip()) . '|avatar-upload'));

        RateLimiter::for('default', fn (Request $request) =>
            Limit::perMinutes($limits['default']['decay_minutes'], $limits['default']['max_attempts'])
                ->by(($request->user()?->id ?? $request->ip()) . '|default'));
    }
}