import React from 'react';
import { handleImageError } from '../utils/imageFallback';
import './Gallery.css';

const GALLERY_IMAGES = [
  { id: 1, name: 'gallery-1', src: '/images/gallery-1.webp', title: 'Intense Gaze' },
  { id: 2, name: 'gallery-2', src: '/images/gallery-2.webp', title: 'Public Safety Suit' },
  { id: 3, name: 'gallery-3', src: '/images/gallery-3.webp', title: 'Sunset Profile' },
  { id: 4, name: 'gallery-4', src: '/images/gallery-4.webp', title: 'Enigmatic Moment (Featured Animation)', isWide: true },
  { id: 5, name: 'gallery-5', src: '/images/gallery-5.webp', title: 'Window Silhouette' },
  { id: 6, name: 'gallery-6', src: '/images/gallery-6.webp', title: 'Gentle Smile' },
  { id: 7, name: 'gallery-7', src: '/images/gallery-7.webp', title: 'Control Authority' },
];

export const Gallery = React.memo(function Gallery({ onSelectImage, onOpenComingSoon }) {
  return (
    <div className="gallery-section-wrapper">
      {/* Gallery Header */}
      <div className="gallery-header-row">
        <div className="gallery-header-left">
          <span className="gallery-section-tag">07 GALLERY</span>
          <h3 className="gallery-main-heading">
            Moments that <br />
            speak for her.
          </h3>
          <p className="gallery-kanji">彼女を物語る瞬間。</p>
        </div>

        <div className="gallery-header-right">
          <button className="view-gallery-btn" onClick={onOpenComingSoon}>
            VIEW GALLERY →
          </button>
        </div>
      </div>

      {/* Grid of Images (3 Top, 1 Wide Center Animated WebP, 3 Bottom) */}
      <div className="gallery-grid-layout">
        <div className="gallery-row row-top">
          {GALLERY_IMAGES.slice(0, 3).map((img) => (
            <div key={img.id} className="gallery-item" onClick={() => onSelectImage && onSelectImage(img)}>
              <img
                src={img.src}
                alt={img.title}
                className="gallery-thumb-img"
                loading="lazy"
                decoding="async"
                onError={(e) => handleImageError(e, 'gallery', img.id)}
              />
            </div>
          ))}
        </div>

        <div className="gallery-row row-wide">
          <div className="gallery-item item-wide" onClick={() => onSelectImage && onSelectImage(GALLERY_IMAGES[3])}>
            <img
              src={GALLERY_IMAGES[3].src}
              alt={GALLERY_IMAGES[3].title}
              className="gallery-thumb-img"
              loading="lazy"
              decoding="async"
              onError={(e) => handleImageError(e, 'gallery', 4)}
            />
          </div>
        </div>

        <div className="gallery-row row-bottom">
          {GALLERY_IMAGES.slice(4, 7).map((img) => (
            <div key={img.id} className="gallery-item" onClick={() => onSelectImage && onSelectImage(img)}>
              <img
                src={img.src}
                alt={img.title}
                className="gallery-thumb-img"
                loading="lazy"
                decoding="async"
                onError={(e) => handleImageError(e, 'gallery', img.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default Gallery;
