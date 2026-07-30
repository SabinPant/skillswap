<?php

declare(strict_types=1);

namespace App\Http\Requests\Review;

use Illuminate\Foundation\Http\FormRequest;

class StoreReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'skill_request_id' => ['required', 'uuid', 'exists:skill_requests,id'],
            'rating'           => ['required', 'integer', 'between:1,5'],
            'comment'          => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * Treat whitespace-only comments as null so they're stored cleanly.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('comment') && trim((string) $this->input('comment')) === '') {
            $this->merge(['comment' => null]);
        }
    }
}