<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\NotFoundException;
use App\Models\Conversation;
use App\Repositories\ConversationRepository;
use Illuminate\Database\Eloquent\Collection;

class ConversationService
{
    public function __construct(
        private readonly ConversationRepository $repository,
    ) {}

    /**
     * Get or create a conversation between two users.
     *
     * Called by SkillRequestCreatedListener — a conversation unlocks
     * the moment a skill request is created, regardless of its outcome.
     */
    public function getOrCreate(string $userOneId, string $userTwoId, ?string $skillRequestId = null): Conversation
    {
        return $this->repository->getOrCreate($userOneId, $userTwoId, $skillRequestId);
    }

    /**
     * Find a conversation by ID, scoped to a participant.
     *
     * @throws NotFoundException If not found or the user is not a participant.
     */
    public function findByIdForParticipant(string $id, string $userId): Conversation
    {
        $conversation = $this->repository->findByIdForParticipant($id, $userId);

        if ($conversation === null) {
            throw new NotFoundException('Conversation not found.');
        }

        return $conversation;
    }

    /**
     * List all conversations for a user, sorted by recency.
     */
    public function list(string $userId): Collection
    {
        return $this->repository->findByUser($userId);
    }
}