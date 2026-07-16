<?php

declare(strict_types=1);

namespace App\Traits;

use Illuminate\Http\JsonResponse;

/**
 * Standard JSON response envelope used by all API controllers and the
 * global exception handler, matching the shape defined in SKILLSWAP.md.
 */
trait ApiResponseTrait
{
    /**
     * Return a successful response.
     */
    protected function successResponse(
        mixed $data = null,
        array $meta = [],
        int $status = 200,
    ): JsonResponse {
        $response = ['success' => true];

        if ($data !== null) {
            $response['data'] = $data;
        }

        if (! empty($meta)) {
            $response['meta'] = $meta;
        }

        return response()->json($response, $status);
    }

    /**
     * Return an error response in the standard envelope.
     */
    protected function errorResponse(
        string $message,
        string $code,
        array $errors = [],
        int $status = 400,
    ): JsonResponse {
        return response()->json([
            'success'   => false,
            'message'   => $message,
            'code'      => $code,
            'timestamp' => now()->toIso8601String(),
            'errors'    => $errors,
        ], $status);
    }
}