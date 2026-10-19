import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Clock, Check, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { PricingPackage } from '../types';
import { soundEngine } from '../utils/audio';

interface PricingSectionProps {
  packages?: PricingPackage[];
  onOpenBooking: (pkg: PricingPackage) => void;
  isDark: boolean;
  glassStyle?: any;
}

const PACKAGES_DATA = [
  {
    id: 'single-photo-session',
    name: 'SINGLE PHOTO SESSION',
    price: 50,
    currency: 'CAD',
    duration: '1–2 hours dedicated session',
    popular: true,
    btnLabel: 'RESERVE THIS PACKAGE',
    features: [
      '15 fully retouched fine-art portraits',
      'Full personal reproduction rights',
      'Delivered via private digital gallery',
      'Guidance on wardrobe & lighting locations',
    ],
  },
  {
    id: 'creative-themed',
    name: 'CREATIVE & THEMED',
    price: 70,
    currency: 'CAD',
    duration: '2–3 hours styled production',
    popular: false,
    btnLabel: 'RESERVE THIS PACKAGE',
    features: [
      '30 artist-curated fine-art edits',
      'Custom color grade & bespoke mood palette',
      'Commercial & personal release included',
      'Multiple outfit changes & lighting setups',
    ],
  },
  {
    id: 'events-celebrations',
    name: 'EVENTS & CELEBRATIONS',
    price: 250,
    currency: 'CAD',
    duration: '4–8 hours documentary coverage',
    popular: true,
    btnLabel: 'RESERVE THIS PACKAGE',
    features: [
      'Complete unscripted story archive (150+ frames)',
      'Online guest viewing & download portal',
      '48-hour preview delivery (10 selects)',
      'Full-resolution unwatermarked digital masters',
    ],
  },
  {
    id: 'traditional-culture',
    name: 'TRADITIONAL CULTURE',
    price: 200,
    currency: 'CAD',
    duration: 'Multi-day ceremonial coverage',
    popular: false,
    btnLabel: 'RESERVE THIS PACKAGE',
    features: [
      'Dedicated cultural nuance & ritual attention',
      'Master fine-art album curation',
      'Full ceremony & candid guest storytelling',
      'Rich archival preservation of ceremonial hues',
    ],
  },
];

/**
 * Pricing & Packages section with enhanced mobile touch carousel and desktop grid
 */
