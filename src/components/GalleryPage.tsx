import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GalleryItem, GalleryCategory } from '../types';
import { soundEngine } from '../utils/audio';
import { 
  ArrowLeft, 
  X, 
  Maximize2,
  Camera,
  Layers,
  LayoutGrid,
  Columns,
  Search,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { LazyImage } from './LazyImage';

interface GalleryPageProps {
  items: GalleryItem[];
  onSelectPhoto: (item: GalleryItem, index: number) => void;
  onBackToPortfolio: () => void;
  isDark: boolean;
}

interface CollectionSuite {
  id: string;
  name: string;
  subtitle: string;
  dotClass: string;
  dotColor: string;
  description: string;
}

const MOOD_SUITES: CollectionSuite[] = [
  {
    id: 'golden-grace',
    name: 'Golden Grace',
    subtitle: 'Warm light & heirloom bridal silk',
    dotClass: 'bg-[#D4AF37]',
    dotColor: '#D4AF37',
    description: 'Golden Grace celebrates tradition through warm tonal grading, natural directional daylight, and heirloom silks.',
  },
  {
    id: 'emerald-harmony',
    name: 'Emerald Harmony',
    subtitle: 'Forest greens & natural canopy',
    dotClass: 'bg-[#2E7D32]',
    dotColor: '#2E7D32',
    description: 'Emerald Harmony explores tradition beyond familiar spaces, placing cultural portraits in lush Ontario landscapes.',
  },
  {
    id: 'still-vision',
    name: 'Still Vision',
    subtitle: 'Low-key chiaroscuro & introspection',
    dotClass: 'bg-[#8C6207]',
    dotColor: '#8C6207',
    description: 'Still Vision focuses on the space between action and stillness, where quiet expressions reveal honest character.',
  },
  {
    id: 'misty-pine',
    name: 'Misty Pine',
    subtitle: 'Ontario boreal fog & weathered timber',
    dotClass: 'bg-[#4A6572]',
    dotColor: '#4A6572',
    description: 'Misty Pine captures cool boreal mist, deep slate indigo, and evergreen ridges across Canadian wilderness.',
  },
];

export const GalleryPage: React.FC<GalleryPageProps> = ({
  items,
  onSelectPhoto,
  onBackToPortfolio,
  isDark,
}) => {
  const [activeCategory, setActiveCategory] = useState<GalleryCategory | 'all'>('all');
  const [selectedMoodSuite, setSelectedMoodSuite] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'masonry' | 'curated' | 'exhibition'>('masonry');
  const [activeModalPhoto, setActiveModalPhoto] = useState<GalleryItem | null>(null);

  const categories: { key: GalleryCategory | 'all'; label: string }[] = [
    { key: 'all', label: 'All Works' },
    { key: 'traditional', label: 'Traditional' },
    { key: 'portraits', label: 'Portraits' },
    { key: 'editorial', label: 'Editorial' },
    { key: 'landscape', label: 'Landscapes' },
    { key: 'events', label: 'Events' },
  ];

  // Filter items according to search, category, and selected mood suite
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Category match
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;

      // 2. Mood suite match
      let matchesMood = true;
      if (selectedMoodSuite !== 'all') {
        const titleLower = item.title.toLowerCase();
        const descLower = (item.description || '').toLowerCase();
        const urlLower = item.imageUrl.toLowerCase();
        const moodKey = selectedMoodSuite.toLowerCase();

        if (moodKey === 'golden-grace') {
          matchesMood = urlLower.includes('golden-grace') || titleLower.includes('golden') || descLower.includes('golden');
        } else if (moodKey === 'emerald-harmony') {
          matchesMood = urlLower.includes('emerald-harmony') || titleLower.includes('emerald') || descLower.includes('emerald');
        } else if (moodKey === 'still-vision') {
          matchesMood = urlLower.includes('still-vision') || titleLower.includes('still') || descLower.includes('still');
        } else if (moodKey === 'misty-pine') {
          matchesMood = urlLower.includes('misty-pine') || titleLower.includes('misty') || descLower.includes('misty') || titleLower.includes('pine');
        }
      }

      // 3. Search query match
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = query === '' || 
        item.title.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.location && item.location.toLowerCase().includes(query)) ||
        item.category.toLowerCase().includes(query);

      return matchesCategory && matchesMood && matchesSearch;
    });
  }, [items, activeCategory, selectedMoodSuite, searchQuery]);

  const handleOpenPhoto = (item: GalleryItem) => {
    soundEngine.playClick();
    soundEngine.hapticTap();
    const originalIndex = items.findIndex((i) => i.id === item.id);
    onSelectPhoto(item, originalIndex !== -1 ? originalIndex : 0);
  };

  // Group photos by mood suite for Curated Suites View
  const photosBySuite = useMemo(() => {
    return MOOD_SUITES.map((suite) => {
      const suitePhotos = items.filter((item) => {
        const urlLower = item.imageUrl.toLowerCase();
        const titleLower = item.title.toLowerCase();
        const descLower = (item.description || '').toLowerCase();

        if (suite.id === 'golden-grace') {
          return urlLower.includes('golden-grace') || titleLower.includes('golden');
        } else if (suite.id === 'emerald-harmony') {
          return urlLower.includes('emerald-harmony') || titleLower.includes('emerald');
        } else if (suite.id === 'still-vision') {
          return urlLower.includes('still-vision') || titleLower.includes('still');
        } else if (suite.id === 'misty-pine') {
          return urlLower.includes('misty-pine') || titleLower.includes('misty');
        }
        return false;
      });

      return {
        ...suite,
        photos: suitePhotos,
      };
    });
  }, [items]);

  return (
    <div className={`w-full min-h-screen text-left transition-colors duration-300 select-none ${
      isDark ? 'text-white' : 'text-[#1A1A1A]'
    }`}>
      {/* 1. Sticky Editorial Site Header */}
      <header className="site-header">
        <div className="header-inner">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onBackToPortfolio();
            }}
            className="brand cursor-pointer text-left bg-transparent border-0 p-0 transition-opacity hover:opacity-80"
            aria-label="Return home"
          >
            <span className="brand-name font-bold tracking-tight">SANJAY’S LIGHTWORKS</span>
            <span className="brand-line">PHOTOGRAPHY &amp; CINEMATOGRAPHY</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onBackToPortfolio();
            }}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium cursor-pointer transition-colors button-editorial h-9 px-4 py-2 rounded-full hover:border-[var(--gold)] shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back home</span>
          </button>
        </div>
      </header>

      {/* 2. Main Gallery Wrap */}
      <main className="section-wrap py-10 sm:py-16">
        {/* Eyebrow & Main Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <div className="eyebrow justify-center">The complete photo archive</div>
          <h1 className="section-heading text-center text-4xl sm:text-5xl font-serif">
            EVERY STUDY IN LIGHT
          </h1>
          <p className="section-description max-w-xl mx-auto text-xs sm:text-sm text-[var(--muted-foreground)]">
            Every unscripted portrait, traditional ceremony, and atmospheric Ontario landscape presented in full, original un-cropped composition.
          </p>
        </div>

        {/* 3. Interactive Filter Bar & View Mode Switcher */}
        <div className="space-y-4 mb-10 pb-6 border-b border-[var(--border)]">
          {/* Quick-Jump Mood Links */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                soundEngine.playSwitch();
                setSelectedMoodSuite('all');
              }}
              className={`text-xs px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 cursor-pointer transition-all border ${
                selectedMoodSuite === 'all'
                  ? 'border-[var(--gold)] bg-[var(--primary)] text-[var(--primary-foreground)] font-bold shadow-xs'
                  : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--gold)]'
              }`}
            >
              <span>All Collections</span>
            </button>

            {MOOD_SUITES.map((col) => {
              const isSelected = selectedMoodSuite === col.id;
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playSwitch();
                    setSelectedMoodSuite(isSelected ? 'all' : col.id);
                  }}
                  className={`text-xs px-3.5 py-1.5 rounded-full inline-flex items-center gap-2 cursor-pointer transition-all border ${
                    isSelected
                      ? 'border-[var(--gold)] bg-[var(--primary)] text-[var(--primary-foreground)] font-bold shadow-xs'
                      : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--gold)]'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${col.dotClass}`} />
                  <span className="font-sans">{col.name}</span>
                </button>
              );
            })}
          </div>

          {/* Category Tabs & View Mode Row */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
            {/* Category Filter Buttons */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => {
                      soundEngine.playSwitch();
                      setActiveCategory(cat.key);
                    }}
                    className={`px-3 py-1.5 text-xs font-sans uppercase tracking-wider transition-all rounded-md cursor-pointer border ${
                      isActive
                        ? 'border-[var(--gold)] bg-[var(--primary)] text-[var(--primary-foreground)] font-bold shadow-xs'
                        : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--gold)]'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-2 bg-[var(--secondary)] p-1 rounded-lg border border-[var(--border)]">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSwitch();
                  setViewMode('masonry');
                }}
                title="Masonry Wall View (Uncropped Natural Proportions)"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'masonry'
                    ? 'bg-[var(--card)] text-[var(--gold)] font-bold shadow-xs'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Masonry Wall</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playSwitch();
                  setViewMode('curated');
                }}
                title="Curated Mood Suites"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'curated'
                    ? 'bg-[var(--card)] text-[var(--gold)] font-bold shadow-xs'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Curated Suites</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playSwitch();
                  setViewMode('exhibition');
                }}
                title="Exhibition Showcase Mode"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'exhibition'
                    ? 'bg-[var(--card)] text-[var(--gold)] font-bold shadow-xs'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exhibition</span>
              </button>
            </div>
          </div>
        </div>

        {/* Photo Count Header */}
        <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] mb-6 px-1">
          <span>
            Showing <strong className="text-[var(--foreground)]">{filteredItems.length}</strong> master curations
          </span>
          {activeCategory !== 'all' || selectedMoodSuite !== 'all' ? (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setActiveCategory('all');
                setSelectedMoodSuite('all');
              }}
              className="text-[var(--gold)] hover:underline cursor-pointer"
            >
              Reset all filters
            </button>
          ) : null}
        </div>

        {/* 4. GALLERY RENDER LAYOUTS (100% Un-Cropped & Authentic) */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[var(--border)] rounded-2xl p-8">
            <Camera className="w-8 h-8 text-[var(--gold)] mx-auto mb-3 opacity-60" />
            <h3 className="font-serif text-lg font-bold">No photographs found</h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Try adjusting your category filter or search query.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('all');
                setSelectedMoodSuite('all');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 rounded-full button-editorial text-xs font-semibold"
            >
              Show All Works
            </button>
          </div>
        ) : viewMode === 'masonry' ? (
          /* =================================================================
             MODE A: MASONRY WALL (Preserves natural height & aspect ratio)
             ================================================================= */
          <div className="gallery-masonry-container">
            {filteredItems.map((item, idx) => (
              <div key={item.id} className="gallery-masonry-item">
                <div
                  onClick={() => handleOpenPhoto(item)}
                  className="archive-photo-card group cursor-pointer"
                >
                  {/* Photo container without fixed height or aggressive cropping */}
                  <div className="relative w-full overflow-hidden bg-[var(--secondary)]">
                    <LazyImage
                      src={item.imageUrl}
                      alt={item.title}
                      aspectRatio="auto"
                      containerClassName="w-full"
                      className="w-full h-auto object-contain block transition-transform duration-700 group-hover:scale-[1.02]"
                    />

                    {/* Subtle Hover Action Viewfinder */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4">
                      <div className="w-10 h-10 rounded-full bg-black/75 text-white flex items-center justify-center shadow-lg border border-white/20 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                        <Maximize2 className="w-4 h-4 text-[var(--gold)]" />
                      </div>
                    </div>
                  </div>

                  {/* Clean Typography Metadata (Zero-Pill Compliance) */}
                  <div className="p-3.5 sm:p-4 text-left border-t border-[var(--border)] bg-[var(--card)] flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-[var(--gold)] font-bold uppercase tracking-wider">
                        <span>{item.category}</span>
                        {item.year && (
                          <>
                            <span aria-hidden="true" className="opacity-40">·</span>
                            <span className="text-[var(--muted-foreground)]">{item.year}</span>
                          </>
                        )}
                      </div>
                      <h3 className="font-serif text-sm font-semibold text-[var(--foreground)] truncate mt-1">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-[11px] text-[var(--muted-foreground)] line-clamp-2 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-[var(--muted-foreground)] font-bold shrink-0 mt-0.5">
                      0{idx + 1}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === 'curated' ? (
          /* =================================================================
             MODE B: CURATED SUITES (Grouped into the 4 Iconic Collections)
             ================================================================= */
          <div className="space-y-16 sm:space-y-24">
            {photosBySuite.map((suite) => {
              if (suite.photos.length === 0) return null;
              return (
                <section
                  key={suite.id}
                  id={suite.id}
                  className="scroll-mt-28"
                  aria-labelledby={`heading-${suite.id}`}
                >
                  <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${suite.dotClass}`} />
                      <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--gold)]">
                        SIGNATURE MOOD SUITE
                      </span>
                    </div>
                    <h2
                      id={`heading-${suite.id}`}
                      className="font-serif text-3xl sm:text-4xl font-bold text-[var(--foreground)]"
                    >
                      {suite.name}
                    </h2>
                    <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                      {suite.description}
                    </p>
                  </div>

                  {/* Responsive Grid with Complete Aspect Ratio Retention */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {suite.photos.map((photo, pIdx) => (
                      <div
                        key={photo.id}
                        onClick={() => handleOpenPhoto(photo)}
                        className="archive-photo-card group cursor-pointer flex flex-col justify-between"
                      >
                        <div className="relative w-full overflow-hidden bg-[var(--secondary)]">
                          <LazyImage
                            src={photo.imageUrl}
                            alt={photo.title}
                            aspectRatio="auto"
                            containerClassName="w-full"
                            className="w-full h-auto object-contain block transition-transform duration-500 group-hover:scale-[1.02]"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Maximize2 className="w-5 h-5 text-white" />
                          </div>
                        </div>

                        <div className="p-4 border-t border-[var(--border)] text-left bg-[var(--card)]">
                          <span className="text-[10px] font-bold text-[var(--gold)] uppercase tracking-wider block">
                            {photo.category}
                          </span>
                          <h4 className="font-serif text-sm font-semibold text-[var(--foreground)] mt-0.5">
                            {photo.title}
                          </h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          /* =================================================================
             MODE C: EXHIBITION SHOWCASE (Spacious 2-column editorial showcase)
             ================================================================= */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
            {filteredItems.map((item, idx) => (
              <article
                key={item.id}
                onClick={() => handleOpenPhoto(item)}
                className="archive-photo-card group cursor-pointer flex flex-col justify-between"
              >
                <div className="relative w-full overflow-hidden bg-[var(--secondary)]">
                  <LazyImage
                    src={item.imageUrl}
                    alt={item.title}
                    aspectRatio="auto"
                    containerClassName="w-full"
                    className="w-full h-auto object-contain block transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-3.5 h-3.5 text-[var(--gold)]" />
                  </div>
                </div>

                <div className="p-5 sm:p-6 text-left border-t border-[var(--border)] bg-[var(--card)] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-bold text-[var(--gold)] uppercase tracking-wider">
                      {item.category}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
                      PLATE #{idx + 1}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[var(--foreground)]">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                      {item.description}
                    </p>
                  )}
                  {item.location && (
                    <div className="pt-2 text-[10px] text-[var(--muted-foreground)] flex items-center gap-1 font-mono">
                      <span>LOCATION:</span>
                      <strong className="text-[var(--foreground)]">{item.location}</strong>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* 5. Archive Footer Note */}
        <div className="mt-20 pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--muted-foreground)]">
          <div className="flex items-center gap-2">
            <Camera className="w-3.5 h-3.5 text-[var(--gold)] shrink-0" />
            <span>AUTHENTIC UNPOSED PHOTOGRAPHY ACROSS ONTARIO, CANADA · FULL RESOLUTION ARCHIVE</span>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hover:text-[var(--gold)] transition-colors cursor-pointer"
          >
            Back to Top ↑
          </button>
        </div>
      </main>
    </div>
  );
};
