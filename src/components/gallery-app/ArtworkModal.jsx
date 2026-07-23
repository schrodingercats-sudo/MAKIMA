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
  Maximize01Icon,
  Download01Icon,
  Flag01Icon,
  Link01Icon
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
  const [isExpandedImgOpen, setIsExpandedImgOpen] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Anime');

  const overlayRef = useRef(null);
  const commentInputRef = useRef(null);

  // Curated "Ideas you might love" topic cards
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
      setShowMoreMenu(false);
      setIsExpandedImgOpen(false);
      setSelectedCategory(artwork.category || 'Anime');

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
        if (isExpandedImgOpen) {
          setIsExpandedImgOpen(false);
        } else if (showMoreMenu) {
          setShowMoreMenu(false);
        } else {
          onClose();
        }
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
  }, [artwork, allArtworks, isExpandedImgOpen, showMoreMenu, onClose, onSelectArtwork]);

  // Partition recommendations into Side Column & Bottom Feed
  const { sideArtworks, bottomArtworks } = useMemo(() => {
    if (!artwork || !allArtworks.length) return { sideArtworks: [], bottomArtworks: [] };

    const others = allArtworks.filter((a) => a.id !== artwork.id);
    return {
      sideArtworks: others.slice(0, 4),
      bottomArtworks: others.slice(4)
    };
  }, [artwork, allArtworks]);

  if (!artwork) return null;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

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
    showToast('Comment posted!');
  };

  const handleRecommendationClick = (selectedArt) => {
    if (overlayRef.current) {
      overlayRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    onSelectArtwork(selectedArt);
  };

  const handleDownloadArtwork = () => {
    const link = document.createElement('a');
    link.href = artwork.src;
    link.download = `${artwork.title.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowMoreMenu(false);
    showToast('Artwork download started!');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowMoreMenu(false);
    showToast('Link copied to clipboard!');
  };

  return (
    <AnimatePresence>
      <div className="pinterest-desktop-overlay" ref={overlayRef} onClick={onClose}>
        {/* Toast Notification Banner */}
        {toastMessage && (
          <motion.div
            className="pin-toast-banner"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <span>✓ {toastMessage}</span>
          </motion.div>
        )}

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
            {/* PIN DETAIL CARD */}
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
                    <img
                      src={artwork.src}
                      alt={artwork.title}
                      className="pin-exact-image"
                      onClick={() => setIsExpandedImgOpen(true)}
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Functional Expand Button */}
                <button
                  className="pin-expand-btn"
                  onClick={() => setIsExpandedImgOpen(true)}
                  title="Expand image lightbox"
                >
                  <HugeiconsIcon icon={Maximize01Icon} size={18} />
                </button>
              </div>

              {/* Right Side: Header Toolbar, Title, Artist & Discussion Pane */}
              <div className="pin-details-box">
                {/* Top Action Toolbar */}
                <div className="pinterest-action-toolbar">
                  <div className="toolbar-left-actions">
                    {/* Functional Like Button */}
                    <button
                      className={`toolbar-btn ${isLiked ? 'liked' : ''}`}
                      onClick={() => {
                        onToggleLike(artwork.id);
                        showToast(isLiked ? 'Artwork unliked' : 'Artwork liked!');
                      }}
                      title="Like artwork"
                    >
                      <HugeiconsIcon icon={FavouriteIcon} size={20} />
                      <span className="like-count">{artwork.likes + (isLiked ? 1 : 0)}</span>
                    </button>

                    {/* Functional Comment Button */}
                    <button
                      className="toolbar-btn"
                      onClick={() => commentInputRef.current?.focus()}
                      title="Add a comment"
                    >
                      <HugeiconsIcon icon={Comment01Icon} size={20} />
                    </button>

                    {/* Functional Share Button */}
                    <button
                      className="toolbar-btn"
                      onClick={handleCopyLink}
                      title="Share link"
                    >
                      <HugeiconsIcon icon={Share01Icon} size={20} />
                    </button>

                    {/* Functional More Options Menu */}
                    <div className="more-menu-wrapper">
                      <button
                        className={`toolbar-btn ${showMoreMenu ? 'active' : ''}`}
                        onClick={() => setShowMoreMenu(!showMoreMenu)}
                        title="More Options"
                      >
                        <HugeiconsIcon icon={MoreHorizontalIcon} size={20} />
                      </button>

                      {showMoreMenu && (
                        <div className="more-dropdown-menu">
                          <button className="menu-option-btn" onClick={handleDownloadArtwork}>
                            <HugeiconsIcon icon={Download01Icon} size={16} />
                            <span>Download Artwork</span>
                          </button>
                          <button className="menu-option-btn" onClick={handleCopyLink}>
                            <HugeiconsIcon icon={Link01Icon} size={16} />
                            <span>Copy Image Link</span>
                          </button>
                          <button
                            className="menu-option-btn danger"
                            onClick={() => {
                              setShowMoreMenu(false);
                              showToast('Report submitted for review');
                            }}
                          >
                            <HugeiconsIcon icon={Flag01Icon} size={16} />
                            <span>Report Artwork</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Styled Category Dropdown & Functional Save Button */}
                  <div className="toolbar-right-actions">
                    <div className="category-select-pill">
                      <select
                        className="pin-category-select"
                        value={selectedCategory}
                        onChange={(e) => {
                          setSelectedCategory(e.target.value);
                          showToast(`Category updated to ${e.target.value}`);
                        }}
                      >
                        <option value="Anime">Anime</option>
                        <option value="Editorial">Editorial</option>
                        <option value="Illustration">Illustration</option>
                        <option value="Manga">Manga</option>
                        <option value="Concept">Concept</option>
                      </select>
                    </div>

                    <button
                      className={`pinterest-save-btn ${isSaved ? 'saved' : ''}`}
                      onClick={() => {
                        onToggleSave(artwork.id);
                        showToast(isSaved ? 'Removed from Saved' : 'Saved to Collection!');
                      }}
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
                    onClick={() => {
                      setIsFollowing(!isFollowing);
                      showToast(isFollowing ? `Unfollowed @${artwork.artistHandle}` : `Following @${artwork.artistHandle}`);
                    }}
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

                {/* Comments Discussion Section (Tight gap, no blank whitespace!) */}
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
                      ref={commentInputRef}
                      className="pinterest-input"
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    />
                    <div className="input-emoji-tools">
                      <button
                        type="button"
                        className="emoji-btn"
                        onClick={() => setCommentText((prev) => prev + ' 😊')}
                        title="Add emoji"
                      >
                        😊
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* RIGHT 2-COLUMN RECOMMENDATION SIDE-GRID */}
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

          {/* BOTTOM MASONRY RECOMMENDATION FEED */}
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

        {/* FULLSCREEN IMAGE LIGHTBOX MODAL */}
        <AnimatePresence>
          {isExpandedImgOpen && (
            <div className="expanded-image-modal-overlay" onClick={() => setIsExpandedImgOpen(false)}>
              <motion.div
                className="expanded-image-content"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="expanded-close-btn"
                  onClick={() => setIsExpandedImgOpen(false)}
                  title="Close Lightbox"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={24} />
                </button>
                <img src={artwork.src} alt={artwork.title} className="expanded-full-img" />
                <div className="expanded-img-caption">
                  <h4>{artwork.title}</h4>
                  <p>by {artwork.artist} ({artwork.artistHandle})</p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
}

export default ArtworkModal;
