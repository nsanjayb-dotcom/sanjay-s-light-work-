import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { soundEngine } from '../utils/audio';
import { PRICING_PACKAGES, SHOOT_ADD_ONS } from '../data/mockData';
import { PricingPackage } from '../types';
import { 
  ArrowLeft, 
  Check, 
  Clock, 
  Sparkles, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck,
  Layers,
  SlidersHorizontal,
  Camera,
  Plane,
  ArrowRight
} from 'lucide-react';

interface PricingPageProps {
  onBack: () => void;
  onSelectPackage: (pkg: PricingPackage) => void;
  isDark: boolean;
}

export const PricingPage: React.FC<PricingPageProps> = ({
  onBack,
  onSelectPackage,
  isDark,
}) => {
  const [mobileMode, setMobileMode] = useState<'carousel' | 'accordion'>('carousel');
  const [activeCarouselIdx, setActiveCarouselIdx] = useState(0);
  const [expandedIds, setExpandedIds] = useState<string[]>(['pkg-portrait']);
  const carouselRef = useRef<HTMLDivElement>(null);

  const toggleExpand = (id: string) => {
    soundEngine.playSwitch();
    soundEngine.hapticTap();
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleCarouselScroll = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, clientWidth } = carouselRef.current;
    const cardWidth = clientWidth * 0.84;
    const newIdx = Math.round(scrollLeft / cardWidth);
    if (newIdx !== activeCarouselIdx && newIdx >= 0 && newIdx < PRICING_PACKAGES.length) {
      setActiveCarouselIdx(newIdx);
    }
  };

  const scrollToCard = (index: number) => {
    soundEngine.playSwitch();
    soundEngine.hapticTap();
    if (!carouselRef.current) return;
    const cards = carouselRef.current.children;
    if (cards[index]) {
      (cards[index] as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
      setActiveCarouselIdx(index);
    }
  };

  const handleReserve = (pkg: PricingPackage) => {
    soundEngine.playClick();
    soundEngine.hapticTap();
    onSelectPackage(pkg);
  };

  return (
    <div className={`w-full min-h-screen pt-20 sm:pt-28 pb-20 px-4 sm:px-8 max-w-6xl mx-auto overflow-x-hidden ${
      isDark ? 'text-white' : 'text-[#1A1A1A]'
    }`}>
      {/* Top Navigation Bar with Lovable Spacing */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onBack();
          }}
          className="button-editorial inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest cursor-pointer group w-fit text-[var(--foreground)] hover:text-[var(--gold)]"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
          <span>RETURN TO PORTFOLIO</span>
        </button>

        <div className="inline-flex items-center gap-2 text-[10px] font-sans font-bold uppercase tracking-widest text-[var(--gold)]">
          <ShieldCheck size={14} />
          <span>TRANSPARENT CAD FLAT RATES · ONTARIO</span>
        </div>
      </div>

      {/* Editorial Header */}
      <div className="mb-8 sm:mb-12 text-left">
        <div className="eyebrow mb-2">
          <span>Packages &amp; Investment</span>
        </div>

        <h1 className="section-heading text-3xl sm:text-5xl uppercase tracking-tight font-serif font-bold text-[var(--foreground)]">
          TRANSPARENT PHOTOGRAPHY PACKAGES
        </h1>

        <p className="section-description text-xs sm:text-sm text-[var(--muted-foreground)] max-w-2xl mt-2 leading-relaxed">
          All packages include high-resolution, unwatermarked digital downloads, personalized ambient lighting, and direct online gallery access across Ontario, Canada.
        </p>
      </div>

      {/* Mobile Toggle Control (<768px): Swipe Cards vs Accordion */}
      <div className="md:hidden flex items-center justify-between mb-6 p-1.5 rounded-xl border border-stone-300 dark:border-white/15 bg-stone-100 dark:bg-white/5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              soundEngine.playSwitch();
              setMobileMode('carousel');
            }}
            className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-display font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              mobileMode === 'carousel'
                ? 'bg-white dark:bg-[#1A1A22] text-[#8C6207] dark:text-[#D4AF37] shadow-xs'
                : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            <SlidersHorizontal size={14} />
            <span>SWIPE CARDS</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playSwitch();
              setMobileMode('accordion');
            }}
            className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-display font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              mobileMode === 'accordion'
                ? 'bg-white dark:bg-[#1A1A22] text-[#8C6207] dark:text-[#D4AF37] shadow-xs'
                : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            <Layers size={14} />
            <span>EXPANDABLE</span>
          </button>
        </div>

        <span className="text-[10px] font-sans font-bold text-[#8C6207] pr-2 uppercase">
          {mobileMode === 'carousel' ? 'Swipe 4 Tiers →' : 'Compare 4 Tiers'}
        </span>
      </div>

      {/* MOBILE OPTION A: Horizontal Swipeable Carousel with 10-15% Peek Edges */}
      {mobileMode === 'carousel' && (
        <div className="md:hidden space-y-4">
          <div
            ref={carouselRef}
            onScroll={handleCarouselScroll}
            className="flex flex-row overflow-x-auto snap-x snap-mandatory gap-4 pb-3 scrollbar-none overscroll-x-contain"
          >
            {PRICING_PACKAGES.map((pkg, idx) => {
              const numStr = `0${idx + 1}`;
              const isPopular = pkg.popular;

              return (
                <div
                  key={pkg.id}
                  className={`w-[84vw] max-w-[340px] shrink-0 snap-center rounded-2xl p-6 border flex flex-col justify-between text-left transition-all ${
                    isDark
                      ? isPopular
                        ? 'bg-[#141418] border-[#D4AF37] shadow-[0_8px_30px_rgba(212,175,55,0.15)]'
                        : 'bg-[#101014] border-white/10 shadow-md'
                      : isPopular
                        ? 'bg-white border-[#B8860B] shadow-[0_8px_30px_rgba(184,134,11,0.15)]'
                        : 'bg-white border-stone-200 shadow-sm'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header Row */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#8C6207]">
                        {numStr} / 04
                      </span>
                      {isPopular && (
                        <span className="bg-[#D4AF37] text-black text-[9px] font-sans font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                          <Sparkles size={9} />
                          MOST POPULAR
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h2 className="font-display font-bold text-xl uppercase tracking-tight">
                      {pkg.name}
                    </h2>

                    {/* Rate */}
                    <div className="flex items-baseline gap-2">
                      <span className="font-display font-extrabold text-3xl tracking-tight text-[#8C6207]">
                        ${pkg.price}
                      </span>
                      <span className="text-xs font-sans font-bold uppercase text-stone-500">
                        CAD Flat Rate
                      </span>
                    </div>

                    {/* Duration badge */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans font-medium border border-stone-200 dark:border-white/10 bg-stone-100 dark:bg-white/5 text-stone-700 dark:text-stone-300">
                      <Clock size={12} className="text-[#8C6207]" />
                      <span>{pkg.duration}</span>
                    </div>

                    {/* Tagline */}
                    <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                      {pkg.tagline}
                    </p>

                    {/* Deliverables */}
                    <div className="pt-3 border-t border-stone-200 dark:border-white/10 space-y-2">
                      <span className="text-[10px] font-sans tracking-[0.2em] uppercase font-bold text-[#8C6207] block">
                        Included In Package:
                      </span>
                      <ul className="space-y-2 text-xs">
                        {pkg.deliverables.map((item, dIdx) => (
                          <li key={dIdx} className="flex items-start gap-2 text-stone-700 dark:text-stone-200">
                            <Check size={14} className="shrink-0 mt-0.5 text-[#8C6207]" strokeWidth={2.5} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Reserve Button */}
                  <button
                    type="button"
                    onClick={() => handleReserve(pkg)}
                    className="w-full btn-tactile-gold py-3.5 px-4 text-xs font-display font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-[0.96] min-h-[48px] mt-6 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <Calendar size={15} />
                    <span>RESERVE SESSION ({pkg.name.toUpperCase()})</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Carousel Pagination Dots & Nav Arrows */}
          <div className="flex items-center justify-between px-2 pt-2">
            <button
              type="button"
              onClick={() => scrollToCard(Math.max(0, activeCarouselIdx - 1))}
              disabled={activeCarouselIdx === 0}
              aria-label="Previous card"
              className="min-h-[48px] min-w-[48px] rounded-full border border-stone-300 dark:border-white/15 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-2">
              {PRICING_PACKAGES.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => scrollToCard(dotIdx)}
                  aria-label={`Go to package ${dotIdx + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    activeCarouselIdx === dotIdx
                      ? 'w-7 bg-[#8C6207] dark:bg-[#D4AF37]'
                      : 'w-2 bg-stone-300 dark:bg-white/20'
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => scrollToCard(Math.min(PRICING_PACKAGES.length - 1, activeCarouselIdx + 1))}
              disabled={activeCarouselIdx === PRICING_PACKAGES.length - 1}
              aria-label="Next card"
              className="min-h-[48px] min-w-[48px] rounded-full border border-stone-300 dark:border-white/15 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* MOBILE OPTION B: Clean Minimalist Expandables */}
      {mobileMode === 'accordion' && (
        <div className="md:hidden space-y-3">
          {PRICING_PACKAGES.map((pkg, idx) => {
            const isExpanded = expandedIds.includes(pkg.id);
            const numStr = `0${idx + 1}`;

            return (
              <div
                key={pkg.id}
                className={`rounded-2xl border transition-all text-left overflow-hidden ${
                  isDark
                    ? isExpanded ? 'bg-[#141418] border-[#D4AF37]/50' : 'bg-[#101014] border-white/10'
                    : isExpanded ? 'bg-white border-[#B8860B]/60 shadow-sm' : 'bg-white border-stone-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(pkg.id)}
                  className="w-full min-h-[56px] p-4 flex items-center justify-between text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-[#8C6207]">
                      {numStr}
                    </span>
                    <div>
                      <div className="font-display font-bold text-sm uppercase">
                        {pkg.name}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">
                        {pkg.duration}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-display font-extrabold text-base text-[#8C6207]">
                      ${pkg.price} CAD
                    </span>
                    <span className="text-xs text-stone-400">
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 pt-1 border-t border-stone-200 dark:border-white/10 space-y-3">
                    <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                      {pkg.tagline}
                    </p>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-sans uppercase font-bold text-[#8C6207]">
                        Deliverables:
                      </span>
                      <ul className="space-y-1 text-xs">
                        {pkg.deliverables.map((item, dIdx) => (
                          <li key={dIdx} className="flex items-start gap-2">
                            <Check size={13} className="shrink-0 mt-0.5 text-[#8C6207]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleReserve(pkg)}
                      className="w-full btn-tactile-gold py-3 px-4 text-xs font-display font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer min-h-[48px] mt-3"
                    >
                      <Calendar size={14} />
                      <span>RESERVE {pkg.name.toUpperCase()}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* DESKTOP (>=768px): Elegant 2x2 or 4-Column Grid */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
        {PRICING_PACKAGES.map((pkg, idx) => {
          const numStr = `0${idx + 1}`;
          const isPopular = pkg.popular;

          return (
            <div
              key={pkg.id}
              className={`rounded-2xl p-6 border flex flex-col justify-between text-left transition-all ${
                isDark
                  ? isPopular
                    ? 'bg-[#141418] border-[#D4AF37] shadow-[0_8px_30px_rgba(212,175,55,0.15)]'
                    : 'bg-[#101014] border-white/10 hover:border-white/20'
                  : isPopular
                    ? 'bg-white border-[#B8860B] shadow-[0_8px_30px_rgba(184,134,11,0.15)]'
                    : 'bg-white border-stone-200 hover:border-stone-300 shadow-xs'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#8C6207]">
                    {numStr} / 04
                  </span>
                  {isPopular && (
                    <span className="bg-[#D4AF37] text-black text-[9px] font-sans font-bold tracking-widest uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                      <Sparkles size={9} />
                      POPULAR
                    </span>
                  )}
                </div>

                <h3 className="font-display font-bold text-lg uppercase tracking-tight">
                  {pkg.name}
                </h3>

                <div className="flex items-baseline gap-1.5">
                  <span className="font-display font-extrabold text-3xl tracking-tight text-[#8C6207]">
                    ${pkg.price}
                  </span>
                  <span className="text-xs font-sans font-bold uppercase text-stone-500">
                    CAD Flat Rate
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-sans font-medium border border-stone-200 dark:border-white/10 bg-stone-100 dark:bg-white/5 text-stone-700 dark:text-stone-300">
                  <Clock size={12} className="text-[#8C6207]" />
                  <span>{pkg.duration}</span>
                </div>

                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  {pkg.tagline}
                </p>

                <div className="pt-3 border-t border-stone-200 dark:border-white/10 space-y-2">
                  <span className="text-[10px] font-sans tracking-[0.2em] uppercase font-bold text-[#8C6207] block">
                    Deliverables:
                  </span>
                  <ul className="space-y-2 text-xs">
                    {pkg.deliverables.map((item, dIdx) => (
                      <li key={dIdx} className="flex items-start gap-2 text-stone-700 dark:text-stone-200">
                        <Check size={14} className="shrink-0 mt-0.5 text-[#8C6207]" strokeWidth={2.5} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleReserve(pkg)}
                className="w-full btn-tactile-gold py-3.5 px-4 text-xs font-display font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all active:scale-[0.96] min-h-[48px] mt-6 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <Calendar size={15} />
                <span>RESERVE {pkg.name.toUpperCase()}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* OPTIONAL ADD-ONS & ENHANCEMENTS SECTION (Secondary Photographers, Drone Options, etc.) */}
      <div className="mt-12 sm:mt-16 p-6 sm:p-8 rounded-2xl border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-white/5 space-y-6 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-white/10 pb-4">
          <div>
            <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#8C6207]">
              CUSTOM SESSION OPTIONS
            </span>
            <h2 className="text-xl sm:text-2xl font-display font-bold uppercase tracking-tight text-[#1A1A1A] dark:text-white mt-0.5">
              OPTIONAL ADD-ONS &amp; CREATIVE ENHANCEMENTS
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Upgrade your coverage with dedicated second shooters, 4K aerial cinematography, or rush processing.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleReserve(PRICING_PACKAGES[0])}
            className="btn-tactile-gold px-5 py-2.5 rounded-xl text-xs font-display font-bold uppercase tracking-wider flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <span>CUSTOMIZE IN BOOKING WIZARD</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SHOOT_ADD_ONS.map((addOn) => {
            const isSecondary = addOn.id.includes('secondary-photographer');
            const isDrone = addOn.id.includes('drone');

            return (
              <div
                key={addOn.id}
                className="p-4 rounded-xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#141418] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-display font-bold uppercase tracking-wide flex items-center gap-1.5 text-[#1A1A1A] dark:text-white">
                      {isSecondary ? (
                        <Camera size={14} className="text-[#8C6207]" />
                      ) : isDrone ? (
                        <Plane size={14} className="text-[#8C6207]" />
                      ) : (
                        <Sparkles size={14} className="text-[#8C6207]" />
                      )}
                      <span>{addOn.name}</span>
                    </span>
                    <span className="text-xs font-sans font-extrabold text-[#8C6207]">
                      +${addOn.price} CAD
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                    {addOn.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-stone-100 dark:border-white/5 flex items-center justify-between text-[11px]">
                  <span className="text-stone-400">Available on all packages</span>
                  <button
                    type="button"
                    onClick={() => handleReserve(PRICING_PACKAGES[0])}
                    className="text-[#8C6207] font-bold hover:underline cursor-pointer"
                  >
                    Select in Wizard →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
