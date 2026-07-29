<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public readonly Message $message,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('conversation.' . $this->message->conversation_id),
        ];
    }

    public function broadcastWith(): array
    {
        $payload = [
            'id'              => $this->message->id,
            'conversation_id' => $this->message->conversation_id,
            'sender_id'       => $this->message->sender_id,
            'content'         => $this->message->content,
            'type'            => $this->message->type->value,
            'is_read'         => $this->message->is_read,
            'created_at'      => $this->message->created_at->toIso8601String(),
        ];

        if ($this->message->attachment_public_id !== null) {
            $payload['attachment'] = [
                'public_id'   => $this->message->attachment_public_id,
                'filename'    => $this->message->attachment_original_filename,
                'mime_type'   => $this->message->attachment_mime_type,
                'size_bytes'  => $this->message->attachment_size_bytes,
            ];
        }

        return $payload;
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }
}