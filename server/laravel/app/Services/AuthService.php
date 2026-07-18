<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\DomainValidationException;
use App\Exceptions\NotFoundException;
use App\Jobs\SendEmailVerificationJob;
use App\Models\User;
use App\Repositories\UserRepository;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly TokenService $tokenService,
    ) {}

    /**
     * Register a new user, dispatch email verification, and return an access token.
     *
     * @throws DomainValidationException If the email is already registered.
     */
    public function register(array $data): array
    {
        if ($this->userRepository->findByEmail($data['email'])) {
            throw new DomainValidationException(
                'This email is already registered.',
                'EMAIL_ALREADY_EXISTS',
                409,
            );
        }

        $user = $this->userRepository->create($data);

        try {
            // Generate a single-use verification token (24h TTL) and queue the email.
            $rawToken = $this->tokenService->generate('email:verify', $user->id, 86400);
            SendEmailVerificationJob::dispatch($user, $rawToken);
        } catch (\Throwable $e) {
            // Token generation or dispatch failed — hard-delete the user so the
            // client can retry cleanly. This is an exception to the "never hard-delete"
            // rule: the row is milliseconds old with zero related data.
            $user->forceDelete();
            throw $e;
        }

        $token = $user->createToken('auth_token');

        return [
            'user'  => $user,
            'token' => $token->plainTextToken,
        ];
    }

    /**
     * Authenticate a user by email and password.
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
                401,
            );
        }

        $token = $user->createToken('auth_token');

        return [
            'user'  => $user,
            'token' => $token->plainTextToken,
        ];
    }

    /**
     * Revoke the current access token.
     */
    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }

    /**
     * Rotate the current token — revoke the old one and issue a new one.
     */
    public function refresh(User $user): array
    {
        $user->currentAccessToken()->delete();

        $token = $user->createToken('auth_token');

        return [
            'token' => $token->plainTextToken,
        ];
    }

    /**
     * Return the authenticated user's full model.
     */
    public function me(User $user): User
    {
        return $user;
    }

    /**
     * Verify a user's email using a single-use verification token.
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
                400,
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
}