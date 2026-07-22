import React from 'react';
import { motion } from 'framer-motion';
import { handleImageError } from '../utils/imageFallback';
import './Hero.css';

export const Hero = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section id="hero" className="editorial-hero">
      {/* Background Graphic & Vibe Layers */}
      <div className="hero-background-wrapper">
        <img
          src="/images/hero-bg.webp"
          alt="Makima Presentation"
          className="hero-bg-image"
          fetchPriority="high"
          onError={(e) => handleImageError(e, 'hero', 'MAKIMA')}
        />
        <div className="hero-overlay-vignette" />
        <div className="hero-overlay-grid" />
      </div>

      {/* Far Left Vertical Number Track (01 to 07) */}
      <div className="hero-left-track">
        {[
          { num: '01', active: true },
          { num: '02' },
          { num: '03' },
          { num: '04' },
          { num: '05' },
          { num: '06' },
          { num: '07' },
        ].map((item, idx) => (
          <span key={idx} className={`hero-track-num ${item.active ? 'active' : ''}`}>
            {item.num}
          </span>
        ))}
      </div>

      {/* Left Content Overlay */}
      <div className="editorial-container hero-content-container">
        <motion.div
          className="hero-text-block"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Kanji Subtitle */}
          <motion.div className="hero-jp-sub" variants={itemVariants}>
            <span>マキマ</span>
          </motion.div>

          {/* Massive Serif Title */}
          <motion.h1 className="hero-main-title" variants={itemVariants}>
            MAKIMA
          </motion.h1>

          {/* Subtitle Badge */}
          <motion.div className="hero-badge-wrapper" variants={itemVariants}>
            <span className="hero-subtitle-text">
              PUBLIC SAFETY DEVIL HUNTER
            </span>
          </motion.div>

          {/* Dual Tagline */}
          <motion.div className="hero-tagline-block" variants={itemVariants}>
            <p>The woman everyone trusted.</p>
            <p>The woman everyone feared.</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Right Vertical Scroll Annotation */}
      <div className="hero-scroll-vertical">
        <span>SCROLL ↓</span>
      </div>
    </section>
  );
};

export default Hero;
