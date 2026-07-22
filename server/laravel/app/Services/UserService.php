<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\NotFoundException;
use App\Models\User;
use App\Repositories\UserRepository;
use Illuminate\Http\UploadedFile;

class UserService
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly FileUploadService $fileUploadService,
    ) {}

    /**
     * Return a user's public profile data.
     *
     * @throws NotFoundException If the user does not exist.
     */
    public function getPublicProfile(string $id): array
    {
        $user = $this->userRepository->findById($id);

        if ($user === null) {
            throw new NotFoundException('User not found.');
        }

        return [
            'id'                => $user->id,
            'name'              => $user->name,
            'bio'               => $user->bio,
            'location'          => $user->location,
            'avatar_public_id'  => $user->avatar_public_id,
            'created_at'        => $user->created_at,
        ];
    }

    /**
     * Update a user's editable profile fields.
     *
     * Only name, bio, and location are fillable — validated
     * by the Form Request before reaching this method.
     */
    public function updateProfile(User $user, array $data): User
    {
        $user->update($data);

        return $user;
    }

    /**
     * Upload a new avatar for the given user.
     *
     * Only the Cloudinary public_id is stored — the display URL
     * is generated at read time via the Cloudinary SDK.
     */
    public function uploadAvatar(User $user, UploadedFile $file): User
    {
        $result = $this->fileUploadService->upload(
            $file,
            'avatars',
            (int) config('skillswap.avatar_max_size_kb'),
            ['image/jpeg', 'image/png', 'image/webp'],
        );

        $user->avatar_public_id = $result['public_id'];
        $user->save();

        return $user;
    }
}