<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\DomainValidationException;
use App\Models\User;
use App\Repositories\UserRepository;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    public function __construct(
        private readonly UserRepository $userRepository,
    ) {}

    /**
     * Register a new user and return an access token.
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
}