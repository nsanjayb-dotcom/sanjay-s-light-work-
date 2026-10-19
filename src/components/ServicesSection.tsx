import React, { useState, useRef, useEffect } from 'react';
import { Heart, Sparkles, PartyPopper, Landmark, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface ServicesSectionProps {
  onOpenBooking: (serviceName?: string) => void;
  isDark: boolean;
  glassStyle?: any;
}

const SERVICES_DATA = [
  {
    num: '01',
    title: 'PORTRAITS & COUPLES',
    desc: 'Relaxed sessions with natural posture & organic ambient light.',
    tag: '1–2 HOURS SESSION · CLOUD GALLERY',
    icon: Heart,
    btnText: 'RESERVE PORTRAITS',
    checklist: [
      'Unposed organic posture — genuine emotion',
      'Natural light on location across Ontario',
      'Private online proofing gallery',
    ],
  },
  {
    num: '02',
    title: 'THEMED & CREATIVE',
    desc: 'Editorial concepts, mood styling, and cinematic framing.',
    tag: '2–3 HOURS SESSION · ART DIRECTION',
    icon: Sparkles,
    btnText: 'RESERVE CREATIVE',
    checklist: [
      'Concept development & mood board',
      'Creative set design & lighting control',
      'High-fashion magazine editorial grading',
    ],
  },
  {
    num: '03',
    title: 'EVENTS & CELEBRATIONS',
    desc: 'Unobtrusive documentary coverage of intimate weddings & milestones.',
    tag: 'HALF TO FULL DAY · CANDID STORY',
    icon: PartyPopper,
    btnText: 'RESERVE EVENT',
    checklist: [
      'Low-profile documentary candid coverage',
      'Timeline coordination with your team',
      'Sneak peeks within 48 hours',
    ],
  },
  {
    num: '04',
    title: 'HERITAGE & CEREMONIES',
    desc: 'Vibrant cultural rituals, silk textiles, and timeless family traditions.',
    tag: 'MULTI-DAY / EXTENDED · FULL ARCHIVE',
    icon: Landmark,
    btnText: 'RESERVE HERITAGE',
    checklist: [
      'Deep sensitivity to rituals & protocol',
      'Rich color grading preserving ceremonial hues',
      'Archival print-ready master files',
    ],
  },
];

/**
 * Services section with enhanced mobile touch carousel and desktop grid
 */
export const ServicesSection: React.FC<ServicesSectionProps> = ({
  onOpenBooking,
}) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<number | null>(null);

  const handleReserve = (serviceTitle: string) => {
    soundEngine.playClick();
    soundEngine.hapticTap();
    onOpenBooking(serviceTitle);
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
      const clamped = Math.max(0, Math.min(newIdx, SERVICES_DATA.length - 1));
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

  const handlePrevService = () => {
    const prevIdx = activeIdx > 0 ? activeIdx - 1 : SERVICES_DATA.length - 1;
    scrollToCard(prevIdx);
  };

  const handleNextService = () => {
    const nextIdx = activeIdx < SERVICES_DATA.length - 1 ? activeIdx + 1 : 0;
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
    <section id="services" className="content-section services-section select-none">
      <div className="section-wrap">
        <div className="eyebrow">
          <span>Core offerings · Ontario, Canada</span>
        </div>
        <h2 className="section-heading">SERVICES WE PROVIDE</h2>
        <p className="section-description">
          Candid storytelling, natural ambient daylight, and calm guidance across Ontario, Canada.
        </p>

        {/* 1. Desktop Responsive Grid */}
        <div className="services-grid-desktop">
          {SERVICES_DATA.map((service) => {
            const Icon = service.icon;
            return (
              <article key={service.num} className="service-card">
                <div className="service-top">
                  <span>{service.num}</span>
                  <div className="service-icon">
                    <Icon className="w-4 h-4 text-[var(--gold)]" />
                  </div>
                </div>

                <h3>{service.title}</h3>
                <p>{service.desc}</p>

                <div className="service-tag">{service.tag}</div>

                <ul className="checklist">
                  {service.checklist.map((item, i) => (
                    <li key={i}>
                      <Check className="w-3.5 h-3.5 text-[var(--gold)] shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => handleReserve(service.title)}
                  className="button-gold rounded-md w-full py-2.5 px-4 text-xs font-semibold cursor-pointer transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  {service.btnText}
                </button>
              </article>
            );
          })}
        </div>

        {/* 2. Mobile Touch-Optimized Carousel */}
        <div className="services-mobile-carousel-wrapper block md:hidden mt-6">
          <div
            ref={carouselRef}
            onScroll={handleScroll}
            className="services-mobile-carousel no-scrollbar"
          >
            {SERVICES_DATA.map((service) => {
              const Icon = service.icon;
              return (
                <article key={service.num} className="service-card services-mobile-card shadow-md">
                  <div className="service-top">
                    <span>{service.num}</span>
                    <div className="service-icon">
                      <Icon className="w-4 h-4 text-[var(--gold)]" />
                    </div>
                  </div>

                  <h3>{service.title}</h3>
                  <p>{service.desc}</p>

                  <div className="service-tag">{service.tag}</div>

                  <ul className="checklist space-y-1 my-2">
                    {service.checklist.map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs">
                        <Check className="w-3 h-3 text-[var(--gold)] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => handleReserve(service.title)}
                    className="button-gold rounded-md w-full min-h-[38px] py-2 px-3 text-xs font-semibold cursor-pointer transition-transform active:scale-[0.98] mt-2.5 flex items-center justify-center gap-1.5"
                  >
                    <span>{service.btnText}</span>
                  </button>
                </article>
              );
            })}
          </div>

          {/* Touch Carousel Navigation & Pagination Bar */}
          <div className="flex items-center justify-between mt-3 px-2">
            {/* Step Counter */}
            <div className="text-[10px] font-mono tracking-widest text-[var(--muted-foreground)] uppercase">
              <span className="text-[var(--gold)] font-bold">0{activeIdx + 1}</span>
              <span className="opacity-40 mx-1">/</span>
              <span>0{SERVICES_DATA.length}</span>
              <span className="ml-2 font-sans opacity-60 text-[9px]">SWIPE</span>
            </div>

            {/* Tap Pagination Indicators */}
            <div className="flex items-center gap-1.5" role="tablist" aria-label="Services carousel slides">
              {SERVICES_DATA.map((_, i) => (
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
                onClick={handlePrevService}
                aria-label="Previous service"
                className="w-9 h-9 rounded-full border border-[var(--border)] bg-[var(--card)] flex items-center justify-center text-[var(--foreground)] hover:border-[var(--gold)] hover:text-[var(--gold)] active:scale-90 transition-all cursor-pointer shadow-xs"
              >
                <ChevronLeft className="w-4 h-4 text-[var(--gold)]" />
              </button>
              <button
                type="button"
                onClick={handleNextService}
                aria-label="Next service"
                className="w-9 h-9 rounded-full border border-[var(--border)] bg-[var(--card)] flex items-center justify-center text-[var(--foreground)] hover:border-[var(--gold)] hover:text-[var(--gold)] active:scale-90 transition-all cursor-pointer shadow-xs"
              >
                <ChevronRight className="w-4 h-4 text-[var(--gold)]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
