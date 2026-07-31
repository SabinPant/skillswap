<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\NotificationType;
use App\Exceptions\NotFoundException;
use App\Models\Notification;
use Illuminate\Contracts\Pagination\CursorPaginator;

class NotificationService
{
    /**
     * List notifications for a user, cursor-paginated newest-first.
     * Excludes dismissed notifications.
     */
    public function list(string $userId, ?string $cursor = null): CursorPaginator
    {
        return Notification::where('user_id', $userId)
            ->where('is_dismissed', false)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->cursorPaginate(20, cursor: $cursor);
    }

    /**
     * Mark a single notification as read.
     * Scoped to the notification owner.
     */
    public function markRead(string $notificationId, string $userId): void
    {
        $notification = $this->findOwned($notificationId, $userId);

        $notification->update([
            'is_read'      => true,
            'unread_count' => 0,
        ]);
    }

    /**
     * Mark all unread notifications as read for a user.
     * Excludes MESSAGE_RECEIVED — those have a dedup counter and should
     * only be marked read when the conversation is actually opened.
     * Dismissed notifications are unaffected (already hidden).
     * 
     * @return int The number of affected notifications.
     */
    public function markAllRead(string $userId): int
    {
        return Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->where('is_dismissed', false)
            ->whereNotIn('type', [NotificationType::MESSAGE_RECEIVED->value])
            ->update([
                'is_read'      => true,
                'unread_count' => 0,
            ]);
    }

    /**
     * Soft-delete a notification by marking it as dismissed.
     * Scoped to the notification owner.
     */
    public function delete(string $notificationId, string $userId): void
    {
        $notification = $this->findOwned($notificationId, $userId);

        $notification->update(['is_dismissed' => true]);
    }

    /**
     * Find a notification owned by the given user.
     *
     * @throws NotFoundException If the notification does not exist or belong to the user.
     */
    private function findOwned(string $notificationId, string $userId): Notification
    {
        $notification = Notification::where('id', $notificationId)
            ->where('user_id', $userId)
            ->first();

        if ($notification === null) {
            throw new NotFoundException('Notification not found.');
        }

        return $notification;
    }
}