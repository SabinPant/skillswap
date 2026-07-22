<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — /api/v1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // Auth — public
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register'])
            ->middleware('throttle:register');

        Route::post('/login', [AuthController::class, 'login'])
            ->middleware('throttle:login');

        Route::post('/verify-email', [AuthController::class, 'verifyEmail']);

        Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])
            ->middleware('throttle:forgot-password');

        Route::post('/reset-password', [AuthController::class, 'resetPassword']);

        // Auth — protected (requires valid Sanctum token + default rate limit)
        Route::middleware(['throttle:default', 'auth:sanctum'])->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::post('/refresh', [AuthController::class, 'refresh']);
            Route::get('/me', [AuthController::class, 'me']);
        });
    });

    // Users
    Route::get('/users/{id}', [UserController::class, 'show']);

    Route::middleware(['throttle:default', 'auth:sanctum'])->group(function () {
        Route::put('/users/{id}', [UserController::class, 'update']);
    });
});