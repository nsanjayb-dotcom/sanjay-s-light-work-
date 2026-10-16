import React, { useState, useRef } from 'react';
import { soundEngine } from '../utils/audio';
import { Sparkles, Sliders, Aperture, Eye } from 'lucide-react';

interface InteractiveShowcaseProps {
  isDark: boolean;
}

export const InteractiveShowcase: React.FC<InteractiveShowcaseProps> = ({ isDark }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [selectedFocalLength, setSelectedFocalLength] = useState<number>(85);
  const containerRef = useRef<HTMLDivElement>(null);

  const focalLengths = [
    { mm: 24, label: '24mm Wide', fStop: 'f/1.8', use: 'Cinematic Environments & Street' },
    { mm: 50, label: '50mm Standard', fStop: 'f/1.2', use: 'Natural Human Perspective' },
    { mm: 85, label: '85mm Portrait', fStop: 'f/1.4', use: 'Signature Creamy Bokeh & Flattery' },
    { mm: 135, label: '135mm Telephoto', fStop: 'f/1.8', use: 'Maximum Background Compression' },
  ];

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  };

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Story Column */}
        <div className="lg:col-span-5 space-y-5 text-left">
          <div className="flex items-center gap-2">
            <span className="w-5 h-px bg-amber-500" />
            <span className="text-xs uppercase font-sans tracking-[0.25em] text-amber-500 font-semibold">
              COLOR SCIENCE &amp; OPTICAL CRAFT
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold font-heading tracking-tight leading-tight">
            From RAW Flat Profile to Master Color Grade
          </h2>

          <p className={`text-sm leading-relaxed ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
            Every photo shoot undergoes bespoke color profiling. Drag the interactive split-slider to inspect raw dynamic range sensor capture versus Sanjay&apos;s filmic Kodak Portra &amp; Kodak Vision3 film curve grade.
          </p>

          {/* Focal Length Selector */}
          <div className="pt-2">
            <span className="text-xs font-sans uppercase text-zinc-400 block mb-2 font-semibold">
              Select Lens Focal Signature:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {focalLengths.map(fl => (
                <button
                  key={fl.mm}
                  onClick={() => {
                    soundEngine.playSwitch();
                    setSelectedFocalLength(fl.mm);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedFocalLength === fl.mm
                      ? 'bg-amber-500 text-black border-amber-500 font-bold shadow-md shadow-amber-500/20'
                      : isDark
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300'
                  }`}
                >
                  <span className="text-xs font-sans block">{fl.mm}mm</span>
                  <span className="text-[10px] opacity-75">{fl.fStop}</span>
                </button>
              ))}
            </div>

            <p className="text-[11px] font-sans text-amber-400 mt-2">
              Current Optic: {focalLengths.find(f => f.mm === selectedFocalLength)?.use}
            </p>
          </div>
        </div>

        {/* Right Interactive Before / After Split Canvas */}
        <div className="lg:col-span-7">
          <div
            ref={containerRef}
            id="before-after-slider-container"
            onMouseMove={handleSliderMove}
            onTouchMove={handleSliderMove}
            className="relative w-full h-[360px] sm:h-[480px] rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 select-none cursor-ew-resize group"
          >
            {/* Color Graded Image (Background) */}
            <img
              src="/src/assets/images/sanjay_hero_photo_1789499102123.jpg"
              alt="Final Master Color Grade"
              referrerPolicy="no-referrer"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-amber-400 text-xs font-sans font-semibold border border-amber-500/30">
              Master Graded
            </div>

            {/* RAW Unprocessed (Clipped Foreground Layer) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src="/src/assets/images/sanjay_hero_photo_1789499102123.jpg"
                alt="RAW Flat Sensor Capture"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover max-w-none grayscale brightness-90 contrast-75 sepia-[0.1]"
                style={{
                  width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
                  height: '100%',
                }}
              />
              <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-zinc-300 text-xs font-sans font-semibold border border-white/10">
                14-bit RAW Flat
              </div>
            </div>

            {/* Split Divider Bar */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize flex items-center justify-center pointer-events-none"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="w-8 h-8 -ml-3.5 rounded-full bg-white text-black shadow-xl flex items-center justify-center border border-zinc-300">
                <Sliders size={14} />
              </div>
            </div>

            {/* Interactive Tooltip Hint */}
            <div className="absolute bottom-4 inset-x-0 flex justify-center pointer-events-none">
              <span className="px-3.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] text-zinc-300 border border-white/10">
                Drag slider horizontally to compare
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
