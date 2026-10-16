import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useSpring, useTransform, useScroll } from 'motion/react';
import { soundEngine } from '../utils/audio';
import { useLazyLoad } from '../hooks/useLazyLoad';
import { 
  ArrowLeft, 
  ArrowRight, 
  Maximize2, 
  Play, 
  Pause, 
  Star,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';
import {
  buildOptimizedImageUrl,
  generateResponsiveWebpSrcSet,
  generateResponsiveFallbackSrcSet,
  getCleanFallbackUrl,
  getStudioFallbackPhoto,
  RESPONSIVE_SIZES,
} from '../utils/imageOptimizer';
import { sampleDominantColor, getFallbackColor, SampledColor } from '../utils/colorExtractor';
import { AmbientRadialGlow } from './AmbientRadialGlow';
import { useSwipeGesture } from '../hooks/useSwipeGesture';

interface PortfolioSliderProps {
  onSelectPhoto: (imageUrl: string, title: string) => void;
  isDark: boolean;
}

interface ColorSwatch {
  hex: string;
  name: string;
}

interface PhotoItem {
  url: string;
  caption: string;
  gear: string;
  aperture: string;
}

interface ThemedPaletteSuite {
  id: string;
  title: string;
  category: string;
  subtitle: string;
  description: string;
  accentColor: string; // Vibrant glowing color
  accentGlow: string; // Drop shadow glow
  textClassDark: string;
  textClassLight: string;
  badgeBgDark: string;
  badgeBgLight: string;
  borderClassDark: string;
  borderClassLight: string;
  starPhoto: PhotoItem; // Center hero photo that slightly pops out
  leftPhoto: PhotoItem; // Companion left
  rightPhoto: PhotoItem; // Companion right
  palette: ColorSwatch[];
  processNotes: string;
}

const PALETTE_SUITES: ThemedPaletteSuite[] = [
  {
    id: 'golden-grace',
    title: 'GOLDEN GRACE',
    category: 'TRADITIONAL & HERITAGE',
    subtitle: 'Warm natural light & radiant amber silks',
    description: 'Tradition celebrated through organic window illumination, rich turmeric golds, and timeless heirloom grace.',
    accentColor: '#E5A93C',
    accentGlow: 'rgba(229, 169, 60, 0.85)',
    textClassDark: 'text-[#FBBF24]',
    textClassLight: 'text-[#B45309]',
    badgeBgDark: 'bg-[#D4AF37]/20 text-[#FCD34D] border-[#D4AF37]/50',
    badgeBgLight: 'bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]/60',
    borderClassDark: 'border-[#E5A93C]',
    borderClassLight: 'border-[#D97706]',
    starPhoto: {
      url: '/images/golden-grace-2.jpg',
      caption: 'Golden Grace · Hero Portrait',
      gear: 'Canon EOS R6 III · 50mm',
      aperture: 'f/1.4 · ISO 100',
    },
    leftPhoto: {
      url: '/images/golden-grace-1.jpg',
      caption: 'Golden Grace · Ambient Light',
      gear: 'Canon EOS R6 III · 35mm',
      aperture: 'f/1.8 · ISO 160',
    },
    rightPhoto: {
      url: '/images/golden-grace-3.jpg',
      caption: 'Golden Grace · Silk Details',
      gear: 'Canon EOS R6 III · 85mm',
      aperture: 'f/2.0 · ISO 200',
    },
    palette: [
      { hex: '#D4AF37', name: 'Imperial Gold' },
      { hex: '#A67C1E', name: 'Raw Ochre' },
      { hex: '#4A3525', name: 'Deep Teak' },
      { hex: '#181512', name: 'Obsidian Noir' },
    ],
    processNotes: 'Highlights rolled off at 14 bits to retain intricate zari embroidery without clipping. Midtones warmed with an S-curve tone response.',
  },
  {
    id: 'emerald-harmony',
    title: 'EMERALD HARMONY',
    category: 'HERITAGE IN NATURE',
    subtitle: 'Verdant greens & cultural portraiture',
    description: 'Placing cultural portraits within verdant open terrain where traditional silks and living flora share the same visual canvas.',
    accentColor: '#10B981',
    accentGlow: 'rgba(16, 185, 129, 0.85)',
    textClassDark: 'text-[#34D399]',
    textClassLight: 'text-[#047857]',
    badgeBgDark: 'bg-[#10B981]/20 text-[#6EE7B7] border-[#10B981]/50',
    badgeBgLight: 'bg-[#ECFDF5] text-[#065F46] border-[#10B981]/60',
    borderClassDark: 'border-[#10B981]',
    borderClassLight: 'border-[#059669]',
    starPhoto: {
      url: '/images/emerald-harmony-2.jpg',
      caption: 'Emerald Harmony · Meadow Breeze',
      gear: 'Canon EOS R6 III · 85mm',
      aperture: 'f/1.8 · ISO 200',
    },
    leftPhoto: {
      url: '/images/emerald-harmony-1.jpg',
      caption: 'Emerald Harmony · Open Horizon',
      gear: 'Canon EOS R6 III · 50mm',
      aperture: 'f/1.4 · ISO 160',
    },
    rightPhoto: {
      url: '/images/emerald-harmony-3.jpg',
      caption: 'Emerald Harmony · Forest Canopy',
      gear: 'Canon EOS R6 III · 70mm',
      aperture: 'f/2.8 · ISO 250',
    },
    palette: [
      { hex: '#1B4D3E', name: 'Deep Emerald' },
      { hex: '#2D5A47', name: 'Verdant Slate' },
      { hex: '#8FA382', name: 'Lichen Sage' },
      { hex: '#0D1912', name: 'Forest Noir' },
    ],
    processNotes: 'Selective hue separation between skin undertones and botanical chlorophyl to ensure subjects stand forward from deep green backgrounds.',
  },
  {
    id: 'still-vision',
    title: 'STILL VISION',
    category: 'PORTRAIT & CHIAROSCURO',
    subtitle: 'Directional light & quiet character studies',
    description: 'The space between speech and silence. Directional chiaroscuro light carving honest contours and emotional stillness.',
    accentColor: '#E2E8F0',
    accentGlow: 'rgba(226, 232, 240, 0.85)',
    textClassDark: 'text-[#F1F5F9]',
    textClassLight: 'text-[#1E293B]',
    badgeBgDark: 'bg-white/20 text-white border-white/50',
    badgeBgLight: 'bg-stone-200 text-stone-900 border-stone-400',
    borderClassDark: 'border-white',
    borderClassLight: 'border-stone-600',
    starPhoto: {
      url: '/images/still-vision-2.jpg',
      caption: 'Still Vision · Low-Key Chiaroscuro',
      gear: 'Canon EOS R6 III · 50mm',
      aperture: 'f/1.4 · ISO 320',
    },
    leftPhoto: {
      url: '/images/still-vision-1.jpg',
      caption: 'Still Vision · Contemplation',
      gear: 'Canon EOS R6 III · 35mm',
      aperture: 'f/1.4 · ISO 400',
    },
    rightPhoto: {
      url: '/images/still-vision-3.jpg',
      caption: 'Still Vision · Quiet Gaze',
      gear: 'Canon EOS R6 III · 85mm',
      aperture: 'f/1.8 · ISO 250',
    },
    palette: [
      { hex: '#D8D8D8', name: 'Specular White' },
      { hex: '#6D7278', name: 'Neutral Slate' },
      { hex: '#282A2E', name: 'Charcoal Film' },
      { hex: '#0C0D0E', name: 'Studio Black' },
    ],
    processNotes: 'Micro-contrast calibrated to preserve authentic skin pore texture while suppressing distracting background specular reflections.',
  },
  {
    id: 'misty-pine',
    title: 'MISTY PINE',
    category: 'THEMED EDITORIAL & MOOD',
    subtitle: 'Boreal morning fog, slate denim & weathered bark',
    description: 'Indigo textures and early boreal mist balancing organic forestry with contemporary editorial aesthetics.',
    accentColor: '#38BDF8',
    accentGlow: 'rgba(56, 189, 248, 0.85)',
    textClassDark: 'text-[#38BDF8]',
    textClassLight: 'text-[#0284C7]',
    badgeBgDark: 'bg-[#38BDF8]/20 text-[#7DD3FC] border-[#38BDF8]/50',
    badgeBgLight: 'bg-[#E0F2FE] text-[#0369A1] border-[#38BDF8]/60',
    borderClassDark: 'border-[#38BDF8]',
    borderClassLight: 'border-[#0284C7]',
    starPhoto: {
      url: '/images/misty-pine-2.jpg',
      caption: 'Misty Pine · Fog Peak Portrait',
      gear: 'Canon EOS R6 III · 70mm',
      aperture: 'f/2.8 · 1/500s',
    },
    leftPhoto: {
      url: '/images/misty-pine-1.jpg',
      caption: 'Misty Pine · Woodland Shroud',
      gear: 'Canon EOS R6 III · 24-70mm',
      aperture: 'f/2.8 · 1/640s',
    },
    rightPhoto: {
      url: '/images/misty-pine-3.jpg',
      caption: 'Misty Pine · Highland Timber',
      gear: 'Canon EOS R6 III · 50mm',
      aperture: 'f/2.0 · ISO 200',
    },
    palette: [
      { hex: '#4E6170', name: 'Slate Denim' },
      { hex: '#697A6D', name: 'Misty Pine' },
      { hex: '#968470', name: 'Weathered Bark' },
      { hex: '#1B2228', name: 'Dusk Fog' },
    ],
    processNotes: 'Atmospheric depth mapping using split-toning with cool cyan in shadowed pine needles and neutral warm tints in skin highlights.',
  },
];

interface VirtualizedImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderColor?: string;
  isDark?: boolean;
  priority?: boolean;
  layout?: 'star' | 'side' | 'mobile';
  sizes?: string;
}

