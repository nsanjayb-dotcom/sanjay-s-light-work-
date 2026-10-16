import React, { useState, useEffect, useRef } from 'react';
import { Calendar, MessageSquare } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface MobileBottomBarProps {
  onOpenBooking: () => void;
  onOpenContact?: () => void;
  isDark: boolean;
  isAnyModalOpen?: boolean;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  onOpenBooking,
  onOpenContact,
  isDark,
  isAnyModalOpen = false,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [hasActiveOverlayInDom, setHasActiveOverlayInDom] = useState(false);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<number | null>(null);

  // Monitor DOM for any active modals, drawers, or open menus
  useEffect(() => {
    const checkOverlays = () => {
      const activeOverlay = document.querySelector(
        '[role="dialog"], #mobile-navigation-drawer, #booking-modal-overlay, #enquiry-modal, #gold-date-picker-modal, #gold-clock-picker-modal, .global-modal-overlay'
      );
      const isMenuOpen = document.body.classList.contains('menu-open') || document.body.classList.contains('modal-open');
      setHasActiveOverlayInDom(Boolean(activeOverlay || isMenuOpen));
    };

    checkOverlays();
    const observer = new MutationObserver(checkOverlays);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true, 
      attributes: true, 
      attributeFilter: ['class', 'style'] 
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop;
      const scrollDiff = currentScrollY - lastScrollY.current;

      // When user scrolls down significantly (> 8px), slide down off-screen
      if (scrollDiff > 8 && currentScrollY > 60) {
        setIsVisible(false);
      } 
      // When user scrolls up (> 4px) or reaches the top, slide back up
      else if (scrollDiff < -4 || currentScrollY <= 20) {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;

      // When scroll stops, slide back into view smoothly
      if (scrollTimeout.current) {
        window.clearTimeout(scrollTimeout.current);
      }
      scrollTimeout.current = window.setTimeout(() => {
        setIsVisible(true);
      }, 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) window.clearTimeout(scrollTimeout.current);
    };
  }, []);

  // When any modal, calendar drawer, or menu is open, completely hide sticky bar
  if (isAnyModalOpen || hasActiveOverlayInDom) return null;

  const handleContactClick = () => {
    soundEngine.playClick();
    soundEngine.hapticTap();
    if (onOpenContact) {
      onOpenContact();
    } else {
      onOpenBooking();
    }
  };

  const handleReserveClick = () => {
    soundEngine.playClick();
    soundEngine.hapticTap();
    onOpenBooking();
  };

  return (
    <div
      id="mobile-bottom-bar"
      aria-label="Mobile Sticky Dock"
      className={`mobile-bottom-bar md:hidden fixed bottom-0 inset-x-0 z-40 px-5 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] transition-transform duration-300 ease-out will-change-transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full pointer-events-none opacity-0'
      }`}
      style={{
        backgroundImage: isDark
          ? 'linear-gradient(to top, rgba(8,8,10,0.98) 85%, rgba(8,8,10,0.8) 100%)'
          : 'linear-gradient(to top, rgba(245,240,230,0.98) 85%, rgba(245,240,230,0.8) 100%)',
        borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
      }}
    >
      <div className="max-w-md mx-auto grid grid-cols-2 gap-3 items-center">
        {/* Button 1: [ Contact ] */}
        <button
          type="button"
          id="mobile-dock-contact-btn"
          onClick={handleContactClick}
          className={`w-full py-3 px-4 rounded-xl text-xs font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2 border transition-all active:scale-[0.98] cursor-pointer min-h-[48px] ${
            isDark
              ? 'bg-[#141418] border-white/15 text-[#F3E5AB] hover:border-[#D4AF37]/50 shadow-sm'
              : 'bg-white border-stone-300 text-[#8C6207] hover:border-[#8C6207] shadow-sm'
          }`}
        >
          <MessageSquare size={15} />
          <span>Contact</span>
        </button>

        {/* Button 2: [ Reserve Session ] */}
        <button
          type="button"
          id="mobile-dock-reserve-btn"
          data-cursor="book"
          onClick={handleReserveClick}
          className="btn-tactile-gold w-full py-3 px-4 rounded-xl font-display font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-[0.98] transition-all min-h-[48px]"
        >
          <Calendar size={15} className="text-[#1A1A1A] pointer-events-none" />
          <span className="pointer-events-none text-[#1A1A1A]">Reserve Session</span>
        </button>
      </div>
    </div>
  );
};
