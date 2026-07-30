<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\MessageSent;
use App\Events\NotificationSent;
use App\Models\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MessageSentListener implements ShouldQueue
{
    /**
     * Create or update a MESSAGE_RECEIVED notification for the recipient.
     *
     * If an unread notification already exists for this recipient+conversation,
     * increment its counter and update the preview atomically. Otherwise,
     * insert a fresh notification.
     */
    public function handle(MessageSent $event): void
    {
        try {
            $message        = $event->message;
            $conversation   = $message->conversation;
            $senderName     = $message->sender->name;
            $conversationId = $message->conversation_id;

            $recipientId = $conversation->user_one_id === $message->sender_id
                ? $conversation->user_two_id
                : $conversation->user_one_id;

            $preview = mb_substr($message->content ?: '[Attachment]', 0, 100);

            $existing = Notification::where('user_id', $recipientId)
                ->where('type', 'message_received')
                ->where('data->conversation_id', $conversationId)
                ->where('is_read', false)
                ->first();

            if ($existing) {
                // Atomic update: guard, increment, and data write in one query.
                // If last_message_id is already >= the incoming message (out-of-order
                // delivery), the WHERE fails and zero rows match — the increment is
                // skipped, which is an accepted low-stakes edge case.
                $updated = Notification::where('id', $existing->id)
                    ->where('data->last_message_id', '<', $message->id)
                    ->update([
                        'unread_count'          => DB::raw('unread_count + 1'),
                        'data->preview'          => $preview,
                        'data->sender_name'      => $senderName,
                        'data->last_message_id'  => $message->id,
                    ]);

                if ($updated) {
                    $existing->refresh();
                    $this->broadcast($existing);
                }

                return;
            }

            // Insert fresh notification.
            $notification = Notification::create([
                'user_id'      => $recipientId,
                'type'         => 'message_received',
                'title'        => "New message from {$senderName}",
                'message'      => $message->content ?: '[Attachment]',
                'data'         => [
                    'conversation_id'  => $conversationId,
                    'sender_name'      => $senderName,
                    'preview'          => $preview,
                    'last_message_id'  => $message->id,
                ],
                'unread_count' => 1,
            ]);

            $this->broadcast($notification);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('MessageSentListener failed', [
                'exception' => $e->getMessage(),
                'trace'     => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Broadcast the notification via Reverb so the frontend bell updates in real time.
     */
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