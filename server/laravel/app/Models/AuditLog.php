<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    /**
     * Columns safe for mass assignment when creating an audit log entry.
     *
     * AuditLog rows are created only by internal Services, never from user input.
     * An allow-list is still used here for consistency and to document intent.
     */
    protected $fillable = [
        'user_id',
        'action',
        'entity_type',
        'entity_id',
        'metadata',
    ];

    /**
     * Native attribute casting.
     */
    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    /**
     * The actor who triggered the audited action, if any.
     * Null for system/scheduled-job-initiated events.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}