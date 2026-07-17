<?php

declare(strict_types=1);

namespace App\Providers;

use App\DTOs\CloudinaryConfig;
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
        //
    }
}