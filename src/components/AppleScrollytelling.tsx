import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  ArrowRight, 
  Sparkles, 
  ChevronDown, 
  Check, 
  MessageCircle, 
  Instagram, 
  Camera,
  Maximize2,
  Clock,
  MapPin,
  ShieldCheck
} from 'lucide-react';
import { soundEngine } from '../utils/audio';
import { getWhatsAppUrl, INSTAGRAM_URL } from '../utils/social';
import { PricingPackage } from '../types';
import { PRICING_PACKAGES } from '../data/mockData';
import { sampleDominantColor, getFallbackColor, SampledColor } from '../utils/colorExtractor';

export interface AppleScrollytellingProps {
  isDark: boolean;
  onOpenBooking: (pkg?: PricingPackage) => void;
  onOpenEnquiry: () => void;
  onViewGallery: () => void;
  onSelectPhotoByUrl: (url: string, title: string) => void;
  onSectionChange?: (sectionId: string) => void;
}

interface ThemeSuiteItem {
  id: string;
  title: string;
  category: string;
  subtitle: string;
  photoUrl: string;
  accentColor: string;
  glowGradient: string;
}

const THEME_SUITES: ThemeSuiteItem[] = [
  {
    id: 'golden-grace',
    title: 'GOLDEN GRACE',
    category: 'TRADITIONAL & HERITAGE',
    subtitle: 'Warm ambient illumination & rich turmeric golds',
    photoUrl: '/images/golden-grace-2.jpg',
    accentColor: '#E5A93C',
    glowGradient: 'bg-gradient-to-tr from-amber-400/40 via-yellow-600/20 to-transparent',
  },
  {
    id: 'emerald-harmony',
    title: 'EMERALD HARMONY',
    category: 'HERITAGE IN NATURE',
    subtitle: 'Cultural portraiture & silks in open terrain',
    photoUrl: '/images/emerald-harmony-2.jpg',
    accentColor: '#10B981',
    glowGradient: 'bg-gradient-to-tr from-emerald-500/40 via-teal-700/20 to-transparent',
  },
  {
    id: 'still-vision',
    title: 'STILL VISION',
    category: 'PORTRAIT & CHIAROSCURO',
    subtitle: 'Quiet chiaroscuro character studies & honest contours',
    photoUrl: '/images/still-vision-2.jpg',
    accentColor: '#E2E8F0',
    glowGradient: 'bg-gradient-to-tr from-stone-300/40 via-amber-100/20 to-transparent',
  },
  {
    id: 'misty-pine',
    title: 'MISTY PINE',
    category: 'THEMED EDITORIAL & MOOD',
    subtitle: 'Indigo textures & early boreal morning mist',
    photoUrl: '/images/misty-pine-2.jpg',
    accentColor: '#38BDF8',
    glowGradient: 'bg-gradient-to-tr from-slate-400/40 via-indigo-900/20 to-transparent',
  },
];

