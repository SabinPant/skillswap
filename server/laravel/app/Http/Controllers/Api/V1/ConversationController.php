<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\ConversationService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        private readonly ConversationService $conversationService,
    ) {}

    /**
     * List the authenticated user's conversations.
     * Sorted by last_message_at desc, includes unread count and last message preview.
     */
    public function index(Request $request): JsonResponse
    {
        $conversations = $this->conversationService->list($request->user()->id);

        return $this->successResponse($conversations);
    }

    /**
     * Show a single conversation (participant scoped).
     */
    public function show(string $id, Request $request): JsonResponse
    {
        $conversation = $this->conversationService->findByIdForParticipant($id, $request->user()->id);

        return $this->successResponse($conversation);
    }
}