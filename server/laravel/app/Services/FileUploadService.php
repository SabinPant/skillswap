<?php

declare(strict_types=1);

namespace App\Services;

use App\DTOs\CloudinaryConfig;
use App\Exceptions\DomainValidationException;
use Cloudinary\Cloudinary;
use Illuminate\Http\UploadedFile;
use RuntimeException;

/**
 * Handles file uploads to Cloudinary.
 *
 * Designed to be reusable for both avatars and chat attachments
 * by accepting size/MIME limits as parameters, not hardcoding them.
 */
class FileUploadService
{
    private readonly Cloudinary $cloudinary;

    public function __construct(CloudinaryConfig $config)
    {
        $this->cloudinary = new Cloudinary([
            'cloud_name' => $config->cloudName,
            'api_key'    => $config->apiKey,
            'api_secret' => $config->apiSecret,
        ]);
    }

    /**
     * Upload a file to Cloudinary and return its public ID.
     *
     * @param UploadedFile $file             The uploaded file.
     * @param string       $folder           The Cloudinary folder (e.g. 'avatars').
     * @param int          $maxSizeKb        Maximum file size in kilobytes.
     * @param string[]     $allowedMimeTypes MIME types to allow.
     *
     * @return array{public_id: string}
     *
     * @throws DomainValidationException If the file fails size or MIME validation.
     * @throws RuntimeException          If the Cloudinary API call fails.
     */
    public function upload(
        UploadedFile $file,
        string $folder,
        int $maxSizeKb,
        array $allowedMimeTypes,
    ): array {
        // Server-side size validation (config-driven, not client-supplied)
        $fileSizeKb = $file->getSize() / 1024;
        if ($fileSizeKb > $maxSizeKb) {
            throw new DomainValidationException(
                "File size exceeds the maximum of {$maxSizeKb} KB.",
                'ATTACHMENT_TOO_LARGE',
                422,
            );
        }

        // Server-side MIME validation (reads actual file contents, not headers)
        $detectedMime = $file->getMimeType();
        if (! in_array($detectedMime, $allowedMimeTypes, true)) {
            throw new DomainValidationException(
                'File type is not allowed.',
                'ATTACHMENT_TYPE_NOT_ALLOWED',
                422,
            );
        }

        try {
            $result = $this->cloudinary->uploadApi()->upload(
                $file->getRealPath(),
                ['folder' => $folder],
            );
        } catch (\Cloudinary\Api\Exception\ApiError $e) {
            throw new RuntimeException('File upload failed.', 0, $e);
        }

        return [
            'public_id' => $result['public_id'],
        ];
    }
}