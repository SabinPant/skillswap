<?php

declare(strict_types=1);

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * All exception-to-response mappings are handled in bootstrap/app.php
     * via the withExceptions() closure — the correct pattern for Laravel 13.
     */
}