import React, { useEffect, useState, useRef } from 'react';
import Lenis from 'lenis';
import { Analytics } from '@vercel/analytics/react';
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
import './App.css';

const SECTIONS = ['hero', 'story', 'profile', 'relationships', 'timeline', 'quotes', 'legacy'];

export function App() {
  const [activeSection, setActiveSection] = useState('hero');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [comingSoonInfo, setComingSoonInfo] = useState({ isOpen: false, title: '', message: '' });
  const [securityPassed, setSecurityPassed] = useState(false);
  const lenisRef = useRef(null);

  // Initialize Lenis Smooth Scroll
  useEffect(() => {
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
  }, []);

  // IntersectionObserver to update active section on scroll
  useEffect(() => {
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
  }, []);

  // Smooth Navigation Handler using Lenis or scrollIntoView fallback
  const handleNavigate = (sectionId) => {
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

  const handleOpenGalleryComingSoon = () => {
    setComingSoonInfo({
      isOpen: true,
      title: 'GALLERY FEATURE',
      message: 'The developer is lazy. The full gallery feature will come soon!'
    });
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
      {/* Vercel Security Checkpoint Overlay */}
      {!securityPassed && (
        <SecurityCheckpoint onComplete={() => setSecurityPassed(true)} />
      )}

      {/* Vercel Analytics Tracker */}
      <Analytics />

      {/* Mobile Device & Viewport Warning Overlay */}
      <MobileWarningOverlay />

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
              onOpenComingSoon={handleOpenGalleryComingSoon}
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
    </div>
  );
}

export default App;
