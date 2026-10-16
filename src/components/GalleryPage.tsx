import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GalleryItem, GalleryCategory } from '../types';
import { soundEngine } from '../utils/audio';
import { 
  ArrowLeft, 
  X, 
  Maximize2,
  Sparkles,
  Camera,
  Layers
} from 'lucide-react';

interface GalleryPageProps {
  items: GalleryItem[];
  onSelectPhoto: (item: GalleryItem, index: number) => void;
  onBackToPortfolio: () => void;
  isDark: boolean;
}

interface PhotoCardData {
  src: string;
  title: string;
  featured?: boolean;
  category?: string;
  aspectRatio?: string;
}

interface CollectionSuite {
  id: string;
  name: string;
  dotClass: string;
  photos: PhotoCardData[];
}

// 4 Core Master Collections Matching https://lightworks-studio-gold.lovable.app/archive
const ARCHIVE_COLLECTIONS: CollectionSuite[] = [
  {
    id: 'golden-grace',
    name: 'Golden Grace',
    dotClass: 'bg-[#D4AF37]',
    photos: [
      {
        src: '/images/golden-grace-1.jpg',
        title: 'Warm light',
        featured: false,
        category: 'TRADITIONAL',
      },
      {
        src: '/images/golden-grace-2.jpg',
        title: 'Golden hour',
        featured: true,
        category: 'EDITORIAL',
      },
      {
        src: '/images/golden-grace-3.jpg',
        title: 'Fleeting glow',
        featured: false,
        category: 'PORTRAIT',
      },
    ],
  },
  {
    id: 'emerald-harmony',
    name: 'Emerald Harmony',
    dotClass: 'bg-[#2E7D32]',
    photos: [
      {
        src: '/images/emerald-harmony-1.jpg',
        title: 'Silk and Current',
        featured: false,
        category: 'HERITAGE',
      },
      {
        src: '/images/emerald-harmony-2.jpg',
        title: 'Veiled Gaze',
        featured: true,
        category: 'ATMOSPHERE',
      },
      {
        src: '/images/emerald-harmony-3.jpg',
        title: 'Stone and Stream',
        featured: false,
        category: 'LANDSCAPE',
      },
    ],
  },
  {
    id: 'still-vision',
    name: 'Still Vision',
    dotClass: 'bg-[#8C6207]',
    photos: [
      {
        src: '/images/still-vision-1.jpg',
        title: 'Wool and Stripe',
        featured: false,
        category: 'PORTRAIT',
      },
      {
        src: '/images/still-vision-2.jpg',
        title: 'Over the Frames',
        featured: true,
        category: 'EDITORIAL',
      },
      {
        src: '/images/still-vision-3.jpg',
        title: 'Between Frames',
        featured: false,
        category: 'STUDY',
      },
    ],
  },
  {
    id: 'misty-pine',
    name: 'Misty Pine',
    dotClass: 'bg-[#4A6572]',
    photos: [
      {
        src: '/images/misty-pine-1.jpg',
        title: 'Bridge in the Pines',
        featured: false,
        category: 'ONTARIO NATURE',
      },
      {
        src: '/images/misty-pine-2.jpg',
        title: 'Quiet Observer',
        featured: true,
        category: 'PANORAMIC',
      },
      {
        src: '/images/misty-pine-3.jpg',
        title: 'Into the Amber',
        featured: false,
        category: 'ATMOSPHERE',
      },
    ],
  },
];

