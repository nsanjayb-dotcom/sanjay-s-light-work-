import React from 'react';
import { ShieldCheck, Clock, Check } from 'lucide-react';
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
    price: '$50',
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
    price: '$70',
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
    price: '$250',
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
    price: '$200',
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
 * Pricing & Packages section matching https://lightworks-studio-gold.lovable.app
 * Ensures precise symmetry and left-to-right alignment between heading and package cards.
 */
export const PricingSection: React.FC<PricingSectionProps> = ({
  onOpenBooking,
}) => {
  const handleSelectPackage = (pkg: any) => {
    soundEngine.playClick();
    soundEngine.hapticTap();
    onOpenBooking(pkg);
  };

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

          {/* Grid of 4 Cards: Unified container layout with symmetrical 32px padding & balanced 24px gap */}
          <div className="pricing-grid grid grid-cols-1 md:grid-cols-2 gap-6">
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

                  <div className={`price ${pkg.price.includes('Quote') ? 'quote-price' : ''}`}>
                    {pkg.price} {pkg.currency && <small>{pkg.currency}</small>}
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
                  className="button-gold package-select rounded-md py-2.5 px-4 text-xs font-semibold cursor-pointer transition-transform hover:-translate-y-0.5 mt-6 w-full flex items-center justify-between"
                >
                  <span>{pkg.btnLabel}</span>
                  <span>→</span>
                </button>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