/**
 * VirtualizedImage: High-performance image component with responsive WebP URL parameters,
 * automatic fallback mechanism, IntersectionObserver lazy loading, cream & gold shimmer skeleton loader,
 * eager preloading for hero/star images, async decoding, and smooth 0.4s fade-in.
 */
const VirtualizedImage: React.FC<VirtualizedImageProps> = ({
  src,
  alt,
  className = '',
  placeholderColor = '#FAF8F5',
  isDark = true,
  priority = false,
  layout = 'side',
  sizes,
}) => {
  const { ref, isVisible, isLoaded, onLoad } = useLazyLoad<HTMLDivElement>({
    rootMargin: '250px 0px',
    enabled: !priority, // Star/hero photo loads immediately, others lazy load on scroll
    triggerOnce: true,
  });

  const imgRef = useRef<HTMLImageElement>(null);

  // Track WebP loading failure and fallback state
  const [useFallback, setUseFallback] = useState(false);
  const [backupPhotoSrc, setBackupPhotoSrc] = useState<string | null>(null);
  const [hasFatalError, setHasFatalError] = useState(false);

  // Reset fallback state when source prop changes
  useEffect(() => {
    setUseFallback(false);
    setBackupPhotoSrc(null);
    setHasFatalError(false);
  }, [src]);

  // Responsive sizes configuration based on layout
  const responsiveSizes = sizes || (
    layout === 'star' || priority 
      ? RESPONSIVE_SIZES.sliderStar 
      : layout === 'side' 
        ? RESPONSIVE_SIZES.sliderSide 
        : RESPONSIVE_SIZES.full
  );

  // Generate responsive WebP srcSet with URL parameters (?format=webp&w=...&q=85)
  const webpSrcSet = useMemo(() => {
    return generateResponsiveWebpSrcSet(src);
  }, [src]);

  // Generate fallback srcSet in original format
  const fallbackSrcSet = useMemo(() => {
    return generateResponsiveFallbackSrcSet(src);
  }, [src]);

  // Primary WebP URL with query parameters
  const primaryWebpUrl = useMemo(() => {
    return buildOptimizedImageUrl(src, {
      width: priority ? 1440 : 1080,
      quality: 85,
      format: 'webp',
    });
  }, [src, priority]);

  // Clean original fallback URL without webp transformation parameters
  const cleanFallbackUrl = useMemo(() => {
    return getCleanFallbackUrl(src);
  }, [src]);

  // Fallback handler: when optimized WebP fails to load, gracefully fall back to original format, then to studio backup photo
  const handleImageError = () => {
    if (!useFallback) {
      console.warn(`[ImageOptimizer] WebP image failed to load for "${alt}", falling back to original format.`);
      setUseFallback(true);
    } else if (!backupPhotoSrc) {
      const safeStudioPhoto = getStudioFallbackPhoto(alt || src);
      console.warn(`[ImageOptimizer] Activating verified studio backup photograph for "${alt}".`);
      setBackupPhotoSrc(safeStudioPhoto);
    } else {
      console.warn(`[ImageOptimizer] Image asset completed resolution for "${alt}".`);
      setHasFatalError(true);
    }
  };

  // If already in browser cache
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      onLoad();
    }
  }, [src, useFallback, backupPhotoSrc, onLoad]);

  const shouldRenderImage = priority || isVisible;

  return (
    <div
      ref={ref}
      className="w-full h-full relative overflow-hidden aspect-[4/5] bg-[#181512]"
    >
      {/* Luxury Golden Dust Shimmer Skeleton Loader (#D4AF37 at 15% opacity on dark warm frame) */}
      {!isLoaded && !hasFatalError && (
        <div
          className="golden-dust-shimmer image-skeleton-loader absolute inset-0 pointer-events-none transition-opacity duration-300 z-10"
          style={{
            background: 'linear-gradient(90deg, #181512 0%, rgba(212, 175, 55, 0.15) 50%, #181512 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.8s infinite linear',
          }}
        />
      )}

      {/* Graceful placeholder if file is missing completely */}
      {hasFatalError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-stone-900/90 text-stone-400 text-xs text-center font-sans">
          <ImageIcon size={28} className="text-[#D4AF37] mb-2 opacity-70" />
          <span className="font-semibold text-stone-300 uppercase tracking-wider mb-0.5">{alt || 'Photograph'}</span>
          <span className="text-[10px] text-stone-500">Image temporarily unavailable</span>
        </div>
      ) : (
        shouldRenderImage && (
          <picture className="w-full h-full block">
            {/* 1. Responsive WebP Source with URL query parameters */}
            {!useFallback && !backupPhotoSrc && webpSrcSet && (
              <source
                type="image/webp"
                srcSet={webpSrcSet}
                sizes={responsiveSizes}
              />
            )}

            {/* 2. Responsive Fallback Source in original format */}
            {!backupPhotoSrc && fallbackSrcSet && (
              <source
                srcSet={fallbackSrcSet}
                sizes={responsiveSizes}
              />
            )}

            {/* 3. Base Image tag with onError fallback detection */}
            <img
              ref={imgRef}
              src={backupPhotoSrc || (useFallback ? cleanFallbackUrl : primaryWebpUrl)}
              alt={alt}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={priority ? 'high' : 'auto'}
              onLoad={onLoad}
              onError={handleImageError}
              className={`${className} transition-opacity duration-[600ms] ease-out ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </picture>
        )
      )}
    </div>
  );
};

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  dataCursor?: string;
  isCenterStar?: boolean;
}

const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className = '',
  style = {},
  onClick,
  dataCursor = 'explore',
  isCenterStar = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const springConfig = { damping: 20, stiffness: 260, mass: 0.5 };
  const mouseX = useSpring(0, springConfig);
  const mouseY = useSpring(0, springConfig);

  const rotateX = useTransform(mouseY, [-180, 180], [10, -10]);
  const rotateY = useTransform(mouseX, [-180, 180], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      data-cursor={dataCursor}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        ...style,
      }}
      whileHover={{ scale: isCenterStar ? 1.05 : 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className={`relative group ${className}`}
    >
      {children}
    </motion.div>
  );
};

export const PortfolioSlider: React.FC<PortfolioSliderProps> = ({
  onSelectPhoto,
  isDark,
}) => {
  const sectionRef = React.useRef<HTMLElement>(null);

  // Scroll progress for vertical background color interpolation & ambient radial glow intensity
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  // Link ambient radial glow intensity smoothly to vertical scroll progress
  const glowIntensity = useTransform(
    scrollYProgress,
    [0, 0.25, 0.5, 0.75, 1],
    [0.2, 0.45, 0.7, 0.45, 0.2]
  );

  const glowScale = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [0.92, 1.1, 0.94]
  );

  // Hue shift gently rotating as user scrolls between the hero portrait and the mood showcase sections
  const glowHueShift = useTransform(
    scrollYProgress,
    [0, 0.25, 0.5, 0.75, 1],
    ['0deg', '25deg', '60deg', '100deg', '135deg']
  );

  const [isSectionVisible, setIsSectionVisible] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [smallScreenPhotoIndex, setSmallScreenPhotoIndex] = useState(1); // 0: Left, 1: Star (Center), 2: Right
  const [isAutoDrift, setIsAutoDrift] = useState(true);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [isWorkProcessOpen, setIsWorkProcessOpen] = useState(false);

  // Observe section visibility to pause background timers when scrolled away
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsSectionVisible(entry.isIntersecting);
        });
      },
      {
        rootMargin: '200px 0px 200px 0px',
        threshold: 0.01,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const currentSuite = PALETTE_SUITES[activeIndex];

  // Dynamic canvas-sampled dominant ambient color from current star photo
  const [sampledColor, setSampledColor] = useState<SampledColor>(() =>
    getFallbackColor(currentSuite.accentColor)
  );

  useEffect(() => {
    let isCurrent = true;
    sampleDominantColor(currentSuite.starPhoto.url, currentSuite.accentColor).then((color) => {
      if (isCurrent) {
        setSampledColor(color);
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [currentSuite.starPhoto.url, currentSuite.accentColor]);

  // Highlighted word formatted with '-' in the middle (e.g. golden-grace)
  const highlightedWord = currentSuite.title.toLowerCase().replace(/\s+/g, '-');

  // High-priority preloading of all portfolio suites in background for instant browsing
  useEffect(() => {
    PALETTE_SUITES.forEach((suite) => {
      [suite.starPhoto.url, suite.leftPhoto.url, suite.rightPhoto.url].forEach((url) => {
        const img = new Image();
        img.decoding = 'async';
        img.src = url;
      });
    });
  }, []);

  // Auto cycle to next suite every 7 seconds if enabled and section is visible
  useEffect(() => {
    if (!isAutoDrift || !isSectionVisible) return;
    const timer = setInterval(() => {
      // Subtle haptic pulse at the start of each auto transition
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(12);
        } catch {}
      }
      soundEngine.triggerHaptic(12);
      setActiveIndex(prev => {
        const next = (prev + 1) % PALETTE_SUITES.length;
        setSmallScreenPhotoIndex(1);
        return next;
      });
    }, 7000);
    return () => clearInterval(timer);
  }, [isAutoDrift, isSectionVisible]);

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const mobilePillRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const touchStartX = useRef<number | null>(null);

  // Automatically center active portfolio tab button horizontally when activeIndex changes
  useEffect(() => {
    const activeBtn = tabRefs.current[activeIndex];
    if (activeBtn) {
      activeBtn.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }

    const activeMobilePill = mobilePillRefs.current[activeIndex];
    if (activeMobilePill) {
      activeMobilePill.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [activeIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX.current - touchEndX;
    if (diffX > 45) {
      handleNext();
    } else if (diffX < -45) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  const [slideDirection, setSlideDirection] = useState<number>(1);

  const handleNext = () => {
    setSlideDirection(1);
    soundEngine.playSwitch();
    soundEngine.triggerHaptic(12);
    setActiveIndex(prev => (prev + 1) % PALETTE_SUITES.length);
    setSmallScreenPhotoIndex(1);
  };

  const handlePrev = () => {
    setSlideDirection(-1);
    soundEngine.playSwitch();
    soundEngine.triggerHaptic(12);
    setActiveIndex(prev => (prev - 1 + PALETTE_SUITES.length) % PALETTE_SUITES.length);
    setSmallScreenPhotoIndex(1);
  };

  // Framer-motion powered swipe gesture hook for smooth horizontal photo transitions
  const { dragProps } = useSwipeGesture({
    onSwipeLeft: handleNext,
    onSwipeRight: handlePrev,
    threshold: 35,
    velocityThreshold: 200,
  });

  const handleSelectSuite = (index: number) => {
    soundEngine.playClick();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(12);
      } catch {}
    }
    soundEngine.triggerHaptic(15);
    setActiveIndex(index);
    setSmallScreenPhotoIndex(1);
  };

  const handleCopyHex = (e: React.MouseEvent, hex: string) => {
    e.stopPropagation();
    soundEngine.playClick();
    soundEngine.triggerHaptic(20);
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1800);
  };

  const toggleWorkProcess = () => {
    soundEngine.playClick();
    soundEngine.triggerHaptic(15);
    setIsWorkProcessOpen(prev => !prev);
  };

  return (
    <section
      ref={sectionRef}
      id="gallery"
      data-section="gallery"
      aria-label="Themed Color Palette & Photo Trio Carousel"
      className={`min-h-[100dvh] border-t select-none relative overflow-hidden transition-colors flex flex-col items-center justify-center py-10 sm:py-16 ${
        isDark ? 'border-white/[0.08] bg-[#09090c]' : 'border-stone-200/90 bg-[#F0EAE0]'
      }`}
    >
      {/* Anchor aliases for backwards compatibility */}
      <span id="work" className="sr-only -top-20 relative pointer-events-none" />
      <span id="stories" className="sr-only -top-20 relative pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 w-full space-y-4 sm:space-y-6 relative z-10 flex flex-col items-center text-center my-auto">
        {/* ========================================================================= */}
        {/* CENTERED HEADER & PALETTE SUITE NAVIGATION (Desktop >= md)                 */}
        {/* ========================================================================= */}
        <div className="hidden md:flex w-full max-w-4xl mx-auto flex-col items-center text-center space-y-2 sm:space-y-2.5 md:space-y-3">
          {/* Infused Category Pill */}
          <div className="flex items-center justify-center gap-2">
            <span 
              className="w-2 h-2 rounded-full animate-pulse shadow-sm"
              style={{ backgroundColor: currentSuite.accentColor }}
            />
            <span className={`text-[10px] sm:text-[11px] font-sans tracking-[0.25em] uppercase font-bold px-3 py-0.5 rounded-full border transition-colors ${
              isDark ? currentSuite.badgeBgDark : currentSuite.badgeBgLight
            }`}>
              {currentSuite.category}
            </span>
            <span className={`text-[10px] font-sans tracking-wider ${isDark ? 'text-white/40' : 'text-stone-500'}`}>
              SUITE {activeIndex + 1} OF {PALETTE_SUITES.length}
            </span>
          </div>

          {/* Infused Display Headline */}
          <h2 className="font-display font-bold text-3xl sm:text-5xl lg:text-6xl leading-[0.95] tracking-tight uppercase transition-all duration-500">
            <span className={isDark ? 'text-white' : 'text-[#181614]'}>
              {currentSuite.title}
            </span>
          </h2>

          {/* Subtitle */}
          <p className={`text-xs sm:text-sm font-sans tracking-wide font-semibold transition-colors duration-500 ${
            isDark ? currentSuite.textClassDark : currentSuite.textClassLight
          }`}>
            {currentSuite.subtitle}
          </p>

          <p className={`text-xs sm:text-sm max-w-xl mx-auto font-light leading-relaxed hidden sm:block ${
            isDark ? 'text-white/75' : 'text-stone-600'
          }`}>
            {currentSuite.description}
          </p>

          {/* DESKTOP TABBED GALLERY BAR: High-contrast active pill states */}
          <div className="pt-1 sm:pt-2 w-full max-w-full flex items-center justify-center gap-2 sm:gap-3">
            <div className={`portfolio-pills p-1.5 rounded-full border flex items-center gap-1.5 backdrop-blur-md transition-colors ${
              isDark ? 'border-white/15 bg-white/5' : 'border-stone-300 bg-white shadow-sm'
            }`}>
                {PALETTE_SUITES.map((suite, idx) => {
                  const isActive = activeIndex === idx;
                  return (
                    <button
                      key={suite.id}
                      ref={(el) => { tabRefs.current[idx] = el; }}
                      onClick={() => handleSelectSuite(idx)}
                      className={`portfolio-pill-tab min-h-[44px] px-4 py-2 text-xs font-sans uppercase tracking-wider rounded-full transition-all duration-300 font-bold shrink-0 cursor-pointer flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        isActive
                          ? isDark
                            ? 'text-black shadow-md border-2 border-white ring-2 ring-white/40'
                            : 'text-white shadow-md border-2 border-stone-900 ring-2 ring-stone-900/20'
                          : isDark
                            ? 'text-white/70 hover:text-white border border-transparent'
                            : 'text-stone-700 hover:text-stone-950 border border-transparent'
                      }`}
                      style={{
                        backgroundColor: isActive ? suite.accentColor : 'transparent',
                      }}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: isActive ? (isDark ? '#000000' : '#ffffff') : suite.accentColor }}
                      />
                      <span>{suite.title}</span>
                    </button>
                  );
                })}
              </div>

              {/* Play/Pause & Direction Controls */}
              <div className={`flex items-center gap-1 p-1 rounded-full border backdrop-blur-md shrink-0 ${
                isDark ? 'border-white/15 bg-white/5' : 'border-stone-300 bg-white shadow-sm'
              }`}>
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    setIsAutoDrift(!isAutoDrift);
                  }}
                  title={isAutoDrift ? 'Pause carousel auto-cycle' : 'Resume carousel auto-cycle'}
                  className={`p-1.5 rounded-full text-xs transition-colors flex items-center gap-1 px-2 font-sans ${
                    isAutoDrift
                      ? isDark ? 'text-white/90 bg-white/10' : 'text-stone-900 bg-stone-100'
                      : isDark ? 'text-white/40' : 'text-stone-400'
                  }`}
                >
                  {isAutoDrift ? <Pause size={12} /> : <Play size={12} />}
                  <span className="text-[10px] uppercase font-bold tracking-wider hidden sm:inline">
                    {isAutoDrift ? 'AUTO' : 'PAUSED'}
                  </span>
                </button>

                <button
                  onClick={handlePrev}
                  aria-label="Previous suite"
                  className={`p-1.5 rounded-full transition-colors ${
                    isDark ? 'hover:bg-white/10 text-white/70 hover:text-white' : 'hover:bg-stone-100 text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <ArrowLeft size={15} />
                </button>
                <button
                  onClick={handleNext}
                  aria-label="Next suite"
                  className={`p-1.5 rounded-full transition-colors ${
                    isDark ? 'hover:bg-white/10 text-white/70 hover:text-white' : 'hover:bg-stone-100 text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>

        {/* ========================================================================= */}
        {/* CAROUSEL WITH CENTER GLOW SPREADING OUTWARD AND SMOOTH CINEMATIC MOTION  */}
        {/* ========================================================================= */}
        <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 relative py-1 sm:py-2 md:py-3 flex flex-col items-center">
          {/* HIGH INTENSITY AMBIENT GLOW: Desktop only with Scroll Progress Interpolation */}
          <motion.div 
            className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[700px] sm:max-w-[850px] md:max-w-[950px] lg:max-w-[1100px] h-[340px] sm:h-[400px] md:h-[440px] lg:h-[520px] rounded-full pointer-events-none blur-[60px] sm:blur-[80px] md:blur-[100px] lg:blur-[130px] transition-all duration-700 ease-out z-0"
            style={{
              backgroundImage: `radial-gradient(ellipse at 50% 50%, ${currentSuite.accentColor} 0%, ${currentSuite.accentColor}bb 30%, ${currentSuite.accentColor}35 55%, transparent 75%)`,
              opacity: useTransform(glowIntensity, (v) => (isDark ? v * 1.35 : v * 0.9)),
              scale: glowScale,
              filter: useTransform(glowHueShift, (deg) => `hue-rotate(${deg})`),
            }}
          />


          <AnimatePresence mode="wait">
            <motion.div
              key={currentSuite.id}
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -16 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="w-full relative z-10"
            >
              {/* TABLET & DESKTOP VIEW: 3 Photos Side by Side with 3D Tilt Physics */}
              <div className="hidden md:grid md:grid-cols-12 gap-3.5 md:gap-4 lg:gap-6 items-center max-w-4xl lg:max-w-5xl mx-auto w-full px-2 sm:px-4">
                {/* 1. LEFT PHOTO (Companion Angle) with 3D Tilt */}
                <div className="md:col-span-4">
                  <TiltCard
                    onClick={() => {
                      soundEngine.playClick();
                      setSmallScreenPhotoIndex(0);
                      onSelectPhoto(currentSuite.leftPhoto.url, currentSuite.leftPhoto.caption);
                    }}
                    dataCursor="explore"
                    className={`rounded-2xl overflow-hidden cursor-pointer border transition-all duration-300 ${
                      isDark 
                        ? 'border-white/10 bg-stone-900/80 shadow-xl hover:border-[#D4AF37]/50' 
                        : 'border-[#D4AF37]/30 bg-white shadow-md hover:border-[#D4AF37]/70'
                    }`}
                  >
                    <div className="aspect-[4/5] overflow-hidden relative">
                      <VirtualizedImage
                        src={currentSuite.leftPhoto.url}
                        alt={currentSuite.leftPhoto.caption}
                        placeholderColor={currentSuite.accentColor}
                        isDark={isDark}
                        layout="side"
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent opacity-60 group-hover:opacity-85 transition-opacity pointer-events-none" />

                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-display font-medium text-white/95 pointer-events-none">
                        <span className="truncate">
                          {currentSuite.leftPhoto.caption}
                        </span>
                        <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shrink-0 ml-2">
                          <Maximize2 size={11} />
                        </div>
                      </div>
                    </div>
                  </TiltCard>
                </div>

                {/* 2. CENTER PHOTO: THE STAR PHOTO with 3D Tilt and Radiant Gold Glow */}
                <div className="md:col-span-4 z-20 md:scale-105 lg:scale-108 md:-translate-y-2">
                  <TiltCard
                    isCenterStar={true}
                    onClick={() => {
                      soundEngine.playClick();
                      setSmallScreenPhotoIndex(1);
                      onSelectPhoto(currentSuite.starPhoto.url, currentSuite.starPhoto.caption);
                    }}
                    dataCursor="explore"
                    className={`rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-300 ${
                      isDark
                        ? `${currentSuite.borderClassDark} bg-stone-950`
                        : `${currentSuite.borderClassLight} bg-white`
                    }`}
                    style={{
                      boxShadow: isDark
                        ? `0 0 65px -8px ${currentSuite.accentColor}cc, 0 25px 60px -10px rgba(0,0,0,0.9)`
                        : `0 0 55px -10px ${currentSuite.accentColor}aa, 0 20px 45px -10px rgba(0,0,0,0.18)`,
                    }}
                  >
                    {/* STAR PHOTO Top Badge Infused with Palette */}
                    <div className="absolute top-3.5 left-3.5 right-3.5 z-30 flex items-center justify-between pointer-events-none">
                      <div 
                        className="px-3 py-1 rounded-full text-[10px] font-sans font-bold tracking-widest uppercase flex items-center gap-1.5 shadow-lg backdrop-blur-md"
                        style={{
                          backgroundColor: currentSuite.accentColor,
                          color: '#000000',
                        }}
                      >
                        <Star size={12} className="fill-black stroke-black" />
                        <span>FEATURED</span>
                      </div>

                      <div className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-md border border-white/30 text-white flex items-center justify-center shadow-lg">
                        <Maximize2 size={12} />
                      </div>
                    </div>

                    <div className="aspect-[4/5] overflow-hidden relative">
                      <VirtualizedImage
                        src={currentSuite.starPhoto.url}
                        alt={currentSuite.starPhoto.caption}
                        placeholderColor={currentSuite.accentColor}
                        isDark={isDark}
                        priority={true}
                        layout="star"
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent opacity-70 group-hover:opacity-90 transition-opacity pointer-events-none" />

                      {/* Center Star Info Bar */}
                      <div className="absolute bottom-3.5 left-3.5 right-3.5 space-y-1 text-left pointer-events-none">
                        <div className="text-xs font-display font-bold uppercase tracking-wider text-white">
                          {currentSuite.starPhoto.caption}
                        </div>
                      </div>
                    </div>
                  </TiltCard>
                </div>

                {/* 3. RIGHT PHOTO (Companion Detail) with 3D Tilt */}
                <div className="md:col-span-4">
                  <TiltCard
                    onClick={() => {
                      soundEngine.playClick();
                      setSmallScreenPhotoIndex(2);
                      onSelectPhoto(currentSuite.rightPhoto.url, currentSuite.rightPhoto.caption);
                    }}
                    dataCursor="explore"
                    className={`rounded-2xl overflow-hidden cursor-pointer border transition-all duration-300 ${
                      isDark 
                        ? 'border-white/10 bg-stone-900/80 shadow-xl hover:border-[#D4AF37]/50' 
                        : 'border-[#D4AF37]/30 bg-white shadow-md hover:border-[#D4AF37]/70'
                    }`}
                  >
                    <div className="aspect-[4/5] overflow-hidden relative">
                      <VirtualizedImage
                        src={currentSuite.rightPhoto.url}
                        alt={currentSuite.rightPhoto.caption}
                        placeholderColor={currentSuite.accentColor}
                        isDark={isDark}
                        layout="side"
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent opacity-60 group-hover:opacity-85 transition-opacity pointer-events-none" />

                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-display font-medium text-white/95 pointer-events-none">
                        <span className="truncate">
                          {currentSuite.rightPhoto.caption}
                        </span>
                        <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shrink-0 ml-2">
                          <Maximize2 size={11} />
                        </div>
                      </div>
                    </div>
                  </TiltCard>
                </div>
              </div>

              {/* MOBILE VIEW: Clean Editorial Portrait Viewer (Dynamic Canvas-Sampled Ambient Glow) */}
              <div className="md:hidden flex flex-col w-full max-w-lg mx-auto px-2 sm:px-3 select-none">
                {/* 1) Main Portrait Photo Card with Canvas-Sampled blur-3xl Ambient Glow */}
                <div className="relative w-full flex items-center justify-center">
                  {/* Dynamic rAF-interpolated 1x1 center-pixel blur-3xl aura glow */}
                  <AmbientRadialGlow
                    imageUrl={currentSuite.starPhoto.url}
                    fallbackHex={currentSuite.accentColor}
                    className="absolute -inset-6 -z-10"
                    blurClass="blur-3xl"
                    intensity={0.65}
                    isDark={isDark}
                  />

                  <motion.div
                    {...dragProps}
                    onClick={() => {
                      soundEngine.playClick();
                      onSelectPhoto(currentSuite.starPhoto.url, currentSuite.starPhoto.caption);
                    }}
                    className={`relative w-full aspect-[3/4] max-h-[46vh] rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing border shadow-md transition-all duration-300 touch-pan-y ${
                      isDark ? 'border-white/10 bg-[#181512]' : 'border-stone-200/90 bg-[#EFE9DF]'
                    }`}
                  >
                    <AnimatePresence initial={false} custom={slideDirection} mode="popLayout">
                      <motion.div
                        key={currentSuite.id}
                        custom={slideDirection}
                        variants={{
                          enter: (dir: number) => ({
                            x: dir > 0 ? '100%' : '-100%',
                            opacity: 0,
                            scale: 0.96,
                          }),
                          center: {
                            x: '0%',
                            opacity: 1,
                            scale: 1,
                            transition: {
                              duration: 0.52,
                              ease: [0.16, 1, 0.3, 1],
                            },
                          },
                          exit: (dir: number) => ({
                            x: dir > 0 ? '-100%' : '100%',
                            opacity: 0,
                            scale: 0.96,
                            transition: {
                              duration: 0.42,
                              ease: [0.16, 1, 0.3, 1],
                            },
                          }),
                        }}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="w-full h-full"
                      >
                        <VirtualizedImage
                          src={currentSuite.starPhoto.url}
                          alt={currentSuite.starPhoto.caption}
                          placeholderColor={currentSuite.accentColor}
                          isDark={isDark}
                          layout="mobile"
                          className="w-full h-full object-cover transition-transform duration-700 ease-out pointer-events-none"
                        />
                      </motion.div>
                    </AnimatePresence>

                    {/* Subtle horizontal swipe indicator hint for mobile touch */}
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-mono tracking-wider text-white/80 pointer-events-none flex items-center gap-1 border border-white/10">
                      <span>‹ swipe ›</span>
                    </div>
                  </motion.div>
                </div>

                {/* 2) Active Theme Title (with '-' in middle: ex; golden-grace) */}
                <div className="flex items-center justify-center py-2.5 mt-1 px-3 select-none w-full">
                  <span
                    className={`inline-flex items-center justify-center gap-2.5 px-5 py-2 rounded-full text-xs sm:text-sm font-mono lowercase tracking-[0.16em] leading-normal transition-all duration-500 shadow-md max-w-full text-center ${
                      isDark
                        ? 'bg-stone-900/95 text-white border border-white/20'
                        : 'bg-stone-900 text-white border border-stone-800'
                    }`}
                    style={{
                      boxShadow: `0 0 18px ${sampledColor.rgba(0.45)}, 0 0 0 1.5px ${sampledColor.hex}`,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0 animate-pulse"
                      style={{ backgroundColor: sampledColor.hex }}
                    />
                    <span className="whitespace-normal leading-normal">{highlightedWord}</span>
                  </span>
                </div>

                {/* 3) Horizontal Theme Filter Pills (Centered flex-wrap, compact, haptic feedback on touch, un-cramped font) */}
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 py-1.5 w-full px-2">
                  {PALETTE_SUITES.map((suite, idx) => {
                    const isActive = activeIndex === idx;
                    const displayName =
                      suite.id === 'emerald-harmony' ? 'Harmony' :
                      suite.id === 'golden-grace' ? 'Golden Grace' :
                      suite.id === 'still-vision' ? 'Still Vision' :
                      suite.id === 'misty-pine' ? 'Misty Pine' :
                      suite.title;

                    return (
                      <button
                        key={suite.id}
                        type="button"
                        onClick={() => {
                          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                            try {
                              navigator.vibrate(12);
                            } catch {}
                          }
                          handleSelectSuite(idx);
                        }}
                        className={`text-xs font-sans font-medium tracking-wide leading-normal px-4 py-1.5 rounded-full border transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap ${
                          isActive
                            ? isDark
                              ? 'bg-white text-stone-950 font-semibold border-white shadow-sm'
                              : 'bg-stone-900 text-white font-semibold border-stone-900 shadow-sm'
                            : isDark
                              ? 'bg-stone-900/60 border-white/10 text-stone-300 hover:text-white hover:border-white/25'
                              : 'bg-stone-100/90 border-stone-200 text-stone-600 hover:text-stone-950 hover:border-stone-300'
                        }`}
                        style={
                          isActive
                            ? {
                                boxShadow: `0 0 0 1.5px ${suite.accentColor}`,
                              }
                            : undefined
                        }
                      >
                        {displayName}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* ========================================================================= */}
          {/* THREE DOTS BUTTON INDICATOR (DESKTOP / TABLET ONLY)                       */}
          {/* ========================================================================= */}
          <div className="hidden md:flex flex-col items-center justify-center mt-3 sm:mt-4 mb-1 relative z-20 w-full">
            <div className={`inline-flex items-center justify-center gap-2 sm:gap-2.5 px-3.5 sm:px-4 py-1.5 rounded-full border backdrop-blur-md shadow-md transition-all ${
              isDark ? 'border-white/20 bg-stone-900/95' : 'border-stone-300 bg-white/95'
            }`}>
              {/* Dot 1: Left Companion Photo */}
              <button
                onClick={() => {
                  soundEngine.playClick();
                  soundEngine.triggerHaptic(12);
                  setSmallScreenPhotoIndex(0);
                }}
                title="View Left Photo"
                aria-label="View Left Companion Angle"
                className={`flex items-center gap-1.5 transition-all px-2 py-1 rounded-full ${
                  smallScreenPhotoIndex === 0 ? 'scale-105 font-bold' : 'opacity-60 hover:opacity-100'
                }`}
              >
                <span 
                  className={`rounded-full transition-all duration-300 ${
                    smallScreenPhotoIndex === 0 ? 'w-5 h-2.5' : 'w-2.5 h-2.5'
                  }`}
                  style={{
                    backgroundColor: smallScreenPhotoIndex === 0 ? currentSuite.accentColor : isDark ? '#ffffff66' : '#00000044',
                  }}
                />
                <span className={`text-[10px] font-sans uppercase tracking-wider ${
                  smallScreenPhotoIndex === 0 ? (isDark ? 'text-white' : 'text-stone-900') : (isDark ? 'text-white/60' : 'text-stone-500')
                }`}>
                  LEFT
                </span>
              </button>

              {/* Dot 2: Center Star Photo */}
              <button
                onClick={() => {
                  soundEngine.playClick();
                  soundEngine.triggerHaptic(12);
                  setSmallScreenPhotoIndex(1);
                }}
                title="View Center Star Photo"
                aria-label="View Center Star Photo"
                className={`flex items-center gap-1.5 transition-all px-2 py-1 rounded-full ${
                  smallScreenPhotoIndex === 1 ? 'scale-105 font-bold' : 'opacity-60 hover:opacity-100'
                }`}
              >
                <span 
                  className={`rounded-full transition-all duration-300 shadow-sm ${
                    smallScreenPhotoIndex === 1 ? 'w-6 h-2.5' : 'w-2.5 h-2.5'
                  }`}
                  style={{
                    backgroundColor: smallScreenPhotoIndex === 1 ? currentSuite.accentColor : isDark ? '#ffffff66' : '#00000044',
                  }}
                />
                <span className={`text-[10px] font-sans uppercase tracking-wider flex items-center gap-1 ${
                  smallScreenPhotoIndex === 1 ? (isDark ? 'text-white' : 'text-stone-900') : (isDark ? 'text-white/60' : 'text-stone-500')
                }`}>
                  <Star size={10} className={smallScreenPhotoIndex === 1 ? 'fill-amber-500 stroke-amber-500' : ''} />
                  STAR
                </span>
              </button>

              {/* Dot 3: Right Companion Photo */}
              <button
                onClick={() => {
                  soundEngine.playClick();
                  soundEngine.triggerHaptic(12);
                  setSmallScreenPhotoIndex(2);
                }}
                title="View Right Photo"
                aria-label="View Right Companion Angle"
                className={`flex items-center gap-1.5 transition-all px-2 py-1 rounded-full ${
                  smallScreenPhotoIndex === 2 ? 'scale-105 font-bold' : 'opacity-60 hover:opacity-100'
                }`}
              >
                <span 
                  className={`rounded-full transition-all duration-300 ${
                    smallScreenPhotoIndex === 2 ? 'w-5 h-2.5' : 'w-2.5 h-2.5'
                  }`}
                  style={{
                    backgroundColor: smallScreenPhotoIndex === 2 ? currentSuite.accentColor : isDark ? '#ffffff66' : '#00000044',
                  }}
                />
                <span className={`text-[10px] font-sans uppercase tracking-wider ${
                  smallScreenPhotoIndex === 2 ? (isDark ? 'text-white' : 'text-stone-900') : (isDark ? 'text-white/60' : 'text-stone-500')
                }`}>
                  RIGHT
                </span>
              </button>
            </div>

            <div className={`text-[10px] font-sans mt-1 tracking-wider ${isDark ? 'text-white/40' : 'text-stone-500'}`}>
              PHOTO {smallScreenPhotoIndex + 1} OF 3 · {smallScreenPhotoIndex === 0 ? 'LEFT COMPANION' : smallScreenPhotoIndex === 1 ? 'CENTRAL STAR ANGLE' : 'RIGHT COMPANION'}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* WORK PROCESS: HIDDEN COLLAPSIBLE MENU FOR HEX TONES & COLOR SCIENCE        */}
        {/* ========================================================================= */}
        <div className="hidden md:block w-full max-w-4xl mx-auto pt-2">
          {/* Work Process Toggle Trigger */}
          <button
            id="toggle-work-process-btn"
            onClick={toggleWorkProcess}
            className={`w-full p-3.5 sm:p-4 rounded-xl border flex items-center justify-between transition-all duration-300 ${
              isDark 
                ? 'border-white/15 bg-white/[0.04] hover:bg-white/[0.07] text-white' 
                : 'border-stone-300 bg-white hover:bg-stone-50 text-stone-900 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2.5 text-left">
              <div 
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${currentSuite.accentColor}25` }}
              >
                <Sliders size={14} style={{ color: currentSuite.accentColor }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-sans text-xs font-bold tracking-wider uppercase">
                    WORK PROCESS
                  </span>
                  <span className={`text-[10px] font-sans px-2 py-0.5 rounded-full border ${
                    isDark ? 'border-white/20 bg-white/5 text-white/70' : 'border-stone-300 bg-stone-100 text-stone-700'
                  }`}>
                    {currentSuite.title} COLOR SCIENCE
                  </span>
                </div>
                <div className={`text-[11px] font-normal ${isDark ? 'text-white/50' : 'text-stone-500'}`}>
                  {isWorkProcessOpen ? 'Click to hide process notes and hex color breakdown' : 'Click to reveal development notes & color science hex tones'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-sans uppercase tracking-wider font-semibold opacity-70 hidden sm:inline">
                {isWorkProcessOpen ? 'COLLAPSE' : 'EXPAND'}
              </span>
              <div className={`p-1 rounded-full border transition-transform duration-300 ${
                isWorkProcessOpen ? 'rotate-180' : ''
              } ${isDark ? 'border-white/20 bg-white/10' : 'border-stone-300 bg-stone-100'}`}>
                <ChevronDown size={14} />
              </div>
            </div>
          </button>

          {/* Collapsible Drawer Content */}
          <AnimatePresence>
            {isWorkProcessOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className={`work-process-drawer color-science-container p-5 mt-3 rounded-2xl border transition-all ${
                  isDark 
                    ? 'border-white/10 bg-white/[0.03] backdrop-blur-md' 
                    : 'border-stone-300/90 bg-white/95 backdrop-blur-md shadow-sm'
                }`}>
                  {/* Process Notes */}
                  <div className="pb-4 border-b border-current/10 text-left space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-sans font-bold uppercase tracking-wider">
                      <Sparkles size={13} style={{ color: currentSuite.accentColor }} />
                      <span className={isDark ? currentSuite.textClassDark : currentSuite.textClassLight}>
                        CURATION &amp; COLOR PIPELINE
                      </span>
                    </div>
                    <p className={`text-xs font-light leading-relaxed ${isDark ? 'text-white/80' : 'text-stone-700'}`}>
                      {currentSuite.processNotes}
                    </p>
                  </div>

                  {/* Swatches Grid */}
                  <div className="pt-4 text-left space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-sans tracking-wider">
                      <span className={`font-semibold uppercase ${isDark ? 'text-white/60' : 'text-stone-600'}`}>
                        Tonal Swatches (Click to copy hex)
                      </span>
                      <span className={isDark ? 'text-white/40' : 'text-stone-400'}>
                        4 COLOR TONES
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {currentSuite.palette.map((swatch) => {
                        const isCopied = copiedHex === swatch.hex;
                        return (
                          <button
                            key={swatch.hex}
                            onClick={(e) => handleCopyHex(e, swatch.hex)}
                            className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 text-left group ${
                              isDark 
                                ? 'border-white/10 bg-white/[0.04] hover:bg-white/[0.09] hover:border-white/30' 
                                : 'border-stone-200 bg-stone-50 hover:bg-white hover:border-stone-400 shadow-sm'
                            }`}
                          >
                            <div
                              className="w-9 h-9 rounded-lg shrink-0 shadow-inner border border-black/20"
                              style={{ backgroundColor: swatch.hex }}
                            />
                            <div className="min-w-0">
                              <div className="font-sans text-xs font-bold tracking-wider truncate flex items-center gap-1.5">
                                <span className={isDark ? 'text-white' : 'text-stone-900'}>
                                  {swatch.hex}
                                </span>
                                {isCopied ? (
                                  <Check size={11} className="text-emerald-500" />
                                ) : (
                                  <Copy size={11} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                                )}
                              </div>
                              <div className={`text-[10px] truncate font-sans ${isDark ? 'text-white/50' : 'text-stone-500'}`}>
                                {isCopied ? 'COPIED!' : swatch.name}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
