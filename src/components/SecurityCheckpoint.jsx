import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './SecurityCheckpoint.css';

export function SecurityCheckpoint({ onComplete }) {
  const [status, setStatus] = useState('VERIFYING BROWSER SECURITY...');
  const [progress, setProgress] = useState(15);
  const [isPassed, setIsPassed] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setStatus('CHECKING PUBLIC SAFETY CLEARANCE...');
      setProgress(45);
    }, 600);

    const timer2 = setTimeout(() => {
      setStatus('ANALYZING CONTROL DEVIL SIGNATURE...');
      setProgress(80);
    }, 1200);

    const timer3 = setTimeout(() => {
      setStatus('ACCESS GRANTED — WELCOME TO PUBLIC SAFETY HQ');
      setProgress(100);
      setIsPassed(true);
    }, 1800);

    const timer4 = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!isPassed && (
        <motion.div
          className="security-checkpoint-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="security-checkpoint-card">
            {/* Header Badge */}
            <div className="security-badge">
              <span className="security-lock-icon">🔒</span>
              <span>VERCEL SECURITY CHECKPOINT</span>
            </div>

            {/* Title */}
            <h1 className="security-title">VERIFYING YOUR CONNECTION</h1>
            <p className="security-subtitle">
              Public Safety HQ is inspecting your browser before granting access to Makima Editorial.
            </p>

            {/* Verification Box */}
            <div className="security-box">
              <div className="security-spinner-row">
                <div className="security-spinner" />
                <span className="security-status-text">{status}</span>
              </div>

              {/* Progress Bar */}
              <div className="security-progress-track">
                <motion.div
                  className="security-progress-fill"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Footer Notice */}
            <div className="security-footer-note">
              <span>Protected by Vercel Web Application Firewall & Public Safety HQ</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SecurityCheckpoint;
