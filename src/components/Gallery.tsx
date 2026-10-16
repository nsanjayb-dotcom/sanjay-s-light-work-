import React, { useState, useMemo, useRef, useEffect } from 'react';
import { GalleryCategory, GalleryItem } from '../types';
import { soundEngine } from '../utils/audio';
import { LayoutGrid, Maximize, Search, Eye, Sparkles } from 'lucide-react';

interface GalleryProps {
  items: GalleryItem[];
  onSelectPhoto: (item: GalleryItem, index: number) => void;
  isDark: boolean;
}

const getAspectClass = (ratio?: string) => {
  switch (ratio) {
    case 'square':
      return 'aspect-[1/1]';
    case 'landscape':
      return 'aspect-[16/10]';
    case 'tall':
      return 'aspect-[9/16]';
    case 'portrait':
    default:
      return 'aspect-[4/5]';
  }
};

const GalleryImage: React.FC<{
  src: string;
  alt: string;
  aspectClass?: string;
  isDark?: boolean;
  className?: string;
}> = ({ src, alt, aspectClass = 'aspect-[4/5]', className = '' }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [src]);

  return (
    <div
      className={`relative overflow-hidden w-full ${aspectClass} bg-[#181512]`}
    >
      {/* Luxury Golden Dust Shimmer Skeleton Loader (#D4AF37 at 15% opacity sweeping across dark frame) */}
      {!isLoaded && (
        <div
          className="golden-dust-shimmer image-skeleton-loader absolute inset-0 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(90deg, #181512 0%, rgba(212, 175, 55, 0.15) 50%, #181512 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.8s infinite linear',
          }}
        />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        className={`${className} transition-opacity duration-[600ms] ease-out ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};

export const Gallery: React.FC<GalleryProps> = ({
  items,
  onSelectPhoto,
  isDark,
}) => {
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'masonry' | 'exhibition'>('masonry');

  const categories: { key: GalleryCategory; label: string }[] = [
    { key: 'all', label: 'All Lightwork' },
    { key: 'portraits', label: 'Portraits' },
    { key: 'editorial', label: 'Editorial' },
    { key: 'concerts', label: 'Live Concerts' },
    { key: 'weddings', label: 'Weddings' },
    { key: 'cinematography', label: 'Cinematography' },
  ];

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchesSearch = searchQuery.trim() === '' || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.client && item.client.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [items, activeCategory, searchQuery]);

  return (
    <section id="gallery-section" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header with Artistic Typography */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-px bg-amber-500" />
            <span className="text-xs uppercase font-sans tracking-[0.25em] text-amber-500 font-semibold">
              CURATED ARCHIVE
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Visual Stories &amp; Light Studies
          </h2>
          <p className={`mt-2 text-sm sm:text-base max-w-xl ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Explore medium format, 35mm analog grain, and cinematic storytelling. Click any visual for the high-res pinch-and-swipe lightbox.
          </p>
        </div>

        {/* View Mode Switcher (Addresses user's "redirect to another page if it feels clustered") */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className={`flex items-center p-1 rounded-xl border ${isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-zinc-100 border-zinc-300'}`}>
            <button
              id="gallery-view-masonry"
              onClick={() => {
                soundEngine.playSwitch();
                setViewMode('masonry');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'masonry'
                  ? 'bg-amber-500 text-black shadow-sm font-semibold'
                  : isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-black'
              }`}
              title="Responsive Masonry Grid"
            >
              <LayoutGrid size={14} />
              <span>Masonry Wall</span>
            </button>
            <button
              id="gallery-view-exhibition"
              onClick={() => {
                soundEngine.playSwitch();
                setViewMode('exhibition');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'exhibition'
                  ? 'bg-amber-500 text-black shadow-sm font-semibold'
                  : isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-black'
              }`}
              title="Uncluttered Exhibition View"
            >
              <Maximize size={14} />
              <span>Curated Exhibition</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Tabs & Quick Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-10">
        {/* Scrollable category pills on mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.key}
              id={`gallery-category-${cat.key}`}
              onClick={() => {
                soundEngine.playClick();
                setActiveCategory(cat.key);
              }}
              onMouseEnter={() => soundEngine.playHover()}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                activeCategory === cat.key
                  ? 'bg-amber-500 text-black border-amber-500 font-semibold shadow-md shadow-amber-500/10'
                  : isDark
                  ? 'bg-zinc-900/50 text-zinc-400 border-zinc-800/80 hover:border-zinc-700 hover:text-zinc-200'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400 hover:text-zinc-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Quick Search */}
        <div className="relative min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            id="gallery-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client, location..."
            className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border transition-colors focus:outline-none focus:ring-1 focus:ring-amber-500 ${
              isDark
                ? 'bg-zinc-900/60 border-zinc-800 text-zinc-200 placeholder-zinc-500'
                : 'bg-white border-zinc-300 text-zinc-800 placeholder-zinc-400'
            }`}
          />
        </div>
      </div>

      {/* Gallery Render Mode 1: Responsive Masonry Layout */}
      {viewMode === 'masonry' ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
          {filteredItems.map((item, idx) => {
            const originalIndex = items.findIndex(i => i.id === item.id);
            return (
              <div
                key={item.id}
                id={`gallery-item-${item.id}`}
                onClick={() => {
                  soundEngine.playClick();
                  onSelectPhoto(item, originalIndex);
                }}
                onMouseEnter={() => soundEngine.playHover()}
                className={`group relative overflow-hidden rounded-2xl break-inside-avoid cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl border ${
                  isDark
                    ? 'bg-zinc-900/40 border-zinc-800/60 hover:border-amber-500/40'
                    : 'bg-zinc-50 border-zinc-200/80 hover:border-amber-500/50'
                }`}
              >
                {/* Image Frame - 12px rounded on mobile, no overlays covering subject */}
                <div className="relative overflow-hidden rounded-[12px] sm:rounded-none">
                  <GalleryImage
                    src={item.imageUrl}
                    alt={item.title}
                    aspectClass={getAspectClass(item.aspectRatio)}
                    isDark={isDark}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  {/* Subtle Gradient Vignette - Desktop only */}
                  <div className="hidden sm:block absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>

                {/* Overlay Metadata on Hover - Desktop only */}
                <div className="hidden sm:flex absolute bottom-0 inset-x-0 p-4 sm:p-5 flex-col justify-end opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 text-white pointer-events-none">
                  <span className="text-[10px] uppercase font-sans tracking-widest text-amber-400 font-semibold mb-1">
                    {item.category} · {item.location || 'Ontario'}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold leading-snug">
                    {item.title}
                  </h3>
                  {item.client && (
                    <p className="text-xs text-zinc-300 mt-1 truncate">
                      {item.client}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/10 text-[11px] text-zinc-300">
                    <span className="font-sans text-amber-300">
                      Editorial Collection
                    </span>
                    <span className="flex items-center gap-1 text-white font-medium">
                      <Eye size={12} />
                      View High-Res
                    </span>
                  </div>
                </div>

                {/* Mobile: Typography BELOW Photograph in clean, muted 12px uppercase, letter-spacing +5%, color: #8C9097 */}
                <div className="sm:hidden pt-2.5 pb-1 px-1 flex justify-between items-center text-left">
                  <div className="min-w-0 pr-2">
                    <h4
                      className="truncate font-display font-bold uppercase text-[12px] tracking-[0.05em] text-[#8C9097]"
                      style={{ fontSize: '12px', letterSpacing: '0.05em', color: '#8C9097' }}
                    >
                      {item.title}
                    </h4>
                    <span
                      className="block text-[11px] uppercase tracking-[0.05em] text-[#8C9097]/80 mt-0.5 truncate"
                      style={{ letterSpacing: '0.05em', color: '#8C9097' }}
                    >
                      {item.category} {item.location ? `· ${item.location}` : ''}
                    </span>
                  </div>
                  <span
                    className="shrink-0 font-mono font-bold text-[12px] tracking-[0.05em] text-[#8C9097]"
                    style={{ fontSize: '12px', letterSpacing: '0.05em', color: '#8C9097' }}
                  >
                    {String(idx + 1).padStart(2, '0')} / {String(filteredItems.length).padStart(2, '0')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Render Mode 2: Curated Exhibition (Uncluttered, Museum-Grade Spacious Layout) */
        <div className="space-y-16 sm:space-y-24">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 flex items-center justify-between">
            <span>✨ Curated Exhibition Mode: Spacious, high-contrast visual showcases designed for uncluttered immersion.</span>
            <button
              onClick={() => setViewMode('masonry')}
              className="underline text-amber-300 hover:text-white font-semibold ml-2"
            >
              Switch back to Grid
            </button>
          </div>

          {filteredItems.map((item, idx) => {
            const originalIndex = items.findIndex(i => i.id === item.id);
            const isReversed = idx % 2 === 1;

            return (
              <div
                key={item.id}
                id={`exhibition-item-${item.id}`}
                className={`flex flex-col ${
                  isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'
                } items-center gap-8 lg:gap-14 py-4`}
              >
                {/* Visual Canvas */}
                <div
                  onClick={() => {
                    soundEngine.playClick();
                    onSelectPhoto(item, originalIndex);
                  }}
                  className="w-full lg:w-3/5 group relative overflow-hidden rounded-2xl cursor-pointer shadow-2xl transition-all duration-300 hover:scale-[1.01]"
                >
                  <GalleryImage
                    src={item.imageUrl}
                    alt={item.title}
                    aspectClass="aspect-[16/10]"
                    isDark={isDark}
                    className="w-full h-full max-h-[600px] object-cover rounded-2xl"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                    <span className="px-4 py-2 rounded-full bg-black/70 backdrop-blur-md text-amber-400 text-xs font-semibold flex items-center gap-1.5 border border-amber-500/30">
                      <Eye size={14} /> Tap to Open Lightbox
                    </span>
                  </div>
                </div>

                {/* Editorial Story & Clean Specs */}
                <div className="w-full lg:w-2/5 space-y-4 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-sans tracking-widest uppercase text-amber-500 font-bold">
                      EXHIBITION PIECE #{idx + 1}
                    </span>
                    <span className="w-8 h-px bg-amber-500/50" />
                    <span className="text-xs uppercase text-zinc-500">{item.year}</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-bold font-heading tracking-tight">
                    {item.title}
                  </h3>

                  <p className={`text-sm leading-relaxed ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                    {item.description}
                  </p>

                  <div className={`p-4 rounded-xl border space-y-2 text-xs font-sans ${
                    isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
                  }`}>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Client / Feature:</span>
                      <span className="font-semibold text-amber-500">{item.client || 'Private Commission'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Location:</span>
                      <span>{item.location || 'Ontario'}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-zinc-800/40">
                      <span className="text-zinc-500">Category:</span>
                      <span className="text-amber-400 font-medium">{item.category}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      onSelectPhoto(item, originalIndex);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold tracking-wide transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    <Eye size={14} />
                    Inspect in High Resolution
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Zero results state */}
      {filteredItems.length === 0 && (
        <div className="text-center py-20">
          <p className="text-base text-zinc-500">No photographs matched your search criteria.</p>
          <button
            onClick={() => {
              setActiveCategory('all');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 rounded-lg bg-amber-500 text-black text-xs font-semibold"
          >
            Clear Filters
          </button>
        </div>
      )}
    </section>
  );
};
