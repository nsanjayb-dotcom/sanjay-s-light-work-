import React from 'react';
import { Check, CalendarDays, MessageCircle } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface AboutSectionProps {
  onOpenBooking: () => void;
  onOpenEnquiry?: () => void;
  isDark: boolean;
  glassStyle?: any;
}

const COMMITMENTS = [
  {
    title: 'EFFORTLESS NATURAL GUIDANCE',
    desc: 'Gentle, unforced direction so you always look and feel natural.',
  },
  {
    title: 'COMPLETE PRINT & DIGITAL RIGHTS',
    desc: 'Unwatermarked high-resolution files delivered directly to you.',
  },
  {
    title: 'RAPID 3–5 DAY DELIVERY',
    desc: 'Polished turnaround so your memories are fresh and ready to share.',
  },
  {
    title: 'DUAL-CARD EQUIPMENT BACKUP',
    desc: 'Real-time redundancy ensuring every irreplaceable moment is safe.',
  },
];

/**
 * About section matching https://lightworks-studio-gold.lovable.app
 * Featuring locked official portrait of Sanjay Naveen.
 */
export const AboutSection: React.FC<AboutSectionProps> = ({
  onOpenBooking,
  onOpenEnquiry,
}) => {
  const handleReserve = () => {
    soundEngine.playClick();
    soundEngine.hapticTap();
    onOpenBooking();
  };

  const handleMessage = () => {
    soundEngine.playClick();
    soundEngine.hapticTap();
    if (onOpenEnquiry) onOpenEnquiry();
  };

  return (
    <section id="about" className="content-section about-section select-none">
      <div className="section-wrap">
        <div className="eyebrow">
          <span>About the artist · Ontario, Canada</span>
        </div>

        <h2 className="about-title">
          SANJAY’S LIGHTWORKS
          <em>organic storytelling &amp;</em>
          TIMELESS PORTRAITURE
        </h2>

        <div className="about-layout">
          {/* Official Artist Portrait */}
          <div className="artist-photo relative rounded overflow-hidden shadow-xl border border-[var(--border)] bg-[var(--card)]">
            <img
              src="/images/sanjay-portrait.jpg"
              alt="Sanjay Naveen, photographer portrait"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="w-full aspect-[2/3] sm:aspect-[3/4] object-cover object-top rounded shadow-md transition-all duration-500 hover:scale-[1.015]"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('artist-photo.jpg')) {
                  target.src = '/images/artist-photo.jpg';
                }
              }}
            />
          </div>

          {/* Biography & Commitments */}
          <div>
            <p className="bio text-[var(--muted-foreground)] leading-relaxed">
              I create unposed, authentic imagery shaped by directional natural light across Ontario, Canada. Every session is relaxed, collaborative, and designed to capture genuine emotion without rigid stiffness.
            </p>

            <div className="commitments">
              <div className="commitment-heading font-serif tracking-widest text-[var(--foreground)] uppercase mb-2">
                <span>CORE COMMITMENTS</span>
                <span className="text-[var(--gold)] text-[8px] font-sans font-bold">ONTARIO, CANADA</span>
              </div>

              <div className="commitment-grid">
                {COMMITMENTS.map((item, idx) => (
                  <div key={idx} className="commitment-item">
                    <Check className="w-3.5 h-3.5 text-[var(--gold)] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-serif font-bold text-xs text-[var(--foreground)] tracking-wide">
                        {item.title}
                      </h4>
                      <p className="text-[9px] text-[var(--muted-foreground)] mt-0.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="about-actions mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={handleReserve}
                className="button-gold inline-flex items-center justify-center gap-2 rounded-md h-9 px-5 text-xs font-semibold cursor-pointer"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Reserve a Session</span>
              </button>

              <button
                type="button"
                onClick={handleMessage}
                className="button-editorial inline-flex items-center justify-center gap-2 rounded-md h-9 px-5 text-xs font-semibold cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[var(--gold)]" />
                <span>Direct Message</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
