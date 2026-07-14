<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Enums\MessageType;

class Message extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    /**
     * Messages are immutable — no updated_at column exists.
     */
    public const UPDATED_AT = null;

    /**
     * Columns safe for mass assignment when sending a message.
     */
    protected $fillable = [
        'conversation_id',
        'sender_id',
        'type',
        'content',
        'attachment_public_id',
        'attachment_original_filename',
        'attachment_mime_type',
        'attachment_size_bytes',
    ];

    /**
     * Native attribute casting.
     */
    protected function casts(): array
    {
        return [
            'type'    => MessageType::class,
            'is_read' => 'boolean',
        ];
    }

    /**
     * The conversation this message belongs to.
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * The user who sent this message.
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}