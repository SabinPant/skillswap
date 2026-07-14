<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conversation extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    /**
     * Columns safe for mass assignment when creating a conversation.
     * last_message_at is updated separately by MessageService.
     */
    protected $fillable = [
        'user_one_id',
        'user_two_id',
        'initiating_skill_request_id',
    ];

    protected function casts(): array
    {
        return [
            'last_message_at' => 'datetime',
        ];
    }

    /**
     * The first participant (lexicographically smaller UUID).
     */
    public function userOne(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_one_id');
    }

    /**
     * The second participant.
     */
    public function userTwo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_two_id');
    }

    /**
     * The skill request that initially unlocked this conversation, if any.
     */
    public function initiatingSkillRequest(): BelongsTo
    {
        return $this->belongsTo(SkillRequest::class, 'initiating_skill_request_id');
    }

    /**
     * Messages sent within this conversation.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }
}