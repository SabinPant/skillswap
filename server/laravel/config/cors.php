<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Restrict cross-origin requests to the SkillSwap frontend only.
    | Supports credentials for Sanctum's cookie/token auth flow.
    |
    */

    'paths' => ['api/v1/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],

    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:3000'),
    ],

    'allowed_headers' => [
        'Content-Type',
        'Authorization',
        'Accept',
        'X-Requested-With',
    ],

    'exposed_headers' => [],

    'max_age' => 86400,

    'supports_credentials' => true,
];