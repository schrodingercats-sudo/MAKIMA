import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { UserIcon, FlashIcon, Copy01Icon, Tick01Icon, File01Icon } from '@hugeicons/core-free-icons';
import Lanyard from './Lanyard';
import './CharacterProfile.css';

const CHARACTER_METADATA = [
  { label: 'Name (Kanji)', value: 'マキマ (Makima)', tag: 'DOMINION' },
  { label: 'Affiliation', value: 'Public Safety (Division 4)', tag: 'PUBLIC SAFETY' },
  { label: 'Species', value: 'Devil (Control Devil)', tag: 'FOUR HORSEMEN' },
  { label: 'Status', value: 'Deceased', tag: 'FINAL FATE' },
  { label: 'Height', value: '168 cm (approx)', tag: 'STATISTICS' },
  { label: 'Age', value: 'Unknown (Ancient)', tag: 'ORIGIN' },
  { label: 'Birthday', value: 'Unknown', tag: 'RECORD' },
  { label: 'Ability', value: 'Control, Bang, Contract', tag: 'CAPABILITIES' }
];

const ABILITY_BREAKDOWN = [
  {
    name: 'Absolute Control',
    jp: '支配権限',
    description: 'Forces obedience upon any entity Makima perceives as inferior.'
  },
  {
    name: 'Force Projectile ("Bang")',
    jp: '衝撃波',
    description: 'Fires an invisible hyper-compressed force that obliterates targets.'
  },
  {
    name: 'Prime Minister Contract',
    jp: '総理大臣契約',
    description: 'Redirects any fatal damage to an arbitrary citizen of Japan.'
  },
  {
    name: 'Corpse Manipulation',
    jp: '死体操縦',
    description: 'Subjugates deceased devil hunters to utilize their contracts at will.'
  }
];

export function CharacterProfile() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'metadata' | 'abilities'
  const [copied, setCopied] = useState(false);

  const handleCopyMetadata = () => {
    const text = CHARACTER_METADATA.map((m) => `${m.label}: ${m.value}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="profile" className="character-profile-section section-padding bg-secondary">
      <div className="editorial-container profile-main-container">
        {/* Section Header */}
        <div className="profile-section-header">
          <div className="profile-header-meta">
            <span className="editorial-tag">SECTION 02 — CHARACTER ARCHIVE</span>
          </div>
          <h2 className="text-display-lg profile-main-title">
            CHARACTER SPECIFICATION
          </h2>
          <p className="text-body-lead text-body-muted profile-header-sub">
            Comprehensive physical, bureaucratic, and supernatural dossier of the Control Devil.
          </p>
        </div>

        {/* Editorial Split Layout */}
        <div className="profile-split-container">
          {/* Left Column: Interactive 3D Lanyard Card */}
          <div className="profile-portrait-column">
            <Lanyard frontImage="/images/makima-id-card.webp" />
          </div>

          {/* Right Column: Tabbed Dossier Panel (Fits Cleanly with Zero Internal Scroll) */}
          <div className="profile-content-column">
            {/* Tab Bar */}
            <div className="profile-tab-bar" role="tablist">
              <button
                role="tab"
                aria-selected={activeTab === 'overview'}
                className={`profile-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <HugeiconsIcon icon={UserIcon} size={14} />
                <span>OVERVIEW</span>
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'metadata'}
                className={`profile-tab-btn ${activeTab === 'metadata' ? 'active' : ''}`}
                onClick={() => setActiveTab('metadata')}
              >
                <HugeiconsIcon icon={File01Icon} size={14} />
                <span>METADATA SPEC</span>
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'abilities'}
                className={`profile-tab-btn ${activeTab === 'abilities' ? 'active' : ''}`}
                onClick={() => setActiveTab('abilities')}
              >
                <HugeiconsIcon icon={FlashIcon} size={14} />
                <span>ABILITIES</span>
              </button>
            </div>

            {/* Tab Content Panels */}
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="tab-overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="profile-tab-panel"
                >
                  <div className="overview-narrative">
                    <span className="narrative-tag">ARCHIVAL SUMMARY</span>
                    <h3 className="narrative-title">
                      The Enigmatic Bureaucrat of Public Safety
                    </h3>
                    <p className="narrative-p">
                      Makima presents herself as a refined officer of Tokyo Special Division 4. Her serene demeanor hides an ancient entity of immense power—the Control Devil. Characterized by her concentric golden eyes and crisp suit, she moves through high society and dark alleys with unwavering elegance.
                    </p>
                    <p className="narrative-p">
                      Behind her polite speech lies absolute pragmatism. She views humans like beloved pets—worthy of affection, but subject to her control. Her primary goal centers on Chainsaw Man (Pochita), whom she reveres as a savior.
                    </p>

                    <div className="narrative-highlights-grid">
                      <div className="highlight-box">
                        <span className="hl-number">01</span>
                        <div className="hl-info">
                          <span className="hl-title">Dual Persona</span>
                          <span className="hl-desc">Gracious supervisor & unyielding entity.</span>
                        </div>
                      </div>
                      <div className="highlight-box">
                        <span className="hl-number">02</span>
                        <div className="hl-info">
                          <span className="hl-title">Golden Eyes</span>
                          <span className="hl-desc">Ringed irises reflecting Control Devil lineage.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'metadata' && (
                <motion.div
                  key="tab-metadata"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="profile-tab-panel"
                >
                  <div className="metadata-spec-wrapper">
                    <div className="metadata-spec-header">
                      <span className="metadata-spec-title">OFFICIAL PUBLIC SAFETY RECORDS</span>
                      <button className="copy-metadata-btn" onClick={handleCopyMetadata}>
                        {copied ? <HugeiconsIcon icon={Tick01Icon} size={14} color="#A63D3D" /> : <HugeiconsIcon icon={Copy01Icon} size={14} />}
                        <span>{copied ? 'COPIED' : 'COPY SPEC'}</span>
                      </button>
                    </div>

                    {/* Compact 2-Column Grid */}
                    <div className="metadata-grid-compact">
                      {CHARACTER_METADATA.map((row, idx) => (
                        <div key={idx} className="metadata-compact-card">
                          <div className="meta-card-top">
                            <span className="meta-card-label">{row.label}</span>
                            <span className="meta-card-tag">{row.tag}</span>
                          </div>
                          <span className="meta-card-val">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'abilities' && (
                <motion.div
                  key="tab-abilities"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="profile-tab-panel"
                >
                  <div className="abilities-wrapper">
                    <span className="narrative-tag">SUPERNATURAL CAPABILITIES</span>
                    <div className="abilities-grid-compact">
                      {ABILITY_BREAKDOWN.map((ab, idx) => (
                        <div key={idx} className="ability-card-compact">
                          <div className="ability-card-header">
                            <HugeiconsIcon icon={FlashIcon} size={14} color="#A63D3D" />
                            <span className="ability-jp">{ab.jp}</span>
                          </div>
                          <h4 className="ability-name">{ab.name}</h4>
                          <p className="ability-desc">{ab.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CharacterProfile;
