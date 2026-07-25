<?php

declare(strict_types=1);

namespace App\Http\Requests\UserSkill;

use App\Enums\ProficiencyLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserSkillRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'proficiency_level' => ['required', Rule::enum(ProficiencyLevel::class)],
            'can_teach'         => ['required', 'boolean'],
            'wants_to_learn'    => ['required', 'boolean'],
        ];
    }
}