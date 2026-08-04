<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\SkillController;
use App\Http\Controllers\Api\V1\UserSkillController;
use App\Http\Controllers\Api\V1\SkillRequestController;
use App\Http\Controllers\Api\V1\ConversationController;
use App\Http\Controllers\Api\V1\MessageController;
use App\Http\Controllers\Api\V1\ReviewController;
use App\Http\Controllers\Api\V1\NotificationController;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Http\Request;
use App\Http\Controllers\Api\V1\StatsController;

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
            Route::post('/resend-verification', [AuthController::class, 'resendVerification'])
                ->middleware('throttle:resend-verification');
        });
    });

    // Skills — authenticated read
    Route::middleware(['throttle:default'])
        ->prefix('skills')
        ->group(function () {
            Route::get('/', [SkillController::class, 'index']);
            Route::get('/{id}', [SkillController::class, 'show']);
        });

    // Skills — Admin only
    Route::middleware(['throttle:default', 'auth:sanctum', \App\Http\Middleware\EnsureUserIsAdmin::class])
        ->prefix('skills')
        ->group(function () {
            Route::post('/', [SkillController::class, 'store']);
            Route::put('/{id}', [SkillController::class, 'update']);
            Route::delete('/{id}', [SkillController::class, 'destroy']);
        });

    // Admin — protected behind Sanctum + Admin role middleware
    Route::middleware(['throttle:default', 'auth:sanctum', \App\Http\Middleware\EnsureUserIsAdmin::class])
        ->prefix('admin')
        ->group(function () {
            Route::get('/stats', [\App\Http\Controllers\Api\V1\AdminController::class, 'stats']);
            Route::get('/users', [\App\Http\Controllers\Api\V1\AdminController::class, 'users']);
            Route::put('/users/{id}/suspend', [\App\Http\Controllers\Api\V1\AdminController::class, 'suspendUser']);
            Route::put('/users/{id}/unsuspend', [\App\Http\Controllers\Api\V1\AdminController::class, 'unsuspendUser']);
            Route::get('/reviews', [\App\Http\Controllers\Api\V1\AdminController::class, 'reviews']);
            Route::put('/reviews/{id}/hide', [\App\Http\Controllers\Api\V1\AdminController::class, 'hideReview']);
        });

    // Users — protected (requires valid Sanctum token + default rate limit)
    Route::middleware(['throttle:default', 'auth:sanctum'])->group(function () {
        // Static routes MUST come before /{id} to avoid shadowing.
        Route::get('/users/search', [UserController::class, 'search']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::post('/users/{id}/avatar', [UserController::class, 'uploadAvatar'])
            ->middleware('throttle:avatar-upload');
    });

    // Users — public
    Route::get('/users/{id}', [UserController::class, 'show']);

    // User Skills — authenticated user's own skill listings
    Route::middleware(['throttle:default', 'auth:sanctum'])
        ->prefix('user-skills')
        ->group(function () {
            Route::get('/', [UserSkillController::class, 'index']);
            Route::post('/', [UserSkillController::class, 'store']);
            Route::put('/{id}', [UserSkillController::class, 'update']);
            Route::delete('/{id}', [UserSkillController::class, 'destroy']);
        });

    // Skill Requests — authenticated, email-verified for creation
    Route::middleware(['throttle:default', 'auth:sanctum'])
        ->prefix('skill-requests')
        ->group(function () {
            Route::get('/', [SkillRequestController::class, 'index']);
            Route::get('/{id}', [SkillRequestController::class, 'show']);
            Route::post('/', [SkillRequestController::class, 'store'])
                ->middleware(\App\Http\Middleware\EnsureEmailIsVerified::class);
            Route::put('/{id}/accept', [SkillRequestController::class, 'accept']);
            Route::put('/{id}/reject', [SkillRequestController::class, 'reject']);
            Route::put('/{id}/cancel', [SkillRequestController::class, 'cancel']);
            Route::put('/{id}/complete', [SkillRequestController::class, 'complete']);
        });

    // Conversations — authenticated, participant-scoped
    Route::middleware(['throttle:default', 'auth:sanctum'])
        ->prefix('conversations')
        ->group(function () {
            Route::get('/', [ConversationController::class, 'index']);
            Route::get('/{id}', [ConversationController::class, 'show']);
        });

    // Messages — authenticated, participant-scoped
    Route::middleware(['throttle:default', 'auth:sanctum'])
        ->prefix('conversations/{conversationId}/messages')
        ->group(function () {
            Route::get('/', [MessageController::class, 'index']);
            Route::post('/', [MessageController::class, 'store']);
            Route::put('/read', [MessageController::class, 'markAllRead']);
        });

    // Reviews
    Route::middleware(['throttle:default', 'auth:sanctum'])->group(function () {
        Route::post('/reviews', [ReviewController::class, 'store'])
            ->middleware('throttle:review');
        Route::get('/reviews/user/{userId}', [ReviewController::class, 'index']);
    });

    // Notifications — authenticated, user-scoped
    Route::middleware(['throttle:default', 'auth:sanctum'])
        ->prefix('notifications')
        ->group(function () {
            Route::get('/', [NotificationController::class, 'index']);
            Route::put('/{id}/read', [NotificationController::class, 'markRead']);
            Route::put('/read-all', [NotificationController::class, 'markAllRead']);
            Route::delete('/{id}', [NotificationController::class, 'destroy']);
        });

    // Public stats — no auth required
    Route::get('/stats', [\App\Http\Controllers\Api\V1\StatsController::class, '__invoke']);

    // Broadcasting auth — authenticated via Sanctum Bearer token
    Route::post('/broadcasting/auth', function (Request $request) {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        return Broadcast::auth($request);
    })->middleware('auth:sanctum');
});