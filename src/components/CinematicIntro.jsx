import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import './CinematicIntro.css';

export function CinematicIntro({ onComplete }) {
  const videoRef = useRef(null);
  const [slideUp, setSlideUp] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Lock scroll on document body during intro playback
    document.body.style.overflow = 'hidden';

    const video = videoRef.current;
    if (video) {
      video.play().catch((err) => {
        console.log('Autoplay handled:', err);
        // Fallback: trigger finish if autoplay is blocked
        startExitTransition();
      });
    }

    // Safety timeout in case video stalls
    const fallbackTimer = setTimeout(() => {
      startExitTransition();
    }, 12000);

    return () => {
      clearTimeout(fallbackTimer);
      document.body.style.overflow = '';
    };
  }, []);

  const startExitTransition = () => {
    if (slideUp) return;
    // Hold final frame for ~0.4s then slide upward like a curtain lifting
    setTimeout(() => {
      setSlideUp(true);
    }, 400);
  };

  const handleVideoEnded = () => {
    startExitTransition();
  };

  const handleAnimationComplete = () => {
    document.body.style.overflow = '';
    setDismissed(true);
    if (onComplete) onComplete();
  };

  if (dismissed) return null;

  return (
    <motion.div
      className="cinematic-intro-overlay"
      initial={{ y: '0%' }}
      animate={{ y: slideUp ? '-100%' : '0%' }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      onAnimationComplete={() => {
        if (slideUp) handleAnimationComplete();
      }}
    >
      <video
        ref={videoRef}
        src="/images/makima-intro.mp4"
        className="cinematic-intro-video"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={handleVideoEnded}
      />

      {/* Elegant Skip Option */}
      {!slideUp && (
        <button
          className="intro-skip-btn"
          onClick={startExitTransition}
          aria-label="Skip Intro Video"
        >
          SKIP INTRO →
        </button>
      )}
    </motion.div>
  );
}

export default CinematicIntro;
