<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Skill;
use App\Models\SkillRequest;
use App\Models\Review;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class StatsController extends Controller
{
    use ApiResponseTrait;

    public function __invoke(): JsonResponse
    {
        $stats = Cache::remember('landing:stats', 300, function () {
            return [
                'users'              => User::count(),
                'skills'             => Skill::count(),
                'requests_completed' => SkillRequest::where('status', 'completed')->count(),
                'average_rating'     => round((float) Review::avg('rating'), 1),
            ];
        });

        return $this->successResponse($stats);
    }
}