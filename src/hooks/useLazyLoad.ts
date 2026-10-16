import React, { 
  useState, 
  useEffect, 
  useRef, 
  useCallback,
  type MutableRefObject,
  type Dispatch,
  type SetStateAction
} from 'react';

export interface UseLazyLoadOptions {
  /**
   * Margin around the root element. Defaults to '200px 0px' to start
   * loading images before they scroll into the viewport, avoiding visual popping.
   */
  rootMargin?: string;
  /**
   * Either a single number or an array of numbers between 0.0 and 1.0.
   * Defaults to 0.01.
   */
  threshold?: number | number[];
  /**
   * Whether to unobserve after the element enters the viewport.
   * Defaults to true.
   */
  triggerOnce?: boolean;
  /**
   * Whether intersection observing is currently enabled.
   * Defaults to true.
   */
  enabled?: boolean;
  /**
   * Optional callback when intersection occurs.
   */
  onIntersect?: () => void;
}

export interface UseLazyLoadReturn<T extends HTMLElement = HTMLDivElement> {
  ref: (node: T | null) => void;
  isVisible: boolean;
  isLoaded: boolean;
  onLoad: () => void;
  elementRef: MutableRefObject<T | null>;
  setIsVisible: Dispatch<SetStateAction<boolean>>;
}

/**
 * Custom React hook for lazy loading elements via IntersectionObserver.
 * 
 * Provides:
 * - High performance viewport detection with zero scroll event listeners
 * - Automatic pre-fetching threshold (default 200px ahead of viewport)
 * - Safe fallback for environments lacking IntersectionObserver
 * - Full cleanup on unmount or trigger
 */
export function useLazyLoad<T extends HTMLElement = HTMLDivElement>(
  options: UseLazyLoadOptions = {}
): UseLazyLoadReturn<T> {
  const {
    rootMargin = '200px 0px',
    threshold = 0.01,
    triggerOnce = true,
    enabled = true,
    onIntersect,
  } = options;

  const [isVisible, setIsVisible] = useState<boolean>(() => {
    // If IntersectionObserver is not supported (e.g. legacy browsers or SSR), fallback to visible
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return true;
    }
    return !enabled;
  });

  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const elementRef = useRef<T | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const onLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  // Ref callback to cleanly attach/detach observer even during dynamic list re-ordering
  const ref = useCallback(
    (node: T | null) => {
      // Disconnect previous observer if node changed
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      elementRef.current = node;

      if (!node || !enabled) {
        return;
      }

      // If already visible and triggerOnce is true, no need to observe again
      if (isVisible && triggerOnce) {
        return;
      }

      // Check browser support
      if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
        setIsVisible(true);
        return;
      }

      try {
        const observer = new IntersectionObserver(
          (entries) => {
            const [entry] = entries;
            if (entry && (entry.isIntersecting || entry.intersectionRatio > 0)) {
              setIsVisible(true);
              if (onIntersect) {
                onIntersect();
              }

              if (triggerOnce) {
                observer.unobserve(entry.target);
                observer.disconnect();
                observerRef.current = null;
              }
            } else if (!triggerOnce) {
              setIsVisible(false);
            }
          },
          {
            root: null, // Viewport
            rootMargin,
            threshold,
          }
        );

        observer.observe(node);
        observerRef.current = observer;
      } catch (err) {
        console.warn('[useLazyLoad] IntersectionObserver error, falling back to visible:', err);
        setIsVisible(true);
      }
    },
    [enabled, isVisible, triggerOnce, rootMargin, threshold, onIntersect]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  return {
    ref,
    isVisible,
    isLoaded,
    onLoad,
    elementRef,
    setIsVisible,
  };
}

/**
 * Helper hook specialized for lazy-loading image sources.
 * Returns a placeholder SVG or blank data URL when off-screen,
 * then swaps to actual image URL when entering the viewport.
 */
export function useLazyImage(
  src: string,
  options: UseLazyLoadOptions = {}
) {
  const lazy = useLazyLoad<HTMLDivElement>(options);

  // Transparent 1x1 pixel SVG data URI to prevent broken image icons before loading
  const PLACEHOLDER_DATA_URI =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>';

  const imageSrc = lazy.isVisible ? src : PLACEHOLDER_DATA_URI;

  return {
    ...lazy,
    imageSrc,
    shouldLoad: lazy.isVisible,
  };
}

export default useLazyLoad;
