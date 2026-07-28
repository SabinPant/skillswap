<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\Conversation;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

class ConversationRepository
{
    /**
     * Get or create a conversation between two users.
     *
     * Canonical ordering: the smaller UUID is always user_one_id.
     * Idempotent — the unique constraint on (user_one_id, user_two_id) prevents duplicates.
     */
    public function getOrCreate(string $userOneId, string $userTwoId, ?string $skillRequestId = null): Conversation
    {
        $ids = [$userOneId, $userTwoId];
        sort($ids);

        try {
            return DB::transaction(fn () => Conversation::create([
                'user_one_id'                  => $ids[0],
                'user_two_id'                  => $ids[1],
                'initiating_skill_request_id'  => $skillRequestId,
            ]));
        } catch (QueryException $e) {
            if ($e->getCode() !== '23505') {
                throw $e;
            }
            // 23505: race — another process created the same pair.
            // The savepoint was already rolled back by Laravel's transaction handler.
            // Fall through to re-fetch on a clean connection.
        }

        return Conversation::where('user_one_id', $ids[0])
            ->where('user_two_id', $ids[1])
            ->firstOrFail();
    }

    /**
     * Find a conversation by ID, scoped to a participant.
     * Returns null if the conversation doesn't exist or the user is not a participant.
     */
    public function findByIdForParticipant(string $conversationId, string $userId): ?Conversation
    {
        return Conversation::where('id', $conversationId)
            ->where(function ($q) use ($userId) {
                $q->where('user_one_id', $userId)
                  ->orWhere('user_two_id', $userId);
            })
            ->first();
    }

    /**
     * Get all conversations for a user, with unread count and last message preview.
     */
    public function findByUser(string $userId): Collection
    {
        return Conversation::where(function ($q) use ($userId) {
                $q->where('user_one_id', $userId)
                  ->orWhere('user_two_id', $userId);
            })
            ->with(['messages' => fn ($q) => $q->latest()->limit(1)])
            ->withCount(['messages as unread_count' => fn ($q) => $q->where('is_read', false)
                ->where('sender_id', '!=', $userId),
            ])
            ->orderByDesc('last_message_at')
            ->get();
    }
}