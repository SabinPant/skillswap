<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Repositories\SkillRequestRepository;
use App\Services\SkillRequestService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class ExpireStaleSkillRequestsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public function handle(SkillRequestRepository $repository, SkillRequestService $service): void
    {
        $expiredIds = $repository->findExpiredPendingIds();

        if (empty($expiredIds)) {
            Log::info('Expiry job: no stale requests found.');
            return;
        }

        $expiredCount  = 0;
        $skippedCount  = 0;
        $totalIds      = count($expiredIds);

        Log::info('Expiry job: processing stale requests.', ['total' => $totalIds]);

        foreach ($expiredIds as $id) {
            try {
                $result = $service->expire($id);

                if ($result !== null) {
                    $expiredCount++;
                } else {
                    $skippedCount++;
                }
            } catch (\Throwable $e) {
                Log::error('Expiry job: failed to expire request.', [
                    'id'        => $id,
                    'exception' => $e->getMessage(),
                ]);
                $skippedCount++;
            }
        }

        Log::info('Expiry job: completed.', [
            'total'   => $totalIds,
            'expired' => $expiredCount,
            'skipped' => $skippedCount,
        ]);
    }
}