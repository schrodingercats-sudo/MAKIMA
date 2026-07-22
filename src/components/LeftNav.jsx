import React from 'react';
import { motion } from 'framer-motion';
import './LeftNav.css';

const SECTIONS = [
  { id: 'story', num: '01', label: 'STORY' },
  { id: 'profile', num: '02', label: 'PROFILE' },
  { id: 'relationships', num: '03', label: 'RELATIONSHIPS' },
  { id: 'timeline', num: '04', label: 'TIMELINE' },
  { id: 'quotes', num: '05', label: 'QUOTES' },
  { id: 'gallery', num: '06', label: 'GALLERY' },
  { id: 'legacy', num: '07', label: 'LEGACY' },
];

export const LeftNav = ({ activeSection, onNavigate }) => {
  const handleNavClick = (id) => {
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
    <aside className="editorial-left-nav" aria-label="Section Tracker">
      <div className="left-nav-track">
        {/* Background Vertical Line */}
        <div className="left-nav-line" />

        {SECTIONS.map((sec) => {
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              className={`left-nav-item ${isActive ? 'is-active' : ''}`}
              onClick={() => handleNavClick(sec.id)}
              aria-label={`Scroll to ${sec.label}`}
              title={sec.label}
            >
              <span className="left-nav-num">{sec.num}</span>
              <span className="left-nav-dot">
                {isActive && (
                  <motion.span
                    className="left-nav-active-fill"
                    layoutId="leftNavActiveDot"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </span>
              <span className="left-nav-tooltip">{sec.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default LeftNav;
