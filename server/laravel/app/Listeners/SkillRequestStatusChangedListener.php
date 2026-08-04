<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Enums\NotificationType;
use App\Enums\SkillRequestStatus;
use App\Events\NotificationSent;
use App\Events\SkillRequestStatusChanged;
use App\Models\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class SkillRequestStatusChangedListener implements ShouldQueue
{
    /**
     * Transition map: previousStatus → newStatus determines notification type and recipient.
     * Null actor → notify the learner (generalized rule for system actions like expiry).
     */
    private const MAP = [
        SkillRequestStatus::PENDING->value => [
            SkillRequestStatus::ACCEPTED->value => [
                'type'    => NotificationType::REQUEST_ACCEPTED,
                'notify'  => 'learner',
            ],
            SkillRequestStatus::REJECTED->value => [
                'type'    => NotificationType::REQUEST_REJECTED,
                'notify'  => 'learner',
            ],
            SkillRequestStatus::EXPIRED->value => [
                'type'    => NotificationType::REQUEST_EXPIRED,
                'notify'  => 'learner',
            ],
        ],
        SkillRequestStatus::ACCEPTED->value => [
            SkillRequestStatus::CANCELLED->value => [
                'type'    => NotificationType::REQUEST_CANCELLED,
                'notify'  => 'non-actor',
            ],
            SkillRequestStatus::COMPLETED->value => [
                'type'    => NotificationType::REQUEST_COMPLETED,
                'notify'  => 'non-actor',
            ],
        ],
    ];

    public function handle(SkillRequestStatusChanged $event): void
    {
        $request        = $event->skillRequest;
        $previousStatus = $event->previousStatus->value;
        $newStatus      = $request->status->value;
        $actor          = $event->actor;

        $mapping = self::MAP[$previousStatus][$newStatus] ?? null;

        if ($mapping === null) {
            Log::warning('Unrecognized skill request transition.', [
                'request_id'     => $request->id,
                'previous_status' => $previousStatus,
                'new_status'     => $newStatus,
            ]);
            return;
        }

        $recipientId = $this->resolveRecipient($request, $mapping['notify'], $actor?->id);

        $titleMap = [
            NotificationType::REQUEST_ACCEPTED->value  => 'Your skill request was accepted!',
            NotificationType::REQUEST_REJECTED->value  => 'Your skill request was rejected.',
            NotificationType::REQUEST_EXPIRED->value   => 'Your skill request has expired.',
            NotificationType::REQUEST_CANCELLED->value => 'A skill request was cancelled.',
            NotificationType::REQUEST_COMPLETED->value => 'A skill request was completed.',
        ];

        // Prevent duplicate notifications for the same request + user + type
        $existing = Notification::where('user_id', $recipientId)
            ->where('type', $mapping['type'])
            ->where('data->skill_request_id', $request->id)
            ->exists();

        if ($existing) {
            return;
        }

        $notification = Notification::create([
            'user_id'      => $recipientId,
            'type'         => $mapping['type'],
            'title'        => $titleMap[$mapping['type']->value] ?? 'Skill request update',
            'message'      => '',
            'data'         => [
                'skill_request_id' => $request->id,
                'skill_name'       => $request->skill->name,
            ],
            'unread_count' => 0,
        ]);

        $this->broadcast($notification);
    }

    /**
     * Determine who gets the notification.
     * - 'learner' → always the learner (used when actor is null or for teacher actions)
     * - 'non-actor' → whichever participant did NOT perform the action
     */
    private function resolveRecipient($request, string $rule, ?string $actorId): string
    {
        if ($rule === 'learner' || $actorId === null) {
            return $request->learner_id;
        }

        return $actorId === $request->learner_id
            ? $request->teacher_id
            : $request->learner_id;
    }

    private function broadcast(Notification $notification): void
    {
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