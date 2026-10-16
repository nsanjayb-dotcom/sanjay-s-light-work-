import React from 'react';
import { GlassThemeStyle } from './PhysicalGlassCard';
import { soundEngine } from '../utils/audio';

interface FloatingGlassHUDProps {
  glassStyle: GlassThemeStyle;
  onChangeStyle: (style: GlassThemeStyle) => void;
  isDark?: boolean;
}

/**
 * Floating Glass Physics HUD
 * Allows users to toggle real-time optical glass shaders (Frosted Crystal, Liquid Gold, Obsidian).
 */
export const FloatingGlassHUD: React.FC<FloatingGlassHUDProps> = ({
  glassStyle,
  onChangeStyle,
  isDark = false,
}) => {
  const handleSelect = (style: GlassThemeStyle) => {
    soundEngine.playSwitch();
    soundEngine.hapticTap();
    onChangeStyle(style);
  };

  return (
    <div 
      id="glass-physics-hud"
      className="fixed bottom-6 left-4 sm:bottom-7 sm:left-7 z-40 select-none pointer-events-auto"
      style={{ filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.18))' }}
    >
      <div className="glass-theme-crystal p-1.5 sm:p-2 rounded-2xl border border-white/80 dark:border-white/20 shadow-2xl backdrop-blur-2xl flex items-center space-x-1 sm:space-x-2">
        <span className="text-[9px] font-bold tracking-widest text-[#B89028] dark:text-[#D4AF37] uppercase px-1.5 sm:px-2 hidden sm:inline">
          GLASS PHYSICS:
        </span>

        <button
          type="button"
          onClick={() => handleSelect('crystal')}
          className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
            glassStyle === 'crystal'
              ? 'bg-[#1A1A1A] text-white shadow-md scale-105'
              : 'text-[#5A544B] dark:text-stone-300 hover:text-black dark:hover:text-white'
          }`}
        >
          Crystal
        </button>

        <button
          type="button"
          onClick={() => handleSelect('gold')}
          className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
            glassStyle === 'gold'
              ? 'bg-[#B89028] text-white shadow-md scale-105'
              : 'text-[#5A544B] dark:text-stone-300 hover:text-black dark:hover:text-white'
          }`}
        >
          Gold
        </button>

        <button
          type="button"
          onClick={() => handleSelect('obsidian')}
          className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
            glassStyle === 'obsidian'
              ? 'bg-black text-white shadow-md scale-105 border border-white/20'
              : 'text-[#5A544B] dark:text-stone-300 hover:text-black dark:hover:text-white'
          }`}
        >
          Obsidian
        </button>
      </div>
    </div>
  );
};
