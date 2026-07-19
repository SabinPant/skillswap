<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;

class SendPasswordResetEmailJob implements ShouldQueue
{
    use Queueable;

    /**
     * @param User   $user  The user requesting a password reset.
     * @param string $token The raw reset token (not the hashed Redis key).
     */
    public function __construct(
        private readonly User $user,
        private readonly string $token,
    ) {}

    /**
     * Send the password reset email with a clickable link and a fallback raw token.
     */
    public function handle(): void
    {
        $frontendUrl = config('services.frontend_url');
        $resetUrl    = "{$frontendUrl}/reset-password?token={$this->token}";

        $user  = $this->user;
        $token = $this->token;

        Mail::send(
            'emails.reset-password',
            [
                'user'     => $user,
                'resetUrl' => $resetUrl,
                'token'    => $token,
            ],
            fn ($message) => $message->to($user->email, $user->name)
                ->subject('Reset your password — SkillSwap'),
        );
    }
}