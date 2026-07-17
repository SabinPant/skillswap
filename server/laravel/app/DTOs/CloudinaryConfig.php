<?php

declare(strict_types=1);

namespace App\DTOs;

/**
 * Cloudinary SDK configuration values, loaded from config('services.cloudinary').
 *
 * This DTO exists so Laravel's container has a concrete type to resolve
 * when injecting into FileUploadService — a raw array cannot be auto-resolved.
 */
readonly class CloudinaryConfig
{
    public function __construct(
        public string $cloudName,
        public string $apiKey,
        public string $apiSecret,
    ) {}
}