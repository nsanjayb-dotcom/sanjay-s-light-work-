import React, { useState, useEffect, useRef } from 'react';

export interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  aspectRatio?: string;
  fallbackSrc?: string;
  rootMargin?: string;
  threshold?: number;
  containerClassName?: string;
  priority?: boolean;
}

/**
 * High-performance IntersectionObserver-based lazy loaded image component.
 * Delivers instant initial paint, pre-fetches 250px ahead of the viewport,
 * and renders smooth blur-up transitions with subtle gold shimmer placeholders.
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  aspectRatio = '3/4',
  fallbackSrc = '/images/still-vision-1.jpg',
  rootMargin = '250px 0px',
  threshold = 0.01,
  className = '',
  containerClassName = '',
  priority = false,
  ...props
}) => {
  const [isInView, setIsInView] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    // Safe fallback if IntersectionObserver is unavailable
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const node = containerRef.current;
    if (!node) return;

    let observer: IntersectionObserver | null = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry && (entry.isIntersecting || entry.intersectionRatio > 0)) {
          setIsInView(true);
          if (observer) {
            observer.unobserve(node);
            observer.disconnect();
            observer = null;
          }
        }
      },
      {
        root: null, // Viewport
        rootMargin,
        threshold,
      }
    );

    observer.observe(node);

    return () => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    };
  }, [priority, rootMargin, threshold]);

  const activeSrc = hasError ? fallbackSrc : (isInView ? src : undefined);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-[var(--secondary)] ${containerClassName}`}
      style={aspectRatio !== 'auto' ? { aspectRatio } : undefined}
    >
      {/* Subtle Gold Shimmer Placeholder while loading or offscreen */}
      {(!isLoaded || !isInView) && (
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--gold)]/10 to-transparent animate-pulse pointer-events-none"
          aria-hidden="true"
        />
      )}

      {isInView && (
        <img
          src={activeSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            if (!hasError) {
              setHasError(true);
            }
          }}
          className={`w-full h-full object-cover transition-all duration-700 ease-out ${
            isLoaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-sm scale-[1.02]'
          } ${className}`}
          {...props}
        />
      )}
    </div>
  );
};

export default LazyImage;
