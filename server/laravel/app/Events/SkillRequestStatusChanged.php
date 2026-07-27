<?php

declare(strict_types=1);

namespace App\Events;

use App\Enums\SkillRequestStatus;
use App\Models\SkillRequest;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;

class SkillRequestStatusChanged
{
    use Dispatchable;

    public function __construct(
        public readonly SkillRequest $skillRequest,
        public readonly SkillRequestStatus $previousStatus,
        public readonly ?User $actor,
    ) {}
}