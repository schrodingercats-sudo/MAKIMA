import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendDiscordBugReport } from '../utils/discordWebhook';
import './ReportModal.css';

export function ReportModal({ isOpen, onClose }) {
  const [description, setDescription] = useState('');
  const [page, setPage] = useState('Gallery');
  const [severity, setSeverity] = useState('Minor');
  const [fileName, setFileName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [autoMetadata, setAutoMetadata] = useState({ browser: '', viewport: '', path: '' });

  useEffect(() => {
    if (isOpen) {
      // Auto-detect browser & screen specs
      const ua = navigator.userAgent;
      let browserName = 'Browser';
      if (ua.includes('Chrome')) browserName = 'Chrome';
      else if (ua.includes('Safari')) browserName = 'Safari';
      else if (ua.includes('Firefox')) browserName = 'Firefox';

      const osName = ua.includes('Win') ? 'Windows' : ua.includes('Mac') ? 'macOS' : 'Mobile';

      setAutoMetadata({
        browser: `${browserName} (${osName})`,
        viewport: `${window.innerWidth}×${window.innerHeight}`,
        path: window.location.pathname || '/'
      });

      // Load saved webhook URL if present in localStorage
      const savedWebhook = localStorage.getItem('makima_discord_webhook');
      if (savedWebhook) {
        setWebhookUrl(savedWebhook);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (webhookUrl) {
      localStorage.setItem('makima_discord_webhook', webhookUrl);
    }

    // Dispatch to Discord Webhook
    await sendDiscordBugReport({
      description,
      page,
      severity,
      fileName,
      webhookUrl
    });

    setIsSubmitting(false);
    setIsSubmitted(true);

    setTimeout(() => {
      setIsSubmitted(false);
      setDescription('');
      setFileName('');
      onClose();
    }, 2500);
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
            {/* Left Column: Makima Mascot */}
            <div className="report-mascot-col">
              <img
                src="/images/coming-soon.jpg"
                alt="Makima Report Mascot"
                className="report-mascot-img"
              />
              <div className="report-quote-bubble">
                “Found an imperfection? Tell me. I'll have it dealt with.”
              </div>
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
                  <h3 className="success-makima-title">“Understood. I'll make sure it's corrected.”</h3>
                  <p className="success-sub">Report dispatched straight to Public Safety Discord.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="report-form">
                  <div className="report-header">
                    <span className="report-hq-badge">PUBLIC SAFETY HQ — BUG DISPATCH</span>
                    <h2 className="report-title">Report an Issue?</h2>
                  </div>

                  {/* Automated Metadata Pills Bar */}
                  <div className="auto-metadata-bar">
                    <span className="meta-pill">🌐 {autoMetadata.path}</span>
                    <span className="meta-pill">💻 {autoMetadata.browser}</span>
                    <span className="meta-pill">📐 {autoMetadata.viewport}</span>
                  </div>

                  {/* Textarea */}
                  <div className="form-group">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the issue in detail..."
                      className="report-textarea"
                      rows={3}
                      required
                    />
                  </div>

                  {/* Page Dropdown */}
                  <div className="form-group row-group">
                    <label className="form-label">Page / Section:</label>
                    <select
                      value={page}
                      onChange={(e) => setPage(e.target.value)}
                      className="report-select"
                    >
                      <option value="Gallery">Gallery (07 GALLERY)</option>
                      <option value="Story">Identity / Story (01 IDENTITY)</option>
                      <option value="Profile">Character Profile (02 PROFILE)</option>
                      <option value="Relationships">Relationships 3D Flipbook (03)</option>
                      <option value="Timeline">Timeline (05 TIMELINE)</option>
                      <option value="Hero">Hero Presentation</option>
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

                  {/* Discord Webhook URL Configuration */}
                  <div className="form-group webhook-group">
                    <label className="form-label">Discord Webhook URL (Optional):</label>
                    <input
                      type="url"
                      placeholder="https://discord.com/api/webhooks/..."
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="webhook-input"
                    />
                  </div>

                  {/* Submit Action Button */}
                  <button type="submit" className="report-submit-btn" disabled={isSubmitting}>
                    {isSubmitting ? 'DISPATCHING TO DISCORD...' : 'Submit Report →'}
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
