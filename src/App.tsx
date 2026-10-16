import React, { useState, useEffect } from 'react';
import { 
  GalleryItem, 
  PricingPackage, 
  ShootAddOn, 
  BookingRequest, 
  ProjectProgressItem, 
  SubscriptionItem, 
  ProjectStage 
} from './types';
import { 
  GALLERY_ITEMS, 
  PRICING_PACKAGES, 
  SHOOT_ADD_ONS, 
  INITIAL_PROJECT_PIPELINE, 
  INITIAL_SUBSCRIPTIONS 
} from './data/mockData';
import { soundEngine } from './utils/audio';
import { motion, AnimatePresence } from 'motion/react';

// Components
import { Preloader } from './components/Preloader';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ServicesSection } from './components/ServicesSection';
import { ServicesPage } from './components/ServicesPage';
import { PricingSection } from './components/PricingSection';
import { AboutSection } from './components/AboutSection';
import { BookSection } from './components/BookSection';
import { DirectBookingPage } from './components/DirectBookingPage';
import { GalleryPage } from './components/GalleryPage';
import { PricingPage } from './components/PricingPage';
import { ContactPage } from './components/ContactPage';
import { Lightbox } from './components/Lightbox';
import { Dashboard } from './components/Dashboard';
import { BookingModal } from './components/BookingModal';
import { EnquireModal } from './components/EnquireModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { Footer } from './components/Footer';
import { FloatingContactBadge } from './components/FloatingContactBadge';
import { CustomMagneticCursor } from './components/CustomMagneticCursor';
import { ThemeSweepTransition } from './components/ThemeSweepTransition';
import { NotFoundPage } from './components/NotFoundPage';
import { clearAdminToken, getAdminToken } from './utils/security';
import { updatePageSEO } from './utils/seo';
import { SupabaseToastContainer } from './components/SupabaseToast';
import { MobileUnifiedActionBar } from './components/MobileUnifiedActionBar';
import { SectionDivider } from './components/SectionDivider';
import { CuratedGallerySection } from './components/CuratedGallerySection';
import { GlassThemeStyle } from './components/PhysicalGlassCard';

// Smooth Scroll Physics
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Clean view-based routing union
export type AppView = 'portfolio' | 'gallery' | 'services' | 'pricing' | 'booking' | 'contact' | 'dashboard' | 'not-found';

// High-end carousel-style moving page transitions with horizontal glide physics
const pageVariants = {
  initial: { 
    opacity: 0, 
    x: 65, 
    scale: 0.985, 
    filter: 'blur(3px)' 
  },
  animate: { 
    opacity: 1, 
    x: 0, 
    scale: 1, 
    filter: 'blur(0px)',
    transition: { 
      duration: 0.42, 
      ease: [0.22, 1, 0.36, 1] 
    } 
  },
  exit: { 
    opacity: 0, 
    x: -65, 
    scale: 0.985, 
    filter: 'blur(3px)',
    transition: { 
      duration: 0.28, 
      ease: [0.22, 1, 0.36, 1] 
    } 
  }
};

// Smooth section reveal transitions with fade-in-up physics & subtle clear
const sectionRevealVariants = {
  hidden: { opacity: 0, y: 35, filter: 'blur(3px)' },
  visible: { 
    opacity: 1, 
    y: 0, 
    filter: 'blur(0px)',
    transition: { 
      duration: 0.65, 
      ease: [0.16, 1, 0.3, 1] 
    } 
  }
};

