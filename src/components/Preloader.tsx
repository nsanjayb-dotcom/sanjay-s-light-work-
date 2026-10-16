import React, { useState, useEffect } from 'react';

interface PreloaderProps {
  onComplete: () => void;
}

export const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsFading(true);
          setTimeout(() => {
            onComplete();
          }, 600);
          return 100;
        }
        return prev + 5;
      });
    }, 45);

    return () => clearInterval(timer);
  }, [onComplete]);

  const letters = ['S', 'A', 'N', 'J', 'A', 'Y', "'", 'S'];

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col items-center justify-center transition-opacity duration-700 select-none ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="space-y-6 text-center">
        {/* Animated Letters */}
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          {letters.map((char, index) => (
            <span
              key={index}
              className="font-display text-3xl sm:text-5xl font-semibold text-white tracking-widest inline-block animate-pulse"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {char}
            </span>
          ))}
        </div>

        <div className="text-[11px] font-sans tracking-[0.3em] text-white/40 uppercase">
          LIGHTWORKS · PORTFOLIO
        </div>

        {/* Minimalist Progress Line */}
        <div className="w-48 sm:w-64 h-[1px] bg-white/10 mx-auto overflow-hidden relative">
          <div
            className="h-full bg-white transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="text-xs font-sans text-white/30 tracking-widest">
          {progress}%
        </div>
      </div>
    </div>
  );
};