export const AppleScrollytelling: React.FC<AppleScrollytellingProps> = ({
  isDark,
  onOpenBooking,
  onOpenEnquiry,
  onViewGallery,
  onSelectPhotoByUrl,
  onSectionChange,
}) => {
  // Main snap-scroll container ref
  const containerRef = useRef<HTMLDivElement>(null);

  // Section element refs for scroll-linked transform calculations
  const section1Ref = useRef<HTMLDivElement>(null);
  const section2Ref = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);
  const section4Ref = useRef<HTMLDivElement>(null);

  // Active snapped section tracking (0: Hero, 1: Theme, 2: Reserve, 3: Philosophy)
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);

  // Active theme selection within Section 2
  const [activeThemeIndex, setActiveThemeIndex] = useState(0);
  const currentTheme = THEME_SUITES[activeThemeIndex];

  // Active selected package in Section 3
  const [selectedPackage, setSelectedPackage] = useState<PricingPackage>(PRICING_PACKAGES[0]);

  // Mobile theme pill scroll refs
  const mobilePillRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // =========================================================================
  // SCROLL-LINKED TRANSFORMATIONS (APPLE-STYLE SCROLLYTELLING LOGIC)
  // =========================================================================

  // Section 1: Hero Portrait scroll progress
  // Tracks progression as Section 1 scrolls out of view into Section 2
  const { scrollYProgress: scrollProgress1 } = useScroll({
    container: containerRef,
    target: section1Ref,
    offset: ['start start', 'end start'],
  });

  // Section 1 Hero Portrait: Animate from zoomed-in state (scale-125 / 1.25)
  // to a crisp framed state (scale-100 / 1.0) as the user scrolls down
  const heroPhotoScale = useTransform(scrollProgress1, [0, 0.95], [1.25, 1.0]);

  // Section 1 Overlays: Smoothly fade out captions & badges as scroll initiates
  const heroCaptionOpacity = useTransform(scrollProgress1, [0, 0.45], [1, 0]);
  const heroCaptionY = useTransform(scrollProgress1, [0, 0.45], [0, -28]);

  // Section 2: Theme Showcase scroll progress
  // Tracks progression as Section 2 enters viewport from bottom to center
  const { scrollYProgress: scrollProgress2 } = useScroll({
    container: containerRef,
    target: section2Ref,
    offset: ['start end', 'center center'],
  });

  // Section 2 Camera Reveal: Scale up the portrait photo from scale-90 (0.90) & opacity-0
  // to crisp scale-100 (1.0) & opacity-100 (1.0) delivering an interactive camera reveal
  const themePhotoScale = useTransform(scrollProgress2, [0, 1], [0.90, 1.0]);
  const themePhotoOpacity = useTransform(scrollProgress2, [0, 0.85], [0, 1]);

  // Section 3: Reservation Stepper scroll progress
  const { scrollYProgress: scrollProgress3 } = useScroll({
    container: containerRef,
    target: section3Ref,
    offset: ['start end', 'center center'],
  });

  const stepperScale = useTransform(scrollProgress3, [0, 1], [0.92, 1.0]);
  const stepperOpacity = useTransform(scrollProgress3, [0, 0.85], [0, 1]);

  // =========================================================================
  // CONTAINER SCROLL & SECTION SNAPPING OBSERVER
  // =========================================================================
  const handleContainerScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const clientHeight = containerRef.current.clientHeight;
    if (clientHeight <= 0) return;
    const index = Math.round(scrollTop / clientHeight);
    const clampedIndex = Math.max(0, Math.min(3, index));
    if (clampedIndex !== activeSectionIndex) {
      setActiveSectionIndex(clampedIndex);
      const sectionIds = ['home', 'work', 'pricing', 'about'];
      if (onSectionChange && sectionIds[clampedIndex]) {
        onSectionChange(sectionIds[clampedIndex]);
      }
    }
  };

  const scrollToSection = (index: number) => {
    soundEngine.playSwitch();
    soundEngine.hapticTap();
    if (!containerRef.current) return;
    const clientHeight = containerRef.current.clientHeight;
    containerRef.current.scrollTo({
      top: index * clientHeight,
      behavior: 'smooth',
    });
  };

  // Expose global scroll-to helper for navbar navigation integration
  useEffect(() => {
    (window as any).scrollToScrollySection = scrollToSection;
    return () => {
      delete (window as any).scrollToScrollySection;
    };
  }, []);

  // Subtle haptic pulse trigger using the Vibration API with fallback
  const triggerHaptic = (ms = 12) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {
        // Safe catch for permissions or unsupported platforms
      }
    }
    soundEngine.triggerHaptic(ms);
  };

  const autoRotateTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoRotateTimer = () => {
    if (autoRotateTimerRef.current) {
      clearInterval(autoRotateTimerRef.current);
    }
    autoRotateTimerRef.current = setInterval(() => {
      // Provide subtle haptic pulse via Vibration API at the start of each auto transition
      triggerHaptic(12);
      setActiveThemeIndex((prev) => (prev + 1) % THEME_SUITES.length);
    }, 7000);
  };

  // Mobile touch swipe gesture handling
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    if (diffX > 40) {
      // Swiped left -> advance next with haptic pulse
      triggerHaptic(12);
      handleSelectTheme((activeThemeIndex + 1) % THEME_SUITES.length);
    } else if (diffX < -40) {
      // Swiped right -> advance prev with haptic pulse
      triggerHaptic(12);
      handleSelectTheme((activeThemeIndex - 1 + THEME_SUITES.length) % THEME_SUITES.length);
    }
    touchStartX.current = null;
  };

  // Auto-rotate photos on mobile every 7 seconds on a loop with subtle haptic pulse at transition start
  useEffect(() => {
    startAutoRotateTimer();
    return () => {
      if (autoRotateTimerRef.current) {
        clearInterval(autoRotateTimerRef.current);
      }
    };
  }, []);

  // Smooth auto-scroll for active theme pill
  useEffect(() => {
    const activePill = mobilePillRefs.current[activeThemeIndex];
    if (activePill) {
      activePill.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [activeThemeIndex]);

  const handleSelectTheme = (index: number) => {
    soundEngine.playClick();
    triggerHaptic(14);
    setActiveThemeIndex(index);
    startAutoRotateTimer(); // Reset the 7-second timer for a clean, full duration
  };

  // Dynamic canvas-sampled dominant ambient color from current photo
  const [sampledColor, setSampledColor] = useState<SampledColor>(() =>
    getFallbackColor(currentTheme.accentColor)
  );

  useEffect(() => {
    let isCurrent = true;
    sampleDominantColor(currentTheme.photoUrl, currentTheme.accentColor).then((color) => {
      if (isCurrent) {
        setSampledColor(color);
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [currentTheme.photoUrl, currentTheme.accentColor]);

  // Spacious, un-cramped editorial title display for desktop
  const formattedTitle = currentTheme.title.split(' ').map((word) => word.split('').join(' ')).join('   ');

  // Highlighted word formatted with '-' in the middle (e.g. golden-grace)
  const highlightedWord = currentTheme.title.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="relative w-full h-screen overflow-hidden select-none">
      {/* ======================================================================= */}
      {/* 3. DYNAMIC AMBIENT AURA SCROLL TRANSITIONS (Fixed background morph)      */}
      {/* Morphs ambient radial glow from golden amber -> emerald -> champagne gold */}
      {/* ======================================================================= */}
      <div
        className="fixed inset-0 pointer-events-none -z-10 flex items-center justify-center overflow-hidden transition-all duration-1000 ease-in-out"
        aria-hidden="true"
      >
        <div
          className={`w-[125vw] max-w-[850px] h-[540px] rounded-full blur-[90px] sm:blur-[135px] transition-all duration-1000 ease-in-out opacity-45 will-change-transform translate-z-0 ${
            activeSectionIndex === 0
              ? 'bg-gradient-to-tr from-amber-400/40 via-yellow-600/20 to-transparent'
              : activeSectionIndex === 1
                ? currentTheme.glowGradient
                : activeSectionIndex === 2
                  ? 'bg-gradient-to-tr from-[#D4AF37]/35 via-stone-700/20 to-transparent'
                  : 'bg-gradient-to-tr from-stone-400/30 via-amber-200/15 to-transparent'
          }`}
        />
      </div>

      {/* Floating Vertical Apple-Style Section Pagination Indicator (Desktop) */}
      <nav
        aria-label="Section Scrolly Navigation"
        className="fixed right-5 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center gap-3 bg-black/20 dark:bg-black/40 backdrop-blur-md p-2 rounded-full border border-white/10 shadow-lg"
      >
        {[
          { label: 'Hero Portrait', idx: 0 },
          { label: 'Theme Showcase', idx: 1 },
          { label: 'Direct Reservation', idx: 2 },
          { label: 'Studio Philosophy', idx: 3 },
        ].map((item) => (
          <button
            key={item.idx}
            type="button"
            onClick={() => scrollToSection(item.idx)}
            title={item.label}
            aria-label={`Jump to ${item.label}`}
            className={`w-2.5 rounded-full transition-all duration-300 cursor-pointer ${
              activeSectionIndex === item.idx
                ? 'h-6 bg-[#D4AF37] shadow-sm'
                : 'h-2.5 bg-white/40 hover:bg-white/80'
            }`}
          />
        ))}
      </nav>

      {/* ======================================================================= */}
      {/* 1. FULL-SCREEN SECTION ARCHITECTURE & SCROLL-SNAP WRAPPER                */}
      {/* Wrapped in a smooth scroll-snap container:                              */}
      {/* h-screen w-full overflow-y-scroll snap-y snap-mandatory scrollbar-none  */}
      {/* ======================================================================= */}
      <div
        ref={containerRef}
        onScroll={handleContainerScroll}
        data-lenis-prevent="true"
        className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scrollbar-none no-scrollbar relative focus:outline-none"
        tabIndex={0}
      >
        {/* ===================================================================== */}
        {/* SECTION 1: HERO PORTRAIT (Apple-Style Zoom & Fade Logic)              */}
        {/* Occupies exactly 100vh (h-screen w-full snap-start relative flex ...) */}
        {/* ===================================================================== */}
        <section
          ref={section1Ref}
          id="home"
          data-section="home"
          className="h-screen w-full snap-start relative flex flex-col justify-between items-center overflow-hidden pt-16 sm:pt-20 pb-20 sm:pb-8 px-4 sm:px-8 text-center"
        >
          {/* Top Micro-Header & Editorial Captions (Scroll-Linked Fade-Out) */}
          <motion.div
            style={{ opacity: heroCaptionOpacity, y: heroCaptionY }}
            className="w-full max-w-2xl mx-auto flex flex-col items-center gap-1.5 will-change-transform translate-z-0"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-sans font-bold tracking-[0.25em] uppercase border backdrop-blur-md bg-stone-900/10 dark:bg-white/5 border-stone-300/60 dark:border-white/15 text-[#8C6207] dark:text-[#F3E5AB]">
              <Sparkles size={12} className="text-[#D4AF37]" />
              <span>SANJAY&apos;S LIGHTWORKS · ONTARIO, CANADA</span>
            </div>

            <h1 className="font-display font-bold text-3xl sm:text-5xl md:text-6xl tracking-tight uppercase leading-[0.98] mt-1">
              <span className={isDark ? 'text-white' : 'text-[#141312]'}>
                CAPTURING MOMENTS
              </span>
              <span className="block text-gold-shimmer font-serif font-extrabold italic tracking-tight">
                THAT LAST
              </span>
            </h1>

            <p className="text-xs sm:text-sm font-sans max-w-md mx-auto text-stone-600 dark:text-stone-300 font-light line-clamp-1 sm:line-clamp-none">
              Natural light, unscripted celebrations &amp; heirloom portraiture across Ontario.
            </p>
          </motion.div>

          {/* Center Apple-Style Zoom-to-Framed Portrait Photograph */}
          {/* As user scrolls down, scales smoothly from scale-125 (1.25) to scale-100 (1.0) */}
          <div className="my-auto w-full max-w-md mx-auto px-4 flex items-center justify-center">
            <div className="relative w-full aspect-[3/4] max-h-[50vh] sm:max-h-[58vh] rounded-2xl overflow-hidden shadow-2xl border border-stone-200/80 dark:border-white/15 bg-[#181512] cursor-pointer group">
              <motion.img
                src="/images/golden-grace-1.jpg"
                alt="Sanjay's Lightworks Signature Hero Portrait"
                style={{ scale: heroPhotoScale }}
                onClick={() => onSelectPhotoByUrl('/images/golden-grace-1.jpg', 'Golden Grace Signature Portrait')}
                className="w-full h-full object-cover will-change-transform translate-z-0 transform-gpu transition-shadow"
                loading="eager"
              />

              {/* Minimal Tap-to-Expand Cue */}
              <button
                type="button"
                onClick={() => onSelectPhotoByUrl('/images/golden-grace-1.jpg', 'Golden Grace Signature Portrait')}
                aria-label="Expand portrait photograph"
                className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/50 border border-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-80 group-hover:opacity-100 transition-opacity"
              >
                <Maximize2 size={13} />
              </button>
            </div>
          </div>

          {/* Bottom Scroll-Down Cue */}
          <motion.div
            style={{ opacity: heroCaptionOpacity }}
            className="flex flex-col items-center gap-1 cursor-pointer pt-1"
            onClick={() => scrollToSection(1)}
          >
            <span className="text-[10px] font-sans tracking-[0.25em] uppercase text-stone-500 dark:text-stone-400 font-semibold">
              SCROLL TO REVEAL THEMES
            </span>
            <ChevronDown size={14} className="animate-bounce text-[#D4AF37]" />
          </motion.div>
        </section>

        {/* ===================================================================== */}
        {/* SECTION 2: THEME SHOWCASE                                            */}
        {/* Occupies exactly 100vh (h-screen w-full snap-start relative flex ...) */}
        {/* ===================================================================== */}
        <section
          ref={section2Ref}
          id="work"
          data-section="work"
          className="h-screen w-full snap-start relative flex flex-col justify-between items-center overflow-hidden pt-14 sm:pt-20 pb-20 sm:pb-8 px-4 sm:px-8 text-center"
        >
          {/* =================================================================== */}
          {/* DESKTOP VIEW (>= md): Apple-Style Reveal with Ambient Aura Glow     */}
          {/* =================================================================== */}
          <div className="hidden md:flex flex-col justify-between items-center h-full w-full max-w-2xl mx-auto">
            {/* Top Section Badge & Synchronized Heading */}
            <div className="w-full flex flex-col items-center gap-1">
              <span className="text-[10px] font-sans tracking-[0.25em] uppercase font-bold text-[#D4AF37]">
                EDITORIAL THEME SUITES · 02 OF 03
              </span>

              {/* Dynamic Selected Image Title Text */}
              <h2 className="tracking-[0.25em] text-2xl font-serif uppercase text-center py-1 text-stone-900 dark:text-stone-100 select-none transition-colors duration-300">
                {formattedTitle}
              </h2>

              <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-1 max-w-sm mx-auto font-light">
                {currentTheme.subtitle}
              </p>
            </div>

            {/* Center Interactive Camera Reveal Photo */}
            <div className="my-auto w-full max-w-md mx-auto px-4 flex items-center justify-center">
              <div className="relative w-full">
                {/* Reactive Dynamic Color Glow Effect behind active photo card (Desktop Only) */}
                <div
                  className={`absolute -inset-6 -z-10 rounded-full blur-3xl transition-all duration-700 ease-in-out opacity-40 pointer-events-none ${currentTheme.glowGradient}`}
                  aria-hidden="true"
                />

                {/* Framed Photo Container with Hardware-Accelerated Reveal */}
                <motion.div
                  style={{ scale: themePhotoScale, opacity: themePhotoOpacity }}
                  onClick={() => onSelectPhotoByUrl(currentTheme.photoUrl, currentTheme.title)}
                  className="relative w-full aspect-[3/4] max-h-[58vh] rounded-2xl overflow-hidden cursor-pointer border shadow-xl border-stone-200/80 dark:border-white/15 bg-[#181512] will-change-transform translate-z-0 transform-gpu active:scale-[0.99] transition-transform"
                >
                  <AnimatePresence initial={false} mode="popLayout">
                    <motion.img
                      key={currentTheme.id}
                      src={currentTheme.photoUrl}
                      alt={`${currentTheme.title} featured portrait`}
                      initial={{ x: '-100%', opacity: 0 }}
                      animate={{ x: '0%', opacity: 1 }}
                      exit={{ x: '100%', opacity: 0 }}
                      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </AnimatePresence>

                  {/* Minimal Expand Badge */}
                  <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/50 border border-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-85 shadow-md pointer-events-none">
                    <Maximize2 size={13} />
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Desktop Theme Filter Pills */}
            <div className="w-full max-w-md mx-auto flex flex-col items-center gap-2 pt-1">
              <div className="w-full flex items-center justify-center gap-2 px-1 py-1">
                {THEME_SUITES.map((suite, idx) => {
                  const isActive = activeThemeIndex === idx;
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
                      onClick={() => handleSelectTheme(idx)}
                      className={`min-h-[38px] px-4 py-2 rounded-full text-xs font-sans tracking-wide border transition-all duration-300 cursor-pointer ${
                        isActive
                          ? isDark
                            ? 'bg-white text-stone-950 font-semibold border-white shadow-md'
                            : 'bg-stone-900 text-white font-semibold border-stone-900 shadow-md'
                          : isDark
                            ? 'bg-stone-900/40 border-white/15 text-stone-300 hover:text-white hover:border-white/30'
                            : 'bg-stone-100/90 border-stone-300 text-stone-700 hover:text-stone-950 hover:border-stone-400'
                      }`}
                      style={
                        isActive
                          ? {
                              boxShadow: `0 0 0 2px ${suite.accentColor}`,
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
          </div>

          {/* =================================================================== */}
          {/* MOBILE VIEW (< md): Clean Editorial Layout                          */}
          {/* 1) Main Portrait Photo (aspect-[3/4], enlarged, rotating -> right)  */}
          {/* 2) Highlighted Active Photo Name                                    */}
          {/* 3) Horizontal Theme Filter Pills (Centered flex-wrap, haptic tap)   */}
          {/* 4) Fixed Bottom Action Bar (Ont. Studio | From $50 CAD | RESERVE)  */}
          {/* =================================================================== */}
          <div className="md:hidden flex flex-col items-center justify-center w-full max-w-md mx-auto h-full px-2 py-2 select-none">
            {/* 1. Main Portrait Photo with Canvas-Sampled blur-3xl Ambient Glow */}
            <div className="relative w-full max-w-[340px] flex items-center justify-center">
              {/* Dynamic blur-3xl aura color dynamically sampled from current image */}
              <div
                className="absolute -inset-6 -z-10 rounded-full blur-3xl transition-all duration-700 ease-in-out pointer-events-none"
                style={{
                  background: sampledColor.radialGradient(0.65),
                  opacity: isDark ? 0.65 : 0.45,
                }}
                aria-hidden="true"
              />

              <div
                onClick={() => onSelectPhotoByUrl(currentTheme.photoUrl, currentTheme.title)}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className={`relative w-full aspect-[3/4] max-h-[50vh] rounded-2xl overflow-hidden cursor-pointer border shadow-lg transition-all duration-300 active:scale-[0.99] ${
                  isDark ? 'border-white/10 bg-[#181512]' : 'border-stone-200/90 bg-[#EFE9DF]'
                }`}
              >
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.img
                    key={currentTheme.id}
                    src={currentTheme.photoUrl}
                    alt={`${currentTheme.title} featured portrait`}
                    initial={{ x: '-100%', opacity: 0 }}
                    animate={{ x: '0%', opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </AnimatePresence>

                {/* Minimal Expand Badge */}
                <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/50 border border-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-85 shadow-md pointer-events-none">
                  <Maximize2 size={13} />
                </div>
              </div>
            </div>

            {/* 2. Highlighted Active Photo Name (with '-' in middle: ex; golden-grace) */}
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

            {/* 3. Compact Horizontal Theme Filter Pills (Centered flex-wrap, haptic feedback, un-cramped font) */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 py-1.5 w-full px-2">
              {THEME_SUITES.map((suite, idx) => {
                const isActive = activeThemeIndex === idx;
                const displayName =
                  suite.id === 'emerald-harmony' ? 'Harmony' :
                  suite.id === 'golden-grace' ? 'Golden Grace' :
                  suite.id === 'still-vision' ? 'Still Vision' :
                  suite.id === 'misty-pine' ? 'Misty Pine' :
                  suite.title;

                return (
                  <button
                    key={suite.id}
                    ref={(el) => { mobilePillRefs.current[idx] = el; }}
                    type="button"
                    onClick={() => handleSelectTheme(idx)}
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
        </section>

        {/* ===================================================================== */}
        {/* SECTION 3: RESERVATION STEPPER (Streamlined 100vh Session Reservation) */}
        {/* Occupies exactly 100vh (h-screen w-full snap-start relative flex ...) */}
        {/* ===================================================================== */}
        <section
          ref={section3Ref}
          id="pricing"
          data-section="pricing"
          className="h-screen w-full snap-start relative flex flex-col justify-between items-center overflow-hidden pt-16 sm:pt-20 pb-20 sm:pb-8 px-4 sm:px-8 text-center"
        >
          {/* Top Reservation Stepper Header */}
          <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-1">
            <span className="text-[10px] font-sans tracking-[0.25em] uppercase font-bold text-[#D4AF37]">
              DIRECT RESERVATION · 03 OF 03
            </span>
            <h2 className="font-display font-bold text-2xl sm:text-4xl uppercase tracking-tight">
              RESERVE YOUR SESSION
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-light max-w-md mx-auto">
              Transparent, all-inclusive photography packages starting from $50 CAD in Ontario.
            </p>
          </div>

          {/* Center Interactive Package Tier Selection Cards */}
          <motion.div
            style={{ scale: stepperScale, opacity: stepperOpacity }}
            className="my-auto w-full max-w-2xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 px-1 will-change-transform translate-z-0"
          >
            {PRICING_PACKAGES.map((pkg) => {
              const isSelected = selectedPackage.id === pkg.id;
              return (
                <div
                  key={pkg.id}
                  onClick={() => {
                    soundEngine.playClick();
                    soundEngine.hapticTap();
                    setSelectedPackage(pkg);
                  }}
                  className={`p-3 sm:p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between text-left relative ${
                    isSelected
                      ? isDark
                        ? 'bg-[#181512] border-[#D4AF37] ring-2 ring-[#D4AF37]/50 shadow-xl'
                        : 'bg-white border-[#B8860B] ring-2 ring-[#B8860B]/40 shadow-xl'
                      : isDark
                        ? 'bg-stone-900/60 border-white/10 hover:border-white/20'
                        : 'bg-stone-100/80 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {pkg.popular && (
                    <span className="absolute -top-2 left-3 bg-[#D4AF37] text-black text-[9px] font-sans font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      POPULAR
                    </span>
                  )}
                  <div>
                    <h3 className="text-xs sm:text-sm font-display font-bold uppercase tracking-wider">
                      {pkg.name}
                    </h3>
                    <div className="text-base sm:text-xl font-bold font-serif text-[#D4AF37] mt-0.5">
                      ${pkg.price} <span className="text-[10px] font-sans font-normal text-stone-400">CAD</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-current/10 text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 space-y-1">
                    <div className="flex items-center gap-1">
                      <Clock size={11} className="text-[#D4AF37]" />
                      <span>{pkg.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Camera size={11} className="text-[#D4AF37]" />
                      <span className="truncate">{pkg.deliverables[1] || 'Retouched Photos'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>

          {/* Bottom Direct Reservation Action Strip */}
          <div className="w-full max-w-md mx-auto flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                soundEngine.hapticTap();
                onOpenBooking(selectedPackage);
              }}
              className="btn-tactile-gold w-full h-12 rounded-xl font-display font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-xl cursor-pointer"
            >
              <Calendar size={15} />
              <span>CONTINUE WITH {selectedPackage.name} (${selectedPackage.price} CAD)</span>
              <ArrowRight size={14} />
            </button>

            <div className="flex items-center justify-center gap-4 text-[10px] font-sans text-stone-500 dark:text-stone-400">
              <span className="flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-500" />
                No Hidden Travel Fees
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-[#D4AF37]" />
                Ontario Natural Light
              </span>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* SECTION 4: STUDIO PHILOSOPHY & ABOUT (Full-Screen Editorial Outro)     */}
        {/* Occupies exactly 100vh (h-screen w-full snap-start relative flex ...) */}
        {/* ===================================================================== */}
        <section
          ref={section4Ref}
          id="about"
          data-section="about"
          className="h-screen w-full snap-start relative flex flex-col justify-between items-center overflow-hidden pt-16 sm:pt-20 pb-20 sm:pb-8 px-4 sm:px-8 text-center"
        >
          {/* Top Philosophy Micro-Header */}
          <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-1">
            <span className="text-[10px] font-sans tracking-[0.25em] uppercase font-bold text-[#D4AF37]">
              PHILOSOPHY &amp; ARTISTIC DIRECTION
            </span>
            <h2 className="font-display font-bold text-2xl sm:text-4xl uppercase tracking-tight">
              THE ART OF HONEST LIGHT
            </h2>
          </div>

          {/* Center Editorial Quote & Studio Intro */}
          <div className="my-auto w-full max-w-xl mx-auto px-4 flex flex-col items-center gap-4">
            <blockquote className="font-serif italic text-base sm:text-xl text-stone-700 dark:text-stone-200 leading-relaxed max-w-lg">
              &ldquo;Great photography isn&apos;t manufactured in studio strobe rigs—it is discovered in the quiet beauty of natural daylight and sincere human warmth.&rdquo;
            </blockquote>

            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-light max-w-md leading-relaxed">
              Based in Ontario, Sanjay specializes in cultural heritage, fine-art chiaroscuro portraits, and candid celebrations without artificial intrusion.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onViewGallery}
                className="px-5 py-2.5 rounded-full border border-[#D4AF37]/50 text-xs font-sans font-bold uppercase tracking-wider hover:bg-[#D4AF37]/10 transition-colors"
              >
                BROWSE FULL GALLERY
              </button>
              <button
                type="button"
                onClick={onOpenEnquiry}
                className="px-5 py-2.5 rounded-full bg-stone-900 dark:bg-white text-white dark:text-black text-xs font-sans font-bold uppercase tracking-wider shadow-md hover:opacity-90 transition-opacity"
              >
                DIRECT INQUIRY
              </button>
            </div>
          </div>

          {/* Footer Metadata & Social Links */}
          <div className="w-full max-w-md mx-auto flex items-center justify-between text-[11px] font-sans text-stone-500 dark:text-stone-400 border-t border-current/10 pt-3">
            <span>© 2026 SANJAY&apos;S LIGHTWORKS</span>
            <div className="flex items-center gap-3">
              <a
                href={getWhatsAppUrl("Hello Sanjay! I'm interested in booking a session.")}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-500 transition-colors flex items-center gap-1"
              >
                <MessageCircle size={13} />
                <span>WhatsApp</span>
              </a>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#D4AF37] transition-colors flex items-center gap-1"
              >
                <Instagram size={13} />
                <span>Instagram</span>
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
