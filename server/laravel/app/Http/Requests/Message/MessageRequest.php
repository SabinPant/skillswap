<?php

declare(strict_types=1);

namespace App\Http\Requests\Message;

use Illuminate\Foundation\Http\FormRequest;

class MessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'content'    => ['nullable', 'string', 'max:5000'],
            'attachment' => ['nullable', 'file', 'max:' . config('skillswap.chat_attachment_max_size_kb')],
        ];
    }

    /**
     * Treat whitespace-only content as null so validation sees it as absent.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('content') && trim((string) $this->input('content')) === '') {
            $this->merge(['content' => null]);
        }
    }
}