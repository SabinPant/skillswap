<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Enums\SkillRequestStatus;
use App\Models\Notification;
use App\Models\SkillRequest;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SessionReminderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public function handle(): void
    {
        $hoursBefore = (int) config('skillswap.session_reminder_hours_before', 24);

        $start = Carbon::now()->addHours($hoursBefore - 1);
        $end   = Carbon::now()->addHours($hoursBefore);

        $requests = SkillRequest::where('status', SkillRequestStatus::ACCEPTED->value)
            ->whereBetween('proposed_at', [$start, $end])
            ->with('skill')
            ->get();

        $sent   = 0;
        $skipped = 0;

        foreach ($requests as $request) {
            // Dedup backstop — skip if already reminded for this request.
            $exists = Notification::where('type', 'session_reminder')
                ->where('data->skill_request_id', $request->id)
                ->exists();

            if ($exists) {
                $skipped++;
                continue;
            }

            // Re-check status — may have been cancelled/completed since the query.

            $request->refresh();
            
            if ($request->status !== SkillRequestStatus::ACCEPTED) {
                $skipped++;
                continue;
            }

            Notification::create([
                'user_id'      => $request->learner_id,
                'type'         => 'session_reminder',
                'title'        => 'Upcoming session reminder',
                'message'      => "Your session for {$request->skill->name} is coming up in approximately {$hoursBefore} hours.",
                'data'         => [
                    'skill_request_id' => $request->id,
                    'proposed_at'      => $request->proposed_at?->toIso8601String(),
                    'skill_name'       => $request->skill->name,
                ],
                'unread_count' => 0,
            ]);

            $sent++;
        }

        Log::info('Session reminder job completed.', [
            'window_hours_before' => $hoursBefore,
            'sent'                => $sent,
            'skipped'             => $skipped,
        ]);
    }
}