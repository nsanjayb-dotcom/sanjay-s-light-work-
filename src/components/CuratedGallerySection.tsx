import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, 
  Expand, 
  Camera, 
  Image as ImageIcon, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight,
  X
} from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface PhotoItem {
  id: string;
  src: string;
  title: string;
  subtitle: string;
  category: string;
  featured?: boolean;
}

interface MoodCollection {
  id: string;
  label: string;
  dotClass: string;
  photos: PhotoItem[];
}

const COLLECTIONS: MoodCollection[] = [
  {
    id: 'golden-grace',
    label: 'GOLDEN GRACE',
    dotClass: 'golden',
    photos: [
      {
        id: 'golden-1',
        src: '/images/golden-grace-1.jpg',
        title: 'Golden Grace',
        subtitle: 'Amber Radiance',
        category: 'PORTRAITURE',
      },
      {
        id: 'golden-2',
        src: '/images/golden-grace-2.jpg',
        title: 'Golden Grace',
        subtitle: 'Heritage Bridal Silk',
        category: 'EDITORIAL',
        featured: true,
      },
      {
        id: 'golden-3',
        src: '/images/golden-grace-3.jpg',
        title: 'Golden Grace',
        subtitle: 'Directional Daylight',
        category: 'PORTRAITURE',
      },
    ],
  },
  {
    id: 'emerald-harmony',
    label: 'EMERALD HARMONY',
    dotClass: 'emerald',
    photos: [
      {
        id: 'emerald-1',
        src: '/images/emerald-harmony-1.jpg',
        title: 'Emerald Harmony',
        subtitle: 'Forest Whispers',
        category: 'NATURAL LIGHT',
      },
      {
        id: 'emerald-2',
        src: '/images/emerald-harmony-2.jpg',
        title: 'Emerald Harmony',
        subtitle: 'Riverbank Serenity',
        category: 'ATMOSPHERE',
        featured: true,
      },
      {
        id: 'emerald-3',
        src: '/images/emerald-harmony-3.jpg',
        title: 'Emerald Harmony',
        subtitle: 'Verdant Solitude',
        category: 'LANDSCAPE',
      },
    ],
  },
  {
    id: 'still-vision',
    label: 'STILL VISION',
    dotClass: 'still',
    photos: [
      {
        id: 'still-1',
        src: '/images/still-vision-1.jpg',
        title: 'Still Vision',
        subtitle: 'Wool and Stripe',
        category: 'PORTRAIT',
      },
      {
        id: 'still-2',
        src: '/images/still-vision-2.jpg',
        title: 'Still Vision',
        subtitle: 'Over the Frames',
        category: 'EDITORIAL',
        featured: true,
      },
      {
        id: 'still-3',
        src: '/images/still-vision-3.jpg',
        title: 'Still Vision',
        subtitle: 'Between Frames',
        category: 'FINE ART',
      },
    ],
  },
  {
    id: 'misty-pine',
    label: 'MISTY PINE',
    dotClass: 'misty',
    photos: [
      {
        id: 'misty-1',
        src: '/images/misty-pine-1.jpg',
        title: 'Misty Pine',
        subtitle: 'Northern Mist',
        category: 'ONTARIO NATURE',
      },
      {
        id: 'misty-2',
        src: '/images/misty-pine-2.jpg',
        title: 'Misty Pine',
        subtitle: 'Algonquin Ridge',
        category: 'PANORAMIC',
        featured: true,
      },
      {
        id: 'misty-3',
        src: '/images/misty-pine-3.jpg',
        title: 'Misty Pine',
        subtitle: 'Twilight Solitude',
        category: 'ATMOSPHERE',
      },
    ],
  },
];

interface CuratedGalleryProps {
  onSelectPhoto: (url: string, caption: string) => void;
  onOpenArchive?: () => void;
  isDark: boolean;
  glassStyle?: any;
}

