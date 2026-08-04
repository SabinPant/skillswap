// lib/cloudinary.ts
// Single source of truth for building Cloudinary display URLs.
// Every component that renders a Cloudinary file must use this helper
// so the cloud name and transformation logic live in one place.

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';

interface CloudinaryOptions {
  width?: number;
  height?: number;
  /** Defaults to 'image'. Use 'raw' for non-image files (PDF, text, etc.). */
  resourceType?: 'image' | 'raw';
}

/**
 * Build a Cloudinary display URL from a public_id.
 * Applies crop-fill transformation when dimensions are provided
 * and resourceType is 'image'.
 */
export function getCloudinaryUrl(publicId: string, options?: CloudinaryOptions): string {
  if (!CLOUD_NAME) {
    return '';
  }

  const resourceType = options?.resourceType ?? 'image';
  const hasDimensions = options?.width && options?.height;

  if (resourceType === 'raw') {
    return `https://res.cloudinary.com/${CLOUD_NAME}/raw/upload/${publicId}`;
  }

  const transformations = hasDimensions
    ? `c_thumb,w_${options!.width},h_${options!.height}`
    : 'c_thumb,w_400,h_400';

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformations}/${publicId}`;
}