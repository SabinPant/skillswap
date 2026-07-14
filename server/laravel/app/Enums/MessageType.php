<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Type of content in a chat message — text-only, image attachment, or file attachment.
 */
enum MessageType: string
{
    case TEXT  = 'text';
    case IMAGE = 'image';
    case FILE  = 'file';
}