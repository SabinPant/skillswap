<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginUserRequest;
use App\Http\Requests\Auth\RegisterUserRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\VerifyEmailRequest;
use App\Services\AuthService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        private readonly AuthService $authService,
    ) {}

    /**
     * Register a new user.
     */
    public function register(RegisterUserRequest $request): JsonResponse
    {
        $result = $this->authService->register($request->validated());

        return $this->successResponse($result, [], 201);
    }

    /**
     * Login and return an access token.
     */
    public function login(LoginUserRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $result = $this->authService->login($validated['email'], $validated['password']);

        return $this->successResponse($result);
    }

    /**
     * Revoke the current token.
     */
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return $this->successResponse(data: null, status: 204);
    }

    /**
     * Rotate the current token — revoke old, issue new.
     */
    public function refresh(Request $request): JsonResponse
    {
        $result = $this->authService->refresh($request->user());

        return $this->successResponse($result);
    }

    /**
     * Return the currently authenticated user.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $this->authService->me($request->user());

        return $this->successResponse($user);
    }

    /**
     * Verify a user's email using a verification token.
     */
    public function verifyEmail(VerifyEmailRequest $request): JsonResponse
    {
        $user = $this->authService->verifyEmail($request->validated('token'));

        return $this->successResponse($user);
    }

    /**
     * Send a password reset email.
     *
     * Always returns the same generic response regardless of whether
     * the email exists — prevents user enumeration.
     */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $this->authService->forgotPassword($request->validated('email'));

        return $this->successResponse(
            data: ['message' => 'If that email is registered, a reset link has been sent.'],
        );
    }

    /**
     * Reset a password using a valid reset token.
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $this->authService->resetPassword(
            $request->validated('token'),
            $request->validated('password'),
        );

        return $this->successResponse(
            data: ['message' => 'Password reset successfully.'],
        );
    }
}