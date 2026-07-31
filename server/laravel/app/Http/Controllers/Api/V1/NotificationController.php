<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        private readonly NotificationService $notificationService,
    ) {}

    /**
     * List the authenticated user's notifications (cursor-paginated).
     */
    public function index(Request $request): JsonResponse
    {
        $notifications = $this->notificationService->list(
            $request->user()->id,
            $request->query('cursor'),
        );

        return $this->successResponse($notifications);
    }

    /**
     * Mark a single notification as read.
     */
    public function markRead(string $id, Request $request): JsonResponse
    {
        $this->notificationService->markRead($id, $request->user()->id);

        return $this->successResponse(data: ['message' => 'Notification marked as read.']);
    }

    /**
     * Mark all unread notifications as read.
     * Message notifications excluded — those require opening the conversation.
     */
    public function markAllRead(Request $request): JsonResponse
    {
        $count = $this->notificationService->markAllRead($request->user()->id);

        return $this->successResponse(data: [
            'message' => 'Notifications marked as read.',
            'marked'  => $count,
        ]);
    }

    /**
     * Dismiss a notification (soft-delete).
     */
    public function destroy(string $id, Request $request): JsonResponse
    {
        $this->notificationService->delete($id, $request->user()->id);

        return $this->successResponse(data: ['message' => 'Notification dismissed.']);
    }
}