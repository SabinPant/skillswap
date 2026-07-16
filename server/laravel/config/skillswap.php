<?php

declare(strict_types=1);

return [
    'request_expiry_hours'         => env('SKILL_REQUEST_EXPIRY_HOURS', 72),
    'session_reminder_hours_before' => env('SESSION_REMINDER_HOURS_BEFORE', 24),
    'max_active_requests_per_user' => env('MAX_ACTIVE_REQUESTS_PER_USER', 20),
    'avatar_max_size_kb'           => env('AVATAR_MAX_SIZE_KB', 2048),
    'chat_attachment_max_size_kb'  => env('CHAT_ATTACHMENT_MAX_SIZE_KB', 8192),
    'rating_cache_ttl_minutes'     => env('RATING_CACHE_TTL_MINUTES', 60),
];