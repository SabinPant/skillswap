<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Contracts\Pagination\CursorPaginator;

class MessageRepository
{
    /**
     * Create a new message.
     */
    public function create(array $data): Message
    {
        return Message::create($data);
    }

    /**
     * Get messages for a conversation, cursor-paginated newest-first.
     * Compound cursor on (created_at desc, id desc) correctly handles ties.
     */
    public function findByConversation(string $conversationId, ?string $cursor = null, int $limit = 50): CursorPaginator
    {
        return Message::where('conversation_id', $conversationId)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->cursorPaginate($limit, cursor: $cursor);
    }

    /**
     * Mark all unread messages in a conversation as read for a specific user.
     * Only marks messages sent by the OTHER participant.
     */
    public function markAsRead(Conversation $conversation, string $userId): void
    {
        $conversation->messages()
            ->where('sender_id', '!=', $userId)
            ->where('is_read', false)
            ->update(['is_read' => true]);
    }
}