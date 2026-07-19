<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset your password — SkillSwap</title>
</head>
<body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
    <h1 style="font-size: 1.5rem; margin-bottom: 1rem;">Hi {{ $user->name }},</h1>

    <p>You requested a password reset for your SkillSwap account.</p>

    <p style="color: #6b7280; font-size: 0.875rem;">This link will expire in 1 hour.</p>

    <p>
        <a href="{{ $resetUrl }}"
           style="display: inline-block; padding: 0.75rem 1.5rem; background: #2563eb; color: #fff; text-decoration: none; border-radius: 0.375rem;">
            Reset Password
        </a>
    </p>

    <p style="margin-top: 2rem; color: #6b7280; font-size: 0.875rem;">
        If the button doesn't work, copy this link into your browser:<br>
        <span style="color: #2563eb;">{{ $resetUrl }}</span>
    </p>

    <p style="color: #9ca3af; font-size: 0.75rem; margin-top: 1.5rem;">
        Or enter this reset code manually: <strong>{{ $token }}</strong>
    </p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0;">

    <p style="color: #9ca3af; font-size: 0.75rem;">
        If you didn't request a password reset, you can safely ignore this email.
    </p>
</body>
</html>