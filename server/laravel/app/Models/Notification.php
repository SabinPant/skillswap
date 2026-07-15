<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Enums\NotificationType;

/**
 * SKILLSWAP's in-app notification, persisted to the custom notifications table.
 *
 * This deliberately shares its class name with Illuminate\Notifications\Notification.
 * That class is never used in this project (we skipped Laravel's notification system),
 * so no collision occurs in practice. If you do need to import both in the same file,
 * alias the Laravel one — don't rename this model.
 */
class Notification extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    /**
     * Columns safe for mass assignment when creating a notification.
     * is_read is excluded — toggled via direct assignment by NotificationService.
     */
    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'data',
    ];

    /**
     * Native attribute casting.
     */
    protected function casts(): array
    {
        return [
            'type'    => NotificationType::class,
            'data'    => 'array',
            'is_read' => 'boolean',
        ];
    }

    /**
     * The user who received this notification.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}