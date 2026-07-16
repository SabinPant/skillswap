<?php

declare(strict_types=1);

namespace App\Exceptions;

use Exception;

/**
 * Thrown by Services when a business rule is violated.
 *
 * Carries a machine-readable error code matching the codes table in SKILLSWAP.md
 * (e.g. CANNOT_REQUEST_OWN_SKILL, REQUEST_ALREADY_ACCEPTED).
 */
class DomainValidationException extends Exception
{
    /**
     * @param string $message   Human-readable error message for the client.
     * @param string $code      Machine-readable error code from the spec's table.
     * @param int    $httpStatus HTTP status code (400 for most, 409 for conflicts).
     */
    public function __construct(
        string $message,
        string $code,
        int $httpStatus = 400,
    ) {
        parent::__construct($message, 0);
        $this->code = $code;
        $this->httpStatus = $httpStatus;
    }

    public readonly int $httpStatus;
}