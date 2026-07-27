<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\SkillRequest;
use Illuminate\Foundation\Events\Dispatchable;

class SkillRequestCreated
{
    use Dispatchable;

    public function __construct(
        public readonly SkillRequest $skillRequest,
    ) {}
}