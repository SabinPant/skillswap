<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use App\Services\TokenService;
use Illuminate\Foundation\Http\FormRequest;

class ResetPasswordRequest extends FormRequest
{
    /**
     * Anyone can attempt a password reset with a valid token.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation rules for the password reset endpoint.
     */
    public function rules(): array
    {
        return [
            'token'    => ['required', 'string', 'size:' . TokenService::TOKEN_LENGTH],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }
}