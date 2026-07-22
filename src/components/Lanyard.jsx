import React, { useRef, useState } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Shield01Icon, SparklesIcon } from '@hugeicons/core-free-icons';
import './Lanyard.css';

export default function Lanyard({
  frontImage = '/images/story-1.jpg',
}) {
  const cardRef = useRef(null);
  const [isFlipped, setIsFlipped] = useState(false);

  // Framer Motion spring physics for mouse drag and tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-200, 200], [25, -25]), { stiffness: 300, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-200, 200], [-25, 25]), { stiffness: 300, damping: 20 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div className="lanyard-container">
      {/* Interactive 3D Card */}
      <motion.div
        ref={cardRef}
        className="lanyard-card-3d"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: rotateX,
          rotateY: rotateY,
          transformStyle: 'preserve-3d',
        }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        onClick={() => setIsFlipped(!isFlipped)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Card Front */}
        <div className="card-face card-front">
          <div className="card-header-bar">
            <div className="card-punch-hole" />
            <div className="card-agency-title">
              <HugeiconsIcon icon={Shield01Icon} size={12} color="#A63D3D" />
              <span>PUBLIC SAFETY SPECIAL DIVISION 4</span>
            </div>
          </div>

          <div className="card-photo-container">
            <img src={frontImage} alt="Makima Officer Badge" className="card-photo-img" />
            <div className="card-photo-overlay" />
            <span className="card-photo-kanji">支配の悪魔</span>
          </div>

          <div className="card-details-footer">
            <div className="card-name-block">
              <span className="card-name-jp">マキマ</span>
              <span className="card-name-en">MAKIMA</span>
            </div>

            <div className="card-barcode-strip">
              <div className="barcode-lines" />
              <span className="barcode-num">ID-1997-04-001</span>
            </div>
          </div>

          {/* Holographic Security Overlay */}
          <div className="holographic-shine" />
        </div>

        {/* Card Back */}
        <div className="card-face card-back">
          <div className="card-header-bar">
            <div className="card-punch-hole" />
            <span className="card-agency-title">CONFIDENTIAL CLASSIFIED</span>
          </div>

          <div className="card-back-content">
            <div className="classified-stamp">TOP SECRET</div>
            <p className="classified-text">
              Property of the Ministry of Internal Affairs. Unauthorized inspection or destruction will trigger immediate telepathic execution.
            </p>
            <div className="classified-seal">
              <HugeiconsIcon icon={SparklesIcon} size={24} color="#A63D3D" />
              <span>CONTROL DEVIL REGISTRY</span>
            </div>
          </div>

          <div className="card-details-footer">
            <div className="card-barcode-strip">
              <div className="barcode-lines" />
              <span className="barcode-num">RESTRICTED ACCESS ONLY</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
