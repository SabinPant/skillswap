<?php

declare(strict_types=1);

return [
    'request_expiry_hours'          => env('SKILL_REQUEST_EXPIRY_HOURS', 72),
    'session_reminder_hours_before' => env('SESSION_REMINDER_HOURS_BEFORE', 24),
    'max_active_requests_per_user'  => env('MAX_ACTIVE_REQUESTS_PER_USER', 20),
    'avatar_max_size_kb'            => env('AVATAR_MAX_SIZE_KB', 2048),
    'chat_attachment_max_size_kb'   => env('CHAT_ATTACHMENT_MAX_SIZE_KB', 8192),
    'rating_cache_ttl_minutes'      => env('RATING_CACHE_TTL_MINUTES', 60),
    'admin_email'                   => env('ADMIN_EMAIL', 'admin@skillswap.test'),
    'admin_password'                => env('ADMIN_PASSWORD', 'CHANGE_ME_BEFORE_SEEDING'),

    'rate_limits' => [
        'login' => [
            'max_attempts'  => (int) env('RATE_LIMIT_LOGIN_MAX_ATTEMPTS', 5),
            'decay_minutes' => (int) env('RATE_LIMIT_LOGIN_DECAY_MINUTES', 15),
        ],
        'register' => [
            'max_attempts'  => (int) env('RATE_LIMIT_REGISTER_MAX_ATTEMPTS', 3),
            'decay_minutes' => (int) env('RATE_LIMIT_REGISTER_DECAY_MINUTES', 60),
        ],
        'forgot_password' => [
            'max_attempts'  => (int) env('RATE_LIMIT_FORGOT_PASSWORD_MAX_ATTEMPTS', 3),
            'decay_minutes' => (int) env('RATE_LIMIT_FORGOT_PASSWORD_DECAY_MINUTES', 60),
        ],
        'resend_verification' => [
            'max_attempts'  => (int) env('RATE_LIMIT_RESEND_VERIFICATION_MAX_ATTEMPTS', 3),
            'decay_minutes' => (int) env('RATE_LIMIT_RESEND_VERIFICATION_DECAY_MINUTES', 60),
        ],
        'skill_request' => [
            'max_attempts'  => (int) env('RATE_LIMIT_SKILL_REQUEST_MAX_ATTEMPTS', 10),
            'decay_minutes' => (int) env('RATE_LIMIT_SKILL_REQUEST_DECAY_MINUTES', 1),
        ],
        'review' => [
            'max_attempts'  => (int) env('RATE_LIMIT_REVIEW_MAX_ATTEMPTS', 10),
            'decay_minutes' => (int) env('RATE_LIMIT_REVIEW_DECAY_MINUTES', 1),
        ],
        'chat_message' => [
            'max_attempts'  => (int) env('RATE_LIMIT_CHAT_MESSAGE_MAX_ATTEMPTS', 30),
            'decay_minutes' => (int) env('RATE_LIMIT_CHAT_MESSAGE_DECAY_MINUTES', 1),
        ],
        'avatar_upload' => [
            'max_attempts'  => (int) env('RATE_LIMIT_AVATAR_UPLOAD_MAX_ATTEMPTS', 5),
            'decay_minutes' => (int) env('RATE_LIMIT_AVATAR_UPLOAD_DECAY_MINUTES', 60),
        ],
        'default' => [
            'max_attempts'  => (int) env('RATE_LIMIT_DEFAULT_MAX_ATTEMPTS', 100),
            'decay_minutes' => (int) env('RATE_LIMIT_DEFAULT_DECAY_MINUTES', 1),
        ],
    ],
];