export default function App() {
  const [loading, setLoading] = useState(true);

  // Theme state: defaults to warm cream theme matching organic daylight portraiture
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sanjay_theme');
      return saved !== null ? saved === 'dark' : false;
    } catch {
      return false;
    }
  });

  // Real-time Optical Glass Physics Theme ('crystal' | 'gold' | 'obsidian')
  const [glassStyle, setGlassStyle] = useState<GlassThemeStyle>('crystal');

  // Owner authentication: Studio Ops stats & pipeline restricted to Sanjay only
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sanjay_admin_authenticated') === 'true';
    } catch {
      return false;
    }
  });
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);

  // Requirement 1 & 2: Clean view-based routing: 'portfolio' | 'gallery' | 'pricing' | 'booking' | 'contact' | 'dashboard' | 'not-found'
  const [currentView, setCurrentView] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/gallery') return 'gallery';
      if (path === '/pricing' || path === '/rates') return 'pricing';
      if (path === '/contact' || path === '/enquire') return 'contact';
      if (path === '/book' || path === '/reserve') return 'booking';
      if (path === '/dashboard') return 'dashboard';
    }
    return 'portfolio';
  });

  const navigateTo = (view: AppView) => {
    soundEngine.playSwitch();
    soundEngine.hapticTap();
    window.scrollTo({ top: 0, behavior: 'instant' });
    setCurrentView(view);
    const pathMap: Record<string, string> = {
      portfolio: '/',
      gallery: '/gallery',
      services: '/services',
      pricing: '/pricing',
      contact: '/contact',
      booking: '/book',
      dashboard: '/dashboard',
      'not-found': '/404',
    };
    try {
      window.history.pushState(null, '', pathMap[view] || '/');
    } catch {}
  };

  // Browser back/forward history navigation synchronization
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/gallery') setCurrentView('gallery');
      else if (path === '/services') setCurrentView('services');
      else if (path === '/pricing' || path === '/rates') setCurrentView('pricing');
      else if (path === '/contact' || path === '/enquire') setCurrentView('contact');
      else if (path === '/book' || path === '/reserve') setCurrentView('booking');
      else if (path === '/dashboard') setCurrentView('dashboard');
      else setCurrentView('portfolio');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Dynamic SEO & Metadata synchronization for each view
  useEffect(() => {
    updatePageSEO(currentView);
  }, [currentView]);

  // Active section tracking for navbar
  const [activeSection, setActiveSection] = useState('home');

  // Gallery items state (CMS manageable by owner)
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(() => {
    try {
      const saved = localStorage.getItem('sanjay_gallery_items');
      if (saved) {
        const parsed: GalleryItem[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return GALLERY_ITEMS;
    } catch {
      return GALLERY_ITEMS;
    }
  });

  // Synchronize gallery items across components & Supabase uploads in real-time
  useEffect(() => {
    const handleGalleryUpdated = (e: Event) => {
      const customEvt = e as CustomEvent<GalleryItem[]>;
      if (Array.isArray(customEvt.detail) && customEvt.detail.length > 0) {
        setGalleryItems(customEvt.detail);
      }
    };
    window.addEventListener('sanjay_gallery_updated', handleGalleryUpdated);

    // Initial sync with backend gallery endpoint
    fetch('/api/gallery')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.photos) && data.photos.length > 0) {
          setGalleryItems(prev => {
            const serverIds = new Set(data.photos.map((p: any) => p.id));
            const localOnly = prev.filter(p => !serverIds.has(p.id) && (p.id.startsWith('photo-') || p.id.startsWith('gallery-custom-')));
            return [...localOnly, ...data.photos];
          });
        }
      })
      .catch(() => {});

    return () => window.removeEventListener('sanjay_gallery_updated', handleGalleryUpdated);
  }, []);

  // Lightbox state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Booking Modal state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [modalPackage, setModalPackage] = useState<PricingPackage>(PRICING_PACKAGES[0]);
  const [modalAddOns, setModalAddOns] = useState<ShootAddOn[]>([]);

  // Direct Enquiry Modal state
  const [isEnquireModalOpen, setIsEnquireModalOpen] = useState(false);
  const [enquiryService, setEnquiryService] = useState('Traditional Shoot');

  // Project & Subscription Pipeline State
  const [projects, setProjects] = useState<ProjectProgressItem[]>(() => {
    try {
      const mode = localStorage.getItem('sanjay_data_mode');
      const saved = localStorage.getItem('sanjay_projects');
      if (mode === 'real') {
        return saved ? JSON.parse(saved) : [];
      }
      return saved ? JSON.parse(saved) : INITIAL_PROJECT_PIPELINE;
    } catch {
      return [];
    }
  });

  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>(() => {
    try {
      const mode = localStorage.getItem('sanjay_data_mode');
      const saved = localStorage.getItem('sanjay_subscriptions');
      if (mode === 'real') {
        return saved ? JSON.parse(saved) : [];
      }
      return saved ? JSON.parse(saved) : INITIAL_SUBSCRIPTIONS;
    } catch {
      return [];
    }
  });

  // Theme synchronization
  useEffect(() => {
    try {
      localStorage.setItem('sanjay_theme', isDark ? 'dark' : 'light');
    } catch {
      // ignore
    }
    if (isDark) {
      document.documentElement.classList.add('dark', 'theme-dark');
      document.documentElement.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
      document.body.classList.remove('theme-light');
      document.body.style.backgroundColor = '#08080A';
      document.body.style.color = '#ffffff';
    } else {
      document.documentElement.classList.remove('dark', 'theme-dark');
      document.documentElement.classList.add('theme-light');
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
      document.body.style.backgroundColor = '#F5F0E6';
      document.body.style.color = '#141312';
    }
  }, [isDark]);

  // Persist pipeline
  useEffect(() => {
    try {
      localStorage.setItem('sanjay_projects', JSON.stringify(projects));
    } catch {
      // ignore
    }
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem('sanjay_subscriptions', JSON.stringify(subscriptions));
    } catch {
      // ignore
    }
  }, [subscriptions]);

  // Persist gallery items
  useEffect(() => {
    try {
      localStorage.setItem('sanjay_gallery_items', JSON.stringify(galleryItems));
    } catch {
      // ignore
    }
  }, [galleryItems]);

  // Scroll spy for active section
  useEffect(() => {
    if (currentView !== 'portfolio') return;
    const handleScroll = () => {
      const sections = ['home', 'services', 'work', 'pricing', 'about', 'book'];
      const scrollPos = window.scrollY + 160;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId) || (sectionId === 'work' ? document.getElementById('stories') : null);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentView]);

  const handleToggleTheme = () => {
    setIsDark(prev => !prev);
  };

  // Lightbox handlers
  const handleSelectPhoto = (item: GalleryItem, index: number) => {
    setActivePhotoIndex(index);
    setIsLightboxOpen(true);
  };

  const handleSelectPhotoByUrl = (imageUrl: string, title: string) => {
    // 1. Direct search by exact imageUrl match
    let idx = galleryItems.findIndex(g => g.imageUrl === imageUrl);

    // 2. If not found by exact string, match by image filename
    if (idx === -1) {
      const filename = imageUrl.split('/').pop()?.split('?')[0];
      if (filename) {
        idx = galleryItems.findIndex(g => g.imageUrl.endsWith(filename));
      }
    }

    // 3. If not found, match by title
    if (idx === -1 && title) {
      const normalizedTitle = title.toLowerCase().trim();
      idx = galleryItems.findIndex(g => 
        g.title.toLowerCase().trim() === normalizedTitle ||
        normalizedTitle.includes(g.title.toLowerCase().trim()) ||
        g.title.toLowerCase().trim().includes(normalizedTitle)
      );
    }

    // 4. Guaranteed direct indexing: NEVER default to index 0 or scramble sequence!
    if (idx !== -1) {
      setActivePhotoIndex(idx);
    } else {
      // Create dynamically if not yet registered and open at that exact item index
      const newItem: GalleryItem = {
        id: `suite-photo-${Date.now()}`,
        title: title || 'Lightworks Editorial Selection',
        category: 'traditional',
        aspectRatio: 'portrait',
        imageUrl: imageUrl,
        year: '2026',
        description: title,
      };
      setGalleryItems(prev => {
        const next = [...prev, newItem];
        try {
          localStorage.setItem('sanjay_gallery_items', JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
      setActivePhotoIndex(galleryItems.length);
    }
    setIsLightboxOpen(true);
  };

  const handleOpenBookingModal = (pkg?: PricingPackage, addOns: ShootAddOn[] = []) => {
    setModalPackage(pkg || PRICING_PACKAGES[0]);
    setModalAddOns(addOns);
    navigateTo('booking');
  };

  const handleOpenEnquiryModal = (serviceName = 'Traditional & Heritage Shoot') => {
    setEnquiryService(serviceName);
    navigateTo('contact');
  };

  /**
   * Handles Reserve/Book button clicks with zero screen overlap:
   * Smoothly navigates to the dedicated Direct Booking view with the chosen package.
   */
  const handleScrollToReservation = (pkg?: PricingPackage) => {
    try {
      soundEngine.playClick();
      soundEngine.hapticTap();
    } catch {
      // Sound engine safe guard
    }

    if (pkg) {
      setModalPackage(pkg);
    }

    // Safely close any active modal overlays without locking body scroll
    setIsBookingModalOpen(false);
    setIsEnquireModalOpen(false);
    setIsAdminAuthModalOpen(false);
    setIsLightboxOpen(false);
    if (typeof document !== 'undefined' && document.body) {
      document.body.style.overflow = 'auto';
    }

    navigateTo('booking');
  };

  const handleScrollToBooking = handleScrollToReservation;

  // GLOBAL ESCAPE KEY LISTENER: Closes ANY open modal or drawer and restores body scrolling
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsBookingModalOpen(false);
        setIsEnquireModalOpen(false);
        setIsAdminAuthModalOpen(false);
        setIsLightboxOpen(false);
        document.body.style.overflow = 'auto';
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleToggleGalleryView = () => {
    soundEngine.playSwitch();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentView(prev => prev === 'gallery' ? 'portfolio' : 'gallery');
  };

  const handleBookingConfirmed = (booking: BookingRequest) => {
    const newProject: ProjectProgressItem = {
      id: `proj-${booking.id}`,
      clientName: booking.clientName,
      clientEmail: booking.clientEmail,
      projectName: `${booking.packageName} (${booking.location})`,
      shootType: booking.packageName,
      date: booking.preferredDate,
      stage: 'inquiry',
      deliverablesCount: 25,
      invoiceStatus: 'deposit_paid',
      totalValue: booking.totalPrice,
      notes: `Booked online. Client notes: ${booking.notes}`,
    };

    setProjects(prev => [newProject, ...prev]);
  };

  const handleUpdateProjectStage = (id: string, newStage: ProjectStage) => {
    setProjects(prev =>
      prev.map(p => (p.id === id ? { ...p, stage: newStage } : p))
    );
  };

  const handleAddProject = (project: ProjectProgressItem) => {
    setProjects(prev => [project, ...prev]);
  };

  const handleDeleteProject = (id: string) => {
    soundEngine.playClick();
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const handleAddSubscription = (sub: SubscriptionItem) => {
    setSubscriptions(prev => [sub, ...prev]);
  };

  const handleDeleteSubscription = (id: string) => {
    soundEngine.playClick();
    setSubscriptions(prev => prev.filter(s => s.id !== id));
  };

  const handleClearAllDemoData = () => {
    soundEngine.playClick();
    setProjects([]);
    setSubscriptions([]);
    try {
      localStorage.setItem('sanjay_data_mode', 'real');
      localStorage.setItem('sanjay_projects', JSON.stringify([]));
      localStorage.setItem('sanjay_subscriptions', JSON.stringify([]));
      localStorage.removeItem('sanjay_bookings');
      fetch('/api/admin/data/clear', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAdminToken()}` 
        }
      }).catch(() => {});
    } catch {
      // ignore
    }
  };

  const handleResetDemoData = () => {
    soundEngine.playSuccess();
    setProjects(INITIAL_PROJECT_PIPELINE);
    setSubscriptions(INITIAL_SUBSCRIPTIONS);
    try {
      localStorage.setItem('sanjay_data_mode', 'demo');
      localStorage.setItem('sanjay_projects', JSON.stringify(INITIAL_PROJECT_PIPELINE));
      localStorage.setItem('sanjay_subscriptions', JSON.stringify(INITIAL_SUBSCRIPTIONS));
      fetch('/api/admin/data/reset-demo', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAdminToken()}` 
        }
      }).catch(() => {});
    } catch {
      // ignore
    }
  };

  // Owner Admin Handlers
  const handleOpenStudioOps = () => {
    soundEngine.playClick();
    if (isAdmin) {
      setCurrentView(prev => prev === 'dashboard' ? 'portfolio' : 'dashboard');
    } else {
      setIsAdminAuthModalOpen(true);
    }
  };

  const handleAdminAuthSuccess = () => {
    setIsAdmin(true);
    setIsAdminAuthModalOpen(false);
    setCurrentView('dashboard');
  };

  // Verify admin session token with server on mount
  useEffect(() => {
    const token = getAdminToken();
    if (token) {
      fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => res.json())
      .then(data => {
        if (!data.authenticated) {
          clearAdminToken();
          setIsAdmin(false);
        }
      })
      .catch(() => {
        // network issue: retain local status
      });
    }

    const handleExpired = () => {
      setIsAdmin(false);
      clearAdminToken();
      if (currentView === 'dashboard') {
        setCurrentView('portfolio');
      }
    };

    window.addEventListener('admin-auth-expired', handleExpired);
    return () => window.removeEventListener('admin-auth-expired', handleExpired);
  }, [currentView]);

  const handleLogoutAdmin = () => {
    setIsAdmin(false);
    clearAdminToken();
    if (currentView === 'dashboard') {
      setCurrentView('portfolio');
    }
  };

  // Keyboard shortcut: Ctrl+Shift+S or Cmd+Shift+S toggles Studio Ops or opens Owner Auth
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        soundEngine.playClick();
        if (isAdmin) {
          setCurrentView(prev => prev === 'dashboard' ? 'portfolio' : 'dashboard');
        } else {
          setIsAdminAuthModalOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdmin]);

  // URL Route & Hash check: /admin, #admin, #ops, #dashboard, #gallery, and 404 handler
  useEffect(() => {
    const handleRouteCheck = () => {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();

      if (path === '/404' || hash === '#404' || hash === '#not-found') {
        setCurrentView('not-found');
      } else if (path === '/gallery' || hash === '#gallery') {
        setCurrentView('gallery');
      } else if (path === '/admin' || hash === '#admin' || hash === '#ops' || hash === '#dashboard') {
        if (isAdmin) {
          setCurrentView('dashboard');
        } else {
          setIsAdminAuthModalOpen(true);
        }
      }
    };

    handleRouteCheck();
    window.addEventListener('hashchange', handleRouteCheck);
    window.addEventListener('popstate', handleRouteCheck);
    return () => {
      window.removeEventListener('hashchange', handleRouteCheck);
      window.removeEventListener('popstate', handleRouteCheck);
    };
  }, [isAdmin]);

  // Smooth Lenis inertial scrolling physics integrated with GSAP ScrollTrigger
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    (window as any).__lenis = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    const updateTicker = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
      delete (window as any).__lenis;
    };
  }, []);

  // ScrollTrigger-based reveal animations (fade-in + smooth scale reveal 0.98 to 1.0)
  useEffect(() => {
    if (currentView !== 'portfolio') return;

    const ctx = gsap.context(() => {
      const sectionSelectors = ['#services', '#pricing', '#about', '#book'];
      sectionSelectors.forEach((selector) => {
        const el = document.querySelector(selector);
        if (el) {
          gsap.fromTo(
            el,
            { opacity: 0, scale: 0.98, y: 30 },
            {
              opacity: 1,
              scale: 1.0,
              y: 0,
              duration: 0.88,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: el,
                start: 'top 85%',
                toggleActions: 'play none none none',
              },
            }
          );
        }
      });
    });

    ScrollTrigger.refresh();

    return () => {
      ctx.revert();
    };
  }, [currentView]);

  // Global single-click bridge helpers
  useEffect(() => {
    (window as any).openEnquiryModal = () => {
      setIsBookingModalOpen(true);
    };
    (window as any).scrollToReservation = (pkg?: PricingPackage) => {
      handleScrollToReservation(pkg);
    };
    return () => {
      delete (window as any).openEnquiryModal;
      delete (window as any).scrollToReservation;
    };
  }, []);

  return (
    <div className={`w-full min-h-screen min-h-[100dvh] overflow-x-hidden glass-canvas-bg glass-grain-texture ${isDark ? 'text-white' : 'text-[#1A1A1A]'} transition-colors duration-300 font-sans relative`}>
      {/* Interactive Magnetic Cursor Overlay (Morphs dynamically on VIEW, BOOK, DRAG, EXPLORE) */}
      <CustomMagneticCursor isDark={isDark} />

      {/* Animated Preloader */}
      {loading && <Preloader onComplete={() => setLoading(false)} />}

      {/* Main Navigation with Gallery & Enquire buttons */}
      <Navbar
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        onOpenBooking={() => navigateTo('booking')}
        onOpenEnquiry={() => navigateTo('contact')}
        onOpenDashboard={handleOpenStudioOps}
        onToggleGalleryView={() => navigateTo(currentView === 'gallery' ? 'portfolio' : 'gallery')}
        onNavigateView={navigateTo}
        currentView={currentView}
        activeSection={activeSection}
        isAdmin={isAdmin}
        onOpenAdminAuth={() => setIsAdminAuthModalOpen(true)}
      />

      {/* Radiant Gold Light Sweep Beam for Dynamic Theme Transition */}
      <ThemeSweepTransition isDark={isDark} />

      {/* Render View based on current selection with Editorial Page Transitions */}
      {/* Editorial Route Transition Progress Bar Indicator */}
      <motion.div
        key={`page-route-bar-${currentView}`}
        initial={{ scaleX: 0, opacity: 1 }}
        animate={{ scaleX: 1, opacity: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#8C6207] via-[#D4AF37] to-[#F3E5AB] origin-left z-[999999] pointer-events-none"
      />

      <AnimatePresence mode="wait">
        {currentView === 'portfolio' ? (
          <motion.main
            key="portfolio"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full overflow-x-hidden page-transition"
          >
            {/* 1. Hero Section (sanjay_s_lightworks_ultra_glassmorphism) */}
            <Hero
              onOpenBooking={() => {
                const configurator = document.getElementById('booking-configurator');
                if (configurator) configurator.scrollIntoView({ behavior: 'smooth' });
                else navigateTo('booking');
              }}
              onOpenEnquiry={() => navigateTo('contact')}
              onViewGallery={() => {
                navigateTo('gallery');
              }}
              isDark={isDark}
            />

            <SectionDivider isDark={isDark} />

            {/* 2. Curated Gallery Carousel with Physical 3D Glass Cards (Matching Reference HTML) */}
            <CuratedGallerySection
              onSelectPhoto={(url, caption) => handleSelectPhotoByUrl(url, caption)}
              onOpenArchive={() => navigateTo('gallery')}
              isDark={isDark}
              glassStyle={glassStyle}
            />

            <SectionDivider isDark={isDark} />

            {/* 3. Services We Provide (Matching Reference HTML) */}
            <ServicesSection
              onOpenBooking={(svcName) => {
                const matched = PRICING_PACKAGES.find(p => 
                  p.name.toLowerCase().includes((svcName || '').toLowerCase())
                ) || PRICING_PACKAGES[0];
                setModalPackage(matched);
                const configurator = document.getElementById('booking-configurator');
                if (configurator) {
                  configurator.scrollIntoView({ behavior: 'smooth' });
                } else {
                  navigateTo('booking');
                }
              }}
              isDark={isDark}
              glassStyle={glassStyle}
            />

            <SectionDivider isDark={isDark} />

            {/* 4. Pricing & Transparent Packages (Investment & Rates) */}
            <PricingSection
              packages={PRICING_PACKAGES}
              onOpenBooking={(pkg) => {
                setModalPackage(pkg);
                const configurator = document.getElementById('booking-configurator');
                if (configurator) {
                  configurator.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              isDark={isDark}
              glassStyle={glassStyle}
            />

            <SectionDivider isDark={isDark} />

            {/* 5. About the Photographer / Heritage & Craft */}
            <AboutSection
              onOpenBooking={() => {
                const configurator = document.getElementById('booking-configurator');
                if (configurator) configurator.scrollIntoView({ behavior: 'smooth' });
                else navigateTo('booking');
              }}
              onOpenEnquiry={() => navigateTo('contact')}
              isDark={isDark}
              glassStyle={glassStyle}
            />

            <SectionDivider isDark={isDark} />

            {/* 6. Direct Reservation & Booking Section (Booking Configurator) */}
            <BookSection
              activePackage={modalPackage}
              onOpenBooking={(pkg, addOns) => {
                if (pkg) setModalPackage(pkg);
                if (addOns) setModalAddOns(addOns);
              }}
              onOpenEnquiry={(svc) => {
                if (svc) setEnquiryService(svc);
                navigateTo('contact');
              }}
              isDark={isDark}
              glassStyle={glassStyle}
            />
          </motion.main>
        ) : currentView === 'gallery' ? (
          /* DEDICATED FULL PHOTO VIEWING PAGE */
          <motion.main
            key="gallery"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full overflow-x-hidden page-transition"
          >
            <GalleryPage
              items={galleryItems}
              onSelectPhoto={handleSelectPhoto}
              onBackToPortfolio={() => navigateTo('portfolio')}
              isDark={isDark}
            />
          </motion.main>
        ) : currentView === 'services' ? (
          /* DEDICATED FULL SERVICES WE PROVIDE PAGE */
          <motion.main
            key="services"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full overflow-x-hidden page-transition"
          >
            <ServicesPage
              onBack={() => navigateTo('portfolio')}
              onSelectService={(svcName) => {
                const matched = PRICING_PACKAGES.find(p => 
                  p.name.toLowerCase().includes((svcName || '').toLowerCase())
                ) || PRICING_PACKAGES[0];
                setModalPackage(matched);
                navigateTo('booking');
              }}
              isDark={isDark}
            />
          </motion.main>
        ) : currentView === 'pricing' ? (
          /* DEDICATED FULL PRICING & PACKAGES PAGE */
          <motion.main
            key="pricing"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full overflow-x-hidden page-transition"
          >
            <PricingPage
              onBack={() => navigateTo('portfolio')}
              onSelectPackage={(pkg) => {
                setModalPackage(pkg);
                navigateTo('booking');
              }}
              isDark={isDark}
            />
          </motion.main>
        ) : currentView === 'contact' ? (
          /* DEDICATED FULL CONTACT & DIRECT ENQUIRY PAGE */
          <motion.main
            key="contact"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full overflow-x-hidden page-transition"
          >
            <ContactPage
              onBack={() => navigateTo('portfolio')}
              isDark={isDark}
              onNavigateBooking={() => navigateTo('booking')}
            />
          </motion.main>
        ) : currentView === 'booking' ? (
          /* DEDICATED DIRECT BOOKING PAGE: Clean view routing preventing overlapping screens */
          <motion.main
            key="booking"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full overflow-x-hidden page-transition"
          >
            <DirectBookingPage
              initialPackage={modalPackage}
              initialAddOns={modalAddOns}
              onBack={() => navigateTo('portfolio')}
              isDark={isDark}
              onBookingConfirmed={handleBookingConfirmed}
            />
          </motion.main>
        ) : currentView === 'not-found' ? (
          /* Custom 404 Error Page */
          <motion.main
            key="not-found"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full overflow-x-hidden page-transition"
          >
            <NotFoundPage
              onGoHome={() => navigateTo('portfolio')}
              onOpenGallery={() => navigateTo('gallery')}
              onOpenBooking={() => navigateTo('booking')}
              isDark={isDark}
            />
          </motion.main>
        ) : (
          /* Studio Ops Dashboard (Restricted to Sanjay) */
          <motion.main
            key="dashboard"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full overflow-x-hidden pt-24 min-h-screen px-4 sm:px-8 max-w-7xl mx-auto page-transition"
          >
            <Dashboard
              projects={projects}
              onUpdateProjects={setProjects}
              subscriptions={subscriptions}
              galleryItems={galleryItems}
              onUpdateGalleryItems={setGalleryItems}
              onUpdateProjectStage={handleUpdateProjectStage}
              onAddProject={handleAddProject}
              onDeleteProject={handleDeleteProject}
              onAddSubscription={handleAddSubscription}
              onDeleteSubscription={handleDeleteSubscription}
              onClearAllDemoData={handleClearAllDemoData}
              onResetDemoData={handleResetDemoData}
              onClose={() => navigateTo('portfolio')}
              isDark={isDark}
              isAdmin={isAdmin}
              onLogoutAdmin={handleLogoutAdmin}
              onOpenAdminAuth={() => setIsAdminAuthModalOpen(true)}
            />
          </motion.main>
        )}
      </AnimatePresence>

      {/* Section Divider Before Footer */}
      <SectionDivider isDark={isDark} />

      {/* Footer with Discreet Owner Access and Repaired Navigation Links */}
      <Footer
        onOpenBooking={() => navigateTo('booking')}
        onNavigateSection={(sectionId) => {
          if (sectionId === 'pricing') {
            navigateTo('pricing');
            return;
          }
          if (sectionId === 'book' || sectionId === 'direct-calendar-reservation') {
            navigateTo('booking');
            return;
          }
          if (sectionId === 'contact' || sectionId === 'enquire') {
            navigateTo('contact');
            return;
          }
          if (currentView !== 'portfolio') {
            setCurrentView('portfolio');
            setTimeout(() => {
              const target = document.getElementById(sectionId);
              if (target) target.scrollIntoView({ behavior: 'smooth' });
            }, 300);
          } else {
            const target = document.getElementById(sectionId);
            if (target) target.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        onToggleGallery={() => navigateTo('gallery')}
        isDark={isDark}
        isAdmin={isAdmin}
        onOpenAdminAuth={() => {
          if (isAdmin) {
            setCurrentView(prev => prev === 'dashboard' ? 'portfolio' : 'dashboard');
          } else {
            setIsAdminAuthModalOpen(true);
          }
        }}
      />

      {/* Owner Authentication Modal for Studio Ops */}
      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => {
          document.body.style.overflow = 'auto';
          setIsAdminAuthModalOpen(false);
        }}
        onSuccess={handleAdminAuthSuccess}
        isDark={isDark}
      />

      {/* Touch-enabled Lightbox */}
      <Lightbox
        items={galleryItems}
        currentIndex={activePhotoIndex}
        isOpen={isLightboxOpen}
        onClose={() => {
          document.body.style.overflow = 'auto';
          setIsLightboxOpen(false);
        }}
        onNavigate={(newIdx) => setActivePhotoIndex(newIdx)}
        isDark={isDark}
      />

      {/* Pinned Floating Contact Badge (WhatsApp, Instagram, Direct Inquiry) */}
      <FloatingContactBadge
        onOpenBooking={() => navigateTo('booking')}
        onOpenEnquiry={() => navigateTo('contact')}
        isDark={isDark}
        isAnyModalOpen={isAdminAuthModalOpen || isLightboxOpen}
      />

      {/* Supabase Database Action Feedback Toast Container */}
      <SupabaseToastContainer isDark={isDark} />
    </div>
  );
}
