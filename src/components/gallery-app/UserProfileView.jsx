import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft02Icon,
  Settings02Icon,
  FavouriteIcon,
  Bookmark02Icon,
  GridIcon,
  Location01Icon,
  Link01Icon
} from '@hugeicons/core-free-icons';
import './UserProfileView.css';

export function UserProfileView({
  username,
  currentUser,
  artworks,
  onBack,
  onOpenSettings,
  onSelectArtwork
}) {
  const [activeTab, setActiveTab] = useState('uploads');

  const userArtworks = artworks.filter(
    (art) => art.artistHandle.toLowerCase().includes(username.toLowerCase()) || art.artist.toLowerCase() === username.toLowerCase()
  );

  return (
    <div className="user-profile-view-root">
      {/* Top Bar Header */}
      <div className="profile-top-bar">
        <button className="back-btn" onClick={onBack}>
          <HugeiconsIcon icon={ArrowLeft02Icon} size={20} />
          <span>Back to Gallery</span>
        </button>
        <h3 className="top-bar-title">@{username}</h3>
        <button className="settings-trigger-btn" onClick={onOpenSettings}>
          <HugeiconsIcon icon={Settings02Icon} size={20} />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Banner */}
      <div className="profile-banner-container">
        <img src="/images/hero-bg.webp" alt="Profile Banner" className="profile-banner-img" />
        <div className="banner-overlay" />
      </div>

      {/* Profile Header Info Box */}
      <div className="profile-header-container">
        <div className="profile-avatar-row">
          <img src={currentUser.avatar} alt={currentUser.name} className="profile-large-avatar" />
          <button className="edit-profile-main-btn" onClick={onOpenSettings}>
            Edit Profile
          </button>
        </div>

        <div className="profile-identity-box">
          <h1 className="profile-main-name">{currentUser.name}</h1>
          <span className="profile-main-handle">@{currentUser.username}</span>
          <p className="profile-main-bio">{currentUser.bio}</p>

          <div className="profile-meta-row">
            <span className="meta-item">
              <HugeiconsIcon icon={Location01Icon} size={14} />
              {currentUser.location}
            </span>
            <a href={currentUser.website} target="_blank" rel="noreferrer" className="meta-item link">
              <HugeiconsIcon icon={Link01Icon} size={14} />
              {currentUser.website}
            </a>
          </div>

          {/* Stats Bar */}
          <div className="profile-stats-bar">
            <div className="stat-box">
              <span className="stat-number">{userArtworks.length}</span>
              <span className="stat-label">Artworks</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{currentUser.likesCount}</span>
              <span className="stat-label">Likes</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{currentUser.followersCount}</span>
              <span className="stat-label">Followers</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{currentUser.followingCount}</span>
              <span className="stat-label">Following</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="profile-tabs-bar">
        <button
          className={`tab-btn ${activeTab === 'uploads' ? 'active' : ''}`}
          onClick={() => setActiveTab('uploads')}
        >
          <HugeiconsIcon icon={GridIcon} size={16} />
          <span>Uploads ({userArtworks.length})</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'liked' ? 'active' : ''}`}
          onClick={() => setActiveTab('liked')}
        >
          <HugeiconsIcon icon={FavouriteIcon} size={16} />
          <span>Liked</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          <HugeiconsIcon icon={Bookmark02Icon} size={16} />
          <span>Saved</span>
        </button>
      </div>

      {/* Tab Content Gallery Grid */}
      <div className="profile-gallery-container">
        {userArtworks.length === 0 ? (
          <div className="empty-profile-box">
            <p>No artworks uploaded yet under @{username}.</p>
          </div>
        ) : (
          <div className="profile-grid">
            {userArtworks.map((art) => (
              <motion.div
                key={art.id}
                className="profile-art-card"
                whileHover={{ y: -4, scale: 1.02 }}
                onClick={() => onSelectArtwork(art)}
              >
                <img src={art.src} alt={art.title} className="profile-art-img" />
                <div className="card-hover-overlay">
                  <h4 className="art-card-title">{art.title}</h4>
                  <span className="art-card-likes">❤️ {art.likes}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserProfileView;
