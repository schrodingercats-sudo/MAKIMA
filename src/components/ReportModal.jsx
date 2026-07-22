import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ReportModal.css';

export function ReportModal({ isOpen, onClose }) {
  const [description, setDescription] = useState('');
  const [page, setPage] = useState('Gallery');
  const [severity, setSeverity] = useState('Minor');
  const [fileName, setFileName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setDescription('');
      setFileName('');
      onClose();
    }, 2200);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="report-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="report-modal-container"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button className="report-modal-close" onClick={onClose} aria-label="Close Report Modal">
            ✕
          </button>

          <div className="report-modal-content-grid">
            {/* Left Column: Chibi Makima Mascot */}
            <div className="report-mascot-col">
              <img
                src="/images/report-style.png"
                alt="Makima Chibi Report Mascot"
                className="report-mascot-img"
              />
            </div>

            {/* Right Column: Interactive Form Panel */}
            <div className="report-form-col">
              {isSubmitted ? (
                <motion.div
                  className="report-success-state"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="success-icon">✓</div>
                  <h3>Report Submitted!</h3>
                  <p>Your issue report has been dispatched to Public Safety HQ.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="report-form">
                  <div className="report-header">
                    <h2 className="report-title">Report an Issue?</h2>
                    <p className="report-subtitle">Found a problem? Let me know.</p>
                  </div>

                  {/* Textarea */}
                  <div className="form-group">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the issue..."
                      className="report-textarea"
                      rows={3}
                      required
                    />
                  </div>

                  {/* Page Dropdown */}
                  <div className="form-group row-group">
                    <label className="form-label">Page:</label>
                    <select
                      value={page}
                      onChange={(e) => setPage(e.target.value)}
                      className="report-select"
                    >
                      <option value="Gallery">Gallery</option>
                      <option value="Story">Identity / Story</option>
                      <option value="Profile">Character Profile</option>
                      <option value="Relationships">Relationships Flipbook</option>
                      <option value="Timeline">Timeline</option>
                      <option value="Hero">Hero Section</option>
                      <option value="Footer">Footer & Legacy</option>
                    </select>
                  </div>

                  {/* Severity Radio Selection */}
                  <div className="form-group row-group severity-group">
                    <span className="form-label">Severity:</span>
                    <div className="radio-options">
                      <label className={`radio-label ${severity === 'Minor' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="severity"
                          value="Minor"
                          checked={severity === 'Minor'}
                          onChange={() => setSeverity('Minor')}
                        />
                        <span className="radio-dot" />
                        Minor
                      </label>

                      <label className={`radio-label ${severity === 'Major' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="severity"
                          value="Major"
                          checked={severity === 'Major'}
                          onChange={() => setSeverity('Major')}
                        />
                        <span className="radio-dot" />
                        Major
                      </label>

                      <label className={`radio-label ${severity === 'Critical' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="severity"
                          value="Critical"
                          checked={severity === 'Critical'}
                          onChange={() => setSeverity('Critical')}
                        />
                        <span className="radio-dot" />
                        Critical
                      </label>
                    </div>
                  </div>

                  {/* File Upload Button */}
                  <div className="form-group file-upload-group">
                    <span className="form-label">Attach screenshot:</span>
                    <label className="file-upload-btn">
                      📎 {fileName ? fileName : 'Upload Image'}
                      <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                    </label>
                  </div>

                  {/* Submit Action Button */}
                  <button type="submit" className="report-submit-btn">
                    Submit Report
                  </button>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ReportModal;
