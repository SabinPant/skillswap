<?php

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use App\Exceptions\DomainValidationException;
use App\Exceptions\NotFoundException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Force JSON responses for all API routes
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        // Business rule violations from Services
        $exceptions->map(DomainValidationException::class, fn (DomainValidationException $e) =>
            response()->json([
                'success'   => false,
                'message'   => $e->getMessage(),
                'code'      => $e->getCode() ?: 'VALIDATION_ERROR',
                'timestamp' => now()->toIso8601String(),
                'errors'    => [],
            ], $e->httpStatus)
        );

        // Resource not found (thrown explicitly by Services)
        $exceptions->map(NotFoundException::class, fn (NotFoundException $e) =>
            response()->json([
                'success'   => false,
                'message'   => $e->getMessage(),
                'code'      => 'NOT_FOUND',
                'timestamp' => now()->toIso8601String(),
                'errors'    => [],
            ], 404)
        );

        // Form request validation failures (422)
        $exceptions->map(ValidationException::class, fn (ValidationException $e) =>
            response()->json([
                'success'   => false,
                'message'   => 'The given data was invalid.',
                'code'      => 'VALIDATION_ERROR',
                'timestamp' => now()->toIso8601String(),
                'errors'    => $e->errors(),
            ], 422)
        );

        // Eloquent findOrFail (404)
        $exceptions->map(ModelNotFoundException::class, fn (ModelNotFoundException $e) =>
            response()->json([
                'success'   => false,
                'message'   => 'Resource not found.',
                'code'      => 'NOT_FOUND',
                'timestamp' => now()->toIso8601String(),
                'errors'    => [],
            ], 404)
        );

        // Route not found (404)
        $exceptions->map(NotFoundHttpException::class, fn (NotFoundHttpException $e) =>
            response()->json([
                'success'   => false,
                'message'   => 'The requested endpoint was not found.',
                'code'      => 'NOT_FOUND',
                'timestamp' => now()->toIso8601String(),
                'errors'    => [],
            ], 404)
        );

        // Unauthenticated (401)
        $exceptions->map(AuthenticationException::class, fn (AuthenticationException $e) =>
            response()->json([
                'success'   => false,
                'message'   => 'Unauthenticated.',
                'code'      => 'UNAUTHENTICATED',
                'timestamp' => now()->toIso8601String(),
                'errors'    => [],
            ], 401)
        );

        // Forbidden (403)
        $exceptions->map(AuthorizationException::class, fn (AuthorizationException $e) =>
            response()->json([
                'success'   => false,
                'message'   => 'Insufficient permissions.',
                'code'      => 'INSUFFICIENT_PERMISSIONS',
                'timestamp' => now()->toIso8601String(),
                'errors'    => [],
            ], 403)
        );
    })->create();