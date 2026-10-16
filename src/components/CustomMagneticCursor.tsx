import React, { useEffect, useState, useRef } from 'react';

type CursorVariant = 'default' | 'view' | 'explore' | 'book' | 'drag' | 'press' | 'pointer';

export const CustomMagneticCursor: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [variant, setVariant] = useState<CursorVariant>('default');
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [cursorText, setCursorText] = useState('');

  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Position references for smooth physics lerp
  const mousePos = useRef({ x: -200, y: -200 });
  const currentPos = useRef({ x: -200, y: -200 });
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    // Only enable on desktop pointer devices
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    if (isTouchDevice) return;

    const onMouseMove = (e: MouseEvent) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;
      setIsVisible(true);

      // Auto-hide after inactivity so screen captures / idle state stay clean
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 2500);
    };

    const onMouseLeave = () => {
      setIsVisible(false);
    };

    const onMouseEnter = () => {
      setIsVisible(true);
    };

    const onMouseDown = () => {
      setIsMouseDown(true);
    };

    const onMouseUp = () => {
      setIsMouseDown(false);
    };

    // Smooth RAF loop with continuous inertia
    const animate = () => {
      currentPos.current.x += (mousePos.current.x - currentPos.current.x) * 0.2;
      currentPos.current.y += (mousePos.current.y - currentPos.current.y) * 0.2;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${currentPos.current.x}px, ${currentPos.current.y}px, 0) translate(-50%, -50%)`;
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mousePos.current.x}px, ${mousePos.current.y}px, 0) translate(-50%, -50%)`;
      }

      rafId.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);
    rafId.current = requestAnimationFrame(animate);

    // Global delegation for cursor morph states
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const viewTarget = target.closest('[data-cursor="view"], .lightbox-image, .photo-preview');
      const dragTarget = target.closest('[data-cursor="drag"], .draggable-handle');
      const exploreTarget = target.closest('[data-cursor="explore"], .photo-card, .gallery-item-hover');
      const bookTarget = target.closest('[data-cursor="book"], .confirm-booking, button[data-package]');
      const pressTarget = target.closest('[data-cursor="press"], .button-gold');
      const pointerTarget = target.closest('button, a, input, select, textarea, [role="button"]');

      if (viewTarget) {
        setVariant('view');
        setCursorText('VIEW');
      } else if (dragTarget) {
        setVariant('drag');
        setCursorText('DRAG');
      } else if (exploreTarget) {
        setVariant('explore');
        setCursorText('EXPLORE');
      } else if (bookTarget) {
        setVariant('book');
        setCursorText('BOOK');
      } else if (pressTarget) {
        setVariant('press');
        setCursorText('RESERVE');
      } else if (pointerTarget) {
        setVariant('pointer');
        setCursorText('');
      } else {
        setVariant('default');
        setCursorText('');
      }
    };

    const handleMouseOut = () => {
      setVariant('default');
      setCursorText('');
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      if (rafId.current) cancelAnimationFrame(rafId.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const isView = variant === 'view';
  const isDrag = variant === 'drag';
  const isExplore = variant === 'explore';
  const isBook = variant === 'book';
  const isPress = variant === 'press';
  const isPointer = variant === 'pointer';

  let size = 28;
  let bgClasses = isDark
    ? 'border-[#D4AF37]/40 bg-transparent'
    : 'border-[#8C6207]/30 bg-transparent';
  let textClasses = '';

  if (isView) {
    size = 76;
    bgClasses = isDark
      ? 'bg-[#08080A]/90 text-[#F3E5AB] border-[#D4AF37] font-serif shadow-2xl backdrop-blur-md'
      : 'bg-[#FAF7F0]/95 text-[#8C6207] border-[#8C6207] font-serif shadow-xl';
    textClasses = isDark ? 'text-[#F3E5AB]' : 'text-[#8C6207]';
  } else if (isDrag) {
    size = 68;
    bgClasses = 'bg-[#D4AF37] text-black border-white shadow-xl';
    textClasses = 'text-black';
  } else if (isExplore) {
    size = 80;
    bgClasses = isDark
      ? 'bg-[#08080A]/90 text-[#F3E5AB] border-[#D4AF37] font-serif shadow-2xl backdrop-blur-md'
      : 'bg-[#FAF7F0]/95 text-[#8C6207] border-[#8C6207] font-serif shadow-xl';
    textClasses = isDark ? 'text-[#F3E5AB]' : 'text-[#8C6207]';
  } else if (isBook) {
    size = 78;
    bgClasses = 'bg-[#D4AF37] text-black border-[#F3E5AB] font-bold shadow-lg';
    textClasses = 'text-black font-sans tracking-widest font-bold';
  } else if (isPress) {
    size = 72;
    bgClasses = isDark
      ? 'bg-[#E5C158]/95 text-black border-white/50 font-bold shadow-md'
      : 'bg-[#8C6207] text-white border-black/20 font-bold shadow-md';
    textClasses = isDark ? 'text-black' : 'text-white';
  } else if (isPointer) {
    size = 36;
    bgClasses = isDark
      ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10'
      : 'border-[#8C6207]/40 bg-[#8C6207]/10';
  }

  return (
    <aside aria-label="Interactive cursor overlay" className="hidden md:block pointer-events-none fixed inset-0 z-[99999] overflow-hidden select-none">
      <div
        ref={cursorRef}
        className={`fixed top-0 left-0 rounded-full flex items-center justify-center border transition-[width,height,background-color,border-color,opacity,transform] duration-200 ease-out will-change-transform ${bgClasses} ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          transform: isMouseDown ? 'scale(0.85)' : undefined,
        }}
      >
        {cursorText && (
          <span
            className={`text-[9px] uppercase font-sans tracking-[0.2em] select-none text-center leading-none font-bold ${textClasses}`}
          >
            {cursorText}
          </span>
        )}
      </div>

      {!isView && !isDrag && !isExplore && !isBook && !isPress && !isPointer && (
        <div
          ref={dotRef}
          className={`fixed top-0 left-0 w-1.5 h-1.5 rounded-full transition-opacity duration-150 will-change-transform ${
            isDark ? 'bg-[#F3E5AB]' : 'bg-[#8C6207]'
          } ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </aside>
  );
};
