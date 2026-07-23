import React, { useEffect, useState, useRef } from 'react';
import Lenis from 'lenis';
import { Analytics } from '@vercel/analytics/react';
import { Agentation } from 'agentation';
import SecurityCheckpoint from './components/SecurityCheckpoint';
import MobileWarningOverlay from './components/MobileWarningOverlay';
import CinematicIntro from './components/CinematicIntro';
import Header from './components/Header';
import Hero from './components/Hero';
import StickyStory from './components/StickyStory';
import CharacterProfile from './components/CharacterProfile';
import RelationshipsDossier from './components/RelationshipsDossier';
import Timeline from './components/Timeline';
import Quote from './components/Quote';
import Gallery from './components/Gallery';
import LegacyFooter from './components/LegacyFooter';
import ImageModal from './components/ImageModal';
import ReportModal from './components/ReportModal';
import ComingSoonModal from './components/ComingSoonModal';
import GalleryPage from './components/gallery-app/GalleryPage';
import AuthModal from './components/gallery-app/AuthModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

const SECTIONS = ['hero', 'story', 'profile', 'relationships', 'timeline', 'quotes', 'legacy'];

function AppContent() {
  const [currentView, setCurrentView] = useState(() => {
    return window.location.pathname.startsWith('/gallery') ? 'gallery' : 'tribute';
  });
  const [activeSection, setActiveSection] = useState('hero');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [comingSoonInfo, setComingSoonInfo] = useState({ isOpen: false, title: '', message: '' });
  const [securityPassed, setSecurityPassed] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('signin');
  const lenisRef = useRef(null);
  const { user } = useAuth();

  const handleOpenAuthModal = (mode = 'signin') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  // Sync URL history state
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname.startsWith('/gallery')) {
        setCurrentView('gallery');
      } else {
        setCurrentView('tribute');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Initialize Lenis Smooth Scroll on tribute view
  useEffect(() => {
    if (currentView !== 'tribute') return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 2.0,
    });

    lenisRef.current = lenis;
    window.lenis = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    const rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      window.lenis = null;
    };
  }, [currentView]);

  // IntersectionObserver to update active section on scroll
  useEffect(() => {
    if (currentView !== 'tribute') return;

    const observerOptions = {
      root: null,
      rootMargin: '-30% 0px -40% 0px',
      threshold: 0,
    };

    const handleIntersect = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          if (id) {
            setActiveSection(id);
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [currentView]);

  // Smooth Navigation Handler for Landing Tribute
  const handleNavigate = (sectionId) => {
    if (sectionId === 'gallery') {
      window.history.pushState({}, '', '/gallery');
      setCurrentView('gallery');
      window.scrollTo(0, 0);
      return;
    }

    if (currentView !== 'tribute') {
      window.history.pushState({}, '', '/');
      setCurrentView('tribute');
      setTimeout(() => {
        const targetEl = document.getElementById(sectionId);
        if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }

    const targetEl = document.getElementById(sectionId);
    if (!targetEl) return;

    if (lenisRef.current) {
      lenisRef.current.scrollTo(targetEl, {
        offset: 0,
        duration: 1.2,
      });
    } else {
      targetEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenGalleryPage = () => {
    window.history.pushState({}, '', '/gallery');
    setCurrentView('gallery');
    window.scrollTo(0, 0);
  };

  const handleOpenSocialComingSoon = (name) => {
    setComingSoonInfo({
      isOpen: true,
      title: `${name} PAGE`,
      message: `The developer is lazy. The official ${name.toLowerCase()} page will come soon!`
    });
  };

  return (
    <div className="makima-editorial-root">
      {/* Agentation Visual Feedback Toolbar */}
      <Agentation endpoint="http://localhost:4747" />

      {/* Vercel Security Checkpoint Overlay */}
      {!securityPassed && (
        <SecurityCheckpoint onComplete={() => setSecurityPassed(true)} />
      )}

      {/* Vercel Analytics Tracker */}
      <Analytics />

      {/* Mobile Device & Viewport Warning Overlay */}
      <MobileWarningOverlay />

      {currentView === 'gallery' ? (
        /* FULL INTERACTIVE GALLERY PAGE VIEW */
        <GalleryPage
          onBackToTribute={() => {
            window.history.pushState({}, '', '/');
            setCurrentView('tribute');
            window.scrollTo(0, 0);
          }}
          onOpenAuth={(mode) => handleOpenAuthModal(mode)}
        />
      ) : (
        /* MAIN LANDING TRIBUTE PAGE VIEW */
        <>
          {/* Fullscreen Video Cinematic Intro Overlay */}
          <CinematicIntro />

          {/* Sticky Header */}
          <Header activeSection={activeSection} onNavigate={handleNavigate} />

          {/* Main Content Area */}
          <main className="editorial-main-content">
            {/* Section 1: Hero */}
            <Hero onScrollClick={handleNavigate} />

            {/* Section 2: Identity (01 IDENTITY) */}
            <StickyStory />

            {/* Section 3: Character Profile (02 PROFILE) */}
            <CharacterProfile />

            {/* Section 4: Relationships (03 RELATIONSHIPS) */}
            <RelationshipsDossier />

            {/* Section 5: Timeline (05 TIMELINE) */}
            <Timeline />

            {/* Section 6 & 7: Quotes & Gallery Side-by-Side (06 QUOTES & 07 GALLERY) */}
            <section id="quotes" className="quotes-gallery-section section-padding">
              <div className="editorial-container quotes-gallery-grid">
                <Quote />
                <Gallery
                  onSelectImage={(img) => setSelectedImage(img)}
                  onOpenComingSoon={handleOpenGalleryPage}
                />
              </div>
            </section>

            {/* Section 8: Legacy Tribute & Footer */}
            <LegacyFooter
              onNavigate={handleNavigate}
              onOpenReport={() => setIsReportOpen(true)}
              onOpenSocialComingSoon={handleOpenSocialComingSoon}
            />
          </main>

          {/* Lightbox Modal */}
          <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />

          {/* Report Bug Modal */}
          <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />

          {/* Coming Soon Modal */}
          <ComingSoonModal
            isOpen={comingSoonInfo.isOpen}
            title={comingSoonInfo.title}
            message={comingSoonInfo.message}
            onClose={() => setComingSoonInfo({ ...comingSoonInfo, isOpen: false })}
          />
        </>
      )}

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

