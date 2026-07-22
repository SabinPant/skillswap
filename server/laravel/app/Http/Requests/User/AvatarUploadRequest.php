<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class AvatarUploadRequest extends FormRequest
{
    /**
     * Only authenticated users can upload avatars.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation rules for avatar upload.
     */
    public function rules(): array
    {
        return [
            'avatar' => [
                'required',
                'file',
                'image',
                'mimes:jpeg,png,webp',
                'max:' . config('skillswap.avatar_max_size_kb'),
            ],
        ];
    }
}