import { useState, useCallback } from 'react';
import type { PanInfo } from 'motion/react';

export interface UseSwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  velocityThreshold?: number;
}

export interface UseSwipeGestureResult {
  swipeDirection: 'left' | 'right' | null;
  directionValue: number; // 1 for next (swiped left), -1 for prev (swiped right)
  dragProps: {
    drag: 'x';
    dragConstraints: { left: 0; right: 0 };
    dragElastic: number;
    onDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
  };
  handleDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
}

/**
 * useSwipeGesture
 * Framer-motion powered swipe gesture hook for smooth horizontal photo transitions
 * Detects horizontal swipe direction with distance threshold, velocity flick detection,
 * and physics-based drag elasticity.
 */
export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  threshold = 40,
  velocityThreshold = 250,
}: UseSwipeGestureOptions = {}): UseSwipeGestureResult {
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [directionValue, setDirectionValue] = useState<number>(1);

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const offsetX = info.offset.x;
      const velocityX = info.velocity.x;
      const power = Math.abs(offsetX) * velocityX;

      // Swiped LEFT (finger moved left, negative offset) -> Advance to NEXT photo
      if (offsetX < -threshold || velocityX < -velocityThreshold || power < -1800) {
        setSwipeDirection('left');
        setDirectionValue(1);
        onSwipeLeft?.();
      }
      // Swiped RIGHT (finger moved right, positive offset) -> Go back to PREVIOUS photo
      else if (offsetX > threshold || velocityX > velocityThreshold || power > 1800) {
        setSwipeDirection('right');
        setDirectionValue(-1);
        onSwipeRight?.();
      } else {
        setSwipeDirection(null);
      }
    },
    [onSwipeLeft, onSwipeRight, threshold, velocityThreshold]
  );

  return {
    swipeDirection,
    directionValue,
    dragProps: {
      drag: 'x',
      dragConstraints: { left: 0, right: 0 },
      dragElastic: 0.22,
      onDragEnd: handleDragEnd,
    },
    handleDragEnd,
  };
}
