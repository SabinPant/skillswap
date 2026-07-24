<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;

class EnsureUserIsAdmin
{
    /**
     * Only allow users with the ADMIN role to proceed.
     *
     * @throws AuthorizationException If the user is not an admin.
     */
    public function handle(Request $request, Closure $next): mixed
    {
        if ($request->user()?->role !== UserRole::ADMIN) {
            throw new AuthorizationException(
                'Insufficient permissions.'
            );
        }

        return $next($request);
    }
}