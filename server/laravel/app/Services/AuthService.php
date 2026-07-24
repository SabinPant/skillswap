<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\DomainValidationException;
use App\Exceptions\NotFoundException;
use App\Jobs\SendEmailVerificationJob;
use App\Jobs\SendPasswordResetEmailJob;
use App\Models\User;
use App\Repositories\UserRepository;
use Illuminate\Support\Facades\Hash;
use Throwable;

/**
 * Class AuthService
 *
 * Handles core authentication logic, user registration, token management,
 * and account recovery processes.
 */
class AuthService
{
    /**
     * AuthService constructor.
     *
     * @param UserRepository $userRepository
     * @param TokenService   $tokenService
     */
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly TokenService $tokenService,
    ) {}

    /**
     * Registers a new user, dispatches the email verification job, 
     * and returns an access token.
     *
     * @param array<string, mixed> $data The user registration payload.
     * @return array{user: User, token: string}
     *
     * @throws DomainValidationException If the email is already registered.
     * @throws Throwable If token generation or email dispatch fails.
     */
    public function register(array $data): array
    {
        if ($this->userRepository->findByEmail($data['email'])) {
            throw new DomainValidationException(
                'This email is already registered.',
                'EMAIL_ALREADY_EXISTS',
                409
            );
        }

        $user = $this->userRepository->create($data);
        $user->refresh();

        try {
            // Generate a single-use verification token (24h TTL) and queue the email.
            $rawToken = $this->tokenService->generate('email:verify', $user->id, 86400);
            SendEmailVerificationJob::dispatch($user, $rawToken);
        } catch (Throwable $e) {
            // Token generation or dispatch failed — hard-delete the user so the
            // client can retry cleanly. This is an exception to the "never hard-delete"
            // rule: the row is milliseconds old with zero related data.
            $user->forceDelete();
            
            throw $e;
        }

        $token = $user->createToken(
            'auth_token',
            ['*'],
            now()->addDays((int) config('skillswap.token_expiry_days'))
        );

        return [
            'user'  => $user,
            'token' => $token->plainTextToken,
        ];
    }

    /**
     * Authenticates a user by email and password.
     *
     * @param string $email
     * @param string $password
     * @return array{user: User, token: string}
     *
     * @throws DomainValidationException If credentials are invalid.
     */
    public function login(string $email, string $password): array
    {
        $user = $this->userRepository->findByEmail($email);

        if (! $user || ! Hash::check($password, $user->password)) {
            throw new DomainValidationException(
                'Invalid email or password.',
                'INVALID_CREDENTIALS',
                401
            );
        }

        $token = $user->createToken(
            'auth_token',
            ['*'],
            now()->addDays((int) config('skillswap.token_expiry_days'))
        );

        return [
            'user'  => $user,
            'token' => $token->plainTextToken,
        ];
    }

    /**
     * Revokes the current access token for the authenticated user.
     *
     * @param User $user
     * @return void
     */
    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }

    /**
     * Rotates the current access token — revokes the old one and issues a new one 
     * while preserving the original expiration time.
     *
     * @param User $user
     * @return array{token: string}
     */
    public function refresh(User $user): array
    {
        $oldToken = $user->currentAccessToken();
        
        // Preserve absolute lifetime
        $expiresAt = $oldToken->expires_at; 

        $oldToken->delete();

        $token = $user->createToken('auth_token', ['*'], $expiresAt);

        return [
            'token' => $token->plainTextToken,
        ];
    }

    /**
     * Retrieves the authenticated user's full model instance.
     *
     * @param User $user
     * @return User
     */
    public function me(User $user): User
    {
        return $user;
    }

    /**
     * Verifies a user's email using a single-use verification token.
     *
     * @param string $rawToken
     * @return User
     *
     * @throws DomainValidationException If the token is invalid or expired.
     * @throws NotFoundException         If the user no longer exists.
     */
    public function verifyEmail(string $rawToken): User
    {
        $userId = $this->tokenService->verify('email:verify', $rawToken);

        if ($userId === null) {
            throw new DomainValidationException(
                'Invalid or expired verification token.',
                'INVALID_VERIFICATION_TOKEN',
                400
            );
        }

        $user = $this->userRepository->findById($userId);

        if ($user === null) {
            throw new NotFoundException('User not found.');
        }

        // If already verified (double-click), the operation is idempotent — no error.
        if ($user->email_verified_at === null) {
            $user->email_verified_at = now();
            $user->save();
        }

        return $user;
    }

    /**
     * Sends a password reset email if the given email belongs to an existing user.
     * 
     * Note: This method silently succeeds when the email is not found to prevent
     * user enumeration attacks.
     *
     * @param string $email
     * @return void
     */
    public function forgotPassword(string $email): void
    {
        $user = $this->userRepository->findByEmail($email);

        if ($user === null) {
            return; // Fail silently
        }

        $rawToken = $this->tokenService->generate('email:reset', $user->id, 3600);
        
        SendPasswordResetEmailJob::dispatch($user, $rawToken);
    }

    /**
     * Resets a user's password using a single-use reset token and revokes 
     * all active sessions.
     *
     * @param string $rawToken
     * @param string $newPassword
     * @return void
     *
     * @throws DomainValidationException If the token is invalid or expired.
     * @throws NotFoundException         If the user no longer exists.
     */
    public function resetPassword(string $rawToken, string $newPassword): void
    {
        $userId = $this->tokenService->verify('email:reset', $rawToken);

        if ($userId === null) {
            throw new DomainValidationException(
                'Invalid or expired reset token.',
                'INVALID_RESET_TOKEN',
                400
            );
        }

        $user = $this->userRepository->findById($userId);

        if ($user === null) {
            throw new NotFoundException('User not found.');
        }

        $user->password = $newPassword;
        
        // Invalidate all existing sessions/tokens upon password reset
        $user->tokens()->delete();
        
        $user->save();
    }

    /**
     * Resends a verification email for the authenticated user.
     *
     * The previous verification token is not explicitly revoked —
     * it harmlessly expires via its own Redis TTL, following the
     * "One Atomic Write" rule in SKILLSWAP.md.
     *
     * @param User $user
     * @return void
     *
     * @throws DomainValidationException If the email is already verified.
     */
    public function resendVerification(User $user): void
    {
        if ($user->email_verified_at !== null) {
            throw new DomainValidationException(
                'Email is already verified.',
                'EMAIL_ALREADY_VERIFIED',
                409
            );
        }

        $rawToken = $this->tokenService->generate('email:verify', $user->id, 86400);
        
        SendEmailVerificationJob::dispatch($user, $rawToken);
    }
}