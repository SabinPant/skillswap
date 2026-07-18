<?php

declare(strict_types=1);

namespace App\Exceptions;

use Exception;

/**
 * Thrown when a requested resource does not exist.
 *
 * Mapped to a 404 NOT_FOUND response by the global exception handler.
 */
class NotFoundException extends Exception
{
    public function __construct(string $message = 'Resource not found.')
    {
        parent::__construct($message);
    }
}