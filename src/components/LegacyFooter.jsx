import React from 'react';
import './LegacyFooter.css';

export const LegacyFooter = React.memo(function LegacyFooter({ onNavigate, onOpenReport }) {
  const handleNavClick = (sectionId) => {
    if (onNavigate) {
      onNavigate(sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer id="legacy" className="editorial-legacy-footer">
      <div className="footer-main-container">
        <div className="editorial-container footer-flex-wrapper">
          {/* Top Row: Left side ASCII Image, Right side 3 Navigation Columns */}
          <div className="footer-top-row">
            {/* Left: ASCII Art Image */}
            <div className="footer-ascii-col">
              <img
                src="/images/ascii-makima.webp"
                alt="Makima ASCII Art"
                className="footer-ascii-img"
                loading="lazy"
                decoding="async"
              />
            </div>

            {/* Right: 3 Link Columns Side-by-Side */}
            <div className="footer-nav-columns">
              {/* 01 Navigation */}
              <div className="footer-nav-col">
                <span className="footer-col-num">01 —</span>
                <h4 className="footer-col-title">NAVIGATION</h4>
                <ul className="footer-nav-links">
                  <li><button onClick={() => handleNavClick('story')}>STORY</button></li>
                  <li><button onClick={() => handleNavClick('profile')}>PROFILE</button></li>
                  <li><button onClick={() => handleNavClick('relationships')}>RELATIONSHIPS</button></li>
                  <li><button onClick={() => handleNavClick('timeline')}>TIMELINE</button></li>
                  <li><button onClick={() => handleNavClick('quotes')}>GALLERY</button></li>
                  <li><button onClick={() => handleNavClick('quotes')}>QUOTES</button></li>
                  <li><button onClick={() => handleNavClick('legacy')}>LEGACY</button></li>
                </ul>
              </div>

              {/* 02 Connect */}
              <div className="footer-nav-col">
                <span className="footer-col-num">02 —</span>
                <h4 className="footer-col-title">CONNECT</h4>
                <ul className="footer-nav-links">
                  <li><a href="https://twitter.com" target="_blank" rel="noreferrer">TWITTER</a></li>
                  <li><a href="https://instagram.com" target="_blank" rel="noreferrer">INSTAGRAM</a></li>
                  <li><a href="https://discord.com" target="_blank" rel="noreferrer">DISCORD</a></li>
                  <li><a href="#legacy">CONTACT</a></li>
                </ul>
              </div>

              {/* 03 Info */}
              <div className="footer-nav-col">
                <span className="footer-col-num">03 —</span>
                <h4 className="footer-col-title">INFO</h4>
                <ul className="footer-nav-links">
                  <li><a href="#legacy">ABOUT THIS SITE</a></li>
                  <li><a href="#legacy">DISCLAIMER</a></li>
                  <li><button onClick={onOpenReport}>REPORT AN ISSUE</button></li>
                  <li><a href="#legacy">PRIVACY POLICY</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Row: Tribute Quote & Copyright Bar */}
          <div className="footer-quote-col">
            <span className="footer-jp-kanji">マキマ</span>
            <div className="footer-quote-line" />
            <h3 className="footer-tribute-quote">
              SOMETIMES, <br />
              THE WARMEST SMILE <br />
              HIDES THE <span className="text-rust">COLDEST</span> <br />
              INTENTIONS.
            </h3>
            <span className="footer-quote-author">— MAKIMA</span>
          </div>

          <div className="footer-bottom-bar">
            <div className="footer-brand">
              <span className="brand-title">MAKIMA</span>
              <span className="brand-jp">マキマ</span>
            </div>

            <div className="footer-copyright-text">
              © 2025 Makima Tribute. All rights reserved.
            </div>

            {/* Interactive Report Bug Trigger Button */}
            <button className="footer-report-btn" onClick={onOpenReport} aria-label="Report an Issue">
              <img src="/images/report-btn-icon.png" alt="Report Bug Icon" className="footer-report-icon" />
              <span>REPORT AN ISSUE</span>
            </button>

            <div className="footer-exterminate-tag">
              <span className="exterminate-text">EXTERMINATE. CONTROL.</span>
              <span className="red-dots">• • •</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
});

export default LegacyFooter;
