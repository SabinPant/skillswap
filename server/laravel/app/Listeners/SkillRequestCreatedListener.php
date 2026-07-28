<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\SkillRequestCreated;
use App\Services\ConversationService;

class SkillRequestCreatedListener
{
    public function __construct(
        private readonly ConversationService $conversationService,
    ) {}

    /**
     * Auto-unlock a private conversation between the learner and teacher
     * the moment a skill request is created.
     *
     * This runs synchronously inside SkillRequestService::create()'s
     * database transaction. If this listener throws, the entire request
     * creation rolls back — the learner sees an honest failure rather
     * than a request that exists without a conversation. This coupling
     * is intentional: do not make this listener queued.
     */
    public function handle(SkillRequestCreated $event): void
    {
        $this->conversationService->getOrCreate(
            $event->skillRequest->learner_id,
            $event->skillRequest->teacher_id,
            $event->skillRequest->id,
        );
    }
}