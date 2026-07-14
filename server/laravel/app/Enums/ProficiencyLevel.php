<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Represents a user's self-assessed proficiency level for a skill.
 */
enum ProficiencyLevel: string
{
    case BEGINNER = 'beginner';
    case INTERMEDIATE = 'intermediate';
    case ADVANCED = 'advanced';
    case EXPERT = 'expert';
}