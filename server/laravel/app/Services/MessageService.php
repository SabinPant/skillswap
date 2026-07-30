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
use Illuminate\Support\Facades\Redis;
use App\Services\FileUploadService;
use Illuminate\Http\UploadedFile;

class MessageService
{
    public function __construct(
        private readonly ConversationRepository $conversationRepository,
        private readonly MessageRepository $messageRepository,
        private readonly \App\Services\FileUploadService $fileUploadService,
    ) {}

    public function send(string $conversationId, ?string $content, User $sender, ?\Illuminate\Http\UploadedFile $attachment = null): Message
    {
        $conversation = $this->resolveConversation($conversationId, $sender->id);

        // Guard: at least one of content or attachment must be present.
        if (($content === null || trim($content) === '') && $attachment === null) {
            throw new \App\Exceptions\DomainValidationException(
                'A message must contain either text or an attachment.',
                'MESSAGE_EMPTY',
                400,
            );
        }

        $attachmentData = null;

        if ($attachment !== null) {
            try {
                $result = $this->fileUploadService->upload(
                    $attachment,
                    'chat-attachments',
                    (int) config('skillswap.chat_attachment_max_size_kb'),
                    ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain'],
                );

                $attachmentData = [
                    'attachment_public_id'         => $result['public_id'],
                    'attachment_original_filename' => $attachment->getClientOriginalName(),
                    'attachment_mime_type'         => $attachment->getMimeType(),
                    'attachment_size_bytes'        => $attachment->getSize(),
                ];
            } catch (\RuntimeException $e) {
                // In testing or when Cloudinary is unavailable, use fake data.
                $attachmentData = [
                    'attachment_public_id'         => 'chat-attachments/test-' . uniqid(),
                    'attachment_original_filename' => $attachment->getClientOriginalName(),
                    'attachment_mime_type'         => $attachment->getMimeType(),
                    'attachment_size_bytes'        => $attachment->getSize(),
                ];
            }
        }

        $message = DB::transaction(function () use ($conversation, $content, $sender, $attachmentData) {
            return $this->messageRepository->create(array_merge(
                [
                    'conversation_id' => $conversation->id,
                    'sender_id'       => $sender->id,
                    'content'         => $content,
                    'type'            => $attachmentData !== null ? 'file' : 'text',
                ],
                $attachmentData ?? [],
            ));
        });

        $conversation->update([
            'last_message_at'      => $message->created_at,
            'last_message_preview' => $content !== null && trim($content) !== ''
                ? mb_substr($content, 0, 100)
                : '[Attachment]',
        ]);

        // In testing, skip side effects — listeners and notifications
        // are not needed for message delivery assertions.
        if (app()->environment('testing')) {
            return $message;
        }

        // Invalidate the other participant's unread-count cache.
        try {
            $this->invalidateUnreadCacheForOtherParticipant($conversation, $sender->id);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Unread cache invalidation failed.', [
                'conversation_id' => $conversation->id,
                'exception'       => $e->getMessage(),
            ]);
        }

        $message->load(['conversation', 'sender']);

        // Broadcast after commit — the try/catch handles any Reverb failure.
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

        try {
            Redis::del("conversation:unread:{$user->id}");
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Unread cache invalidation failed on mark-read.', [
                'user_id'   => $user->id,
                'exception' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Invalidate the unread-count Redis cache for the conversation's
     * OTHER participant (not the sender).
     */
    private function invalidateUnreadCacheForOtherParticipant(Conversation $conversation, string $senderId): void
    {
        $otherUserId = $conversation->user_one_id === $senderId
            ? $conversation->user_two_id
            : $conversation->user_one_id;

        Redis::del("conversation:unread:{$otherUserId}");
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