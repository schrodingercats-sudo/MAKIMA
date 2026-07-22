import React, { useEffect, useState, useRef } from 'react';
import Lenis from 'lenis';
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
import './App.css';

// Lazy-load Agentation so a crash in that module doesn't blank the whole site
const LazyAgentation = React.lazy(() =>
  import('agentation')
    .then((mod) => ({ default: mod.Agentation || mod.default }))
    .catch(() => ({ default: () => null }))
);

const SECTIONS = ['hero', 'story', 'profile', 'relationships', 'timeline', 'quotes', 'legacy'];

export function App() {
  const [activeSection, setActiveSection] = useState('hero');
  const [selectedImage, setSelectedImage] = useState(null);
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

  return (
    <div className="makima-editorial-root">
      {/* Fullscreen Video Cinematic Intro Overlay */}
      <CinematicIntro />

      {/* Sticky Header */}
      <Header activeSection={activeSection} onNavigate={handleNavigate} />

      {/* Main Content Area matching final design.png */}
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
            <Gallery onSelectImage={(img) => setSelectedImage(img)} />
          </div>
        </section>

        {/* Section 8: Legacy Tribute & Footer */}
        <LegacyFooter onNavigate={handleNavigate} />
      </main>

      {/* Lightbox Modal */}
      <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />

      {/* Visual Feedback Agentation Toolbar (lazy-loaded) */}
      <React.Suspense fallback={null}>
        <LazyAgentation />
      </React.Suspense>
    </div>
  );
}

export default App;
