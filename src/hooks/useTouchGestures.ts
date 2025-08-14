import { useState, useEffect } from 'react';

interface TouchGesture {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  distance: number;
}

interface UseTouchGesturesOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

export function useTouchGestures(
  elementRef: React.RefObject<HTMLElement>,
  options: UseTouchGesturesOptions = {}
) {
  const { threshold = 50 } = options;
  const [gesture, setGesture] = useState<TouchGesture | null>(null);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let startTouch: Touch | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      startTouch = e.touches[0];
      setIsTouch(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!startTouch) return;
      
      // Prevent scroll while detecting swipe
      if (Math.abs(e.touches[0].clientX - startTouch.clientX) > 10) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!startTouch) return;

      const endTouch = e.changedTouches[0];
      const deltaX = endTouch.clientX - startTouch.clientX;
      const deltaY = endTouch.clientY - startTouch.clientY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance < threshold) {
        setIsTouch(false);
        return;
      }

      let direction: TouchGesture['direction'] = null;
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }

      const gestureData: TouchGesture = {
        startX: startTouch.clientX,
        startY: startTouch.clientY,
        endX: endTouch.clientX,
        endY: endTouch.clientY,
        direction,
        distance
      };

      setGesture(gestureData);

      // Execute callbacks
      switch (direction) {
        case 'left':
          options.onSwipeLeft?.();
          break;
        case 'right':
          options.onSwipeRight?.();
          break;
        case 'up':
          options.onSwipeUp?.();
          break;
        case 'down':
          options.onSwipeDown?.();
          break;
      }

      setIsTouch(false);
      startTouch = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, options, threshold]);

  return { gesture, isTouch };
}