<?php

declare(strict_types=1);

namespace App\Services;

use App\Events\MessageSent;
use App\Exceptions\NotFoundException;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Repositories\ConversationRepository;
use App\Repositories\MessageRepository;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Support\Facades\DB;

class MessageService
{
    public function __construct(
        private readonly ConversationRepository $conversationRepository,
        private readonly MessageRepository $messageRepository,
    ) {}

    /**
     * Send a message to a conversation.
     *
     * Writes are transactional — both the message insert and conversation
     * metadata update commit together. The broadcast fires AFTER the
     * transaction closes, so a rollback never sends a phantom message.
     */
    public function send(string $conversationId, string $content, User $sender): Message
    {
        $conversation = $this->resolveConversation($conversationId, $sender->id);

        $message = null;

        DB::transaction(function () use ($conversation, $content, $sender, &$message) {
            $message = $this->messageRepository->create([
                'conversation_id' => $conversation->id,
                'sender_id'       => $sender->id,
                'content'         => $content,
                'type'            => 'text',
            ]);

            $conversation->update([
                'last_message_at'      => $message->created_at,
                'last_message_preview' => mb_substr($content, 0, 100),
            ]);
        });

        // Broadcast after commit — no rollback can produce a phantom message.
        // If the broadcast fails (Reverb down, network issue), the message
        // was already persisted. Log the failure but don't block the sender.
        try {
            broadcast(new MessageSent($message));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Message broadcast failed.', [
                'message_id' => $message->id,
                'exception'  => $e->getMessage(),
            ]);
        }

        return $message;
    }

    /**
     * List messages for a conversation, cursor-paginated newest-first.
     *
     * On the first page (no cursor), implicitly marks all unread messages
     * from the other participant as read — matches real chat UX.
     */
    public function list(string $conversationId, User $user, ?string $cursor = null): CursorPaginator
    {
        $this->resolveConversation($conversationId, $user->id);

        if ($cursor === null) {
            $this->markAllRead($conversationId, $user);
        }

        return $this->messageRepository->findByConversation($conversationId, $cursor);
    }

    /**
     * Mark all unread messages in a conversation as read for the given user.
     */
    public function markAllRead(string $conversationId, User $user): void
    {
        $conversation = $this->resolveConversation($conversationId, $user->id);

        $this->messageRepository->markAsRead($conversation, $user->id);
    }

    /**
     * Resolve a conversation by ID, scoped to the participant.
     *
     * @throws NotFoundException If the conversation doesn't exist
     *                           or the user is not a participant.
     */
    private function resolveConversation(string $conversationId, string $userId): Conversation
    {
        $conversation = $this->conversationRepository->findByIdForParticipant($conversationId, $userId);

        if ($conversation === null) {
            throw new NotFoundException('Conversation not found.');
        }

        return $conversation;
    }
}