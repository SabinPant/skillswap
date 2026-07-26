<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use App\Enums\ProficiencyLevel;
use App\Enums\SkillCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserSearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'skill'            => ['required', 'string', 'max:255'],
            'category'         => ['nullable', Rule::enum(SkillCategory::class)],
            'lat'              => ['nullable', 'numeric', 'required_with:lng,radius_km'],
            'lng'              => ['nullable', 'numeric', 'required_with:lat,radius_km'],
            'radius_km'        => ['nullable', 'integer', 'min:1', 'max:500', 'required_with:lat,lng'],
            'min_proficiency'  => ['nullable', Rule::enum(ProficiencyLevel::class)],
            'page'             => ['nullable', 'integer', 'min:1'],
        ];
    }
}