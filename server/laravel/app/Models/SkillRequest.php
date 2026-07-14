<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Enums\SkillRequestStatus;

class SkillRequest extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    /**
     * Columns safe for mass assignment when creating a request.
     * Status, cancellation, and completion fields are managed by SkillRequestService.
     */
    protected $fillable = [
        'learner_id',
        'teacher_id',
        'skill_id',
        'message',
        'proposed_at',
        'timezone',
    ];

    /**
     * Native attribute casting.
     */
    protected function casts(): array
    {
        return [
            'status'       => SkillRequestStatus::class,
            'proposed_at'  => 'datetime',
            'completed_at' => 'datetime',
            'expires_at'   => 'datetime',
        ];
    }

    /**
     * The user who sent the request (learner).
     */
    public function learner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'learner_id');
    }

    /**
     * The user receiving the request (teacher).
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    /**
     * The skill being requested.
     */
    public function skill(): BelongsTo
    {
        return $this->belongsTo(Skill::class);
    }

    /**
     * The user who cancelled the request (if any).
     */
    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    /**
     * The user who marked the request completed (if any).
     */
    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }
}