/**
 * Curated Gallery & Carousel matching https://lightworks-studio-gold.lovable.app
 * Features smooth directional carousel slides, touch swipe gesture support,
 * symmetrical 3-card photo grid, and clean mobile refinement.
 */
export const CuratedGallerySection: React.FC<CuratedGalleryProps> = ({
  onSelectPhoto,
  onOpenArchive,
  isDark,
}) => {
  // Still Vision is selected by default as in Lovable
  const [activeMoodIndex, setActiveMoodIndex] = useState(2);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const currentMood = COLLECTIONS[activeMoodIndex] || COLLECTIONS[2];

  const handlePrevMood = () => {
    soundEngine.playClick();
    soundEngine.hapticTap();
    setDirection('left');
    setActiveMoodIndex((prev) => (prev > 0 ? prev - 1 : COLLECTIONS.length - 1));
  };

  const handleNextMood = () => {
    soundEngine.playClick();
    soundEngine.hapticTap();
    setDirection('right');
    setActiveMoodIndex((prev) => (prev < COLLECTIONS.length - 1 ? prev + 1 : 0));
  };

  const handleTabClick = (index: number) => {
    soundEngine.playClick();
    soundEngine.hapticTap();
    setDirection(index >= activeMoodIndex ? 'right' : 'left');
    setActiveMoodIndex(index);
  };

  const handleCardClick = (photo: PhotoItem) => {
    soundEngine.playClick();
    soundEngine.hapticTap();
    onSelectPhoto(photo.src, `${photo.title} · ${photo.subtitle}`);
  };

  // Mobile Touch Swipe Handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX < -45) {
      // Swiped Left -> Advance to next collection
      handleNextMood();
    } else if (deltaX > 45) {
      // Swiped Right -> Go to previous collection
      handlePrevMood();
    }
    touchStartX.current = null;
  };

  // Flat list of all archive photos
  const allArchivePhotos = COLLECTIONS.flatMap((col) => col.photos);

  const slideVariants = {
    enter: (dir: 'left' | 'right') => ({
      x: dir === 'right' ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring', stiffness: 320, damping: 32 },
        opacity: { duration: 0.3 },
      },
    },
    exit: (dir: 'left' | 'right') => ({
      x: dir === 'right' ? -50 : 50,
      opacity: 0,
      transition: {
        x: { type: 'spring', stiffness: 320, damping: 32 },
        opacity: { duration: 0.25 },
      },
    }),
  };

  return (
    <section id="gallery" className="gallery-section section-wrap select-none">
      {/* Eyebrow Label */}
      <div className="eyebrow">
        <span>CURATED VISUAL TALES</span>
      </div>

      {/* Main Section Heading */}
      <h2 className="section-heading">THE ART OF SEEING</h2>

      {/* Description */}
      <p className="section-description">
        A collection shaped by light, authentic expressions, and intimate natural frames.
      </p>

      {/* Mood Tab Controls / Carousel Switcher */}
      <div className="relative inline-flex items-center justify-center my-6 max-w-full">
        {/* Previous Carousel Button (Desktop) */}
        <button
          type="button"
          onClick={handlePrevMood}
          aria-label="Previous mood"
          className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--gold)] hover:border-[var(--gold)] transition-colors mr-2 cursor-pointer shadow-sm active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Gallery Mood Tabs */}
        <div
          role="tablist"
          aria-label="Mood Collections"
          className="gallery-tabs"
        >
          {COLLECTIONS.map((col, idx) => {
            const isSelected = activeMoodIndex === idx;
            return (
              <button
                key={col.id}
                role="tab"
                type="button"
                aria-selected={isSelected}
                aria-controls="mood-gallery"
                onClick={() => handleTabClick(idx)}
                className="button-mood inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-all active:scale-98"
              >
                <span className={`mood-dot ${col.dotClass}`} />
                <span>{col.label}</span>
              </button>
            );
          })}
        </div>

        {/* Next Carousel Button (Desktop) */}
        <button
          type="button"
          onClick={handleNextMood}
          aria-label="Next mood"
          className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--gold)] hover:border-[var(--gold)] transition-colors ml-2 cursor-pointer shadow-sm active:scale-95"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 3-Photo Grid with Center Featured Card + Touch Swipe Carousel */}
      <div 
        className="w-full overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentMood.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            id="mood-gallery"
            role="tabpanel"
            aria-label={currentMood.label}
            className="photo-grid"
          >
            {currentMood.photos.map((photo) => {
              const isFeatured = !!photo.featured;
              return (
                <div
                  key={photo.id}
                  onClick={() => handleCardClick(photo)}
                  className={`photo-card cursor-pointer group ${isFeatured ? 'featured' : ''}`}
                >
                  <img
                    src={photo.src}
                    alt={`${photo.title} — ${photo.subtitle}`}
                    loading="lazy"
                    className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  {/* Featured Gold Badge on center card */}
                  {isFeatured && (
                    <span className="featured-label shadow-sm">
                      <Star className="w-2.5 h-2.5 fill-current text-[var(--gold)]" />
                      <span>FEATURED</span>
                    </span>
                  )}

                  {/* Bottom Caption & Expand Trigger */}
                  <div className="photo-caption">
                    <span className="truncate pr-2">
                      {photo.title} · {photo.subtitle}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(photo);
                      }}
                      aria-label={`Expand ${photo.subtitle}`}
                      className="photo-expand inline-flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Expand className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Symmetrical Carousel Indicator Dots */}
      <div className="flex items-center justify-center gap-2 mt-4" aria-hidden="true">
        {COLLECTIONS.map((col, idx) => (
          <button
            key={col.id}
            type="button"
            onClick={() => handleTabClick(idx)}
            aria-label={`Switch to ${col.label}`}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              activeMoodIndex === idx
                ? 'w-5 h-1.5 bg-[var(--gold)] shadow-sm'
                : 'w-1.5 h-1.5 bg-[var(--border)] hover:bg-[var(--muted-foreground)]'
            }`}
          />
        ))}
      </div>

      {/* Gallery Tagline Footer */}
      <p className="gallery-footer">
        <Camera className="w-3 h-3 text-[var(--gold)] shrink-0" />
        <span>UNSCRIPTED MOMENTS. INTENTIONAL LIGHT. TIMELESS STORIES.</span>
      </p>

      {/* Complete Archive Button */}
      <div>
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            soundEngine.hapticTap();
            if (onOpenArchive) {
              onOpenArchive();
            } else {
              setIsArchiveOpen(true);
            }
          }}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium cursor-pointer transition-colors button-editorial h-9 px-5 py-2 mt-5 rounded-full hover:border-[var(--gold)] shadow-sm"
        >
          <ImageIcon className="w-4 h-4 text-[var(--gold)]" />
          <span>View the complete archive</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Complete Archive Modal */}
      <AnimatePresence>
        {isArchiveOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="editorial-modal relative w-full max-w-4xl max-h-[85vh] bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-6">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-[var(--foreground)]">
                    COMPLETE PHOTO ARCHIVE
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    All {allArchivePhotos.length} Master Curations across Ontario, Canada
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsArchiveOpen(false)}
                  className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors cursor-pointer"
                  aria-label="Close archive"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {allArchivePhotos.map((photo) => (
                  <div
                    key={`archive-${photo.id}`}
                    onClick={() => {
                      setIsArchiveOpen(false);
                      handleCardClick(photo);
                    }}
                    className="group relative aspect-[3/4] rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--secondary)] cursor-pointer"
                  >
                    <img
                      src={photo.src}
                      alt={photo.subtitle}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                      <span className="text-[10px] font-bold text-[var(--gold)] uppercase tracking-wider">
                        {photo.category}
                      </span>
                      <span className="text-sm font-serif font-bold text-white">
                        {photo.subtitle}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
