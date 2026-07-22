import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './RelationshipsDossier.css';

const BOOK_PAGES = [
  '/images/book-cover-art.webp',       // Page 1: Front Cover
  '/images/book-page1.webp',           // Page 2: Spread 1 Left
  '/images/book-poster2.webp',         // Page 3: Spread 1 Right
  '/images/book-page2.webp',           // Page 4: Spread 2 Left
  '/images/book-poster3.webp',         // Page 5: Spread 2 Right
  '/images/book-page3.webp',           // Page 6: Spread 3 Left
  '/images/book-poster4.webp',         // Page 7: Spread 3 Right
  '/images/book-page4.webp',           // Page 8: Spread 4 Left
  '/images/book-poster5.webp',         // Page 9: Spread 4 Right
  '/images/book-page5.webp',           // Page 10: Spread 5 Left
  '/images/book-poster6.webp',         // Page 11: Spread 5 Right
  '/images/book-makimaposter1.webp'    // Page 12: Back Cover
];

export function RelationshipsDossier() {
  const containerRef = useRef(null);
  const flipBookInstance = useRef(null);
  const [showTag, setShowTag] = useState(true);

  useEffect(() => {
    let checkInterval;
    let observer;

    // Set global dFlip defaults to disable all zoom & mousewheel interception
    if (window.dFlipOptions) {
      window.dFlipOptions.zoom = false;
      window.dFlipOptions.enableZoom = false;
      window.dFlipOptions.mousewheel = false;
    }

    const disableCanvasPointerEvents = () => {
      if (containerRef.current) {
        const canvasEls = containerRef.current.querySelectorAll('canvas');
        canvasEls.forEach((c) => {
          c.style.pointerEvents = 'none';
          c.style.touchAction = 'pan-y';
        });
      }
    };

    const initFlipBook = () => {
      if (window.jQuery && window.jQuery.fn && window.jQuery.fn.flipBook && containerRef.current) {
        if (flipBookInstance.current) return;

        const options = {
          height: 520,
          duration: 800,
          webgl: true,
          webglMin: false,
          pageSize: 2,
          showCover: true,
          soundEnable: false,
          autoEnableOutline: false,
          autoEnableThumbnail: false,
          controlsPosition: 'none',
          zoom: false,
          enableZoom: false,
          zoomStep: 0,
          maxZoom: 1,
          minZoom: 1,
          mousewheel: false,
          backgroundColor: 'transparent',
        };

        try {
          flipBookInstance.current = window.jQuery(containerRef.current).flipBook(BOOK_PAGES, options);

          // Watch for canvas creation and force pointer-events: none instantly
          disableCanvasPointerEvents();
          observer = new MutationObserver(() => {
            disableCanvasPointerEvents();
          });
          observer.observe(containerRef.current, { childList: true, subtree: true });

          // Prevent trackpad pinch zoom on container
          containerRef.current.addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
            }
          }, { passive: false });
        } catch (err) {
          console.log('DearFlip init error:', err);
        }
      }
    };

    checkInterval = setInterval(() => {
      if (window.jQuery && window.jQuery.fn && window.jQuery.fn.flipBook) {
        initFlipBook();
        clearInterval(checkInterval);
      }
    }, 100);

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (observer) observer.disconnect();
    };
  }, []);

  const handleBookClick = (e) => {
    if (showTag) {
      setShowTag(false);
    }

    // Trigger next page flip on click
    if (flipBookInstance.current && typeof flipBookInstance.current.next === 'function') {
      try {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        // Click on left half flips backward, right half flips forward
        if (clickX < rect.width / 2) {
          flipBookInstance.current.prev();
        } else {
          flipBookInstance.current.next();
        }
      } catch (err) {
        flipBookInstance.current.next();
      }
    }
  };

  return (
    <section id="relationships" className="relationships-section section-padding">
      <div className="editorial-container relationships-grid">
        {/* Left Column Text Header */}
        <div className="relationships-left-column">
          <span className="relationships-section-tag">03 RELATIONSHIPS</span>
          <h2 className="relationships-main-heading">
            The people she <br />changed forever.
          </h2>
          <p className="relationships-kanji">彼女を変えた人々。</p>
        </div>

        {/* Right Column DearFlip 3D WebGL Physics Flipbook */}
        <div className="relationships-right-column">
          <div className="relationships-book-wrapper-outer" onClick={handleBookClick}>
            {/* Interactive "Click Me" Hint Tag */}
            <AnimatePresence>
              {showTag && (
                <motion.div
                  className="interactive-click-tag"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="tag-pulse-dot" />
                  <span>CLICK ME TO FLIP BOOK</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relationships-book-wrapper">
              <div ref={containerRef} className="_df_book" id="dflip_relationships_book" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default RelationshipsDossier;
