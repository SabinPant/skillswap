<?php

declare(strict_types=1);

namespace App\Http\Requests\SkillRequest;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSkillRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'teacher_id'  => ['required', 'uuid', 'exists:users,id'],
            'skill_id'    => ['required', 'uuid', 'exists:skills,id'],
            'message'     => ['nullable', 'string', 'max:2000'],
            'proposed_at' => ['nullable', 'date', 'after:now'],
            'timezone'    => ['nullable', 'string', Rule::in(timezone_identifiers_list())],
        ];
    }

    /**
     * Trim whitespace from the message field so an all-whitespace string
     * is treated as empty and stored as null rather than a blank string.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('message') && trim((string) $this->input('message')) === '') {
            $this->merge(['message' => null]);
        }
    }
}