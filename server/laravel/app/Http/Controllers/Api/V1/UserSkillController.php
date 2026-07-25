<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserSkill\StoreUserSkillRequest;
use App\Http\Requests\UserSkill\UpdateUserSkillRequest;
use App\Services\UserSkillService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserSkillController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        private readonly UserSkillService $userSkillService,
    ) {}

    /**
     * List the authenticated user's skills.
     */
    public function index(Request $request): JsonResponse
    {
        $skills = $this->userSkillService->list($request->user());

        return $this->successResponse($skills);
    }

    /**
     * Add a skill to the authenticated user's profile.
     */
    public function store(StoreUserSkillRequest $request): JsonResponse
    {
        $userSkill = $this->userSkillService->add($request->user(), $request->validated());

        return $this->successResponse($userSkill, [], 201);
    }

    /**
     * Update one of the authenticated user's skill entries.
     */
    public function update(UpdateUserSkillRequest $request, string $id): JsonResponse
    {
        $userSkill = $this->userSkillService->update($id, $request->user(), $request->validated());

        return $this->successResponse($userSkill);
    }

    /**
     * Remove a skill from the authenticated user's profile.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $this->userSkillService->delete($id, $request->user());

        return $this->successResponse(data: null, status: 204);
    }
}