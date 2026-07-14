<?php

declare(strict_types=1);

namespace App\Enums;

enum SkillCategory: string
{
    case PROGRAMMING = 'programming';
    case DESIGN = 'design';
    case MUSIC = 'music';
    case LANGUAGES = 'languages';
    case FITNESS = 'fitness';
    case COOKING = 'cooking';
    case PHOTOGRAPHY = 'photography';
    case MARKETING = 'marketing';
    case BUSINESS = 'business';
    case OTHER = 'other';
}