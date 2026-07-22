import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, Tag01Icon, Layers01Icon, Calendar01Icon } from '@hugeicons/core-free-icons';
import { getFallbackImageUrl, handleImageError } from '../utils/imageFallback';
import './ImageModal.css';

export function ImageModal({ image, onClose }) {
  // ESC key listener & body scroll lock
  useEffect(() => {
    if (!image) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [image, onClose]);

  if (!image) return null;

  const title = image.title || 'EDITORIAL STILL';
  const category = image.category || 'CURATED ARCHIVE';
  const kanji = image.kanji || '美学';
  const description = image.description || 'A rare editorial portrait capturing the calm authority and divine elegance of Makima.';
  const date = image.date || 'EDITORIAL ARCHIVE 2026';

  return (
    <AnimatePresence>
      <div
        className="image-modal-backdrop"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={`Lightbox image preview for ${title}`}
      >
        <motion.div
          className="image-modal-container"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Header Bar */}
          <div className="image-modal-header">
            <div className="modal-header-left">
              <span className="modal-category-badge">{category}</span>
              <span className="modal-kanji">{kanji}</span>
            </div>
            <button
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Close image lightbox"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={20} />
              <span className="close-btn-text">ESC</span>
            </button>
          </div>

          {/* Center Content Body */}
          <div className="image-modal-body">
            <div className="modal-image-wrapper">
              <img
                src={image.src || getFallbackImageUrl('gallery', title)}
                alt={title}
                className="modal-preview-img"
                onError={(e) => handleImageError(e, 'gallery', title)}
              />
              <div className="modal-image-vignette" />
            </div>

            {/* Right Information Panel */}
            <div className="modal-info-panel">
              <div className="panel-watermark">{kanji}</div>

              <div className="panel-header">
                <span className="panel-tag">HIGH RESOLUTION EXHIBIT</span>
                <h3 className="panel-title">{title}</h3>
              </div>

              <div className="panel-divider" />

              <p className="panel-description">{description}</p>

              <div className="panel-meta-list">
                <div className="meta-item">
                  <HugeiconsIcon icon={Tag01Icon} size={14} color="#A63D3D" />
                  <span className="meta-label">CATEGORY:</span>
                  <span className="meta-val">{category}</span>
                </div>
                <div className="meta-item">
                  <HugeiconsIcon icon={Layers01Icon} size={14} color="#A63D3D" />
                  <span className="meta-label">FORMAT:</span>
                  <span className="meta-val">LUXURY EDITORIAL STILL</span>
                </div>
                <div className="meta-item">
                  <HugeiconsIcon icon={Calendar01Icon} size={14} color="#A63D3D" />
                  <span className="meta-label">RELEASE:</span>
                  <span className="meta-val">{date}</span>
                </div>
              </div>

              <div className="panel-footer">
                <span className="panel-copyright">PUBLIC SAFETY ARCHIVAL DIVISION N° 004</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ImageModal;
