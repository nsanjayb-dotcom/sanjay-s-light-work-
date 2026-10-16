import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { soundEngine } from '../utils/audio';
import { 
  ArrowLeft, 
  ArrowRight, 
  Heart, 
  Palette, 
  CalendarDays, 
  Flame, 
  Check, 
  Sparkles, 
  Calendar, 
  Clock, 
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ServicesPageProps {
  onBack: () => void;
  onSelectService: (serviceName: string) => void;
  isDark: boolean;
}

interface ServiceDetail {
  id: string;
  num: string;
  name: string;
  tagline: string;
  icon: any;
  highlights: string[];
  deliverables: string[];
  turnaround: string;
  priceNote: string;
  idealFor: string;
}

const SERVICES_CATALOG: ServiceDetail[] = [
  {
    id: 'portrait',
    num: '01',
    name: 'PORTRAITS & COUPLES',
    tagline: 'Relaxed sessions with natural posture, candid warmth & organic ambient light.',
    icon: Heart,
    highlights: [
      'Unposed candid guidance with zero stiffness',
      'Flattering natural rim lighting and golden hour timing',
      'Full personal digital print and high-res reproduction rights',
      'Choice of scenic outdoor Ontario locations or home lifestyle sessions',
    ],
    deliverables: [
      '25+ artisanal hand-retouched portraits',
      'Private password-protected cloud gallery',
      'High-resolution print files & web-ready downloads',
      'Print release certificate included',
    ],
    turnaround: '3-Day Turnaround · Cloud Gallery',
    priceNote: 'Starting at $50 CAD',
    idealFor: 'Couples, solo creative portraits, engagement announcements, graduates',
  },
  {
    id: 'themed',
    num: '02',
    name: 'THEMED & CREATIVE',
    tagline: 'Artistic concepts, editorial moodboard styling & bespoke lighting direction.',
    icon: Palette,
    highlights: [
      'Collaborative concept moodboarding & visual styling direction',
      'Artisanal color grading with fine art cinema film simulations',
      'Unique outdoor environments, architectural backdrops & natural textures',
      'Creative props & wardrobe styling assistance',
    ],
    deliverables: [
      '30+ master print-ready framed digital assets',
      'Fine art high-resolution color corrected files',
      'Social media formatted crops & aspect ratios',
      'Dedicated creative styling consultation before shoot',
    ],
    turnaround: '3-Day Turnaround · High-Res Downloads',
    priceNote: 'Starting at $70 CAD (Up to 2-Hour Session)',
    idealFor: 'Artists, musicians, fashion concepts, personal branding, editorial portfolios',
  },
  {
    id: 'events',
    num: '03',
    name: 'EVENTS & CELEBRATIONS',
    tagline: 'Immersive documentary coverage capturing unscripted room energy & emotion.',
    icon: CalendarDays,
    highlights: [
      'Full ceremony and celebration candids without intrusive flash',
      'Dual-card camera backup safety ensuring zero lost photos',
      'Candid guest interactions, speeches, toasts, and spontaneous moments',
      'Detailed venue decor, florals, and tablescape documentation',
    ],
    deliverables: [
      '150+ color-corrected, documentary-style celebration images',
      '48-hour express sneak peek for quick social sharing',
      'Private guest-shareable web gallery with unrestricted downloads',
      'Full ceremony highlight reel sequencing',
    ],
    turnaround: '48h Sneak Peek · 5-Day Full Gallery',
    priceNote: 'Starting at $250 CAD (Up to 5 Hours Coverage)',
    idealFor: 'Intimate weddings, milestone birthdays, anniversaries, corporate celebrations',
  },
  {
    id: 'traditional',
    num: '04',
    name: 'HERITAGE & CEREMONIES',
    tagline: 'Sacred rites, cultural traditions & heartfelt multi-generational family milestones.',
    icon: Flame,
    highlights: [
      'Deep ritual observance with respectful, culturally attuned coverage',
      'Rich golden tones, vibrant silk fidelity & fine textile detail',
      'Elder blessings, formal family groupings & lively candid exchanges',
      'Dual photographer options available for simultaneous angles',
    ],
    deliverables: [
      '140+ curated, color-graded celebration master images',
      'Dual-card hardware camera backup for critical safety',
      '1-Year guaranteed cloud storage archival backup',
      'High-resolution full-resolution download rights for all family members',
    ],
    turnaround: 'Dual-Card Backup · 1-Year Cloud Storage',
    priceNote: 'Starting at $200 CAD',
    idealFor: 'Traditional cultural weddings, puja ceremonies, milestone family reunions',
  },
];

export const ServicesPage: React.FC<ServicesPageProps> = ({
  onBack,
  onSelectService,
  isDark,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(SERVICES_CATALOG[0].id);

  const toggleExpand = (id: string) => {
    soundEngine.playSwitch();
    soundEngine.hapticTap();
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className={`w-full min-h-screen py-10 sm:py-16 px-4 sm:px-8 max-w-5xl mx-auto text-left select-none animate-in fade-in duration-300 transition-colors ${
      isDark ? 'text-white' : 'text-[#1A1A1A]'
    }`}>
      <div className="space-y-8 sm:space-y-12">
        {/* Header Navigation & Back Button with Lovable Spacing */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
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
            <Sparkles size={13} className="text-[var(--gold)]" />
            <span>SERVICES CATALOG · ONTARIO, CANADA</span>
          </div>
        </div>

        {/* Editorial Title */}
        <div className="text-left">
          <div className="eyebrow mb-2">
            <span>Core offerings &amp; disciplines</span>
          </div>
          <h1 className="section-heading text-3xl sm:text-5xl uppercase tracking-tight font-serif font-bold text-[var(--foreground)]">
            SERVICES WE PROVIDE
          </h1>
          <p className="section-description text-xs sm:text-sm text-[var(--muted-foreground)] max-w-2xl mt-2 leading-relaxed">
            From quiet daylight portrait sessions to dynamic multi-hour milestone celebrations. Every shoot is captured with organic posture guidance, artisanal color fidelity, and transparent flat CAD rates.
          </p>
        </div>

        {/* 4 Interactive Service Cards */}
        <div className="space-y-5">
          {SERVICES_CATALOG.map((svc) => {
            const isExpanded = expandedId === svc.id;
            const Icon = svc.icon;

            return (
              <div
                key={svc.id}
                className={`rounded-2xl border transition-all text-left overflow-hidden ${
                  isDark
                    ? isExpanded 
                      ? 'bg-[#141418] border-[#C5A059] shadow-xl' 
                      : 'bg-[#101014] border-white/10 hover:border-white/25'
                    : isExpanded
                      ? 'bg-white border-[#8C6207] shadow-lg ring-1 ring-[#8C6207]/30'
                      : 'bg-white border-stone-200 hover:border-stone-300 shadow-xs'
                }`}
              >
                {/* Header row */}
                <div 
                  onClick={() => toggleExpand(svc.id)}
                  className="p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                      isDark 
                        ? 'bg-white/5 border-white/10 text-[#D4AF37]' 
                        : 'bg-[#FAF6ED] border-[#8C6207]/30 text-[#8C6207]'
                    }`}>
                      <Icon size={22} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#8C6207]">{svc.num}</span>
                        <h2 className="font-display font-black text-lg sm:text-2xl uppercase tracking-tight text-[#1A1A1A] dark:text-white">
                          {svc.name}
                        </h2>
                      </div>
                      <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1 font-sans">
                        {svc.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200 dark:border-white/10">
                    <span className="text-xs sm:text-sm font-sans font-bold text-[#8C6207]">
                      {svc.priceNote}
                    </span>
                    <button
                      type="button"
                      aria-label={isExpanded ? 'Collapse service details' : 'Expand service details'}
                      className="w-8 h-8 rounded-full border border-stone-300 dark:border-white/20 flex items-center justify-center text-stone-500 hover:text-stone-900 dark:hover:text-white"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Section */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.28, ease: 'easeOut' }}
                      className="border-t border-stone-200 dark:border-white/10 p-5 sm:p-7 space-y-6 bg-stone-50/60 dark:bg-white/[0.02]"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Highlights */}
                        <div className="space-y-2.5">
                          <h4 className="text-xs font-display font-bold uppercase tracking-wider text-[#8C6207] flex items-center gap-1.5">
                            <Sparkles size={13} />
                            <span>EXPERIENCE HIGHLIGHTS</span>
                          </h4>
                          <ul className="space-y-2 text-xs font-sans text-stone-600 dark:text-stone-300">
                            {svc.highlights.map((h, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <Check size={14} className="text-[#8C6207] shrink-0 mt-0.5" strokeWidth={2.5} />
                                <span>{h}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Deliverables */}
                        <div className="space-y-2.5">
                          <h4 className="text-xs font-display font-bold uppercase tracking-wider text-[#8C6207] flex items-center gap-1.5">
                            <ShieldCheck size={13} />
                            <span>DELIVERABLES &amp; TURNAROUND</span>
                          </h4>
                          <ul className="space-y-2 text-xs font-sans text-stone-600 dark:text-stone-300">
                            {svc.deliverables.map((d, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" strokeWidth={2.5} />
                                <span>{d}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Turnaround & Ideal For Banner */}
                      <div className="p-3.5 rounded-xl border border-stone-200 dark:border-white/10 bg-white dark:bg-black/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <Clock size={15} className="text-[#8C6207]" />
                          <span className="font-bold">{svc.turnaround}</span>
                        </div>
                        <div className="text-stone-500 dark:text-stone-400 text-[11px]">
                          <strong>Ideal for:</strong> {svc.idealFor}
                        </div>
                      </div>

                      {/* Reserve Action Button */}
                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playSuccess();
                            onSelectService(svc.name);
                          }}
                          className="w-full sm:w-auto btn-tactile-gold px-6 py-3 rounded-xl font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95 transition-all"
                        >
                          <Calendar size={15} />
                          <span>RESERVE {svc.name}</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner Linking to Transparent Pricing */}
        <div className="p-6 sm:p-8 rounded-2xl border border-[#8C6207]/40 bg-[#FAF6ED] dark:bg-white/5 text-left flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-1">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#8C6207]">
              FLAT RATES · ZERO HIDDEN FEES
            </span>
            <h3 className="font-display font-bold text-lg sm:text-xl uppercase tracking-tight text-[#1A1A1A] dark:text-white">
              NEED TRANSPARENT PRICING &amp; PACKAGE COMPARISON?
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-300">
              Review our 4 core flat tiers ($50, $70, $200, &amp; $250 CAD) or customize with 2nd photographer ($40 CAD), drone ($35 CAD), or additional hours ($30 CAD).
            </p>
          </div>

          <button
            type="button"
            onClick={() => onSelectService('Portraits')}
            className="w-full md:w-auto btn-tactile-gold px-6 py-3.5 rounded-xl font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shrink-0 shadow-md cursor-pointer"
          >
            <span>OPEN BOOKING WIZARD</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
