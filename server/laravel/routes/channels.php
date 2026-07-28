<?php

use Illuminate\Support\Facades\Broadcast;
use App\Repositories\ConversationRepository;

Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    $repository = app(ConversationRepository::class);

    return $repository->findByIdForParticipant($conversationId, $user->id) !== null;
});