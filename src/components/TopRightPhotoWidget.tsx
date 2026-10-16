import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';
import { soundEngine } from '../utils/audio';

const TOP_PORTFOLIO_THUMBS = [
  { url: '/images/golden-grace-2.jpg', title: 'Golden Grace' },
  { url: '/images/emerald-harmony-2.jpg', title: 'Emerald Harmony' },
  { url: '/images/still-vision-2.jpg', title: 'Still Vision' },
  { url: '/images/misty-pine-2.jpg', title: 'Misty Pine' },
  { url: '/images/gallery-1.jpg', title: 'Editorial Noir' },
  { url: '/images/gallery-3.jpg', title: 'Heirloom Portrait' },
  { url: '/images/gallery-7.jpg', title: 'Natural Glow' },
  { url: '/images/gallery-10.jpg', title: 'Cinematic Frame' },
];

interface TopRightPhotoWidgetProps {
  onOpenGallery: () => void;
  isDark: boolean;
}

export const TopRightPhotoWidget: React.FC<TopRightPhotoWidgetProps> = ({
  onOpenGallery,
  isDark,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isCrossfading, setIsCrossfading] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Crossfade through randomized / sequential array of portfolio images every 3.5 seconds
    intervalRef.current = window.setInterval(() => {
      setNextIndex((prev) => (prev + 1) % TOP_PORTFOLIO_THUMBS.length);
      setIsCrossfading(true);

      const timer = window.setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % TOP_PORTFOLIO_THUMBS.length);
        setIsCrossfading(false);
      }, 300); // 300ms ease crossfade duration

      return () => window.clearTimeout(timer);
    }, 3500);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, []);

  const handleWidgetTap = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Subtle 10ms haptic feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // Safe fallback
      }
    }
    soundEngine.playClick();
    soundEngine.hapticTap();

    onOpenGallery();
  };

  const currentPhoto = TOP_PORTFOLIO_THUMBS[currentIndex];
  const nextPhoto = TOP_PORTFOLIO_THUMBS[nextIndex];

  return (
    <div
      id="top-right-photo-widget"
      onClick={handleWidgetTap}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleWidgetTap(e as any);
      }}
      aria-label="Quick Gallery - View all portfolio Lightworks"
      title="Quick Gallery ↗ – Tap to browse all curated lightworks"
      className="md:hidden flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform group select-none py-1 focus:outline-none"
    >
      {/* 56x56px rounded (12px radius) photo frame */}
      <div
        className={`relative w-[56px] h-[56px] min-w-[56px] min-h-[56px] rounded-[12px] overflow-hidden border shadow-sm transition-all duration-300 ${
          isDark
            ? 'border-[#D4AF37]/40 bg-stone-900 group-hover:border-[#D4AF37]'
            : 'border-[#B8860B]/40 bg-white group-hover:border-[#B8860B]'
        }`}
      >
        {/* Base Layer Photo */}
        <img
          src={currentPhoto.url}
          alt={currentPhoto.title}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          decoding="async"
        />

        {/* Crossfade Layer Photo (300ms ease) */}
        <img
          src={nextPhoto.url}
          alt={nextPhoto.title}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-in-out ${
            isCrossfading ? 'opacity-100' : 'opacity-0'
          }`}
          loading="eager"
          decoding="async"
        />

        {/* Subtle glossy sheen */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10 pointer-events-none" />

        {/* Micro spark indicator */}
        <div className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-[#D4AF37] flex items-center justify-center shadow-xs">
          <Sparkles size={6} className="text-black" />
        </div>
      </div>

      {/* Muted label beside the widget reading "Quick Gallery ↗" */}
      <div className="flex flex-col items-start justify-center leading-none text-left">
        <span
          className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#8C9097] group-hover:text-[#D4AF37] transition-colors flex items-center gap-0.5"
          style={{ letterSpacing: '0.05em', color: '#8C9097' }}
        >
          <span>Quick Gallery</span>
          <span className="text-[11px] leading-none">↗</span>
        </span>
        <span className="text-[8px] font-mono tracking-wider text-[#8C9097]/70 mt-0.5">
          {currentIndex + 1}/8
        </span>
      </div>
    </div>
  );
};
