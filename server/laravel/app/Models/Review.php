<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    /**
     * Columns safe for mass assignment when a participant submits a review.
     * is_hidden is excluded — Admin-only, set via direct assignment.
     */
    protected $fillable = [
        'skill_request_id',
        'reviewer_id',
        'reviewee_id',
        'rating',
        'comment',
    ];

    /**
     * Native attribute casting.
     */
    protected function casts(): array
    {
        return [
            'rating'    => 'integer',
            'is_hidden' => 'boolean',
        ];
    }

    /**
     * The skill request this review is tied to.
     */
    public function skillRequest(): BelongsTo
    {
        return $this->belongsTo(SkillRequest::class);
    }

    /**
     * The user who wrote the review.
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    /**
     * The user being reviewed.
     */
    public function reviewee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewee_id');
    }
}