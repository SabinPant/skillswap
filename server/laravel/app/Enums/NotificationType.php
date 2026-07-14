<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Categories of in-app notifications a user can receive.
 */
enum NotificationType: string
{
    case REQUEST_RECEIVED  = 'request_received';
    case REQUEST_ACCEPTED  = 'request_accepted';
    case REQUEST_REJECTED  = 'request_rejected';
    case REQUEST_CANCELLED = 'request_cancelled';
    case REQUEST_EXPIRED   = 'request_expired';
    case SESSION_REMINDER  = 'session_reminder';
    case REVIEW_RECEIVED   = 'review_received';
    case MESSAGE_RECEIVED  = 'message_received';
}