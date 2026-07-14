<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Legal states for a SkillRequest, matching the state machine in SKILLSWAP.md.
 */
enum SkillRequestStatus: string
{
    case PENDING   = 'pending';
    case ACCEPTED  = 'accepted';
    case REJECTED  = 'rejected';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';
    case EXPIRED   = 'expired';
}