import React from 'react';
import { Heart, Sparkles, PartyPopper, Landmark, Check } from 'lucide-react';
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
 * Services section matching https://lightworks-studio-gold.lovable.app
 */
export const ServicesSection: React.FC<ServicesSectionProps> = ({
  onOpenBooking,
}) => {
  const handleReserve = (serviceTitle: string) => {
    soundEngine.playClick();
    soundEngine.hapticTap();
    onOpenBooking(serviceTitle);
  };

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

        <div className="services-grid">
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
                  className="button-gold rounded-md w-full py-2.5 px-4 text-xs font-semibold cursor-pointer transition-transform hover:-translate-y-0.5"
                >
                  {service.btnText}
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
