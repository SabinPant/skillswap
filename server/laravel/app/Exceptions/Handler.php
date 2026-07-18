<?php

declare(strict_types=1);

namespace App\Exceptions;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use App\Traits\ApiResponseTrait;
use Throwable;

class Handler extends ExceptionHandler
{
    use ApiResponseTrait;

    /**
     * Render an exception into an HTTP response.
     *
     * All exceptions return the standard error envelope. Stack traces,
     * SQL, and secrets are never exposed, in any environment.
     */
    public function render($request, Throwable $e): JsonResponse
    {
        // Business rule violations from Services
        if ($e instanceof DomainValidationException) {
            return $this->errorResponse(
                $e->getMessage(),
                $e->getCode() ?: 'VALIDATION_ERROR',
                [],
                $e->httpStatus,
            );
        }

        // Resource not found (thrown explicitly by Services)
        if ($e instanceof NotFoundException) {
            return $this->errorResponse(
                $e->getMessage(),
                'NOT_FOUND',
                [],
                404,
            );
        }

        // Form request validation failures (422)
        if ($e instanceof ValidationException) {
            return $this->errorResponse(
                'The given data was invalid.',
                'VALIDATION_ERROR',
                $e->errors(),
                422,
            );
        }

        // Eloquent findOrFail (404)
        if ($e instanceof ModelNotFoundException) {
            return $this->errorResponse(
                'Resource not found.',
                'NOT_FOUND',
                [],
                404,
            );
        }

        // Route not found (404)
        if ($e instanceof NotFoundHttpException) {
            return $this->errorResponse(
                'The requested endpoint was not found.',
                'NOT_FOUND',
                [],
                404,
            );
        }

        // Unauthenticated (401)
        if ($e instanceof AuthenticationException) {
            return $this->errorResponse(
                'Unauthenticated.',
                'UNAUTHENTICATED',
                [],
                401,
            );
        }

        // Forbidden — insufficient permissions (403)
        if ($e instanceof AuthorizationException) {
            return $this->errorResponse(
                'Insufficient permissions.',
                'INSUFFICIENT_PERMISSIONS',
                [],
                403,
            );
        }

        // Catch-all — never leak internal details
        return $this->errorResponse(
            'An unexpected error occurred.',
            'INTERNAL_ERROR',
            [],
            500,
        );
    }
}