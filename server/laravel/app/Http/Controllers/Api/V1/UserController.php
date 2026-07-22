<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\UpdateProfileRequest;
use App\Services\UserService;
use App\Traits\ApiResponseTrait;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Requests\User\AvatarUploadRequest;

class UserController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        private readonly UserService $userService,
    ) {}

    /**
     * Get a user's public profile.
     */
    public function show(string $id): JsonResponse
    {
        $profile = $this->userService->getPublicProfile($id);

        return $this->successResponse($profile);
    }

    /**
     * Update the authenticated user's own profile.
     *
     * @throws AuthorizationException If the user tries to update another user's profile.
     */
    public function update(UpdateProfileRequest $request, string $id): JsonResponse
    {
        /** @var \App\Models\User $authUser */
        $authUser = $request->user();

        if ($authUser->id !== $id) {
            throw new AuthorizationException('You can only update your own profile.');
        }

        $user = $this->userService->updateProfile($authUser, $request->validated());

        return $this->successResponse($user);
    }

        /**
     * Upload a new avatar for the authenticated user.
     *
     * @throws AuthorizationException If the user tries to update another user's avatar.
     */
    public function uploadAvatar(AvatarUploadRequest $request, string $id): JsonResponse
    {
        /** @var \App\Models\User $authUser */
        $authUser = $request->user();

        if ($authUser->id !== $id) {
            throw new AuthorizationException('You can only update your own avatar.');
        }

        $user = $this->userService->uploadAvatar($authUser, $request->file('avatar'));

        return $this->successResponse($user);
    }
}