<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\NotFoundException;
use App\Models\User;
use App\Repositories\UserRepository;

class UserService
{
    public function __construct(
        private readonly UserRepository $userRepository,
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
}