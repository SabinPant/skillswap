<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;

class SendEmailVerificationJob implements ShouldQueue
{
    use Queueable;

    /**
     * @param User   $user  The newly registered user.
     * @param string $token The raw verification token (not the hashed Redis key).
     */
    public function __construct(
        private readonly User $user,
        private readonly string $token,
    ) {}

    /**
     * Send the verification email with a clickable link and a fallback raw token.
     */
    public function handle(): void
    {
        $frontendUrl = config('services.frontend_url');
        $verifyUrl   = "{$frontendUrl}/verify-email?token={$this->token}";

        $user  = $this->user;
        $token = $this->token;

        Mail::send(
            'emails.verify-email',
            [
                'user'      => $user,
                'verifyUrl' => $verifyUrl,
                'token'     => $token,
            ],
            fn ($message) => $message->to($user->email, $user->name)
                ->subject('Verify your email — SkillSwap'),
        );
    }
}