import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Menu01Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
import './Header.css';

const NAV_ITEMS = [
  { id: 'story', label: 'STORY', num: '01' },
  { id: 'profile', label: 'PROFILE', num: '02' },
  { id: 'relationships', label: 'RELATIONSHIPS', num: '03' },
  { id: 'timeline', label: 'TIMELINE', num: '04' },
  { id: 'quotes', label: 'QUOTES', num: '05' },
  { id: 'gallery', label: 'GALLERY', num: '06' },
  { id: 'legacy', label: 'LEGACY', num: '07' },
];

export const Header = ({ activeSection, onNavigate }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (id) => {
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(id);
    } else {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className={`editorial-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="editorial-container header-inner">
        {/* Brand Logo */}
        <button 
          className="header-logo-btn" 
          onClick={() => handleLinkClick('hero')}
          aria-label="Makima Home"
        >
          <span className="logo-title">MAKIMA</span>
          <span className="logo-jp">マキマ</span>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav" aria-label="Main Navigation">
          <ul className="nav-list">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <li key={item.id} className="nav-item">
                  <button
                    className={`nav-link ${isActive ? 'is-active' : ''}`}
                    onClick={() => handleLinkClick(item.id)}
                  >
                    <span className="nav-link-num">{item.num}</span>
                    <span className="nav-link-text">{item.label}</span>
                    {isActive && (
                      <motion.span
                        className="active-indicator-dot"
                        layoutId="activeHeaderDot"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <HugeiconsIcon icon={Cancel01Icon} size={24} /> : <HugeiconsIcon icon={Menu01Icon} size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="mobile-menu-overlay"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <nav className="mobile-nav">
              <ul>
                {NAV_ITEMS.map((item) => (
                  <li key={item.id}>
                    <button
                      className={`mobile-nav-link ${activeSection === item.id ? 'is-active' : ''}`}
                      onClick={() => handleLinkClick(item.id)}
                    >
                      <span className="mobile-nav-num">{item.num}</span>
                      <span className="mobile-nav-text">{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
