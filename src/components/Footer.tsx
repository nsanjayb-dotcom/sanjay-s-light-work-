import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface FooterProps {
  onOpenBooking: () => void;
  onNavigateSection?: (sectionId: string) => void;
  onToggleGallery?: () => void;
  isDark: boolean;
  isAdmin?: boolean;
  onOpenAdminAuth?: () => void;
}

/**
 * Footer matching https://lightworks-studio-gold.lovable.app
 * Provides centered symmetry on mobile and high-contrast Sanjay logo styling.
 */
export const Footer: React.FC<FooterProps> = ({
  isAdmin = false,
  onOpenAdminAuth,
}) => {
  const [isMuted, setIsMuted] = useState(soundEngine.getMuted());

  const handleToggleSound = () => {
    const newMuted = soundEngine.toggleMute();
    setIsMuted(newMuted);
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    soundEngine.hapticTap();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStudioAccessClick = (e: React.MouseEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    soundEngine.hapticTap();
    if (onOpenAdminAuth) {
      onOpenAdminAuth();
    }
  };

  return (
    <footer className="site-footer section-wrap select-none border-t border-[var(--border)]">
      <a
        href="#home"
        onClick={handleLogoClick}
        className="brand group flex flex-col items-center sm:items-start"
        aria-label="Sanjay's Lightworks home"
      >
        <span className="brand-name font-serif font-bold tracking-wider text-[var(--foreground)] group-hover:text-[var(--gold)] transition-colors">
          SANJAY’S LIGHTWORKS
        </span>
        <span className="brand-line font-sans font-bold text-[var(--gold)] tracking-[0.22em] uppercase">
          PHOTOGRAPHY &amp; CINEMATOGRAPHY
        </span>
      </a>

      <div className="flex items-center gap-3">
        <p className="text-center sm:text-left text-[11px] text-[var(--muted-foreground)]">
          © 2026 Sanjay’s Lightworks · Ontario, Canada
        </p>
        {onOpenAdminAuth && (
          <button
            type="button"
            onClick={handleStudioAccessClick}
            className="text-[9px] text-[var(--muted-foreground)] hover:text-[var(--gold)] transition-colors cursor-pointer"
            title="Studio Portal"
          >
            ● Studio
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={handleToggleSound}
        className="inline-flex items-center justify-center rounded-md hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] h-9 w-9 transition-colors cursor-pointer"
        aria-label={isMuted ? 'Enable sound' : 'Mute sound'}
        title={isMuted ? 'Enable sound' : 'Mute sound'}
      >
        {isMuted ? (
          <VolumeX className="w-4 h-4" />
        ) : (
          <Volume2 className="w-4 h-4 text-[var(--gold)]" />
        )}
      </button>
    </footer>
  );
};
