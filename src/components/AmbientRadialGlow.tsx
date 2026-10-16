import React, { useRef, useEffect } from 'react';
import { sampleCenterPixelColor, parseHex } from '../utils/colorExtractor';

interface AmbientRadialGlowProps {
  imageUrl: string;
  fallbackHex?: string;
  className?: string;
  blurClass?: string;
  intensity?: number;
  isDark?: boolean;
  style?: React.CSSProperties;
}

/**
 * AmbientRadialGlow Component
 * Samples a single 1x1 pixel from the center of the current image via offscreen canvas,
 * then smoothly animates the CSS variable `--ambient-glow-color` / `--ambient-glow-rgba`
 * using a requestAnimationFrame loop over 500ms to eliminate canvas performance hitches on mobile.
 */
export const AmbientRadialGlow: React.FC<AmbientRadialGlowProps> = ({
  imageUrl,
  fallbackHex = '#D4AF37',
  className = '',
  blurClass = 'blur-3xl',
  intensity = 0.55,
  isDark = true,
  style = {},
}) => {
  const glowRef = useRef<HTMLDivElement>(null);
  const currentColorRef = useRef<{ r: number; g: number; b: number }>(parseHex(fallbackHex));
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    let isCancelled = false;

    // Sample 1x1 pixel from the center of the target image
    sampleCenterPixelColor(imageUrl, fallbackHex).then((targetRgb) => {
      if (isCancelled || !glowRef.current) return;

      // Cancel any running animation loop before starting a new 500ms transition
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      const startRgb = { ...currentColorRef.current };
      const startTime = performance.now();
      const duration = 500; // 500ms smooth transition loop

      const animateStep = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        // Smooth ease-out cubic deceleration curve
        const ease = 1 - Math.pow(1 - progress, 3);

        const r = Math.round(startRgb.r + (targetRgb.r - startRgb.r) * ease);
        const g = Math.round(startRgb.g + (targetRgb.g - startRgb.g) * ease);
        const b = Math.round(startRgb.b + (targetRgb.b - startRgb.b) * ease);

        currentColorRef.current = { r, g, b };

        if (glowRef.current) {
          // Update CSS custom variables directly on the element without re-rendering or touching canvas
          glowRef.current.style.setProperty('--ambient-glow-color', `rgb(${r}, ${g}, ${b})`);
          glowRef.current.style.setProperty(
            '--ambient-glow-rgba',
            `rgba(${r}, ${g}, ${b}, ${intensity})`
          );
          glowRef.current.style.setProperty(
            '--ambient-glow-subtle',
            `rgba(${r}, ${g}, ${b}, ${intensity * 0.35})`
          );
        }

        if (progress < 1) {
          rafIdRef.current = requestAnimationFrame(animateStep);
        }
      };

      rafIdRef.current = requestAnimationFrame(animateStep);
    });

    return () => {
      isCancelled = true;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [imageUrl, fallbackHex, intensity]);

  const initialRgb = currentColorRef.current;

  return (
    <div
      ref={glowRef}
      className={`rounded-full pointer-events-none ${blurClass} ${className}`}
      style={
        {
          '--ambient-glow-color': `rgb(${initialRgb.r}, ${initialRgb.g}, ${initialRgb.b})`,
          '--ambient-glow-rgba': `rgba(${initialRgb.r}, ${initialRgb.g}, ${initialRgb.b}, ${intensity})`,
          '--ambient-glow-subtle': `rgba(${initialRgb.r}, ${initialRgb.g}, ${initialRgb.b}, ${intensity * 0.35})`,
          background: `radial-gradient(circle, var(--ambient-glow-rgba) 0%, var(--ambient-glow-subtle) 45%, transparent 70%)`,
          opacity: isDark ? 0.65 : 0.45,
          ...style,
        } as React.CSSProperties
      }
      aria-hidden="true"
    />
  );
};
