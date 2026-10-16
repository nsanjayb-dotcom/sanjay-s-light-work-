import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Sparkles, CalendarDays, ArrowRight, Image as ImageIcon, ArrowDown } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface HeroProps {
  onOpenBooking: () => void;
  onOpenEnquiry?: () => void;
  onViewGallery: () => void;
  isDark: boolean;
}

/**
 * Hero component matching https://lightworks-studio-gold.lovable.app
 */
export const Hero: React.FC<HeroProps> = ({
  onOpenBooking,
  onViewGallery,
  isDark,
}) => {
  const heroRef = useRef<HTMLElement>(null);

  const handleReserveClick = () => {
    soundEngine.playClick();
    soundEngine.hapticTap();
    const configurator = document.getElementById('booking-configurator') || document.getElementById('pricing');
    if (configurator) {
      if ((window as any).__lenis) {
        (window as any).__lenis.scrollTo(configurator, { offset: -90 });
      } else {
        configurator.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      onOpenBooking();
    }
  };

  const handleGalleryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    soundEngine.hapticTap();
    onViewGallery();
  };

  const handleExploreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    soundEngine.hapticTap();
    const servicesElem = document.getElementById('services');
    if (servicesElem) {
      if ((window as any).__lenis) {
        (window as any).__lenis.scrollTo(servicesElem, { offset: -90 });
      } else {
        servicesElem.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section ref={heroRef} id="home" className="hero select-none">
      {/* Top Editorial Badge */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="hero-badge"
      >
        <Sparkles className="w-2.5 h-2.5" />
        <span>SANJAY’S LIGHTWORKS · ONTARIO, CANADA</span>
      </motion.div>

      {/* Main Hero Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <span>CAPTURING</span>
        <span className="gold-word">MOMENTS</span>
        <span>THAT LAST</span>
      </motion.h1>

      {/* Hero Subtitle Description */}
      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="hero-copy"
      >
        Natural light, candid celebrations, and timeless portraits across Ontario,<br className="hidden sm:block" /> Canada. Pure visual storytelling with an elevated, unscripted aesthetic.
      </motion.p>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="hero-actions"
      >
        <button
          type="button"
          onClick={handleReserveClick}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors button-gold h-9 px-4 py-2 main-cta"
        >
          <CalendarDays className="w-4 h-4" />
          <span>Reserve Shoot</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleGalleryClick}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors button-editorial h-9 px-4 py-2 main-cta"
        >
          <ImageIcon className="w-4 h-4" />
          <span>View Gallery</span>
        </button>
      </motion.div>

      {/* Hero Bottom Bar */}
      <div className="hero-bottom section-wrap">
        <span className="text-[var(--gold)] font-bold tracking-widest text-[9px] uppercase">
          ONTARIO, CANADA
        </span>
        <a
          href="#services"
          onClick={handleExploreClick}
          className="hover:text-[var(--gold)] transition-colors"
        >
          <span>EXPLORE SERVICES &amp; PRICING</span>
          <ArrowDown className="w-2.5 h-2.5" />
        </a>
      </div>
    </section>
  );
};
