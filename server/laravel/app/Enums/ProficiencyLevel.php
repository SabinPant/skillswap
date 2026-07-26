<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Represents a user's self-assessed proficiency level for a skill.
 */
enum ProficiencyLevel: string
{
    case BEGINNER     = 'beginner';
    case INTERMEDIATE = 'intermediate';
    case ADVANCED     = 'advanced';
    case EXPERT       = 'expert';

    /**
     * Return all proficiency levels at or above the given minimum.
     * Uses declaration order to determine ordering — BEGINNER < INTERMEDIATE < ADVANCED < EXPERT.
     */
    public static function atLeast(self $min): array
    {
        $cases = self::cases();
        $start = array_search($min, $cases, true);

        return array_map(
            fn ($level) => $level->value,
            array_slice($cases, $start),
        );
    }
}