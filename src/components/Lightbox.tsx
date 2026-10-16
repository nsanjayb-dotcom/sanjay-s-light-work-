import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GalleryItem } from '../types';
import { soundEngine } from '../utils/audio';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Camera, 
  Calendar, 
  MapPin, 
  Download, 
  Share2, 
  Info,
  Maximize2
} from 'lucide-react';

interface LightboxProps {
  items: GalleryItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  isDark: boolean;
}

export const Lightbox: React.FC<LightboxProps> = ({
  items,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  isDark,
}) => {
  const [scale, setScale] = useState(1);
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Dedicated refs for high-precision gesture recognition (pinch-to-zoom, pan, swipe)
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const touchStartDistRef = useRef<number | null>(null);
  const initialScaleRef = useRef<number>(1);
  const initialPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartSingleRef = useRef<{ x: number; y: number } | null>(null);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const isMouseDownRef = useRef(false);
  const mouseStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const currentItem = items[currentIndex];

  // Reset zoom and pan when active item changes or lightbox closes
  useEffect(() => {
    setScale(1);
    setPanOffset({ x: 0, y: 0 });
    setIsInteracting(false);
  }, [currentIndex, isOpen]);

  // Keyboard navigation & accessibility
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        soundEngine.playClick();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      } else if (e.key === 'i' || e.key === 'I') {
        setShowDetails(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Lock background scrolling with Lenis synchronization
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    try {
      (window as any).__lenis?.stop();
    } catch {}

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow || 'auto';
      document.body.classList.remove('modal-open');
      try {
        (window as any).__lenis?.start();
      } catch {}
    };
  }, [isOpen, currentIndex, items.length]);

  const handleNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      soundEngine.playHover();
      onNavigate(currentIndex + 1);
    } else {
      // Loop to beginning
      soundEngine.playHover();
      onNavigate(0);
    }
  }, [currentIndex, items.length, onNavigate]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      soundEngine.playHover();
      onNavigate(currentIndex - 1);
    } else {
      // Loop to end
      soundEngine.playHover();
      onNavigate(items.length - 1);
    }
  }, [currentIndex, items.length, onNavigate]);

  const handleZoomIn = () => {
    soundEngine.playClick();
    setScale(prev => Math.min(prev + 0.5, 3.5));
  };

  const handleZoomOut = () => {
    soundEngine.playClick();
    setScale(prev => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    soundEngine.playSwitch();
    setScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Touch & Gesture Recognition Handlers on .lightbox-image-container
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      // Two fingers: Pinch-to-zoom recognition
      setIsInteracting(true);
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      const dist = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      touchStartDistRef.current = dist;
      initialScaleRef.current = scale;
      initialPanRef.current = { ...panOffset };
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
      touchStartSingleRef.current = { x: touch.clientX, y: touch.clientY };

      // Double-tap to zoom toggle (1x <-> 2.5x) into tapped point
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTimeRef.current;
      if (timeSinceLastTap < 320) {
        soundEngine.playClick();
        if (scale > 1.2) {
          handleResetZoom();
        } else {
          const containerRect = imageContainerRef.current?.getBoundingClientRect();
          if (containerRect) {
            const tapX = touch.clientX - (containerRect.left + containerRect.width / 2);
            const tapY = touch.clientY - (containerRect.top + containerRect.height / 2);
            setScale(2.5);
            setPanOffset({ x: -tapX * 0.75, y: -tapY * 0.75 });
          } else {
            setScale(2.5);
          }
        }
        lastTapTimeRef.current = 0;
        return;
      }
      lastTapTimeRef.current = now;

      if (scale > 1.05) {
        setIsInteracting(true);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      // 2-Finger Pinch-to-Zoom gesture processing
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      const currentDist = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );

      const ratio = currentDist / touchStartDistRef.current;
      // Allow fluid magnification up to 5.0x for inspecting fine portrait & landscape details
      const newScale = Math.min(Math.max(initialScaleRef.current * ratio, 0.85), 5.0);
      setScale(newScale);

      // Dynamic focal offset towards pinch center
      const currentMidX = (touch1.clientX + touch2.clientX) / 2;
      const currentMidY = (touch1.clientY + touch2.clientY) / 2;
      const containerRect = imageContainerRef.current?.getBoundingClientRect();

      if (containerRect) {
        const centerOffsetX = currentMidX - (containerRect.left + containerRect.width / 2);
        const centerOffsetY = currentMidY - (containerRect.top + containerRect.height / 2);

        const scaleDelta = newScale - initialScaleRef.current;
        const focalOffsetX = -centerOffsetX * (scaleDelta / (initialScaleRef.current || 1)) * 0.35;
        const focalOffsetY = -centerOffsetY * (scaleDelta / (initialScaleRef.current || 1)) * 0.35;

        setPanOffset({
          x: initialPanRef.current.x + focalOffsetX,
          y: initialPanRef.current.y + focalOffsetY,
        });
      }
    } else if (e.touches.length === 1 && scale > 1.05 && lastTouchRef.current) {
      // 1-Finger Pan when zoomed in
      const touch = e.touches[0];
      const deltaX = touch.clientX - lastTouchRef.current.x;
      const deltaY = touch.clientY - lastTouchRef.current.y;

      const containerRect = imageContainerRef.current?.getBoundingClientRect();
      const maxPanX = containerRect ? (containerRect.width * (scale - 1)) / 1.5 : 900;
      const maxPanY = containerRect ? (containerRect.height * (scale - 1)) / 1.5 : 900;

      setPanOffset(prev => ({
        x: Math.max(-maxPanX, Math.min(maxPanX, prev.x + deltaX)),
        y: Math.max(-maxPanY, Math.min(maxPanY, prev.y + deltaY)),
      }));

      lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsInteracting(false);
    touchStartDistRef.current = null;

    // Smooth bounce back if scale is below 1.05x
    if (scale < 1.05) {
      setScale(1);
      setPanOffset({ x: 0, y: 0 });
    }

    // Horizontal swipe navigation when unzoomed
    if (touchStartSingleRef.current && scale <= 1.05 && e.changedTouches.length === 1) {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - touchStartSingleRef.current.x;
      const diffY = endY - touchStartSingleRef.current.y;

      if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0) {
          handlePrev();
        } else {
          handleNext();
        }
      }
    }

    touchStartSingleRef.current = null;
    lastTouchRef.current = null;
  };

  // Mouse pan & wheel zoom support for desktop inspection
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1.05) {
      isMouseDownRef.current = true;
      mouseStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      setIsInteracting(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMouseDownRef.current && scale > 1.05) {
      setPanOffset({
        x: e.clientX - mouseStartRef.current.x,
        y: e.clientY - mouseStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
    setIsInteracting(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
    setScale(prev => {
      const next = Math.min(Math.max(prev * zoomFactor, 1), 5.0);
      if (next <= 1.05) {
        setPanOffset({ x: 0, y: 0 });
        return 1;
      }
      return next;
    });
  };

  const handleShare = () => {
    soundEngine.playClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen || !currentItem) return null;

  return (
    <div
      id="portfolio-lightbox-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Photo Lightbox: ${currentItem.title}`}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95 backdrop-blur-xl select-none"
    >
      {/* PERSISTENT HIGH Z-INDEX CLOSE (X) BUTTON IN TOP-RIGHT CORNER */}
      <button
        id="lightbox-persistent-close-btn"
        onClick={(e) => {
          e.stopPropagation();
          soundEngine.playClick();
          onClose();
        }}
        aria-label="Close full-screen lightbox (Escape)"
        style={{
          position: 'fixed',
          top: '20px',
          right: '25px',
          zIndex: 100000,
        }}
        className="w-12 h-12 rounded-full bg-black/90 hover:bg-black text-white hover:text-[#D4AF37] border-2 border-white/40 hover:border-[#D4AF37] backdrop-blur-md shadow-2xl flex items-center justify-center transition-all duration-200 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-[#D4AF37] cursor-pointer"
        title="Close (Escape)"
      >
        <X size={22} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Top Controls Bar */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-3.5 sm:p-5 pr-16 sm:pr-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        {/* Photo Title & Counter */}
        <div className="flex items-center gap-3 text-white">
          <span className="font-sans text-xs sm:text-sm text-amber-400 font-semibold tracking-wider">
            {currentIndex + 1} / {items.length}
          </span>
          <span className="hidden md:inline-block w-px h-3.5 bg-zinc-700" />
          <h2 className="hidden md:inline-block text-sm sm:text-base font-medium text-zinc-200 truncate max-w-[280px]">
            {currentItem.title}
          </h2>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom controls (hidden on small mobile to keep clean) */}
          <div className="hidden sm:flex items-center bg-zinc-900/80 border border-zinc-800 rounded-full p-0.5">
            <button
              id="lightbox-zoom-out"
              onClick={handleZoomOut}
              aria-label="Zoom out"
              disabled={scale <= 1}
              className="p-1.5 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-40 transition-colors"
            >
              <ZoomOut size={16} />
            </button>
            <span className="font-sans text-[11px] text-zinc-400 px-1.5 min-w-[38px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              id="lightbox-zoom-in"
              onClick={handleZoomIn}
              aria-label="Zoom in"
              disabled={scale >= 3.5}
              className="p-1.5 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-40 transition-colors"
            >
              <ZoomIn size={16} />
            </button>
            {scale > 1 && (
              <button
                id="lightbox-reset-zoom"
                onClick={handleResetZoom}
                aria-label="Reset zoom"
                className="p-1.5 rounded-full text-amber-400 hover:bg-zinc-800 transition-colors"
                title="Reset zoom (0)"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>

          {/* Toggle EXIF / Shot Specs */}
          <button
            id="lightbox-toggle-info"
            onClick={() => {
              soundEngine.playClick();
              setShowDetails(prev => !prev);
            }}
            aria-label="Toggle camera metadata"
            className={`p-2 rounded-full border transition-all ${
              showDetails
                ? 'bg-amber-500 text-black border-amber-400'
                : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:text-white hover:bg-zinc-800'
            }`}
            title="Camera & Lighting Details (I)"
          >
            <Info size={17} />
          </button>

          {/* Share */}
          <button
            id="lightbox-share-btn"
            onClick={handleShare}
            aria-label="Share photo link"
            className="p-2 rounded-full bg-zinc-900/80 text-zinc-300 border border-zinc-800 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Copy link"
          >
            <Share2 size={17} />
          </button>

          {/* Close button */}
          <button
            id="lightbox-close-btn"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            aria-label="Close lightbox (Escape)"
            className="p-2 rounded-full bg-zinc-900/80 text-zinc-200 border border-zinc-700 hover:text-white hover:bg-zinc-700 transition-colors ml-1"
          >
            <X size={19} />
          </button>
        </div>
      </div>

      {/* Share Toast */}
      {copied && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-amber-500 text-black px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-lg animate-fade-in">
          Link copied to clipboard!
        </div>
      )}

      {/* Left Navigation Arrow */}
      <button
        id="lightbox-prev-btn"
        onClick={handlePrev}
        aria-label="Previous photograph"
        className="absolute left-2 sm:left-6 z-30 p-3 rounded-full bg-black/40 hover:bg-black/80 text-zinc-300 hover:text-white backdrop-blur-md border border-white/10 transition-all hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500"
      >
        <ChevronLeft size={26} />
      </button>

      {/* Right Navigation Arrow */}
      <button
        id="lightbox-next-btn"
        onClick={handleNext}
        aria-label="Next photograph"
        className="absolute right-2 sm:right-6 z-30 p-3 rounded-full bg-black/40 hover:bg-black/80 text-zinc-300 hover:text-white backdrop-blur-md border border-white/10 transition-all hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500"
      >
        <ChevronRight size={26} />
      </button>

      {/* Floating Zoom Magnification Badge with Quick Reset for Mobile & Desktop */}
      {scale > 1.05 && (
        <div className="absolute top-16 sm:top-20 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/85 backdrop-blur-md border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-mono shadow-xl animate-in fade-in duration-200 pointer-events-auto">
          <ZoomIn size={13} />
          <span>{scale.toFixed(1)}x ZOOM</span>
          <span className="text-zinc-600">|</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleResetZoom();
            }}
            className="text-zinc-300 hover:text-white hover:underline text-[11px] font-sans font-medium transition-colors"
          >
            Reset
          </button>
        </div>
      )}

      {/* Main High-Resolution Image Canvas with Pinch-to-Zoom Gesture Recognition */}
      <div 
        ref={imageContainerRef}
        className="lightbox-image-container relative w-full h-full flex items-center justify-center p-3 sm:p-12 overflow-hidden cursor-grab active:cursor-grabbing select-none touch-none"
        style={{ touchAction: 'none' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          className={`relative max-w-full max-h-full flex items-center justify-center will-change-transform ${
            isInteracting ? '' : 'transition-transform duration-200 ease-out'
          }`}
          style={{
            transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          <img
            id={`lightbox-active-image-${currentItem.id}`}
            src={currentItem.imageUrl}
            alt={currentItem.title}
            referrerPolicy="no-referrer"
            className="max-h-[82vh] max-w-[92vw] sm:max-w-[85vw] object-contain rounded-sm shadow-2xl transition-opacity duration-300 pointer-events-auto select-none"
            draggable={false}
          />
        </div>
      </div>

      {/* Mobile Pinch-to-Zoom & Swipe Tip (fades out) */}
      <div className="sm:hidden absolute bottom-16 inset-x-0 flex justify-center pointer-events-none z-20">
        <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] text-zinc-400 border border-white/10">
          Swipe left/right or pinch to zoom
        </span>
      </div>

      {/* Slide-out EXIF Metadata & Details Drawer */}
      {showDetails && (
        <div
          id="lightbox-metadata-drawer"
          className="absolute bottom-0 sm:bottom-6 sm:right-6 z-40 w-full sm:w-88 bg-zinc-900/95 text-zinc-100 p-5 rounded-t-2xl sm:rounded-2xl border border-zinc-800 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom duration-300"
        >
          <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
            <div>
              <span className="text-[10px] font-sans uppercase tracking-widest text-amber-400 font-semibold">
                {currentItem.category} Lightwork
              </span>
              <h3 className="text-base font-semibold text-white mt-0.5">{currentItem.title}</h3>
            </div>
            <button
              onClick={() => setShowDetails(false)}
              className="text-zinc-400 hover:text-white p-1 rounded-lg"
              aria-label="Close metadata"
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed my-3 font-normal">
            {currentItem.description}
          </p>

          <div className="space-y-2.5 pt-1 text-xs">
            {currentItem.location && (
              <div className="flex items-center gap-2 text-zinc-300">
                <MapPin size={13} className="text-amber-500 shrink-0" />
                <span>{currentItem.location}</span>
              </div>
            )}
            {currentItem.client && (
              <div className="flex items-center gap-2 text-zinc-300">
                <Calendar size={13} className="text-amber-500 shrink-0" />
                <span>Collection / Series: <strong className="text-zinc-100 font-medium">{currentItem.client}</strong> ({currentItem.year})</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
