import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { useAuth } from '../../context/AuthContext';
import './AuthModal.css';

export function AuthModal({ isOpen, onClose, initialMode = 'signin' }) {
  const [mode, setMode] = useState(initialMode); // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, signInWithOAuth, resetPassword } = useAuth();

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
        setSuccessMessage('Successfully logged in!');
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
        setSuccessMessage('Account created successfully! Check your email to confirm registration.');
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
      <div className="auth-modal-overlay" onClick={onClose}>
        <motion.div
          className="auth-modal-container"
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="auth-modal-header">
            <h3 className="auth-modal-title">
              {mode === 'signin' && 'Sign In to Makima Gallery'}
              {mode === 'signup' && 'Create Your Account'}
              {mode === 'forgot' && 'Reset Password'}
            </h3>
            <button className="auth-close-btn" onClick={onClose} aria-label="Close modal">
              <HugeiconsIcon icon={Cancel01Icon} size={20} />
            </button>
          </div>

          {/* Mode Switch Tabs */}
          {mode !== 'forgot' && (
            <div className="auth-modal-tabs">
              <button
                type="button"
                className={`auth-tab-btn ${mode === 'signin' ? 'active' : ''}`}
                onClick={() => handleSwitchMode('signin')}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => handleSwitchMode('signup')}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Modal Body */}
          <div className="auth-modal-body">
            {errorMessage && <div className="auth-alert error">{errorMessage}</div>}
            {successMessage && <div className="auth-alert success">{successMessage}</div>}

            {/* OAuth buttons */}
            {mode !== 'forgot' && (
              <>
                <div className="auth-oauth-group">
                  <button
                    type="button"
                    className="oauth-btn"
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
                    Continue with Google
                  </button>

                  <button
                    type="button"
                    className="oauth-btn"
                    onClick={() => handleOAuthLogin('github')}
                  >
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                    Continue with GitHub
                  </button>
                </div>

                <div className="auth-divider">
                  <span>or continue with email</span>
                </div>
              </>
            )}

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="auth-form">
              {mode === 'signup' && (
                <>
                  <div className="auth-field">
                    <label className="auth-label">Display Name</label>
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="e.g. Makima Fan"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Handle</label>
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="e.g. @makimafan"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              <div className="auth-field">
                <label className="auth-label">Email Address</label>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {mode !== 'forgot' && (
                <div className="auth-field">
                  <label className="auth-label">Password</label>
                  <input
                    type="password"
                    className="auth-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              )}

              {mode === 'signin' && (
                <button
                  type="button"
                  className="auth-forgot-link"
                  onClick={() => handleSwitchMode('forgot')}
                >
                  Forgot password?
                </button>
              )}

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  'Processing...'
                ) : mode === 'signin' ? (
                  'Sign In →'
                ) : mode === 'signup' ? (
                  'Create Account →'
                ) : (
                  'Send Reset Link →'
                )}
              </button>
            </form>

            {/* Switch Mode Footer */}
            <div className="auth-modal-footer-text">
              {mode === 'signin' && (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    className="auth-toggle-link"
                    onClick={() => handleSwitchMode('signup')}
                  >
                    Sign Up
                  </button>
                </>
              )}

              {mode === 'signup' && (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="auth-toggle-link"
                    onClick={() => handleSwitchMode('signin')}
                  >
                    Sign In
                  </button>
                </>
              )}

              {mode === 'forgot' && (
                <>
                  Remembered your password?{' '}
                  <button
                    type="button"
                    className="auth-toggle-link"
                    onClick={() => handleSwitchMode('signin')}
                  >
                    Back to Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default AuthModal;
