<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\MessageService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Requests\Message\MessageRequest;

class MessageController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        private readonly MessageService $messageService,
    ) {}

    /**
     * List messages for a conversation, cursor-paginated newest-first.
     *
     * First page (no cursor) triggers implicit mark-all-read — matches
     * real chat UX where opening a conversation marks it as seen.
     */
    public function index(string $conversationId, Request $request): JsonResponse
    {
        $messages = $this->messageService->list(
            $conversationId,
            $request->user(),
            $request->query('cursor'),
        );

        return $this->successResponse($messages);
    }

    /**
     * Send a message to a conversation.
     */
    public function store(string $conversationId, MessageRequest $request): JsonResponse
    {
        $message = $this->messageService->send(
            $conversationId,
            $request->validated('content'),
            $request->user(),
        );

        return $this->successResponse($message, [], 201);
    }

    /**
     * Mark all messages in a conversation as read.
     */
    public function markAllRead(string $conversationId, Request $request): JsonResponse
    {
        $this->messageService->markAllRead($conversationId, $request->user());

        return $this->successResponse(data: ['message' => 'All messages marked as read.']);
    }
}