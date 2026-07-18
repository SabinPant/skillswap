<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verify your email — SkillSwap</title>
</head>
<body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
    <h1 style="font-size: 1.5rem; margin-bottom: 1rem;">Welcome to SkillSwap, {{ $user->name }}!</h1>

    <p>Please verify your email address to start swapping skills.</p>

    <p>
        <a href="{{ $verifyUrl }}"
           style="display: inline-block; padding: 0.75rem 1.5rem; background: #2563eb; color: #fff; text-decoration: none; border-radius: 0.375rem;">
            Verify Email
        </a>
    </p>

    <p style="margin-top: 2rem; color: #6b7280; font-size: 0.875rem;">
        If the button doesn't work, copy this link into your browser:<br>
        <span style="color: #2563eb;">{{ $verifyUrl }}</span>
    </p>

    <p style="color: #9ca3af; font-size: 0.75rem; margin-top: 1.5rem;">
        Or enter this verification code manually: <strong>{{ $token }}</strong>
    </p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0;">

    <p style="color: #9ca3af; font-size: 0.75rem;">
        If you didn't create a SkillSwap account, you can safely ignore this email.
    </p>
</body>
</html>