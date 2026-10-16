/**
 * ==============================================================================
 * SANJAY'S LIGHTWORKS - RESPONSIVE WEBP IMAGE OPTIMIZER (src/utils/imageOptimizer.ts)
 * ==============================================================================
 * Provides utilities for:
 * 1. Building responsive WebP image URLs via URL query parameters
 * 2. Constructing high-density responsive srcSet strings
 * 3. Graceful fallback resolution for legacy browsers or loading failures
 * ==============================================================================
 */

export interface ImageOptimizationOptions {
  width?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'original';
  watermark?: boolean;
  watermarkPosition?: 'bottom-right' | 'bottom-center' | 'bottom-left' | 'center';
  watermarkOpacity?: number;
}

/**
 * Standard responsive breakpoints for photography galleries and sliders
 */
export const RESPONSIVE_IMAGE_WIDTHS = [480, 768, 1080, 1440, 1920] as const;

/**
 * Verified signature studio backup photographs that always exist locally
 */
export const STUDIO_SIGNATURE_FALLBACK_PHOTOS = {
  landscape: '/images/misty-pine-1.jpg',
  portrait: '/images/still-vision-2.jpg',
  traditional: '/images/golden-grace-2.jpg',
  default: '/images/golden-grace-1.jpg',
} as const;

/**
 * Returns a high-resolution signature fallback photo based on title or context
 */
export function getStudioFallbackPhoto(queryOrAlt?: string): string {
  if (!queryOrAlt) return STUDIO_SIGNATURE_FALLBACK_PHOTOS.default;
  const q = queryOrAlt.toLowerCase();
  if (
    q.includes('algonquin') ||
    q.includes('pine') ||
    q.includes('landscape') ||
    q.includes('mist') ||
    q.includes('mountain') ||
    q.includes('forest') ||
    q.includes('nature')
  ) {
    return STUDIO_SIGNATURE_FALLBACK_PHOTOS.landscape;
  }
  if (
    q.includes('waterfront') ||
    q.includes('portrait') ||
    q.includes('couple') ||
    q.includes('vision') ||
    q.includes('gaze') ||
    q.includes('character')
  ) {
    return STUDIO_SIGNATURE_FALLBACK_PHOTOS.portrait;
  }
  if (
    q.includes('traditional') ||
    q.includes('saree') ||
    q.includes('silk') ||
    q.includes('gold') ||
    q.includes('ritual') ||
    q.includes('wedding')
  ) {
    return STUDIO_SIGNATURE_FALLBACK_PHOTOS.traditional;
  }
  return STUDIO_SIGNATURE_FALLBACK_PHOTOS.default;
}

/**
 * Checks whether an image URL supports dynamic optimization parameters
 */
export function isOptimizableImageUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  if (url.startsWith('data:') || url.startsWith('blob:')) return false;
  // Local gallery images or external CDNs (like Unsplash)
  return (
    url.startsWith('/images/') ||
    url.startsWith('/src/assets/images/') ||
    url.includes('images.unsplash.com') ||
    url.includes('cloudinary.com') ||
    url.startsWith('/api/optimize-image')
  );
}

/**
 * Generates an optimized WebP image URL with query parameters.
 * E.g. /images/golden-grace-1.jpg -> /images/golden-grace-1.jpg?format=webp&w=800&q=85
 * Supports both local `/images/...` endpoints and external CDNs like Unsplash.
 */
