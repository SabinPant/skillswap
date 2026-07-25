<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\NotFoundException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Skill\StoreSkillRequest;
use App\Http\Requests\Skill\UpdateSkillRequest;
use App\Repositories\SkillRepository;
use App\Services\SkillService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;

class SkillController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        private readonly SkillRepository $skillRepository,
        private readonly SkillService $skillService,
    ) {}

    /**
     * List all skills in the global taxonomy.
     */
    public function index(): JsonResponse
    {
        $skills = $this->skillRepository->getAllOrderedByName();

        return $this->successResponse($skills);
    }

    /**
     * Get a single skill by ID.
     */
    public function show(string $id): JsonResponse
    {
        $skill = $this->skillRepository->findById($id);

        if ($skill === null) {
            throw new NotFoundException('Skill not found.');
        }

        return $this->successResponse($skill);
    }

    /**
     * Create a new skill (Admin only).
     */
    public function store(StoreSkillRequest $request): JsonResponse
    {
        $skill = $this->skillService->create($request->validated());

        return $this->successResponse($skill, [], 201);
    }

    /**
     * Update an existing skill (Admin only).
     */
    public function update(UpdateSkillRequest $request, string $id): JsonResponse
    {
        $skill = $this->skillRepository->findById($id);

        if ($skill === null) {
            throw new NotFoundException('Skill not found.');
        }

        $skill = $this->skillService->update($skill, $request->validated());

        return $this->successResponse($skill);
    }

    /**
     * Delete a skill (Admin only).
     */
    public function destroy(string $id): JsonResponse
    {
        $skill = $this->skillRepository->findById($id);

        if ($skill === null) {
            throw new NotFoundException('Skill not found.');
        }

        $this->skillService->delete($skill);

        return $this->successResponse(data: null, status: 204);
    }
}