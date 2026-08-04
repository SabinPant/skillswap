<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\NotificationSent;
use App\Events\SkillRequestCreated;
use App\Models\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class NotifyTeacherOfNewRequest implements ShouldQueue
{
    public function handle(SkillRequestCreated $event): void
    {
        $request = $event->skillRequest;

        // Prevent duplicate notifications for the same request
        $existing = Notification::where('user_id', $request->teacher_id)
            ->where('type', 'request_received')
            ->where('data->skill_request_id', $request->id)
            ->exists();

        if ($existing) {
            return;
        }

        $notification = Notification::create([
            'user_id'      => $request->teacher_id,
            'type'         => 'request_received',
            'title'        => 'New skill request received!',
            'message'      => '',
            'data'         => [
                'skill_request_id' => $request->id,
                'learner_name'     => $request->learner->name,
                'skill_name'       => $request->skill->name,
            ],
            'unread_count' => 0,
        ]);

        try {
            broadcast(new NotificationSent($notification));
        } catch (\Throwable $e) {
            Log::error('Notification broadcast failed.', [
                'notification_id' => $notification->id,
                'exception'       => $e->getMessage(),
            ]);
        }
    }
}