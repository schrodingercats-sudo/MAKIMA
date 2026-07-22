import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { handleImageError } from '../utils/imageFallback';
import './Timeline.css';

const TIMELINE_CARDS = [
  {
    id: '01',
    title: 'Arrival',
    kanji: '到来',
    subtitle: 'The Control Devil arrives on Earth.',
    detail: 'Makima appears in Tokyo as a high-ranking officer in Public Safety, recruiting Denji after slaying the Zombie Devil.',
    imageSrc: '/images/timeline-1.webp',
  },
  {
    id: '02',
    title: 'Special Division 4',
    kanji: '特異4課',
    subtitle: 'Joins Public Safety as a Devil Hunter.',
    detail: 'Establishes Tokyo Special Division 4, binding Denji, Aki Hayakawa, and Power into a squad under her command.',
    imageSrc: '/images/timeline-2.webp',
  },
  {
    id: '03',
    title: 'Katana Man Arc',
    kanji: '刀の悪魔編',
    subtitle: 'Makima takes action.',
    detail: 'Survives a bullet train ambush and executes remote telepathic crushing rituals from a shrine in Kyoto.',
    imageSrc: '/images/timeline-3.webp',
  },
  {
    id: '04',
    title: 'Bomb Girl Arc',
    kanji: '爆弾の悪魔編',
    subtitle: 'Plans unfold in silence.',
    detail: 'Quietly neutralizes Reze in a rainy alleyway, insulating Denji while consolidating control behind the scenes.',
    imageSrc: '/images/timeline-4.webp',
  },
  {
    id: '05',
    title: 'Gun Devil Arc',
    kanji: '銃の悪魔編',
    subtitle: 'The world trembles before power.',
    detail: 'Subjugates Aki into the Gun Fiend and single-handedly defeats the Gun Devil using multiple sacrificed contracts.',
    imageSrc: '/images/timeline-5.webp',
  },
  {
    id: '06',
    title: 'Control Devil Revelation',
    kanji: '支配の悪魔編',
    subtitle: 'The truth behind Makima.',
    detail: 'Reveals her true identity as the Control Devil and her plan to consume Chainsaw Man to create a world free of suffering.',
    imageSrc: '/images/timeline-6.webp',
  },
];

export function Timeline() {
  const [activeIndex, setActiveIndex] = useState(5); // Default card 06 active

  return (
    <section id="timeline" className="timeline-section section-padding">
      <div className="editorial-container timeline-grid">
        {/* Left Column Header */}
        <div className="timeline-left-column">
          <span className="timeline-section-tag">05 TIMELINE</span>
          <h2 className="timeline-main-heading">
            Every step. <br />
            Every plan. <br />
            Every move.
          </h2>
          <p className="timeline-kanji">すべての計画。</p>
        </div>

        {/* Right Column 6 Horizontal Cards */}
        <div className="timeline-right-column">
          <div className="timeline-cards-row">
            {TIMELINE_CARDS.map((card, index) => {
              const isActive = index === activeIndex;
              return (
                <motion.div
                  key={card.id}
                  layout
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className={`timeline-card-item ${isActive ? 'active' : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => setActiveIndex(index)}
                >
                  <motion.div layout className="timeline-card-thumb">
                    <img
                      src={card.imageSrc}
                      alt={card.title}
                      className="timeline-thumb-img"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => handleImageError(e, 'timeline', card.id)}
                    />
                    <div className="timeline-thumb-overlay" />
                    <span className="timeline-card-badge">{card.kanji}</span>
                  </motion.div>

                  <motion.div layout className="timeline-card-info">
                    <div className="card-header-row">
                      <span className="card-num">{card.id}</span>
                      <h4 className="card-title">{card.title}</h4>
                    </div>

                    <p className="card-sub">{card.subtitle}</p>

                    {/* Smooth Unfolded Detail Content with AnimatePresence */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                          className="card-expanded-detail"
                        >
                          <p className="detail-paragraph">{card.detail}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Active Indicator Bar */}
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="card-active-indicator"
                    >
                      <span className="indicator-dot" />
                      <span className="indicator-line" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Timeline;
