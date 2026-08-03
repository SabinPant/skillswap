<?php

use App\Repositories\ConversationRepository;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('user.{userId}', function ($user, $userId) {
    return $user->id === $userId;
});

Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    $repository = app(ConversationRepository::class);
    return $repository->findByIdForParticipant($conversationId, $user->id) !== null;
});