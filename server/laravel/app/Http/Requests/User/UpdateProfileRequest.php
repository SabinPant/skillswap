<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    /**
     * Only authenticated users can update profiles.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation rules for profile updates.
     */
    public function rules(): array
    {
        return [
            'name'     => ['required', 'string', 'max:255'],
            'bio'      => ['nullable', 'string', 'max:500'],
            'location' => ['nullable', 'string', 'max:255'],
        ];
    }
}