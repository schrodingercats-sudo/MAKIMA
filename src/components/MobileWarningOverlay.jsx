import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './MobileWarningOverlay.css';

export function MobileWarningOverlay() {
  const [isMobile, setIsMobile] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgentMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      const smallScreen = window.innerWidth < 1024;

      setIsMobile(userAgentMobile || smallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  if (!isMobile || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="mobile-warning-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="mobile-warning-card"
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Header Badge */}
          <div className="mobile-warning-badge">
            <span className="warning-dot" />
            <span>DESKTOP VIEWPORT REQUIRED</span>
          </div>

          {/* Mascot Image */}
          <div className="mobile-mascot-wrapper">
            <img
              src="/images/coming-soon.jpg"
              alt="Makima Mobile Warning Mascot"
              className="mobile-mascot-img"
            />
          </div>

          {/* Speech Bubble */}
          <div className="mobile-speech-bubble">
            “The developer is too lazy. Please use a desktop or laptop for the full luxury editorial experience.”
          </div>

          {/* Title & Description */}
          <h2 className="mobile-warning-title">DESKTOP EXCLUSIVE</h2>
          <p className="mobile-warning-desc">
            This interactive tribute features 3D WebGL physics, dual-timeline tracks, and high-resolution editorial grids optimized specifically for widescreen displays.
          </p>

          {/* Specs Requirement Pill */}
          <div className="mobile-specs-pill">
            🖥️ Recommended Resolution: 1024px+
          </div>

          {/* Dismiss button if user insists */}
          <button
            className="mobile-dismiss-btn"
            onClick={() => setDismissed(true)}
          >
            Preview Anyway (Experimental) →
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default MobileWarningOverlay;
