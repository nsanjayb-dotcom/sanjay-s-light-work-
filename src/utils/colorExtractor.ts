/**
 * ==============================================================================
 * SANJAY'S LIGHTWORKS - LIGHTWEIGHT CANVAS COLOR EXTRACTOR (src/utils/colorExtractor.ts)
 * ==============================================================================
 * Dynamically samples the vibrant/dominant ambient color from an image URL
 * using a tiny 16x16 offscreen canvas. Results are cached in-memory for instant lookups.
 * ==============================================================================
 */

export interface SampledColor {
  r: number;
  g: number;
  b: number;
  hex: string;
  rgba: (alpha: number) => string;
  radialGradient: (intensity?: number) => string;
}

// In-memory cache to guarantee zero redundant canvas operations
const colorCache = new Map<string, SampledColor>();

export function parseHex(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 212, g: 175, b: 55 }; // Default gold fallback
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function getFallbackColor(fallbackHex = '#D4AF37'): SampledColor {
  const { r, g, b } = parseHex(fallbackHex);
  return {
    r,
    g,
    b,
    hex: fallbackHex,
    rgba: (alpha: number) => `rgba(${r}, ${g}, ${b}, ${alpha})`,
    radialGradient: (intensity = 0.45) =>
      `radial-gradient(ellipse at center, rgba(${r}, ${g}, ${b}, ${intensity}) 0%, rgba(${r}, ${g}, ${b}, ${intensity * 0.4}) 45%, transparent 70%)`,
  };
}

/**
 * Samples the dominant color from an image URL using a fast 16x16 canvas.
 * Weights saturated midtone pixels over pure whites or deep crushed blacks.
 */
export function sampleDominantColor(
  imageUrl: string,
  fallbackHex = '#D4AF37'
): Promise<SampledColor> {
  if (!imageUrl) {
    return Promise.resolve(getFallbackColor(fallbackHex));
  }

  if (colorCache.has(imageUrl)) {
    return Promise.resolve(colorCache.get(imageUrl)!);
  }

  return new Promise((resolve) => {
    // If not in a browser environment, return fallback
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(getFallbackColor(fallbackHex));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';

    const handleSuccess = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 16;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          resolve(getFallbackColor(fallbackHex));
          return;
        }

        ctx.drawImage(img, 0, 0, size, size);
        const imgData = ctx.getImageData(0, 0, size, size).data;

        let totalR = 0;
        let totalG = 0;
        let totalB = 0;
        let totalWeight = 0;

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          // Skip transparent or near-transparent pixels
          if (a < 128) continue;

          // Skip near-black or blown-out white pixels to capture authentic pigments
          const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
          if (brightness < 18 || brightness > 242) continue;

          // Compute saturation weight (favor rich silks, foliage, amber, indigos)
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max === 0 ? 0 : (max - min) / max;
          const weight = 1 + saturation * 2.5;

          totalR += r * weight;
          totalG += g * weight;
          totalB += b * weight;
          totalWeight += weight;
        }

        if (totalWeight === 0) {
          const fallback = getFallbackColor(fallbackHex);
          colorCache.set(imageUrl, fallback);
          resolve(fallback);
          return;
        }

        const avgR = Math.round(totalR / totalWeight);
        const avgG = Math.round(totalG / totalWeight);
        const avgB = Math.round(totalB / totalWeight);
        const hex = `#${((1 << 24) + (avgR << 16) + (avgG << 8) + avgB).toString(16).slice(1)}`;

        const result: SampledColor = {
          r: avgR,
          g: avgG,
          b: avgB,
          hex,
          rgba: (alpha: number) => `rgba(${avgR}, ${avgG}, ${avgB}, ${alpha})`,
          radialGradient: (intensity = 0.45) =>
            `radial-gradient(ellipse at center, rgba(${avgR}, ${avgG}, ${avgB}, ${intensity}) 0%, rgba(${avgR}, ${avgG}, ${avgB}, ${intensity * 0.4}) 45%, transparent 70%)`,
        };

        colorCache.set(imageUrl, result);
        resolve(result);
      } catch {
        resolve(getFallbackColor(fallbackHex));
      }
    };

    img.onload = handleSuccess;
    img.onerror = () => {
      resolve(getFallbackColor(fallbackHex));
    };

    // If already complete in cache
    if (img.complete && img.naturalWidth !== 0) {
      handleSuccess();
    } else {
      img.src = imageUrl;
    }
  });
}

const centerPixelCache = new Map<string, { r: number; g: number; b: number }>();

/**
 * Samples a single 1x1 pixel directly from the center of the image.
 * Uses a 1x1 offscreen canvas for near-zero memory footprint and sub-millisecond execution.
 */
export function sampleCenterPixelColor(
  imageUrl: string,
  fallbackHex = '#D4AF37'
): Promise<{ r: number; g: number; b: number }> {
  if (!imageUrl) {
    return Promise.resolve(parseHex(fallbackHex));
  }

  if (centerPixelCache.has(imageUrl)) {
    return Promise.resolve(centerPixelCache.get(imageUrl)!);
  }

  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(parseHex(fallbackHex));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';

    const handleSuccess = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(parseHex(fallbackHex));
          return;
        }

        const nw = img.naturalWidth || img.width || 2;
        const nh = img.naturalHeight || img.height || 2;
        const sx = Math.floor(nw / 2);
        const sy = Math.floor(nh / 2);

        // Draw ONLY the 1x1 center pixel directly onto the 1x1 canvas
        ctx.drawImage(img, sx, sy, 1, 1, 0, 0, 1, 1);
        const data = ctx.getImageData(0, 0, 1, 1).data;

        const rgb = {
          r: data[0],
          g: data[1],
          b: data[2],
        };

        centerPixelCache.set(imageUrl, rgb);
        resolve(rgb);
      } catch {
        resolve(parseHex(fallbackHex));
      }
    };

    img.onload = handleSuccess;
    img.onerror = () => {
      resolve(parseHex(fallbackHex));
    };

    if (img.complete && img.naturalWidth !== 0) {
      handleSuccess();
    } else {
      img.src = imageUrl;
    }
  });
}

