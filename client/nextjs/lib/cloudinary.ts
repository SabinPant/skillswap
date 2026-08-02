// lib/cloudinary.ts
// Single source of truth for building Cloudinary display URLs.
// Every component that renders a Cloudinary image must use this helper
// so the cloud name and transformation logic live in one place.

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';

interface CloudinaryOptions {
  width?: number;
  height?: number;
}

/**
 * Build a Cloudinary display URL from a public_id.
 * Applies crop-fill transformation when dimensions are provided.
 */
export function getCloudinaryUrl(publicId: string, options?: CloudinaryOptions): string {
  if (!CLOUD_NAME) {
    // Fallback for local dev without Cloudinary configured — image won't
    // render, but the app won't crash. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    // in .env.local to enable avatars.
    return '';
  }

  const transformations = options?.width && options?.height
    ? `c_thumb,w_${options.width},h_${options.height}`
    : 'c_thumb,w_400,h_400';

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformations}/${publicId}`;
}