/**
 * ==============================================================================
 * SANJAY'S LIGHTWORKS - DYNAMIC WATERMARK UTILITY (src/server/watermark.ts)
 * ==============================================================================
 * High-aesthetic dynamic watermarking engine for portfolio photography.
 * Generates responsive SVG overlays with luxury typographic styling,
 * soft ambient drop shadows, and subtle gold accents.
 * Protects creative copyright while preserving gallery-grade visual beauty.
 * ==============================================================================
 */

import sharp, { Sharp, Gravity } from 'sharp';

export interface WatermarkOptions {
  imageWidth: number;
  imageHeight: number;
  text?: string;
  subtitle?: string;
  opacity?: number;
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left' | 'center';
}

/**
 * Generates an SVG watermark buffer scaled dynamically to match image resolution
 */
export function generateWatermarkSvg(options: WatermarkOptions): Buffer {
  const {
    imageWidth,
    imageHeight,
    text = "SANJAY'S LIGHTWORKS",
    subtitle = 'FINE ART PHOTOGRAPHY',
    opacity = 0.72,
    position = 'bottom-right',
  } = options;

  // Dynamically calculate typographic scales based on image width
  // Ensures watermark is legible on 480w mobile yet discreet on 1920w desktop
  const baseScale = Math.max(0.55, Math.min(2.2, imageWidth / 1000));
  const mainFontSize = Math.round(15 * baseScale);
  const subFontSize = Math.max(9, Math.round(9 * baseScale));
  const iconSize = Math.round(14 * baseScale);
  const letterSpacing = Math.round(4 * baseScale);

  // Approximate dimensions for the SVG container
  const boxWidth = Math.round(340 * baseScale);
  const boxHeight = Math.round(58 * baseScale);
  const marginX = Math.round(28 * baseScale);
  const marginY = Math.round(26 * baseScale);

  // Position alignment
  let posX = imageWidth - boxWidth - marginX;
  let posY = imageHeight - boxHeight - marginY;

  if (position === 'bottom-left') {
    posX = marginX;
  } else if (position === 'bottom-center') {
    posX = Math.round((imageWidth - boxWidth) / 2);
  } else if (position === 'center') {
    posX = Math.round((imageWidth - boxWidth) / 2);
    posY = Math.round((imageHeight - boxHeight) / 2);
  }

  // Clamping to avoid negative positions
  posX = Math.max(8, posX);
  posY = Math.max(8, posY);

  // Luxury aesthetic SVG with drop-shadow filter and warm gold (#D4AF37) / ivory (#FAF8F5)
  const svg = `
<svg width="${boxWidth}" height="${boxHeight}" viewBox="0 0 ${boxWidth} ${boxHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Soft dual shadow to ensure legibility on both bright snow/sky and pitch dark shadows -->
    <filter id="wmShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.85"/>
      <feDropShadow dx="0" dy="0.5" stdDeviation="1" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <g filter="url(#wmShadow)" opacity="${opacity}">
    <!-- Subtle glass pill background backdrop for subtle contrast -->
    <rect 
      x="0" 
      y="0" 
      width="${boxWidth}" 
      height="${boxHeight}" 
      rx="${Math.round(8 * baseScale)}" 
      fill="rgba(12, 12, 14, 0.32)" 
      stroke="rgba(212, 175, 55, 0.28)" 
      stroke-width="1"
    />

    <!-- Elegant Gold Diamond Emblem -->
    <g transform="translate(${Math.round(18 * baseScale)}, ${Math.round(boxHeight / 2)})">
      <!-- Outer diamond -->
      <polygon 
        points="0,-${iconSize / 2} ${iconSize / 2},0 0,${iconSize / 2} -${iconSize / 2},0" 
        fill="none" 
        stroke="#D4AF37" 
        stroke-width="${Math.max(1, 1.4 * baseScale)}"
      />
      <!-- Inner core diamond -->
      <polygon 
        points="0,-${iconSize / 4} ${iconSize / 4},0 0,${iconSize / 4} -${iconSize / 4},0" 
        fill="#D4AF37"
      />
    </g>

    <!-- Main Title: SANJAY'S LIGHTWORKS -->
    <text 
      x="${Math.round(36 * baseScale + iconSize)}" 
      y="${Math.round(24 * baseScale)}" 
      font-family="'Playfair Display', 'Cinzel', 'Didot', 'Georgia', serif" 
      font-size="${mainFontSize}px" 
      font-weight="700" 
      letter-spacing="${letterSpacing}px" 
      fill="#FAF8F5"
    >
      ${text}
    </text>

    <!-- Subtitle: FINE ART PHOTOGRAPHY · ONTARIO -->
    <text 
      x="${Math.round(36 * baseScale + iconSize)}" 
      y="${Math.round(44 * baseScale)}" 
      font-family="'Inter', 'Helvetica Neue', 'Arial', sans-serif" 
      font-size="${subFontSize}px" 
      font-weight="600" 
      letter-spacing="${Math.round(2.5 * baseScale)}px" 
      fill="#D4AF37"
    >
      ${subtitle}
    </text>
  </g>
</svg>
`.trim();

  return Buffer.from(svg);
}

/**
 * Inspects the image dimensions and composites the dynamic watermark
 */
export async function applyWatermarkToPipeline(
  pipeline: Sharp,
  options: {
    enabled?: boolean;
    text?: string;
    subtitle?: string;
    opacity?: number;
    position?: 'bottom-right' | 'bottom-center' | 'bottom-left' | 'center';
  } = {}
): Promise<Sharp> {
  const { enabled = true, text, subtitle, opacity, position = 'bottom-right' } = options;

  if (!enabled) {
    return pipeline;
  }

  try {
    // Clone and inspect metadata of the pipeline to read target dimensions
    const metadata = await pipeline.metadata();
    const width = metadata.width || 1200;
    const height = metadata.height || 900;

    // Generate the resolution-matched SVG watermark buffer
    const watermarkSvgBuffer = generateWatermarkSvg({
      imageWidth: width,
      imageHeight: height,
      text,
      subtitle,
      opacity,
      position,
    });

    // Composite the watermark overlay
    let gravity: Gravity = 'southeast';
    if (position === 'bottom-left') gravity = 'southwest';
    else if (position === 'bottom-center') gravity = 'south';
    else if (position === 'center') gravity = 'center';

    return pipeline.composite([
      {
        input: watermarkSvgBuffer,
        gravity,
        // Blend overlay for seamless photographic integration
        blend: 'over',
      },
    ]);
  } catch (err) {
    console.warn('[WATERMARK] Failed to apply watermark to pipeline, continuing with raw image:', err);
    return pipeline;
  }
}
