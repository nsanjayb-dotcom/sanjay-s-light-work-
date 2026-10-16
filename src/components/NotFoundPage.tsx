import React from 'react';
import { motion } from 'motion/react';
import { Camera, Home, ArrowLeft, Image as ImageIcon, Calendar } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { soundEngine } from '../utils/audio';

interface NotFoundPageProps {
  onGoHome: () => void;
  onOpenGallery?: () => void;
  onOpenBooking?: () => void;
  isDark: boolean;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onGoHome,
  onOpenGallery,
  onOpenBooking,
  isDark,
}) => {
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-20 text-center transition-colors ${
      isDark ? 'bg-[#08080A] text-white' : 'bg-[#F5F0E6] text-[#141312]'
    }`}>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-xl mx-auto space-y-8"
      >
        {/* Brand Identity */}
        <div className="flex justify-center pb-2">
          <BrandLogo isDark={isDark} size="lg" />
        </div>

        {/* Visual 404 Badge */}
        <div className="relative inline-flex items-center justify-center">
          <span className={`text-8xl sm:text-9xl font-display font-bold tracking-tighter opacity-15 select-none ${
            isDark ? 'text-[#D4AF37]' : 'text-[#8C6207]'
          }`}>
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`p-4 rounded-2xl border shadow-xl backdrop-blur-md ${
              isDark 
                ? 'bg-[#141418]/90 border-[#D4AF37]/40 text-[#F3E5AB]' 
                : 'bg-white/95 border-[#B8860B]/40 text-[#8C6207]'
            }`}>
              <Camera size={38} className="animate-pulse" />
            </div>
          </div>
        </div>

        {/* Editorial Headline & Helpful Description */}
        <div className="space-y-3">
          <h1 className="font-display font-bold text-3xl sm:text-4xl uppercase tracking-tight">
            Frame Not Found
          </h1>
          <p className={`text-sm sm:text-base max-w-md mx-auto leading-relaxed ${
            isDark ? 'text-zinc-400' : 'text-stone-600'
          }`}>
            The portfolio collection, photograph, or address you are trying to view might have moved or is no longer available.
          </p>
        </div>

        {/* Action Navigation Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              soundEngine.triggerHaptic(15);
              onGoHome();
            }}
            className="w-full sm:w-auto btn-tactile-gold px-6 py-3 rounded-xl font-display font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-transform active:scale-95"
          >
            <Home size={15} />
            <span>Return to Portfolio</span>
          </button>

          {onOpenGallery && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                soundEngine.triggerHaptic(15);
                onOpenGallery();
              }}
              className={`w-full sm:w-auto px-5 py-3 rounded-xl border text-xs font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isDark
                  ? 'border-white/20 bg-white/5 hover:bg-white/10 text-white'
                  : 'border-stone-300 bg-white hover:bg-stone-50 text-stone-900 shadow-sm'
              }`}
            >
              <ImageIcon size={15} />
              <span>Explore Gallery</span>
            </button>
          )}

          {onOpenBooking && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                soundEngine.triggerHaptic(15);
                onOpenBooking();
              }}
              className={`w-full sm:w-auto px-5 py-3 rounded-xl border text-xs font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isDark
                  ? 'border-[#D4AF37]/40 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#F3E5AB]'
                  : 'border-[#B8860B]/40 bg-[#B8860B]/10 hover:bg-[#B8860B]/20 text-[#8C6207]'
              }`}
            >
              <Calendar size={15} />
              <span>Reserve Shoot</span>
            </button>
          )}
        </div>

        {/* Direct Contact Fallback */}
        <div className={`pt-6 border-t text-xs ${
          isDark ? 'border-white/10 text-zinc-500' : 'border-stone-300 text-stone-500'
        }`}>
          <span>Need custom shoot availability or assistance? </span>
          <a
            href="mailto:nsanjayb@gmail.com"
            className={`font-semibold hover:underline ${
              isDark ? 'text-amber-400' : 'text-amber-700'
            }`}
          >
            nsanjayb@gmail.com
          </a>
        </div>
      </motion.div>
    </div>
  );
};
