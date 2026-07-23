import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Cancel01Icon,
  FavouriteIcon,
  Bookmark02Icon,
  Share01Icon,
  Comment01Icon,
  UserCheck01Icon,
  UserAdd01Icon
} from '@hugeicons/core-free-icons';
import './ArtworkModal.css';

export function ArtworkModal({
  artwork,
  onClose,
  isLiked,
  isSaved,
  onToggleLike,
  onToggleSave,
  onNavigateArtist,
  onSelectRelated
}) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([
    { id: 1, name: 'Denji', handle: '@denji_chainsaw', avatar: '/images/p1.jpg', text: 'Makima-san is truly absolute...' },
    { id: 2, name: 'Aki Hayakawa', handle: '@aki_fox', avatar: '/images/p2.jpg', text: 'Contract acknowledged.' }
  ]);

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

  return (
    <AnimatePresence>
      <div className="artwork-modal-overlay" onClick={onClose}>
        <motion.div
          className="artwork-modal-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button className="artwork-close-btn" onClick={onClose} aria-label="Close artwork detail">
            <HugeiconsIcon icon={Cancel01Icon} size={22} />
          </button>

          <div className="artwork-grid">
            {/* LEFT COLUMN: Large High-Res Artwork Display */}
            <div className="artwork-media-container">
              <img src={artwork.src} alt={artwork.title} className="artwork-main-img" />
            </div>

            {/* RIGHT COLUMN: Details, Artist Info & Discussion */}
            <div className="artwork-details-pane">
              {/* Artist Header */}
              <div className="artwork-artist-row">
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
              <div className="artwork-header-box">
                <span className="artwork-category-badge">{artwork.category}</span>
                <h2 className="artwork-title">{artwork.title}</h2>
              </div>

              {/* Action Toolbar (Like, Save, Share) */}
              <div className="artwork-action-bar">
                <button
                  className={`action-pill-btn ${isLiked ? 'liked' : ''}`}
                  onClick={() => onToggleLike(artwork.id)}
                >
                  <HugeiconsIcon icon={FavouriteIcon} size={18} />
                  <span>{artwork.likes + (isLiked ? 1 : 0)} Likes</span>
                </button>

                <button
                  className={`action-pill-btn ${isSaved ? 'saved' : ''}`}
                  onClick={() => onToggleSave(artwork.id)}
                >
                  <HugeiconsIcon icon={Bookmark02Icon} size={18} />
                  <span>{isSaved ? 'Saved' : 'Save'}</span>
                </button>

                <button
                  className="action-pill-btn"
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
              <div className="artwork-tags-row">
                {artwork.tags?.map((tag, idx) => (
                  <span key={idx} className="tag-chip">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Comments Discussion Section */}
              <div className="comments-section">
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
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ArtworkModal;
