import React, { useState, useRef, useEffect } from 'react';
import { GalleryItem, GalleryCategory } from '../types';
import { soundEngine } from '../utils/audio';
import { Maximize2, Grid, Columns } from 'lucide-react';

interface GallerySectionProps {
  items: GalleryItem[];
  onSelectPhoto: (item: GalleryItem, index: number) => void;
  isDark: boolean;
}

const GoldenDustShimmerImage: React.FC<{
  src: string;
  alt: string;
  aspectRatioClass?: string;
  isDark?: boolean;
}> = ({ src, alt, aspectRatioClass = 'aspect-[3/4]', isDark = true }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [src]);

  return (
    <div className={`relative overflow-hidden w-full ${aspectRatioClass} bg-[#1C1916]`}>
      {/* Warm Photographic Fallback Pattern if image is loading or fails */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background: 'radial-gradient(circle at 50% 40%, rgba(212, 175, 55, 0.25) 0%, rgba(20, 18, 16, 0.95) 75%)'
        }}
      />

      {/* Golden Dust Shimmer Loading Transition (#D4AF37 at 15% opacity on deep dark frame) */}
      {!isLoaded && !hasError && (
        <div
          className="golden-dust-shimmer absolute inset-0 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(90deg, #1C1916 0%, rgba(212, 175, 55, 0.22) 50%, #1C1916 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.8s infinite linear',
          }}
        />
      )}
      <img
        ref={imgRef}
        src={hasError ? '/images/still-vision-1.jpg' : src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          if (!hasError) {
            setHasError(true);
            setIsLoaded(true);
          }
        }}
        className={`w-full h-full object-cover transition-all duration-[600ms] ease-out group-hover:scale-105 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};

export const GallerySection: React.FC<GallerySectionProps> = ({
  items,
  onSelectPhoto,
  isDark,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<GalleryCategory>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'exhibition'>('grid');

  const categories: { id: GalleryCategory; label: string }[] = [
    { id: 'all', label: 'All Works' },
    { id: 'traditional', label: 'Traditional' },
    { id: 'portraits', label: 'Portraits' },
    { id: 'landscape', label: 'Landscapes' },
    { id: 'editorial', label: 'Editorial' },
    { id: 'events', label: 'Events' },
  ];

  const filteredItems = selectedCategory === 'all'
    ? items
    : items.filter(item => item.category === selectedCategory);

  return (
    <section
      id="gallery"
      data-section="gallery"
      className={`py-14 sm:py-28 px-4 sm:px-8 lg:px-12 border-t transition-colors select-none ${
        isDark ? 'border-white/[0.08] bg-[#0a0a0c]' : 'border-stone-200/80 bg-[#f5f4ef]'
      }`}
    >
      <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
          <div className="space-y-2 text-left">
            <div className={`text-[10px] sm:text-[11px] font-sans tracking-[0.25em] uppercase font-bold ${
              isDark ? 'text-[#D4AF37]' : 'text-[#8C6207]'
            }`}>
              04 / CURATED PORTFOLIO ARCHIVE
            </div>
            <h2 className="font-serif font-light text-3xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight uppercase">
              <span className={`block font-sans font-extrabold text-2xl sm:text-5xl ${isDark ? 'text-white' : 'text-[#181614]'}`}>THE</span>
              <span className={`block italic font-serif lowercase my-0.5 text-gold-shimmer`}>
                collection
              </span>
              <span className={`block font-sans font-light tracking-[0.1em] ${isDark ? 'text-white' : 'text-[#181614]'}`}>GALLERY</span>
            </h2>
          </div>

          {/* View Mode Switcher - Desktop only */}
          <div className={`hidden sm:flex items-center gap-1 border p-1 rounded-sm ${
            isDark ? 'border-white/15 bg-white/5' : 'border-stone-300 bg-white shadow-sm'
          }`}>
            <button
              onClick={() => {
                soundEngine.playSwitch();
                setViewMode('grid');
              }}
              title="Masonry Grid View"
              className={`p-2 rounded-sm transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? isDark ? 'bg-white text-black' : 'bg-stone-900 text-white'
                  : isDark ? 'text-white/60 hover:text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Grid size={15} />
            </button>
            <button
              onClick={() => {
                soundEngine.playSwitch();
                setViewMode('exhibition');
              }}
              title="Spacious Exhibition Mode"
              className={`p-2 rounded-sm transition-colors cursor-pointer ${
                viewMode === 'exhibition'
                  ? isDark ? 'bg-white text-black' : 'bg-stone-900 text-white'
                  : isDark ? 'text-white/60 hover:text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Columns size={15} />
            </button>
          </div>
        </div>

        {/* Sleek Horizontal Swipe Bar (overflow-x-auto no-scrollbar flex gap-2) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-none pb-2 border-b border-stone-200 dark:border-white/[0.08] text-xs font-sans -mx-4 px-4 sm:mx-0 sm:px-0">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  soundEngine.playClick();
                  soundEngine.hapticTap();
                  setSelectedCategory(cat.id);
                }}
                className={`min-h-[40px] px-4 py-2 whitespace-nowrap uppercase tracking-wider font-display font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'border border-[#D4AF37] bg-[#181512] text-[#F3E5AB] shadow-md shadow-amber-900/20'
                    : 'border border-stone-300 dark:border-white/10 bg-white/40 dark:bg-white/5 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* High-Impact Single-Column on Mobile, 2-3 Columns on Desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-6">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              onClick={() => {
                soundEngine.playClick();
                onSelectPhoto(item, index);
              }}
              className={`relative group cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300 shadow-md ${
                isDark
                  ? 'bg-[#181512] border-white/10 hover:border-[#D4AF37]/50'
                  : 'bg-white border-stone-300 hover:border-[#C5A059]'
              }`}
            >
              {/* Photo Frame with Uniform 3:4 Aspect Ratio and Golden Dust Shimmer Loader */}
              <div className="relative overflow-hidden aspect-[3/4] w-full bg-[#1C1916]">
                <GoldenDustShimmerImage
                  src={item.imageUrl}
                  alt={item.title}
                  aspectRatioClass="aspect-[3/4]"
                  isDark={isDark}
                />
                
                {/* Desktop subtle hover viewfinder */}
                <div className="hidden sm:flex absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-col justify-between p-6 pointer-events-none">
                  <div className="flex justify-end">
                    <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                      <Maximize2 size={15} />
                    </div>
                  </div>
                  <div className="text-left space-y-1">
                    <span className="text-[10px] font-sans tracking-widest text-[#D4AF37] uppercase font-bold">
                      {item.category}
                    </span>
                    <h4 className="font-display font-bold text-xl uppercase tracking-tight text-white">
                      {item.title}
                    </h4>
                  </div>
                </div>
              </div>

              {/* Minimal Clean Metadata Caption Placed Cleanly BELOW Photograph */}
              <div className={`p-4 flex items-center justify-between border-t text-left ${
                isDark ? 'border-white/[0.08] bg-[#141210]' : 'border-stone-200 bg-white'
              }`}>
                <div className="min-w-0 pr-3">
                  <span className={`text-[10px] font-sans uppercase tracking-widest block font-bold ${
                    isDark ? 'text-[#D4AF37]' : 'text-[#8C6207]'
                  }`}>
                    {item.category}
                  </span>
                  <h4 className={`font-display font-bold text-sm uppercase tracking-tight truncate mt-0.5 ${
                    isDark ? 'text-white' : 'text-[#181614]'
                  }`}>
                    {item.title}
                  </h4>
                </div>
                <span className={`text-xs font-mono font-bold shrink-0 ${
                  isDark ? 'text-stone-400' : 'text-stone-500'
                }`}>
                  0{index + 1}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
