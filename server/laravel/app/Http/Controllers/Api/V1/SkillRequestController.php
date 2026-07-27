<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\SkillRequestStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\SkillRequest\CancelSkillRequestRequest;
use App\Http\Requests\SkillRequest\StoreSkillRequestRequest;
use App\Services\SkillRequestService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SkillRequestController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        private readonly SkillRequestService $skillRequestService,
    ) {}

    /**
     * Create a new skill request (learner).
     */
    public function store(StoreSkillRequestRequest $request): JsonResponse
    {
        $skillRequest = $this->skillRequestService->create($request->user(), $request->validated());

        return $this->successResponse($skillRequest, [], 201);
    }

    /**
     * List requests for the authenticated user.
     * ?role=learner|teacher&status=pending|accepted|completed|cancelled|expired
     */
    public function index(Request $request): JsonResponse
    {
        $status = null;

        if ($request->query('status')) {
            $status = SkillRequestStatus::tryFrom($request->query('status'));

            if ($status === null) {
                return response()->json([
                    'success'   => false,
                    'message'   => 'Invalid status filter.',
                    'code'      => 'VALIDATION_ERROR',
                    'timestamp' => now()->toIso8601String(),
                    'errors'    => ['status' => ['The selected status is invalid.']],
                ], 422);
            }
        }

        $requests = $this->skillRequestService->list(
            $request->user()->id,
            $request->query('role', 'learner'),
            $status,
        );

        return $this->successResponse($requests);
    }

    /**
     * Teacher accepts a pending request.
     */
    public function accept(string $id, Request $request): JsonResponse
    {
        $skillRequest = $this->skillRequestService->accept($id, $request->user());

        return $this->successResponse($skillRequest);
    }

    /**
     * Teacher rejects a pending request.
     */
    public function reject(string $id, Request $request): JsonResponse
    {
        $skillRequest = $this->skillRequestService->reject($id, $request->user());

        return $this->successResponse($skillRequest);
    }

    /**
     * Either party cancels an accepted request.
     */
    public function cancel(string $id, CancelSkillRequestRequest $request): JsonResponse
    {
        $skillRequest = $this->skillRequestService->cancel(
            $id,
            $request->user(),
            $request->validated('reason'),
        );

        return $this->successResponse($skillRequest);
    }

    /**
     * Either party marks an accepted request as completed.
     */
    public function complete(string $id, Request $request): JsonResponse
    {
        $skillRequest = $this->skillRequestService->complete($id, $request->user());

        return $this->successResponse($skillRequest);
    }
}