export const GalleryPage: React.FC<GalleryPageProps> = ({
  items,
  onSelectPhoto,
  onBackToPortfolio,
  isDark,
}) => {
  const [activeModalPhoto, setActiveModalPhoto] = useState<{
    src: string;
    title: string;
    mood: string;
  } | null>(null);

  const [activeCategory, setActiveCategory] = useState<GalleryCategory | 'all'>('all');

  const categories: { key: GalleryCategory | 'all'; label: string }[] = [
    { key: 'all', label: 'All Works' },
    { key: 'traditional', label: 'Traditional' },
    { key: 'portraits', label: 'Portraits' },
    { key: 'editorial', label: 'Editorial' },
    { key: 'landscape', label: 'Landscapes' },
    { key: 'events', label: 'Events' },
  ];

  // Any additional items in CMS / mock data beyond the 12 primary mood suite photos
  const additionalItems = useMemo(() => {
    const coreUrls = new Set(
      ARCHIVE_COLLECTIONS.flatMap((col) => col.photos.map((p) => p.src))
    );
    return items.filter((item) => !coreUrls.has(item.imageUrl));
  }, [items]);

  const filteredAdditionalItems = useMemo(() => {
    if (activeCategory === 'all') return additionalItems;
    return additionalItems.filter((i) => i.category === activeCategory);
  }, [additionalItems, activeCategory]);

  const handlePhotoClick = (photo: PhotoCardData, mood: string) => {
    soundEngine.playClick();
    soundEngine.hapticTap();
    setActiveModalPhoto({
      src: photo.src,
      title: photo.title,
      mood,
    });
  };

  const handleOpenFullLightbox = (photoSrc: string, photoTitle: string, mood: string) => {
    const existingIndex = items.findIndex((i) => i.imageUrl === photoSrc);
    if (existingIndex !== -1) {
      onSelectPhoto(items[existingIndex], existingIndex);
    } else {
      const tempItem: GalleryItem = {
        id: `arch-${Date.now()}`,
        title: `${mood} · ${photoTitle}`,
        category: 'portraits',
        aspectRatio: 'portrait',
        imageUrl: photoSrc,
        year: '2026',
        description: `Natural light photograph from the ${mood} collection in Ontario, Canada.`,
      };
      onSelectPhoto(tempItem, 0);
    }
    setActiveModalPhoto(null);
  };

  return (
    <div className={`w-full min-h-screen text-left transition-colors duration-300 select-none ${
      isDark ? 'text-white' : 'text-[#1A1A1A]'
    }`}>
      {/* 1. Sticky Editorial Site Header (Matching Lovable /archive) */}
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

      {/* 2. Main Gallery Section Wrap */}
      <main className="section-wrap gallery-section">
        {/* Eyebrow & Main Section Heading */}
        <div className="eyebrow justify-center">The complete archive</div>
        <h1 className="section-heading text-center">EVERY STUDY IN LIGHT</h1>
        <p className="section-description max-w-xl mx-auto mt-2 text-xs sm:text-sm text-[var(--muted-foreground)] text-center">
          The complete photography archive of Sanjay's Lightworks, organised by mood: Golden Grace, Emerald Harmony, Still Vision and Misty Pine.
        </p>

        {/* Quick-Jump Mood Links */}
        <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
          {ARCHIVE_COLLECTIONS.map((col) => (
            <button
              key={col.id}
              type="button"
              onClick={() => {
                soundEngine.playSwitch();
                document.getElementById(col.id)?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="button-editorial text-xs px-3.5 py-1.5 rounded-full inline-flex items-center gap-2 cursor-pointer hover:border-[var(--gold)] transition-colors"
            >
              <span className={`w-2 h-2 rounded-full ${col.dotClass}`} />
              <span className="font-sans font-medium">{col.name}</span>
            </button>
          ))}
          {additionalItems.length > 0 && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playSwitch();
                document.getElementById('additional-archives')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="button-editorial text-xs px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 cursor-pointer hover:border-[var(--gold)]"
            >
              <Layers className="w-3 h-3 text-[var(--gold)]" />
              <span>More Studies ({additionalItems.length})</span>
            </button>
          )}
        </div>

        {/* 3. The 4 Core Mood Sections (Exact Lovable Layout & Structure) */}
        {ARCHIVE_COLLECTIONS.map((col) => (
          <section
            key={col.id}
            id={col.id}
            className="mt-14 sm:mt-20 scroll-mt-28"
            aria-labelledby={col.name}
          >
            <h2 id={col.name} className="serif text-3xl mb-6 text-center text-[var(--foreground)] font-serif">
              {col.name}
            </h2>

            <div className="photo-grid">
              {col.photos.map((photo, pIdx) => {
                const isFeatured = pIdx === 1 || photo.featured;
                return (
                  <div
                    key={`${col.id}-${photo.title}`}
                    className={`photo-card ${isFeatured ? 'featured' : ''} group`}
                  >
                    <button
                      type="button"
                      className="block h-full w-full cursor-pointer focus:outline-none"
                      aria-label={`Expand ${photo.title}`}
                      onClick={() => handlePhotoClick(photo, col.name)}
                    >
                      <img
                        src={photo.src}
                        alt={`${col.name} — ${photo.title}`}
                        loading="lazy"
                        width={768}
                        height={1152}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => {
                          // Guaranteed fallback
                          (e.target as HTMLImageElement).src = '/images/still-vision-1.jpg';
                        }}
                      />
                    </button>
                    <div className="photo-caption">
                      <span>{col.name} · {photo.title}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* 4. Additional Archive Studies & Custom Uploads */}
        {additionalItems.length > 0 && (
          <section id="additional-archives" className="mt-20 sm:mt-24 pt-12 border-t border-[var(--border)] scroll-mt-28">
            <div className="text-center space-y-2 mb-8">
              <div className="eyebrow justify-center">Extended photographic collection</div>
              <h2 className="serif text-3xl font-serif text-[var(--foreground)]">
                ADDITIONAL LIGHTWORKS &amp; COMMISSIONS
              </h2>
              <p className="text-xs text-[var(--muted-foreground)] max-w-lg mx-auto">
                Explore dedicated portraiture, traditional rites, and landscape studies across Ontario.
              </p>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap mb-8">
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
                    className={`px-3.5 py-1.5 text-xs font-sans uppercase tracking-wider transition-all rounded-full cursor-pointer border ${
                      isActive
                        ? 'border-[var(--gold)] bg-[var(--primary)] text-[var(--primary-foreground)] font-bold shadow-sm'
                        : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--gold)]'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Additional Photos Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-[970px] mx-auto">
              {filteredAdditionalItems.map((item, index) => {
                const actualIndex = items.findIndex((i) => i.id === item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      soundEngine.playClick();
                      onSelectPhoto(item, actualIndex !== -1 ? actualIndex : index);
                    }}
                    className="photo-card group cursor-pointer"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden bg-[var(--secondary)]">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/still-vision-1.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end text-left">
                        <span className="text-[10px] font-bold text-[var(--gold)] uppercase tracking-wider">
                          {item.category}
                        </span>
                        <h4 className="font-serif text-sm font-bold text-white truncate">
                          {item.title}
                        </h4>
                      </div>
                    </div>
                    <div className="photo-caption">
                      <span>{item.category.toUpperCase()} · {item.title}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Archive Footer Note */}
        <div className="mt-20 pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--muted-foreground)]">
          <div className="flex items-center gap-2">
            <Camera className="w-3.5 h-3.5 text-[var(--gold)]" />
            <span>AUTHENTIC UNPOSED PHOTOGRAPHY ACROSS ONTARIO, CANADA</span>
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

      {/* 5. Lightbox Modal (Exact Lovable Editorial Modal Lightbox) */}
      <AnimatePresence>
        {activeModalPhoto && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={() => setActiveModalPhoto(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="editorial-modal lightbox relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setActiveModalPhoto(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition-colors z-10 cursor-pointer shadow-md"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              {/* High-Resolution Photograph Display */}
              <img
                src={activeModalPhoto.src}
                alt={`${activeModalPhoto.mood} — ${activeModalPhoto.title}`}
                className="w-full object-contain rounded-md shadow-lg"
              />

              {/* Caption & Actions */}
              <div className="flex items-center justify-between mt-3 px-1">
                <span className="serif text-sm text-[var(--foreground)] font-serif">
                  {activeModalPhoto.mood} · {activeModalPhoto.title}
                </span>

                <button
                  type="button"
                  onClick={() => handleOpenFullLightbox(activeModalPhoto.src, activeModalPhoto.title, activeModalPhoto.mood)}
                  className="text-xs text-[var(--gold)] font-medium hover:underline inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Full Lightbox</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
