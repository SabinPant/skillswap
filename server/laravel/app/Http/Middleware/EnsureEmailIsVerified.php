<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Exceptions\DomainValidationException;
use Closure;
use Illuminate\Http\Request;

class EnsureEmailIsVerified
{
    /**
     * Block unverified users from gated actions.
     *
     * @throws DomainValidationException If the user's email is not verified.
     */
    public function handle(Request $request, Closure $next): mixed
    {
        if ($request->user()?->email_verified_at === null) {
            throw new DomainValidationException(
                'You must verify your email before performing this action.',
                'EMAIL_NOT_VERIFIED',
                403,
            );
        }

        return $next($request);
    }
}