export const PricingSection: React.FC<PricingSectionProps> = ({
  onOpenBooking,
}) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<number | null>(null);

  const handleSelectPackage = (pkg: any) => {
    soundEngine.playClick();
    soundEngine.hapticTap();
    onOpenBooking(pkg);
  };

  const handleScroll = () => {
    if (!carouselRef.current) return;
    if (scrollTimeoutRef.current) {
      window.cancelAnimationFrame(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = window.requestAnimationFrame(() => {
      if (!carouselRef.current) return;
      const { scrollLeft, clientWidth } = carouselRef.current;
      if (clientWidth === 0) return;
      const cardEl = carouselRef.current.firstElementChild as HTMLElement;
      const cardStep = cardEl ? cardEl.offsetWidth + 14 : clientWidth * 0.85;
      const newIdx = Math.round(scrollLeft / cardStep);
      const clamped = Math.max(0, Math.min(newIdx, PACKAGES_DATA.length - 1));
      if (clamped !== activeIdx) {
        setActiveIdx(clamped);
      }
    });
  };

  const scrollToCard = (index: number) => {
    soundEngine.playSwitch();
    soundEngine.hapticTap();
    if (!carouselRef.current) return;
    const cards = carouselRef.current.children;
    const targetCard = cards[index] as HTMLElement;
    if (targetCard) {
      const container = carouselRef.current;
      const targetLeft = targetCard.offsetLeft - (container.clientWidth - targetCard.offsetWidth) / 2;
      container.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: 'smooth',
      });
      setActiveIdx(index);
    }
  };

  const handlePrevPackage = () => {
    const prevIdx = activeIdx > 0 ? activeIdx - 1 : PACKAGES_DATA.length - 1;
    scrollToCard(prevIdx);
  };

  const handleNextPackage = () => {
    const nextIdx = activeIdx < PACKAGES_DATA.length - 1 ? activeIdx + 1 : 0;
    scrollToCard(nextIdx);
  };

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        window.cancelAnimationFrame(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <section id="pricing" className="content-section select-none">
      <div className="section-wrap">
        <div className="max-w-[860px] mx-auto">
          {/* Header Aligned with Grid */}
          <div className="pricing-heading mb-8">
            <div>
              <div className="eyebrow">
                <span>An investment in your memories</span>
              </div>
              <h2 className="section-heading">PRICING &amp; PACKAGES</h2>
              <p className="section-description">
                Thoughtfully curated sessions. Beautifully finished photographs.
              </p>
            </div>

            <span className="pricing-note">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--gold)] shrink-0" />
              <span>FULL-RESOLUTION FILES · NO WATERMARKS</span>
            </span>
          </div>

          {/* 1. Desktop Responsive Grid (hidden on mobile) */}
          <div className="pricing-grid-desktop">
            {PACKAGES_DATA.map((pkg) => (
              <article key={pkg.id} className="package-card p-6 sm:p-8 rounded-xl border border-[var(--border)] bg-[var(--card)] flex flex-col justify-between shadow-xs">
                <div>
                  {pkg.popular ? (
                    <span className="popular-badge">
                      MOST POPULAR
                    </span>
                  ) : (
                    <div className="h-[23px] mb-3.5" aria-hidden="true" />
                  )}

                  <h3 className="font-serif">{pkg.name}</h3>

                  <div className="price">
                    ${pkg.price} {pkg.currency && <small>{pkg.currency}</small>}
                  </div>

                  <div className="package-duration">
                    <Clock className="w-3 h-3 text-[var(--gold)] shrink-0" />
                    <span>{pkg.duration}</span>
                  </div>

                  <ul className="checklist">
                    {pkg.features.map((feat, i) => (
                      <li key={i}>
                        <Check className="w-3.5 h-3.5 text-[var(--gold)] shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectPackage(pkg)}
                  className="button-gold package-select rounded-md py-2.5 px-4 text-xs font-semibold cursor-pointer transition-transform hover:-translate-y-0.5 mt-6 w-full flex items-center justify-between active:scale-[0.98]"
                >
                  <span>{pkg.btnLabel}</span>
                  <span>→</span>
                </button>
              </article>
            ))}
          </div>

          {/* 2. Mobile Touch-Optimized Carousel (visible on mobile only) */}
          <div className="pricing-mobile-carousel-wrapper block md:hidden mt-6">
            <div
              ref={carouselRef}
              onScroll={handleScroll}
              className="pricing-mobile-carousel no-scrollbar"
            >
              {PACKAGES_DATA.map((pkg) => (
                <article
                  key={pkg.id}
                  className="package-card pricing-mobile-card p-4 sm:p-6 rounded-xl border border-[var(--border)] bg-[var(--card)] flex flex-col justify-between shadow-md"
                >
                  <div>
                    {pkg.popular ? (
                      <span className="popular-badge mb-2 text-[9px] py-0.5 px-2">
                        MOST POPULAR
                      </span>
                    ) : (
                      <div className="h-[18px] mb-2" aria-hidden="true" />
                    )}

                    <h3 className="font-serif text-lg font-bold">{pkg.name}</h3>

                    <div className="price my-1.5">
                      <span className="text-2xl font-serif font-bold text-[var(--gold)]">${pkg.price}</span>{' '}
                      {pkg.currency && <small className="text-[10px] text-[var(--muted-foreground)] font-bold">{pkg.currency}</small>}
                    </div>

                    <div className="package-duration flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)] mb-2.5">
                      <Clock className="w-3 h-3 text-[var(--gold)] shrink-0" />
                      <span>{pkg.duration}</span>
                    </div>

                    <ul className="checklist space-y-1 mb-3">
                      {pkg.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11px]">
                          <Check className="w-3 h-3 text-[var(--gold)] shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectPackage(pkg)}
                    className="button-gold package-select rounded-md min-h-[38px] py-2 px-3 text-xs font-semibold cursor-pointer transition-transform active:scale-[0.98] w-full flex items-center justify-between mt-2"
                  >
                    <span>{pkg.btnLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </article>
              ))}
            </div>

            {/* Touch Carousel Navigation & Pagination Bar */}
            <div className="flex items-center justify-between mt-3 px-2">
              {/* Step Counter */}
              <div className="text-[10px] font-mono tracking-widest text-[var(--muted-foreground)] uppercase">
                <span className="text-[var(--gold)] font-bold">0{activeIdx + 1}</span>
                <span className="opacity-40 mx-1">/</span>
                <span>0{PACKAGES_DATA.length}</span>
                <span className="ml-2 font-sans opacity-60 text-[9px]">SWIPE</span>
              </div>

              {/* Tap Pagination Indicators */}
              <div className="flex items-center gap-1.5" role="tablist" aria-label="Pricing carousel slides">
                {PACKAGES_DATA.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => scrollToCard(i)}
                    aria-label={`Slide ${i + 1}`}
                    className="min-h-[36px] min-w-[28px] flex items-center justify-center cursor-pointer"
                  >
                    <span
                      className={`block h-1.5 rounded-full transition-all duration-300 ${
                        activeIdx === i
                          ? 'w-6 bg-[var(--gold)]'
                          : 'w-1.5 bg-[var(--border)] hover:bg-[var(--gold)]/50'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Touch Arrow Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevPackage}
                  aria-label="Previous package"
                  className="w-9 h-9 rounded-full border border-[var(--border)] bg-[var(--card)] flex items-center justify-center text-[var(--foreground)] hover:border-[var(--gold)] hover:text-[var(--gold)] active:scale-90 transition-all cursor-pointer shadow-xs"
                >
                  <ChevronLeft className="w-4 h-4 text-[var(--gold)]" />
                </button>
                <button
                  type="button"
                  onClick={handleNextPackage}
                  aria-label="Next package"
                  className="w-9 h-9 rounded-full border border-[var(--border)] bg-[var(--card)] flex items-center justify-center text-[var(--foreground)] hover:border-[var(--gold)] hover:text-[var(--gold)] active:scale-90 transition-all cursor-pointer shadow-xs"
                >
                  <ChevronRight className="w-4 h-4 text-[var(--gold)]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
