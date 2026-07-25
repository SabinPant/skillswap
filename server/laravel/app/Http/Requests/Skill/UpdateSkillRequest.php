<?php

declare(strict_types=1);

namespace App\Http\Requests\Skill;

use App\Enums\SkillCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSkillRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $skillId = $this->route('id');

        return [
            'name'        => ['required', 'string', 'max:255', Rule::unique('skills', 'name')->ignore($skillId)],
            'category'    => ['required', Rule::enum(SkillCategory::class)],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }
}