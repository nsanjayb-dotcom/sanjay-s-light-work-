import React, { useState, useEffect, useRef, useCallback } from 'react';
import { soundEngine } from '../utils/audio';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface SectionScrollEngineProps {
  currentView: string;
  isDark: boolean;
  isModalOpen?: boolean;
}

export const LANDING_SECTIONS = [
  { id: 'home', title: 'Editorial Daylight', label: '01', name: 'Hero' },
  { id: 'work', title: 'Photography Stories', label: '02', name: 'Work' },
  { id: 'services', title: 'Core Offerings', label: '03', name: 'Services' },
  { id: 'pricing', title: 'Transparent Pricing', label: '04', name: 'Pricing' },
  { id: 'about', title: 'Artist & Craft', label: '05', name: 'About' },
  { id: 'book', title: 'Direct Reservation', label: '06', name: 'Reserve' },
];

/**
 * SectionScrollEngine
 * Implements precise one-scroll-per-section snapping for the landing page.
 * When scrolling, it smoothly stops for each section and perfectly fits/aligns
 * all information inside that section, and the next scroll advances to the next section.
 */
export const SectionScrollEngine: React.FC<SectionScrollEngineProps> = ({
  currentView,
  isDark,
  isModalOpen = false,
}) => {
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const isTransitioningRef = useRef(false);
  const activeIndexRef = useRef(0);
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  // Sync ref with state
  useEffect(() => {
    activeIndexRef.current = activeSectionIndex;
  }, [activeSectionIndex]);

  // Smoothly scroll to a section by index using Lenis or native smooth scroll
  const scrollToSectionIndex = useCallback(
    (index: number) => {
      const clampedIndex = Math.max(0, Math.min(LANDING_SECTIONS.length - 1, index));
      const target = LANDING_SECTIONS[clampedIndex];
      const targetEl =
        document.getElementById(target.id) ||
        (target.id === 'work' ? document.getElementById('stories') : null) ||
        (target.id === 'book' ? document.getElementById('direct-calendar-reservation') : null);

      if (!targetEl) return;

      isTransitioningRef.current = true;
      setActiveSectionIndex(clampedIndex);

      try {
        soundEngine.playSwitch();
        soundEngine.triggerHaptic(10);
      } catch {}

      const lenis = (window as any).__lenis;
      if (lenis && typeof lenis.scrollTo === 'function') {
        lenis.scrollTo(targetEl, {
          duration: 0.82,
          immediate: false,
          lock: true,
          onComplete: () => {
            setTimeout(() => {
              isTransitioningRef.current = false;
            }, 120);
          },
        });
      } else {
        targetEl.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
          isTransitioningRef.current = false;
        }, 820);
      }
    },
    []
  );

  // Track active section via IntersectionObserver when user lands or switches views
  useEffect(() => {
    if (currentView !== 'portfolio') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isTransitioningRef.current) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
            const id = entry.target.id;
            const foundIdx = LANDING_SECTIONS.findIndex(
              (s) =>
                s.id === id ||
                (s.id === 'work' && id === 'stories') ||
                (s.id === 'book' && id === 'direct-calendar-reservation')
            );
            if (foundIdx !== -1) {
              setActiveSectionIndex(foundIdx);
            }
          }
        });
      },
      {
        threshold: [0.45, 0.75],
      }
    );

    LANDING_SECTIONS.forEach((s) => {
      const el =
        document.getElementById(s.id) ||
        (s.id === 'work' ? document.getElementById('stories') : null) ||
        (s.id === 'book' ? document.getElementById('direct-calendar-reservation') : null);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [currentView]);

  // Wheel interceptor: guarantees 1-wheel-gesture -> 1-section advance/stop
  useEffect(() => {
    if (currentView !== 'portfolio' || isModalOpen) return;

    const handleWheel = (e: WheelEvent) => {
      // Don't intercept if inside an internal scrollable element that has remaining scroll
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-lenis-prevent]') || target?.closest('.allow-scroll')) {
        return;
      }

      // Check vertical delta
      if (Math.abs(e.deltaY) < 18) return;

      e.preventDefault();

      if (isTransitioningRef.current) return;

      const currentIdx = activeIndexRef.current;
      if (e.deltaY > 0) {
        // Next section
        if (currentIdx < LANDING_SECTIONS.length - 1) {
          scrollToSectionIndex(currentIdx + 1);
        }
      } else {
        // Prev section
        if (currentIdx > 0) {
          scrollToSectionIndex(currentIdx - 1);
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [currentView, isModalOpen, scrollToSectionIndex]);

  // Touch gesture interceptor for mobile section-to-section navigation
  useEffect(() => {
    if (currentView !== 'portfolio' || isModalOpen) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartY.current = e.touches[0].clientY;
        touchStartX.current = e.touches[0].clientX;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartY.current === null || touchStartX.current === null) return;
      if (isTransitioningRef.current) return;

      const touchEndY = e.changedTouches[0].clientY;
      const touchEndX = e.changedTouches[0].clientX;
      const diffY = touchStartY.current - touchEndY;
      const diffX = touchStartX.current - touchEndX;

      touchStartY.current = null;
      touchStartX.current = null;

      // Only trigger if vertical motion clearly dominates horizontal motion
      if (Math.abs(diffY) > 48 && Math.abs(diffY) > Math.abs(diffX) * 1.3) {
        const currentIdx = activeIndexRef.current;
        if (diffY > 0) {
          // Swiped up -> advance to next section
          if (currentIdx < LANDING_SECTIONS.length - 1) {
            scrollToSectionIndex(currentIdx + 1);
          }
        } else {
          // Swiped down -> return to previous section
          if (currentIdx > 0) {
            scrollToSectionIndex(currentIdx - 1);
          }
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentView, isModalOpen, scrollToSectionIndex]);

  // Keyboard navigation (ArrowDown, PageDown, Space, ArrowUp, PageUp)
  useEffect(() => {
    if (currentView !== 'portfolio' || isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') return;

      const currentIdx = activeIndexRef.current;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) {
        if (currentIdx < LANDING_SECTIONS.length - 1) {
          e.preventDefault();
          scrollToSectionIndex(currentIdx + 1);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) {
        if (currentIdx > 0) {
          e.preventDefault();
          scrollToSectionIndex(currentIdx - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, isModalOpen, scrollToSectionIndex]);

  if (currentView !== 'portfolio') return null;

  return (
    <>
      {/* Desktop Floating Right-Side Section Navigator (Dots with Micro-Labels & Active Gold Glow) */}
      <nav
        aria-label="Section Navigation"
        className="fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center gap-3 select-none pointer-events-auto"
      >
        <div
          className={`flex flex-col items-center gap-2.5 p-2 rounded-full border backdrop-blur-md transition-all duration-300 ${
            isDark
              ? 'bg-[#121216]/85 border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.5)]'
              : 'bg-white/90 border-stone-200/90 shadow-md'
          }`}
        >
          {LANDING_SECTIONS.map((section, idx) => {
            const isActive = activeSectionIndex === idx;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollToSectionIndex(idx)}
                title={`${section.label} · ${section.name} (${section.title})`}
                aria-label={`Jump to ${section.name} section`}
                aria-current={isActive ? 'true' : undefined}
                className="group relative flex items-center justify-center cursor-pointer p-1 rounded-full transition-transform active:scale-90"
              >
                {/* Active Tooltip Popover on Hover */}
                <div
                  className={`pointer-events-none absolute right-8 px-2.5 py-1 rounded-md text-[10px] font-sans font-bold uppercase tracking-wider whitespace-nowrap shadow-md transition-all duration-200 opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 ${
                    isDark ? 'bg-stone-900 text-[#F3E5AB] border border-[#D4AF37]/30' : 'bg-stone-900 text-white'
                  }`}
                >
                  <span className="text-[#D4AF37] mr-1.5">{section.label}</span>
                  <span>{section.name}</span>
                </div>

                {/* Dot Element */}
                <div
                  className={`rounded-full transition-all duration-400 ${
                    isActive
                      ? 'w-2.5 h-6 bg-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.7)]'
                      : isDark
                        ? 'w-2 h-2 bg-white/25 hover:bg-white/60 hover:scale-125'
                        : 'w-2 h-2 bg-stone-300 hover:bg-stone-500 hover:scale-125'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Floating Micro-Section Status Pill & Jump Controls */}
      <div className="fixed bottom-20 right-3 z-40 md:hidden select-none pointer-events-auto">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border backdrop-blur-md shadow-lg transition-all duration-300 ${
            isDark
              ? 'bg-[#141418]/90 border-[#D4AF37]/30 text-white shadow-[0_4px_16px_rgba(0,0,0,0.6)]'
              : 'bg-white/95 border-stone-300 text-stone-900 shadow-md'
          }`}
        >
          {activeSectionIndex > 0 && (
            <button
              type="button"
              onClick={() => scrollToSectionIndex(activeSectionIndex - 1)}
              aria-label="Previous section"
              className="p-1 rounded-full hover:bg-white/10 active:scale-90 text-[#D4AF37]"
            >
              <ChevronUp size={14} />
            </button>
          )}

          <span className="text-[10px] font-mono font-bold tracking-wider px-1 text-[#D4AF37]">
            {LANDING_SECTIONS[activeSectionIndex]?.label} / 06
          </span>

          {activeSectionIndex < LANDING_SECTIONS.length - 1 && (
            <button
              type="button"
              onClick={() => scrollToSectionIndex(activeSectionIndex + 1)}
              aria-label="Next section"
              className="p-1 rounded-full hover:bg-white/10 active:scale-90 text-[#D4AF37]"
            >
              <ChevronDown size={14} />
            </button>
          )}
        </div>
      </div>
    </>
  );
};
