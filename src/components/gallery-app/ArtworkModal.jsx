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
  MoreHorizontalIcon,
  Maximize01Icon
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
    { id: 2, name: 'Aki Hayakawa', handle: '@aki_fox', avatar: '/images/p2.jpg', text: 'Contract acknowledged.' },
    { id: 3, name: 'Power', handle: '@power_blood', avatar: '/images/p3.jpg', text: 'Where nose?' }
  ]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const overlayRef = useRef(null);

  // Curated "Ideas you might love" category chips matching Pinterest screenshot
  const curatedIdeas = [
    { title: 'Mommy makima', image: '/images/gallery-1.webp' },
    { title: 'Kishibe makima is listening', image: '/images/hero-bg.webp' },
    { title: 'Denji and asa', image: '/images/gallery-2.webp' },
    { title: 'Miss makima', image: '/images/gallery-3.webp' },
    { title: 'Makima black and white', image: '/images/gallery-4.webp' }
  ];

  // Preload image and sync History API
  useEffect(() => {
    if (artwork) {
      setImageLoaded(false);
      const img = new Image();
      img.src = artwork.src;
      img.onload = () => setImageLoaded(true);

      const targetPath = `/gallery/artwork/${artwork.id}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ artworkId: artwork.id }, '', targetPath);
      }
    }
  }, [artwork]);

  // Handle History API popstate, Esc key, Left/Right arrow keys
  useEffect(() => {
    if (!artwork) return;

    const handlePopState = () => {
      onClose();
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        const currentIndex = allArtworks.findIndex((a) => a.id === artwork.id);
        if (currentIndex >= 0 && currentIndex < allArtworks.length - 1) {
          onSelectArtwork(allArtworks[currentIndex + 1]);
        }
      } else if (e.key === 'ArrowLeft') {
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

  // Partition recommendations into Side Column (2-col) & Bottom Feed
  const { sideArtworks, bottomArtworks } = useMemo(() => {
    if (!artwork || !allArtworks.length) return { sideArtworks: [], bottomArtworks: [] };

    const others = allArtworks.filter((a) => a.id !== artwork.id);
    return {
      sideArtworks: others.slice(0, 4),
      bottomArtworks: others.slice(4)
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
    if (overlayRef.current) {
      overlayRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    onSelectArtwork(selectedArt);
  };

  return (
    <AnimatePresence>
      <div className="pinterest-desktop-overlay" ref={overlayRef} onClick={onClose}>
        <motion.div
          className="pinterest-layout-wrapper"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* MAIN PIN ROW: [Pin Detail Card] + [Right 2-Col Side Grid] */}
          <div className="pin-detail-main-row">
            {/* PIN DETAIL CARD (Exact Pinterest Card Layout) */}
            <div className="pinterest-pin-card">
              {/* Left Side: Artwork Image Container */}
              <div className="pin-media-box">
                <button className="pin-back-arrow-btn" onClick={onClose} title="Back to Gallery">
                  <HugeiconsIcon icon={ArrowLeft02Icon} size={20} />
                </button>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={artwork.id}
                    className="pin-image-wrapper"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: imageLoaded ? 1 : 0.4 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <img src={artwork.src} alt={artwork.title} className="pin-exact-image" />
                  </motion.div>
                </AnimatePresence>

                <button className="pin-expand-btn" title="Expand image">
                  <HugeiconsIcon icon={Maximize01Icon} size={18} />
                </button>
              </div>

              {/* Right Side: Header Toolbar, Title, Artist & Discussion Pane */}
              <div className="pin-details-box">
                {/* Top Action Toolbar matching Screenshot 1 */}
                <div className="pinterest-action-toolbar">
                  <div className="toolbar-left-actions">
                    <button
                      className={`toolbar-btn ${isLiked ? 'liked' : ''}`}
                      onClick={() => onToggleLike(artwork.id)}
                      title="Like"
                    >
                      <HugeiconsIcon icon={FavouriteIcon} size={20} />
                      <span className="like-count">{artwork.likes + (isLiked ? 1 : 0)}</span>
                    </button>

                    <button className="toolbar-btn" title="Comment">
                      <HugeiconsIcon icon={Comment01Icon} size={20} />
                    </button>

                    <button
                      className="toolbar-btn"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        alert('Link copied!');
                      }}
                      title="Share"
                    >
                      <HugeiconsIcon icon={Share01Icon} size={20} />
                    </button>

                    <button className="toolbar-btn" title="More Options">
                      <HugeiconsIcon icon={MoreHorizontalIcon} size={20} />
                    </button>
                  </div>

                  <div className="toolbar-right-actions">
                    <select className="pin-category-select" defaultValue={artwork.category}>
                      <option value="Anime">Anime</option>
                      <option value="Editorial">Editorial</option>
                      <option value="Illustration">Illustration</option>
                      <option value="Manga">Manga</option>
                    </select>

                    <button
                      className={`pinterest-save-btn ${isSaved ? 'saved' : ''}`}
                      onClick={() => onToggleSave(artwork.id)}
                    >
                      {isSaved ? 'Saved' : 'Save'}
                    </button>
                  </div>
                </div>

                {/* Artist Row */}
                <div className="pinterest-artist-row">
                  <img src={artwork.artistAvatar} alt={artwork.artist} className="pin-artist-avatar" />
                  <div className="pin-artist-info">
                    <span className="artist-name">{artwork.artist}</span>
                    <span className="artist-handle">{artwork.artistHandle}</span>
                  </div>
                  <button
                    className={`pinterest-follow-btn ${isFollowing ? 'following' : ''}`}
                    onClick={() => setIsFollowing(!isFollowing)}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>

                {/* Artwork Title & Tags */}
                <div className="pin-title-block">
                  <h2 className="pin-main-title">{artwork.title}</h2>
                  <div className="pin-tags-list">
                    {artwork.tags?.map((t, idx) => (
                      <span key={idx} className="pin-tag-pill">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Comments Discussion Section */}
                <div className="pinterest-comments-block">
                  <div className="comments-header-row">
                    <span className="comments-count-title">{comments.length} comments</span>
                  </div>

                  <div className="pinterest-comments-list">
                    {comments.map((c) => (
                      <div key={c.id} className="pinterest-comment-item">
                        <img src={c.avatar} alt={c.name} className="comment-user-avatar" />
                        <div className="comment-content-box">
                          <span className="comment-user-name">{c.name}</span>
                          <span className="comment-text">{c.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Comment Input */}
                  <form onSubmit={handleAddComment} className="pinterest-comment-input-bar">
                    <input
                      type="text"
                      className="pinterest-input"
                      placeholder="Add a comment"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    />
                    <div className="input-emoji-tools">
                      <button type="button" className="emoji-btn" title="Add emoji">😊</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* RIGHT 2-COLUMN RECOMMENDATION SIDE-GRID (Matching Screenshot 1 Right Pane) */}
            <div className="pinterest-side-recommendations">
              {sideArtworks.map((item) => (
                <motion.div
                  key={item.id}
                  className="side-pin-card"
                  whileHover={{ y: -4, scale: 1.02 }}
                  onClick={() => handleRecommendationClick(item)}
                >
                  <img src={item.src} alt={item.title} className="side-pin-img" loading="lazy" />
                  <div className="side-pin-footer">
                    <span className="side-pin-title">{item.title}</span>
                    <span className="side-pin-artist">{item.artistHandle}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* BOTTOM MASONRY RECOMMENDATION FEED (Matching Screenshot 2 Continuous Grid) */}
          <div className="pinterest-bottom-feed-container">
            {/* Curated "Ideas you might love" Topic Cards Row */}
            <div className="ideas-might-love-section">
              <h3 className="ideas-section-title">Ideas you might love</h3>
              <div className="ideas-cards-grid">
                {curatedIdeas.map((idea, idx) => (
                  <div key={idx} className="idea-chip-card">
                    <img src={idea.image} alt={idea.title} className="idea-chip-img" />
                    <div className="idea-chip-overlay">
                      <span className="idea-chip-text">{idea.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Full Width Continuous Masonry Recommendation Grid */}
            <div className="pinterest-full-masonry-grid">
              {bottomArtworks.map((item) => (
                <motion.div
                  key={item.id}
                  className="bottom-pin-card"
                  whileHover={{ y: -4, scale: 1.02 }}
                  onClick={() => handleRecommendationClick(item)}
                >
                  <img src={item.src} alt={item.title} className="bottom-pin-img" loading="lazy" />
                  <div className="bottom-pin-info">
                    <span className="bottom-pin-title">{item.title}</span>
                    <span className="bottom-pin-artist">by {item.artist}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ArtworkModal;
