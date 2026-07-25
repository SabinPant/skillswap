<?php

declare(strict_types=1);

namespace App\Http\Requests\Skill;

use App\Enums\SkillCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSkillRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:255', 'unique:skills,name'],
            'category'    => ['required', Rule::enum(SkillCategory::class)],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }
}