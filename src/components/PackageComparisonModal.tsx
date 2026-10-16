import React, { useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Clock, Sparkles, ShieldCheck, Calendar, ArrowRight } from 'lucide-react';
import { soundEngine } from '../utils/audio';
import { PricingPackage } from '../types';

interface PackageComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPackage: (pkg: PricingPackage) => void;
  packages: PricingPackage[];
  isDark: boolean;
}

export const PackageComparisonModal: React.FC<PackageComparisonModalProps> = ({
  isOpen,
  onClose,
  onSelectPackage,
  packages,
  isDark,
}) => {
  const handleClose = useCallback(() => {
    soundEngine.playClick();
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  // Base tier reference price (Single Photo Session = $50 CAD)
  const basePrice = useMemo(() => {
    if (!packages || packages.length === 0) return 50;
    return Math.min(...packages.map(p => p.price));
  }, [packages]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-modal-title"
      data-lenis-prevent="true"
      className="fixed inset-0 z-[10000000] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-5xl rounded-2xl border shadow-2xl p-4 sm:p-6 md:p-7 my-auto select-none overflow-hidden ${
          isDark 
            ? 'bg-[#101014] border-[#D4AF37]/40 text-white shadow-[0_25px_60px_rgba(0,0,0,0.85)]' 
            : 'bg-[#FAF8F5] border-[#8C6207]/40 text-[#1A1A1A] shadow-2xl'
        }`}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-stone-200 dark:border-white/10 pb-3.5 mb-4 sm:mb-5 pr-10 text-left">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-sans font-bold uppercase tracking-widest text-[#8C6207] dark:text-[#D4AF37]">
              <Sparkles size={12} />
              <span>TRANSPARENT TIER COMPARISON</span>
            </div>
            <h2 id="comparison-modal-title" className="font-display font-black text-xl sm:text-2xl md:text-3xl uppercase tracking-tight">
              COMPARE PACKAGES &amp; DELIVERABLES
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
              Side-by-side breakdown of duration, deliverables count, and flat CAD pricing differences at a glance.
            </p>
          </div>

          {/* Close 'X' Button */}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close comparison modal"
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-9 h-9 rounded-full border border-stone-300 dark:border-white/20 bg-white/80 dark:bg-white/10 hover:bg-stone-100 dark:hover:bg-white/20 flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-sm"
          >
            <X size={18} />
          </button>
        </div>

        {/* Side-by-Side Comparison Grid (Compact & Easy to Scan) */}
        <div className="overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin">
          <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5 min-w-[620px] sm:min-w-0 text-left items-stretch">
            {packages.map((pkg) => {
              const isPopular = pkg.popular;
              const priceDiff = pkg.price - basePrice;
              const priceDiffLabel = priceDiff === 0 
                ? 'Base Tier' 
                : `+$${priceDiff} CAD difference`;

              return (
                <div
                  key={pkg.id}
                  className={`rounded-xl p-3 sm:p-4 border flex flex-col justify-between transition-all ${
                    isPopular
                      ? isDark
                        ? 'bg-[#181820] border-[#D4AF37] ring-1 ring-[#D4AF37]/50 shadow-md'
                        : 'bg-white border-[#8C6207] ring-1 ring-[#8C6207]/40 shadow-sm'
                      : isDark
                        ? 'bg-black/40 border-white/10'
                        : 'bg-white/95 border-stone-200'
                  }`}
                >
                  <div className="space-y-3">
                    {/* 1. Package Name & Price Difference */}
                    <div className="border-b border-stone-200 dark:border-white/10 pb-2.5">
                      <div className="flex items-center justify-between mb-1">
                        {isPopular ? (
                          <span className="inline-block bg-[#8C6207] dark:bg-[#D4AF37] text-white dark:text-black text-[8px] font-sans font-bold tracking-widest uppercase px-2 py-0.5 rounded-full">
                            POPULAR CHOICE
                          </span>
                        ) : (
                          <span className="inline-block text-[8px] font-mono font-bold text-stone-400 dark:text-stone-500 uppercase">
                            STANDARD TIER
                          </span>
                        )}
                        <span className="text-[9px] font-sans font-semibold text-[#8C6207] dark:text-[#D4AF37]">
                          {priceDiffLabel}
                        </span>
                      </div>

                      <h3 className="font-display font-bold text-sm sm:text-base uppercase tracking-tight line-clamp-1">
                        {pkg.name}
                      </h3>

                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="font-display font-black text-xl sm:text-2xl text-[#8C6207] dark:text-[#D4AF37]">
                          ${pkg.price}
                        </span>
                        <span className="text-[10px] font-sans font-bold uppercase text-stone-500">
                          CAD
                        </span>
                      </div>
                    </div>

                    {/* 2. Coverage Duration */}
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-sans font-bold uppercase text-stone-400 dark:text-stone-500 flex items-center gap-1">
                        <Clock size={11} className="text-[#8C6207] dark:text-[#D4AF37]" />
                        <span>Coverage Duration</span>
                      </span>
                      <p className="text-xs font-semibold text-stone-800 dark:text-stone-200 line-clamp-2">
                        {pkg.duration}
                      </p>
                    </div>

                    {/* 3. Core Included Deliverables */}
                    <div className="space-y-1.5 pt-1.5 border-t border-stone-200/60 dark:border-white/10">
                      <span className="text-[9px] font-sans font-bold uppercase text-stone-400 dark:text-stone-500 block">
                        Core Included Deliverables
                      </span>
                      <ul className="space-y-1 text-[11px] text-stone-700 dark:text-stone-300">
                        {pkg.deliverables.slice(0, 3).map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 leading-tight">
                            <Check size={12} className="shrink-0 mt-0.5 text-[#8C6207] dark:text-[#D4AF37]" strokeWidth={2.5} />
                            <span className="line-clamp-2">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Hardware Safety & Print Rights */}
                    <div className="pt-1.5 border-t border-stone-200/60 dark:border-white/10 space-y-0.5 text-[10px]">
                      <span className="font-sans font-bold uppercase text-stone-400 dark:text-stone-500 flex items-center gap-1">
                        <ShieldCheck size={11} className="text-[#8C6207] dark:text-[#D4AF37]" />
                        <span>Safety &amp; Rights</span>
                      </span>
                      <p className="text-stone-600 dark:text-stone-300 text-[10px]">
                        Full personal print rights · Private cloud
                      </p>
                    </div>
                  </div>

                  {/* Reserve Button for this Column */}
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playSuccess();
                      onSelectPackage(pkg);
                      onClose();
                    }}
                    className="w-full mt-3 btn-tactile-gold py-2 px-2.5 rounded-lg text-xs font-display font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
                  >
                    <Calendar size={13} />
                    <span>SELECT ${pkg.price}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Summary Strip */}
        <div className="mt-3.5 pt-3 border-t border-stone-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400">
          <span>All packages include unwatermarked master files. Need more time? Add extra hours for $30 CAD.</span>
          <button
            type="button"
            onClick={handleClose}
            className="text-stone-700 dark:text-stone-300 hover:text-black dark:hover:text-white font-bold cursor-pointer transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