export function buildOptimizedImageUrl(
  src: string,
  options: ImageOptimizationOptions = {}
): string {
  if (!src) return '';
  // Never append query parameters to base64 data URIs or blob objects
  if (src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }

  // If not optimizable URL, return untouched
  if (!isOptimizableImageUrl(src)) {
    return src;
  }

  const { 
    width, 
    quality = 85, 
    format = 'webp', 
    watermark = true, 
    watermarkPosition, 
    watermarkOpacity 
  } = options;

  // If format is original, return clean URL without format/w overrides
  if (format === 'original') {
    return getCleanFallbackUrl(src);
  }

  try {
    // Check if external full URL
    if (src.startsWith('http://') || src.startsWith('https://')) {
      const parsed = new URL(src);
      if (parsed.hostname.includes('unsplash.com')) {
        parsed.searchParams.set('auto', 'format');
        parsed.searchParams.set('fit', 'crop');
        parsed.searchParams.set('fm', format);
        if (width) parsed.searchParams.set('w', String(width));
        if (quality) parsed.searchParams.set('q', String(quality));
        return parsed.toString();
      }
      // Other CDNs: append query parameters
      parsed.searchParams.set('format', format);
      if (width) parsed.searchParams.set('w', String(width));
      if (quality) parsed.searchParams.set('q', String(quality));
      if (watermark !== undefined) parsed.searchParams.set('watermark', String(watermark));
      if (watermarkPosition) parsed.searchParams.set('wm_pos', watermarkPosition);
      if (watermarkOpacity !== undefined) parsed.searchParams.set('wm_opacity', String(watermarkOpacity));
      return parsed.toString();
    }

    // Relative/local image URL (e.g. /images/golden-grace-1.jpg)
    const [basePath, existingQuery] = src.split('?');
    const params = new URLSearchParams(existingQuery || '');
    params.set('format', format);
    if (width) params.set('w', String(width));
    if (quality) params.set('q', String(quality));
    if (watermark !== undefined) params.set('watermark', String(watermark));
    if (watermarkPosition) params.set('wm_pos', watermarkPosition);
    if (watermarkOpacity !== undefined) params.set('wm_opacity', String(watermarkOpacity));

    return `${basePath}?${params.toString()}`;
  } catch {
    // If URL parsing fails, fallback safely
    return src;
  }
}

/**
 * Strips optimization parameters to yield the clean, original fallback URL
 */
export function getCleanFallbackUrl(src: string): string {
  if (!src) return '';
  if (src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }
  try {
    if (src.startsWith('http://') || src.startsWith('https://')) {
      const parsed = new URL(src);
      parsed.searchParams.delete('format');
      parsed.searchParams.delete('fm');
      parsed.searchParams.delete('w');
      parsed.searchParams.delete('width');
      parsed.searchParams.delete('q');
      parsed.searchParams.delete('quality');
      parsed.searchParams.delete('watermark');
      parsed.searchParams.delete('wm');
      parsed.searchParams.delete('wm_pos');
      parsed.searchParams.delete('wm_opacity');
      return parsed.toString();
    }
    const [basePath] = src.split('?');
    return basePath;
  } catch {
    return src;
  }
}

/**
 * Generates a responsive WebP srcSet for <picture> or <img>
 */
export function generateResponsiveWebpSrcSet(
  src: string,
  widths: readonly number[] = RESPONSIVE_IMAGE_WIDTHS,
  quality: number = 85,
  watermark: boolean = true
): string {
  if (!src || src.startsWith('data:') || src.startsWith('blob:') || !isOptimizableImageUrl(src)) {
    return '';
  }
  return widths
    .map((w) => `${buildOptimizedImageUrl(src, { width: w, quality, format: 'webp', watermark })} ${w}w`)
    .join(', ');
}

/**
 * Generates a responsive fallback srcSet in original format with width constraints
 */
export function generateResponsiveFallbackSrcSet(
  src: string,
  widths: readonly number[] = RESPONSIVE_IMAGE_WIDTHS,
  quality: number = 85
): string {
  if (!src || src.startsWith('data:') || src.startsWith('blob:') || !isOptimizableImageUrl(src)) {
    return '';
  }
  return widths
    .map((w) => `${buildOptimizedImageUrl(src, { width: w, quality, format: 'original' })} ${w}w`)
    .join(', ');
}

/**
 * Common responsive sizes attribute presets
 */
export const RESPONSIVE_SIZES = {
  grid: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  exhibition: '(max-width: 768px) 100vw, (max-width: 1280px) 70vw, 850px',
  sliderStar: '(max-width: 768px) 92vw, (max-width: 1280px) 50vw, 680px',
  sliderSide: '(max-width: 768px) 45vw, 380px',
  full: '100vw',
};
