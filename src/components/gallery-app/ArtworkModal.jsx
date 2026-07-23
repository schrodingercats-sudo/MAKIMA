import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Cancel01Icon,
  FavouriteIcon,
  Bookmark02Icon,
  Share01Icon,
  Comment01Icon,
  UserCheck01Icon,
  UserAdd01Icon,
  ArrowLeft02Icon,
  ArrowRight02Icon,
  SparklesIcon,
  GridIcon
} from '@hugeicons/core-free-icons';
import './ArtworkModal.css';

export function ArtworkModal({
  artwork,
  allArtworks = [],
  onClose,
  isLiked,
  isSaved,
  onToggleLike,
  onToggleSave,
  onNavigateArtist,
  onSelectArtwork
}) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([
    { id: 1, name: 'Denji', handle: '@denji_chainsaw', avatar: '/images/p1.jpg', text: 'Makima-san is truly absolute...' },
    { id: 2, name: 'Aki Hayakawa', handle: '@aki_fox', avatar: '/images/p2.jpg', text: 'Contract acknowledged.' }
  ]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const overlayRef = useRef(null);

  // Reset state & scroll when artwork changes
  useEffect(() => {
    if (artwork) {
      setImageLoaded(false);
      // Preload image
      const img = new Image();
      img.src = artwork.src;
      img.onload = () => setImageLoaded(true);

      // Push history state if not already set
      const targetPath = `/gallery/artwork/${artwork.id}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ artworkId: artwork.id }, '', targetPath);
      }
    }
  }, [artwork]);

  // Handle History API Back Button (popstate), Esc key, and Arrow Keys (Left/Right)
  useEffect(() => {
    if (!artwork) return;

    const handlePopState = (e) => {
      onClose();
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        // Navigate to next artwork in list
        const currentIndex = allArtworks.findIndex((a) => a.id === artwork.id);
        if (currentIndex >= 0 && currentIndex < allArtworks.length - 1) {
          onSelectArtwork(allArtworks[currentIndex + 1]);
        }
      } else if (e.key === 'ArrowLeft') {
        // Navigate to previous artwork in list
        const currentIndex = allArtworks.findIndex((a) => a.id === artwork.id);
        if (currentIndex > 0) {
          onSelectArtwork(allArtworks[currentIndex - 1]);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [artwork, allArtworks, onClose, onSelectArtwork]);

  // Curated Recommendation Feed Categorization
  const recommendations = useMemo(() => {
    if (!artwork || !allArtworks.length) return {};

    const otherArtworks = allArtworks.filter((a) => a.id !== artwork.id);

    // 1. Same Artist
    const sameArtist = otherArtworks.filter((a) => a.artist === artwork.artist);

    // 2. Related (Same Category or Tags)
    const related = otherArtworks.filter(
      (a) => a.artist !== artwork.artist && (a.category === artwork.category || a.tags?.some((t) => artwork.tags?.includes(t)))
    );

    // 3. Editorial Collection
    const editorial = otherArtworks.filter((a) => a.category === 'Editorial');

    // 4. You May Also Like (Curated mix)
    const curated = otherArtworks.filter((a) => a.likes > 3000);

    // 5. Recently Uploaded
    const recent = [...otherArtworks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return {
      sameArtist: sameArtist.slice(0, 4),
      related: related.slice(0, 6),
      editorial: editorial.slice(0, 4),
      curated: curated.slice(0, 6),
      recent: recent.slice(0, 6)
    };
  }, [artwork, allArtworks]);

  if (!artwork) return null;

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setComments([
      ...comments,
      {
        id: Date.now(),
        name: 'You (Makima)',
        handle: '@makima',
        avatar: '/images/coming-soon.jpg',
        text: commentText
      }
    ]);
    setCommentText('');
  };

  const handleRecommendationClick = (selectedArt) => {
    // Scroll overlay back up smoothly to main viewer card
    if (overlayRef.current) {
      overlayRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    onSelectArtwork(selectedArt);
  };

  return (
    <AnimatePresence>
      <div className="pinterest-viewer-overlay" ref={overlayRef} onClick={onClose}>
        <motion.div
          className="pinterest-viewer-container"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Floating Button */}
          <button className="pinterest-close-btn" onClick={onClose} aria-label="Close Artwork Viewer">
            <HugeiconsIcon icon={Cancel01Icon} size={22} />
          </button>

          {/* MAIN PIN CARD (65% Image / 35% Info Split) */}
          <div className="main-pin-card">
            {/* LEFT 65%: Large High-Res Artwork Area */}
            <div className="pin-media-area">
              <AnimatePresence mode="wait">
                <motion.div
                  key={artwork.id}
                  className="pin-image-frame"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: imageLoaded ? 1 : 0.4 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <img
                    src={artwork.src}
                    alt={artwork.title}
                    className="pin-main-image"
                    onLoad={() => setImageLoaded(true)}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Prev / Next Keyboard Navigation Badges */}
              <div className="nav-shortcut-hints">
                <span className="hint-pill">← Previous</span>
                <span className="hint-pill">Next →</span>
              </div>
            </div>

            {/* RIGHT 35%: Information, Actions & Discussion Pane */}
            <div className="pin-info-pane">
              {/* Artist Row */}
              <div className="pin-artist-row">
                <div
                  className="artist-profile-trigger"
                  onClick={() => {
                    onClose();
                    onNavigateArtist(artwork.artist);
                  }}
                >
                  <img src={artwork.artistAvatar} alt={artwork.artist} className="artist-avatar-img" />
                  <div className="artist-meta">
                    <h4 className="artist-name">{artwork.artist}</h4>
                    <span className="artist-handle">{artwork.artistHandle}</span>
                  </div>
                </div>

                <button
                  className={`follow-btn ${isFollowing ? 'following' : ''}`}
                  onClick={() => setIsFollowing(!isFollowing)}
                >
                  {isFollowing ? (
                    <>
                      <HugeiconsIcon icon={UserCheck01Icon} size={16} />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={UserAdd01Icon} size={16} />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              </div>

              {/* Title & Category */}
              <div className="pin-header-box">
                <span className="pin-category-badge">{artwork.category}</span>
                <h1 className="pin-title">{artwork.title}</h1>
              </div>

              {/* Action Bar (Like, Save, Share) */}
              <div className="pin-action-bar">
                <button
                  className={`pin-action-btn ${isLiked ? 'liked' : ''}`}
                  onClick={() => onToggleLike(artwork.id)}
                >
                  <HugeiconsIcon icon={FavouriteIcon} size={18} />
                  <span>{artwork.likes + (isLiked ? 1 : 0)} Likes</span>
                </button>

                <button
                  className={`pin-action-btn ${isSaved ? 'saved' : ''}`}
                  onClick={() => onToggleSave(artwork.id)}
                >
                  <HugeiconsIcon icon={Bookmark02Icon} size={18} />
                  <span>{isSaved ? 'Saved' : 'Save'}</span>
                </button>

                <button
                  className="pin-action-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Artwork link copied to clipboard!');
                  }}
                >
                  <HugeiconsIcon icon={Share01Icon} size={18} />
                  <span>Share</span>
                </button>
              </div>

              {/* Tags */}
              <div className="pin-tags-row">
                {artwork.tags?.map((tag, idx) => (
                  <span key={idx} className="pin-tag-chip">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Discussion / Comments Section */}
              <div className="pin-comments-section">
                <h5 className="comments-header-title">
                  <HugeiconsIcon icon={Comment01Icon} size={16} />
                  <span>Discussion ({comments.length})</span>
                </h5>

                <div className="comments-list">
                  {comments.map((c) => (
                    <div key={c.id} className="comment-item">
                      <img src={c.avatar} alt={c.name} className="comment-avatar" />
                      <div className="comment-body">
                        <div className="comment-author">
                          <span className="comment-name">{c.name}</span>
                          <span className="comment-handle">{c.handle}</span>
                        </div>
                        <p className="comment-text">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddComment} className="comment-input-form">
                  <input
                    type="text"
                    className="comment-input"
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <button type="submit" className="comment-submit-btn" disabled={!commentText.trim()}>
                    Post
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* CONTINUOUS EXPLORATION RECOMMENDATION FEED ("MORE LIKE THIS") */}
          <div className="recommendations-feed-container">
            <div className="feed-header-divider">
              <span className="feed-divider-line" />
              <div className="feed-header-badge">
                <HugeiconsIcon icon={SparklesIcon} size={16} />
                <span>MORE LIKE THIS</span>
              </div>
              <span className="feed-divider-line" />
            </div>

            {/* 1. Related to this Artwork Section */}
            {recommendations.related?.length > 0 && (
              <div className="recommendation-section">
                <h3 className="section-feed-title">Related to this Artwork</h3>
                <div className="recommendation-masonry-grid">
                  {recommendations.related.map((item) => (
                    <motion.div
                      key={item.id}
                      className="rec-artwork-card"
                      whileHover={{ y: -4, scale: 1.02 }}
                      onClick={() => handleRecommendationClick(item)}
                    >
                      <img src={item.src} alt={item.title} className="rec-img" loading="lazy" />
                      <div className="rec-card-overlay">
                        <span className="rec-title">{item.title}</span>
                        <span className="rec-artist">by {item.artist}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. More by Same Artist Section */}
            {recommendations.sameArtist?.length > 0 && (
              <div className="recommendation-section">
                <h3 className="section-feed-title">More by {artwork.artist}</h3>
                <div className="recommendation-masonry-grid">
                  {recommendations.sameArtist.map((item) => (
                    <motion.div
                      key={item.id}
                      className="rec-artwork-card"
                      whileHover={{ y: -4, scale: 1.02 }}
                      onClick={() => handleRecommendationClick(item)}
                    >
                      <img src={item.src} alt={item.title} className="rec-img" loading="lazy" />
                      <div className="rec-card-overlay">
                        <span className="rec-title">{item.title}</span>
                        <span className="rec-artist">by {item.artist}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Editorial Collection Section */}
            {recommendations.editorial?.length > 0 && (
              <div className="recommendation-section">
                <h3 className="section-feed-title">Editorial Collection</h3>
                <div className="recommendation-masonry-grid">
                  {recommendations.editorial.map((item) => (
                    <motion.div
                      key={item.id}
                      className="rec-artwork-card"
                      whileHover={{ y: -4, scale: 1.02 }}
                      onClick={() => handleRecommendationClick(item)}
                    >
                      <img src={item.src} alt={item.title} className="rec-img" loading="lazy" />
                      <div className="rec-card-overlay">
                        <span className="rec-title">{item.title}</span>
                        <span className="rec-artist">by {item.artist}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. You May Also Like Section */}
            {recommendations.curated?.length > 0 && (
              <div className="recommendation-section">
                <h3 className="section-feed-title">You May Also Like</h3>
                <div className="recommendation-masonry-grid">
                  {recommendations.curated.map((item) => (
                    <motion.div
                      key={item.id}
                      className="rec-artwork-card"
                      whileHover={{ y: -4, scale: 1.02 }}
                      onClick={() => handleRecommendationClick(item)}
                    >
                      <img src={item.src} alt={item.title} className="rec-img" loading="lazy" />
                      <div className="rec-card-overlay">
                        <span className="rec-title">{item.title}</span>
                        <span className="rec-artist">by {item.artist}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ArtworkModal;
