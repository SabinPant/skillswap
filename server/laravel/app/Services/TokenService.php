<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

/**
 * Manages single-use tokens stored in Redis (email verification, password reset).
 *
 * Tokens are never stored raw — the Redis key is the SHA-256 hash of the raw token,
 * so a compromised Redis instance doesn't leak usable tokens.
 */
class TokenService
{
    /**
     * Generate a single-use token and store its hash in Redis.
     *
     * @param string $prefix    Redis key prefix (e.g. 'email:verify', 'email:reset').
     * @param string $userId    The user this token belongs to.
     * @param int    $ttlSeconds Time-to-live in seconds.
     *
     * @return string The raw token to send to the user (not the hash).
     */
    public function generate(string $prefix, string $userId, int $ttlSeconds): string
    {
        $rawToken = Str::random(64);
        $hash     = hash('sha256', $rawToken);

        Redis::setex("{$prefix}:{$hash}", $ttlSeconds, $userId);

        return $rawToken;
    }

    /**
     * Verify a raw token and return the associated user ID if valid.
     *
     * The token is single-use — it is deleted from Redis immediately upon
     * successful verification.
     *
     * @param string $prefix   Redis key prefix (must match the one used in generate()).
     * @param string $rawToken The raw token received from the user.
     *
     * @return string|null The user ID if the token is valid, null otherwise.
     */
    public function verify(string $prefix, string $rawToken): ?string
    {
        $hash = hash('sha256', $rawToken);
        $key  = "{$prefix}:{$hash}";

        $userId = Redis::get($key);

        if ($userId !== null) {
            Redis::del($key);
            return $userId;
        }

        return null;
    }
}