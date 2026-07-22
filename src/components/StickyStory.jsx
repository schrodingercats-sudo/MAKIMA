import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, ArrowRight01Icon, StarIcon, Add01Icon } from '@hugeicons/core-free-icons';
import { handleImageError } from '../utils/imageFallback';
import './StickyStory.css';

const IDENTITY_CARDS = [
  {
    id: '01',
    count: '01 / 05',
    title: 'The Woman of Control.',
    kanji: '支配の悪魔',
    affiliation: 'Public Safety Devil Hunter (Tokyo Special Division 4)',
    species: 'Devil (Control Devil)',
    status: 'Deceased',
    importance: 5,
    imageSrc: '/images/identity-img1.webp',
    body: 'The Control Devil. Public Safety Devil Hunter. A woman of refined taste and terrifying intellect. She doesn\'t need to raise her voice. Because everyone obeys.'
  },
  {
    id: '02',
    count: '02 / 05',
    title: 'An Unshakable Demeanor.',
    kanji: '冷徹な支配者',
    affiliation: 'Public Safety (Headquarters)',
    species: 'Control Devil',
    status: 'Deceased',
    importance: 5,
    imageSrc: '/images/identity-img2.webp',
    body: 'Always calm, polite, and soft-spoken. Behind her pleasant demeanor lies a ruthless manipulator who views humans as dogs to be owned and commanded.'
  },
  {
    id: '03',
    count: '03 / 05',
    title: 'Absolute Telepathic Power.',
    kanji: '絶対的遠隔力',
    affiliation: 'Special Operations',
    species: 'Control Devil',
    status: 'Deceased',
    importance: 5,
    imageSrc: '/images/identity-img3.webp',
    body: 'Her ritualistic force requires living sacrifices to crush targets at any distance. Distance offers no safety from her authority.'
  },
  {
    id: '04',
    count: '04 / 05',
    title: 'Prime Minister Contract.',
    kanji: '内閣総理大臣契約',
    affiliation: 'Japanese Government',
    species: 'Control Devil',
    status: 'Deceased',
    importance: 5,
    imageSrc: '/images/identity-img4.webp',
    body: 'All fatal damage inflicted upon Makima is nullified and transferred into equivalent illnesses and accidents among citizens of Japan.'
  },
  {
    id: '05',
    count: '05 / 05',
    title: 'The Hero of Hell.',
    kanji: '地獄のヒーロー',
    affiliation: 'Public Safety',
    species: 'Control Devil',
    status: 'Deceased',
    importance: 5,
    imageSrc: '/images/identity-img5.webp',
    body: 'Her ultimate desire was equal companionship with Chainsaw Man, a relationship she believed impossible unless achieved through absolute control or total consumption.'
  }
];

export function StickyStory() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeCard = IDENTITY_CARDS[activeIndex];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : IDENTITY_CARDS.length - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < IDENTITY_CARDS.length - 1 ? prev + 1 : 0));
  };

  const handleNavClick = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="story" className="identity-section section-padding">
      <div className="editorial-container identity-grid-three-col">
        {/* Column 1: Nav Menu Track */}
        <div className="identity-nav-col">
          <div className="identity-nav-list">
            <button className="nav-item active" onClick={() => handleNavClick('story')}>
              <span className="nav-dot" />
              <span className="nav-num">01</span>
              <span className="nav-label">Identity</span>
            </button>
            <button className="nav-item" onClick={() => handleNavClick('profile')}>
              <span className="nav-num">02</span>
              <span className="nav-label">Profile</span>
            </button>
            <button className="nav-item" onClick={() => handleNavClick('relationships')}>
              <span className="nav-num">03</span>
              <span className="nav-label">Relationships</span>
            </button>
            <button className="nav-item" onClick={() => handleNavClick('story')}>
              <span className="nav-num">04</span>
              <span className="nav-label">Power</span>
            </button>
            <button className="nav-item" onClick={() => handleNavClick('timeline')}>
              <span className="nav-num">05</span>
              <span className="nav-label">Timeline</span>
            </button>
            <button className="nav-item" onClick={() => handleNavClick('quotes')}>
              <span className="nav-num">06</span>
              <span className="nav-label">Quotes</span>
            </button>
            <button className="nav-item" onClick={() => handleNavClick('legacy')}>
              <span className="nav-num">07</span>
              <span className="nav-label">Legacy</span>
            </button>
          </div>
        </div>

        {/* Column 2: "Who is Makima?" Text Block */}
        <div className="identity-text-col">
          <span className="identity-section-tag">01 IDENTITY</span>
          <h2 className="identity-main-heading">
            Who is <span className="text-rust-italic">Makima?</span>
          </h2>
          <p className="identity-body-paragraph">{activeCard.body}</p>
        </div>

        {/* Column 3: Dark Sliding Card Container */}
        <div className="identity-card-col">
          <div className="identity-card-wrapper">
            <button className="card-arrow-btn prev-btn" onClick={handlePrev} aria-label="Previous Slide">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            </button>

            <div className="identity-dark-card">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCard.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="identity-card-inner"
                >
                  <div className="identity-card-image-col">
                    {activeCard.imageSrc ? (
                      <img
                        src={activeCard.imageSrc}
                        alt={activeCard.title}
                        className="identity-card-img"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => handleImageError(e, 'story', activeCard.id)}
                      />
                    ) : (
                      <div className="identity-image-empty-placeholder">
                        <HugeiconsIcon icon={Add01Icon} size={28} color="#A63D3D" />
                        <span className="empty-tag-label">ADD IMAGE {activeCard.id}</span>
                        <span className="empty-tag-sub">RECOMMENDED: 600×800 PORTRAIT</span>
                      </div>
                    )}
                  </div>

                  <div className="identity-card-info-col">
                    <span className="card-counter">{activeCard.count}</span>
                    <h3 className="card-title">{activeCard.title}</h3>
                    <span className="card-kanji">{activeCard.kanji}</span>

                    <div className="card-spec-list">
                      <div className="spec-row">
                        <span className="spec-label">AFFILIATION</span>
                        <span className="spec-val">{activeCard.affiliation}</span>
                      </div>
                      <div className="spec-row">
                        <span className="spec-label">SPECIES</span>
                        <span className="spec-val">{activeCard.species}</span>
                      </div>
                      <div className="spec-row">
                        <span className="spec-label">STATUS</span>
                        <span className="spec-val">{activeCard.status}</span>
                      </div>
                      <div className="spec-row">
                        <span className="spec-label">IMPORTANCE</span>
                        <div className="spec-stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <HugeiconsIcon key={star} icon={StarIcon} size={13} color="#A63D3D" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <button className="card-arrow-btn next-btn" onClick={handleNext} aria-label="Next Slide">
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
            </button>
          </div>

          <div className="identity-pagination-dots">
            {IDENTITY_CARDS.map((_, idx) => (
              <span
                key={idx}
                className={`page-dot ${idx === activeIndex ? 'active' : ''}`}
                onClick={() => setActiveIndex(idx)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default StickyStory;
