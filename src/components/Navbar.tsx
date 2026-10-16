import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  Image as ImageIcon,
  Lock
} from 'lucide-react';
import { soundEngine } from '../utils/audio';

export type AppView = 'portfolio' | 'gallery' | 'services' | 'pricing' | 'booking' | 'contact' | 'dashboard' | 'not-found';

interface NavbarProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenBooking: () => void;
  onOpenEnquiry: () => void;
  onOpenDashboard: () => void;
  onToggleGalleryView: () => void;
  onNavigateView?: (view: AppView) => void;
  currentView: AppView;
  activeSection: string;
  isAdmin?: boolean;
  onOpenAdminAuth?: () => void;
}

/**
 * Navbar matching https://lightworks-studio-gold.lovable.app
 * Provides high-contrast typography for SANJAY'S LIGHTWORKS logo in both light and dark themes,
 * complete with smooth responsive grid, Lovable action buttons, theme & audio toggles.
 */
export const Navbar: React.FC<NavbarProps> = ({
  isDark,
  onToggleTheme,
  onOpenBooking,
  onOpenEnquiry,
  onOpenDashboard,
  onToggleGalleryView,
  onNavigateView,
  currentView,
  activeSection,
  isAdmin = false,
  onOpenAdminAuth,
}) => {
  const [isMuted, setIsMuted] = useState(soundEngine.getMuted());

  const handleToggleSound = () => {
    const newMuted = soundEngine.toggleMute();
    setIsMuted(newMuted);
  };

  const navItems = [
    { label: 'Services', id: 'services' },
    { label: 'Pricing & Packages', id: 'pricing' },
    { label: 'About', id: 'about' },
  ];

  const handleNavClick = (id: string) => {
    soundEngine.playClick();
    soundEngine.hapticTap();

    if (currentView !== 'portfolio') {
      if (onNavigateView) onNavigateView('portfolio');
      setTimeout(() => {
        const target = document.getElementById(id);
        if (target) {
          if ((window as any).__lenis) {
            (window as any).__lenis.scrollTo(target, { offset: -90 });
          } else {
            target.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }, 250);
      return;
    }

    const target = document.getElementById(id);
    if (target) {
      if ((window as any).__lenis) {
        (window as any).__lenis.scrollTo(target, { offset: -90 });
      } else {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    soundEngine.hapticTap();
    if (currentView !== 'portfolio') {
      if (onNavigateView) onNavigateView('portfolio');
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGalleryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    soundEngine.hapticTap();
    if (onNavigateView) {
      onNavigateView('gallery');
    } else {
      onToggleGalleryView();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReserveClick = () => {
    soundEngine.playClick();
    soundEngine.hapticTap();
    onOpenBooking();
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        {/* Brand Logo with High Contrast Typography */}
        <a 
          href="#home" 
          onClick={handleLogoClick}
          className="brand select-none group flex flex-col justify-center" 
          aria-label="Sanjay's Lightworks home"
        >
          <div className="flex items-center gap-2">
            <span className="brand-name font-serif font-bold tracking-wider text-[var(--foreground)] group-hover:text-[var(--gold)] transition-colors">
              SANJAY’S LIGHTWORKS
            </span>
          </div>
          <span className="brand-line font-sans font-bold text-[var(--gold)] tracking-[0.22em] uppercase">
            PHOTOGRAPHY &amp; CINEMATOGRAPHY
          </span>
        </a>

        {/* Navigation Links */}
        <nav className="nav-links" aria-label="Main navigation">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(item.id);
              }}
              className={activeSection === item.id ? 'active' : ''}
            >
              {item.label}
            </a>
          ))}

          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onOpenDashboard();
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold tracking-wider uppercase hover:bg-amber-500/20 cursor-pointer"
            >
              <Lock className="w-2.5 h-2.5" />
              <span>Studio Ops</span>
            </button>
          )}
        </nav>

        {/* Header Actions */}
        <div className="header-actions">
          {/* Gallery Button */}
          <button
            type="button"
            onClick={handleGalleryClick}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium cursor-pointer transition-colors button-editorial h-9 px-4 py-2 header-cta gallery-header rounded-full"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Gallery</span>
          </button>

          {/* Reserve Gold Button */}
          <button
            type="button"
            onClick={handleReserveClick}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors button-gold h-9 px-4 py-2 header-cta shadow-md hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Reserve</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              soundEngine.hapticTap();
              onToggleTheme();
            }}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors button-editorial h-9 w-9 theme-header hover:scale-105 active:scale-95"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-[var(--gold)]" />
            ) : (
              <Moon className="w-4 h-4 text-[var(--foreground)]" />
            )}
          </button>

          {/* Sound Toggle Button */}
          <button
            type="button"
            onClick={handleToggleSound}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors button-editorial h-9 w-9 sound-header hover:scale-105 active:scale-95"
            title={isMuted ? 'Enable sound' : 'Mute sound'}
            aria-label={isMuted ? 'Enable sound' : 'Mute sound'}
            aria-pressed={!isMuted}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-[var(--muted-foreground)]" />
            ) : (
              <Volume2 className="w-4 h-4 text-[var(--gold)]" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
