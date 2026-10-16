import React from 'react';
import { motion } from 'motion/react';
import { Calendar, MessageCircle, ArrowRight } from 'lucide-react';
import { soundEngine } from '../utils/audio';
import { getWhatsAppUrl } from '../utils/social';

interface MobileUnifiedActionBarProps {
  onOpenBooking: () => void;
  onOpenEnquiry?: () => void;
  isDark: boolean;
  activePackageName?: string;
  activePrice?: number;
  currentView?: string;
  isModalOpen?: boolean;
}

export const MobileUnifiedActionBar: React.FC<MobileUnifiedActionBarProps> = ({
  onOpenBooking,
  isDark,
  activePackageName = 'Session',
  activePrice = 50,
  currentView = 'portfolio',
  isModalOpen = false,
}) => {
  // Hide action bar if a full-screen modal/dialog is currently active
  if (isModalOpen) return null;

  const handleWhatsApp = () => {
    soundEngine.playClick();
    soundEngine.hapticTap();
    const url = getWhatsAppUrl(`Hello Sanjay! I'm on your site and would love to enquire about reserving a ${activePackageName} photoshoot.`);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleBook = () => {
    soundEngine.playClick();
    soundEngine.hapticTap();
    onOpenBooking();
  };

  return (
    <aside
      id="mobile-unified-action-bar"
      aria-label="Quick Mobile Actions"
      className="md:hidden fixed bottom-0 inset-x-0 z-[990] select-none pointer-events-auto"
    >
      <div className="backdrop-blur-xl bg-[#181512]/92 dark:bg-[#141210]/95 border-t border-[#D4AF37]/25 shadow-[0_-8px_32px_rgba(0,0,0,0.65)] px-4 pt-2.5 pb-[max(12px,calc(10px+env(safe-area-inset-bottom)))]">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          {/* Left: Quick WhatsApp Inquiry */}
          <button
            type="button"
            onClick={handleWhatsApp}
            aria-label="Direct WhatsApp Consultation with Sanjay"
            className="h-12 w-12 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-[#25D366]"
          >
            <MessageCircle size={20} strokeWidth={2.2} />
          </button>

          {/* Center Info: Dynamic Pricing / Current Tier Note */}
          <div className="flex-1 min-w-0 text-left">
            <div className="text-[10px] font-sans font-bold tracking-widest uppercase text-[#D4AF37] truncate">
              {currentView === 'booking' ? 'DIRECT RESERVATION' : 'ONTARIO STUDIO'}
            </div>
            <div className="text-xs font-serif font-bold text-white tracking-wide truncate">
              From <span className="font-mono text-[#F3E5AB]">${activePrice} CAD</span>
              <span className="text-[10px] font-sans font-normal text-stone-400 ml-1">· all-inclusive</span>
            </div>
          </div>

          {/* Right: Primary Book Session Action CTA */}
          <button
            type="button"
            id="mobile-action-bar-book-btn"
            onClick={handleBook}
            className="btn-tactile-gold h-12 px-5 rounded-xl font-display font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-95 transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <Calendar size={15} />
            <span>RESERVE</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
};
