import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ComingSoonModal.css';

export function ComingSoonModal({ isOpen, onClose, title = 'COMING SOON', message }) {
  if (!isOpen) return null;

  const defaultMessage = 'The developer is lazy. The full feature will come soon!';

  return (
    <AnimatePresence>
      <motion.div
        className="coming-soon-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="coming-soon-modal"
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="coming-soon-close" onClick={onClose} aria-label="Close Modal">
            ✕
          </button>

          <div className="coming-soon-image-wrapper">
            <img
              src="/images/coming-soon.jpg"
              alt="Makima Smirk - Developer is lazy"
              className="coming-soon-img"
            />
          </div>

          <div className="coming-soon-content">
            <span className="coming-soon-badge">PUBLIC SAFETY ANNOUNCEMENT</span>
            <h3 className="coming-soon-title">{title}</h3>
            <p className="coming-soon-text">
              {message || defaultMessage}
            </p>

            <button className="coming-soon-btn" onClick={onClose}>
              UNDERSTOOD
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ComingSoonModal;
