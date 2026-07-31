<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Schedule;

Schedule::job(\App\Jobs\ExpireStaleSkillRequestsJob::class)->hourly()->withoutOverlapping();
Schedule::job(\App\Jobs\SessionReminderJob::class)->hourly()->withoutOverlapping();