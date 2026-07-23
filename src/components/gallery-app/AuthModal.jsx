import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, ArrowLeft02Icon, ViewIcon, ViewOffIcon } from '@hugeicons/core-free-icons';
import { useAuth } from '../../context/AuthContext';
import './AuthModal.css';

export function AuthModal({ isOpen, onClose, initialMode = 'signin' }) {
  const [mode, setMode] = useState(initialMode); // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const videoRef = useRef(null);
  const { signIn, signUp, signInWithOAuth, resetPassword } = useAuth();

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode, isOpen]);

  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Ensure high quality video plays instantly on mount
  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleResetState = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSwitchMode = (newMode) => {
    handleResetState();
    setMode(newMode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    handleResetState();
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) throw error;
        setSuccessMessage('Welcome back!');
        setTimeout(() => {
          onClose();
        }, 600);
      } else if (mode === 'signup') {
        if (!displayName || !handle) {
          setErrorMessage('Display Name and Handle are required.');
          setLoading(false);
          return;
        }
        const formattedHandle = handle.startsWith('@') ? handle : `@${handle}`;
        const { error } = await signUp(email, password, displayName, formattedHandle);
        if (error) throw error;
        setSuccessMessage('Account created successfully! Check your email to confirm.');
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) throw error;
        setSuccessMessage('Password reset link sent to your email.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    handleResetState();
    try {
      const { error } = await signInWithOAuth(provider);
      if (error) throw error;
    } catch (err) {
      setErrorMessage(err.message || `Failed to sign in with ${provider}.`);
    }
  };

  return (
    <AnimatePresence>
      <div className="auth-fullpage-overlay">
        {/* Top Floating Header with Back to Gallery */}
        <div className="auth-top-bar">
          <button className="auth-back-btn" onClick={onClose} title="Back to Gallery">
            <HugeiconsIcon icon={ArrowLeft02Icon} size={18} />
            <span>Back to Gallery</span>
          </button>

          <div className="auth-brand-logo">
            <span className="brand-text">MAKIMA</span>
            <span className="brand-kanji">マキマ</span>
          </div>

          <button className="auth-close-circle-btn" onClick={onClose} aria-label="Close">
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
        </div>

        {/* Dedicated Split Card Layout matching Image 2 */}
        <motion.div
          className="auth-split-card"
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Left Side: High Quality Video Hero Box */}
          <div className="auth-video-box">
            <video
              ref={videoRef}
              src="/mine2.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="auth-hero-video"
            />
            <div className="auth-video-overlay-badge">
              <span className="badge-dot" />
              <span>Public Safety Devil Hunter</span>
            </div>
          </div>

          {/* Right Side: Editorial Form Pane matching Image 2 */}
          <div className="auth-form-pane">
            <div className="auth-form-header">
              <h2 className="auth-headline">
                {mode === 'signin' && 'Welcome Back!'}
                {mode === 'signup' && 'Create Account'}
                {mode === 'forgot' && 'Reset Password'}
              </h2>
              <p className="auth-subline">Enter your details below</p>
            </div>

            {errorMessage && <div className="auth-alert error">{errorMessage}</div>}
            {successMessage && <div className="auth-alert success">{successMessage}</div>}

            <form onSubmit={handleSubmit} className="auth-form-fields">
              {mode === 'signup' && (
                <>
                  <div className="auth-input-group">
                    <label className="auth-input-label">Display Name</label>
                    <input
                      type="text"
                      className="auth-minimal-input"
                      placeholder="e.g. Makima Fan"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="auth-input-group">
                    <label className="auth-input-label">Handle</label>
                    <input
                      type="text"
                      className="auth-minimal-input"
                      placeholder="e.g. @makimafan"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              <div className="auth-input-group">
                <label className="auth-input-label">Email</label>
                <input
                  type="email"
                  className="auth-minimal-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {mode !== 'forgot' && (
                <div className="auth-input-group">
                  <label className="auth-input-label">Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="auth-minimal-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <HugeiconsIcon icon={showPassword ? ViewOffIcon : ViewIcon} size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Options Row (Remember Me & Forgot Password) */}
              {mode === 'signin' && (
                <div className="auth-options-row">
                  <label className="remember-me-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="auth-checkbox"
                    />
                    <span>Remember me</span>
                  </label>

                  <button
                    type="button"
                    className="forgot-password-link"
                    onClick={() => handleSwitchMode('forgot')}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Primary Action Button */}
              <button
                type="submit"
                className="auth-primary-submit-btn"
                disabled={loading}
              >
                {loading
                  ? 'Processing...'
                  : mode === 'signin'
                  ? 'Log in'
                  : mode === 'signup'
                  ? 'Create Account'
                  : 'Send Reset Link'}
              </button>
            </form>

            {/* OAuth Divider & Buttons */}
            {mode !== 'forgot' && (
              <div className="oauth-section">
                <button
                  type="button"
                  className="oauth-pill-btn"
                  onClick={() => handleOAuthLogin('google')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.2 8.8 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.3 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.4C.6 9.4 0 11.6 0 14s.6 4.6 1.6 6.6l3.7-2.9c-.2-.7-.4-1.5-.4-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.2-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z"
                    />
                  </svg>
                  <span>Log in with Google</span>
                </button>

                <button
                  type="button"
                  className="oauth-pill-btn"
                  onClick={() => handleOAuthLogin('github')}
                >
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>Log in with GitHub</span>
                </button>
              </div>
            )}

            {/* Footer Mode Switcher */}
            <div className="auth-footer-switcher">
              {mode === 'signin' && (
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    className="switch-mode-btn"
                    onClick={() => handleSwitchMode('signup')}
                  >
                    Sign Up
                  </button>
                </p>
              )}

              {mode === 'signup' && (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="switch-mode-btn"
                    onClick={() => handleSwitchMode('signin')}
                  >
                    Sign In
                  </button>
                </p>
              )}

              {mode === 'forgot' && (
                <p>
                  Remembered password?{' '}
                  <button
                    type="button"
                    className="switch-mode-btn"
                    onClick={() => handleSwitchMode('signin')}
                  >
                    Back to Sign In
                  </button>
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default AuthModal;
