import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  UserIcon,
  Bookmark02Icon,
  Clock01Icon,
  FavouriteIcon,
  UserGroupIcon,
  UserCheck01Icon,
  Settings02Icon,
  Notification01Icon,
  PaintBucketIcon,
  Logout01Icon,
  Copy01Icon,
  Add01Icon,
  Remove01Icon,
  Delete02Icon,
  Upload01Icon
} from '@hugeicons/core-free-icons';
import './ProfileDrawer.css';

export function ProfileDrawer({
  isOpen,
  onClose,
  currentUser,
  onNavigateProfile,
  onUpdateUser
}) {
  const [activeTab, setActiveTab] = useState('profile-settings');
  const [formState, setFormState] = useState({ ...currentUser });
  const [copied, setCopied] = useState(false);
  const [socialLinks, setSocialLinks] = useState([
    { id: 1, type: 'x', url: currentUser.social.x },
    { id: 2, type: 'instagram', url: currentUser.social.instagram },
    { id: 3, type: 'youtube', url: currentUser.social.youtube }
  ]);

  // Handle Esc key to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://makima.gallery/${formState.username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddSocialLink = () => {
    setSocialLinks([
      ...socialLinks,
      { id: Date.now(), type: 'website', url: 'https://' }
    ]);
  };

  const handleRemoveSocialLink = (id) => {
    setSocialLinks(socialLinks.filter((item) => item.id !== id));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (onUpdateUser) {
      onUpdateUser({
        ...formState,
        social: {
          x: socialLinks[0]?.url || '',
          instagram: socialLinks[1]?.url || '',
          youtube: socialLinks[2]?.url || ''
        }
      });
    }
  };

  return (
    <AnimatePresence>
      <div className="profile-drawer-root">
        {/* Backdrop */}
        <motion.div
          className="profile-drawer-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        />

        {/* Drawer Panel Container */}
        <motion.div
          className="profile-drawer-panel"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label="Profile Settings Panel"
        >
          {/* Main Grid Layout inside Drawer: Left Navigation | Right Content */}
          <div className="drawer-grid-container">
            {/* LEFT NAVIGATION COLUMN */}
            <aside className="drawer-left-nav">
              {/* User Avatar & Info Card Header */}
              <div className="drawer-user-card">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="user-card-avatar"
                />
                <div className="user-card-info">
                  <h4 className="user-card-name">{currentUser.name}</h4>
                  <span className="user-card-handle">@{currentUser.username}</span>
                  <button
                    className="view-profile-link-btn"
                    onClick={() => {
                      onClose();
                      onNavigateProfile(currentUser.username);
                    }}
                  >
                    View Profile &rsaquo;
                  </button>
                </div>
              </div>

              {/* Navigation Menu Links */}
              <nav className="drawer-menu-nav">
                <ul className="menu-list">
                  <li>
                    <button
                      className={`menu-btn ${activeTab === 'my-profile' ? 'active' : ''}`}
                      onClick={() => setActiveTab('my-profile')}
                    >
                      <HugeiconsIcon icon={UserIcon} size={18} />
                      <span>My Profile</span>
                    </button>
                  </li>
                  <li>
                    <button
                      className={`menu-btn ${activeTab === 'saved-collections' ? 'active' : ''}`}
                      onClick={() => setActiveTab('saved-collections')}
                    >
                      <HugeiconsIcon icon={Bookmark02Icon} size={18} />
                      <span>Saved Collections</span>
                    </button>
                  </li>
                  <li>
                    <button
                      className={`menu-btn ${activeTab === 'history' ? 'active' : ''}`}
                      onClick={() => setActiveTab('history')}
                    >
                      <HugeiconsIcon icon={Clock01Icon} size={18} />
                      <span>History</span>
                    </button>
                  </li>
                  <li>
                    <button
                      className={`menu-btn ${activeTab === 'likes' ? 'active' : ''}`}
                      onClick={() => setActiveTab('likes')}
                    >
                      <HugeiconsIcon icon={FavouriteIcon} size={18} />
                      <span>Likes</span>
                    </button>
                  </li>
                  <li>
                    <button
                      className={`menu-btn ${activeTab === 'following' ? 'active' : ''}`}
                      onClick={() => setActiveTab('following')}
                    >
                      <HugeiconsIcon icon={UserGroupIcon} size={18} />
                      <span>Following</span>
                    </button>
                  </li>
                  <li>
                    <button
                      className={`menu-btn ${activeTab === 'followers' ? 'active' : ''}`}
                      onClick={() => setActiveTab('followers')}
                    >
                      <HugeiconsIcon icon={UserCheck01Icon} size={18} />
                      <span>Followers</span>
                    </button>
                  </li>
                </ul>

                <div className="drawer-nav-section-title">SETTINGS</div>

                <ul className="menu-list">
                  <li>
                    <button
                      className={`menu-btn ${activeTab === 'profile-settings' ? 'active' : ''}`}
                      onClick={() => setActiveTab('profile-settings')}
                    >
                      <HugeiconsIcon icon={Settings02Icon} size={18} />
                      <span>Profile Settings</span>
                    </button>
                  </li>
                  <li>
                    <button
                      className={`menu-btn ${activeTab === 'account-settings' ? 'active' : ''}`}
                      onClick={() => setActiveTab('account-settings')}
                    >
                      <HugeiconsIcon icon={UserIcon} size={18} />
                      <span>Account Settings</span>
                    </button>
                  </li>
                  <li>
                    <button
                      className={`menu-btn ${activeTab === 'privacy' ? 'active' : ''}`}
                      onClick={() => setActiveTab('privacy')}
                    >
                      <HugeiconsIcon icon={Settings02Icon} size={18} />
                      <span>Privacy</span>
                    </button>
                  </li>
                  <li>
                    <button
                      className={`menu-btn ${activeTab === 'notifications' ? 'active' : ''}`}
                      onClick={() => setActiveTab('notifications')}
                    >
                      <HugeiconsIcon icon={Notification01Icon} size={18} />
                      <span>Notifications</span>
                    </button>
                  </li>
                  <li>
                    <button
                      className={`menu-btn ${activeTab === 'appearance' ? 'active' : ''}`}
                      onClick={() => setActiveTab('appearance')}
                    >
                      <HugeiconsIcon icon={PaintBucketIcon} size={18} />
                      <span>Appearance</span>
                    </button>
                  </li>
                </ul>
              </nav>

              {/* Bottom Log Out Action */}
              <div className="drawer-logout-container">
                <button className="logout-btn" onClick={onClose}>
                  <HugeiconsIcon icon={Logout01Icon} size={18} />
                  <span>Log Out</span>
                </button>
              </div>
            </aside>

            {/* RIGHT DYNAMIC CONTENT AREA */}
            <section className="drawer-right-content">
              {activeTab === 'profile-settings' && (
                <div className="tab-pane profile-settings-pane">
                  <header className="pane-header">
                    <h3 className="pane-title">Profile Settings</h3>
                    <p className="pane-desc">Manage your profile and preferences</p>
                  </header>

                  <form onSubmit={handleSaveProfile} className="settings-form">
                    {/* Profile Picture Section */}
                    <div className="form-field-group">
                      <label className="field-label">Profile Picture</label>
                      <div className="avatar-edit-row">
                        <img
                          src={formState.avatar}
                          alt="Avatar Preview"
                          className="avatar-edit-preview"
                        />
                        <div className="avatar-btn-group">
                          <label className="btn-secondary change-photo-btn">
                            Change Photo
                            <input type="file" accept="image/*" hidden />
                          </label>
                          <button type="button" className="icon-btn-danger" title="Remove photo">
                            <HugeiconsIcon icon={Delete02Icon} size={18} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Username Input */}
                    <div className="form-field-group">
                      <label className="field-label">Username</label>
                      <div className="input-with-action">
                        <input
                          type="text"
                          className="form-input"
                          value={formState.username}
                          onChange={(e) => setFormState({ ...formState, username: e.target.value })}
                        />
                        <button
                          type="button"
                          className="input-action-btn"
                          onClick={handleCopyLink}
                          title="Copy Profile Link"
                        >
                          <HugeiconsIcon icon={Copy01Icon} size={16} />
                        </button>
                      </div>
                      <span className="field-hint">
                        {copied ? '✓ Link copied to clipboard!' : `https://makima.gallery/${formState.username}`}
                      </span>
                    </div>

                    {/* Bio Textarea */}
                    <div className="form-field-group">
                      <label className="field-label">Bio</label>
                      <textarea
                        className="form-textarea"
                        rows={3}
                        maxLength={160}
                        value={formState.bio}
                        onChange={(e) => setFormState({ ...formState, bio: e.target.value })}
                      />
                      <span className="field-hint text-right">{formState.bio.length}/160</span>
                    </div>

                    {/* Website Input */}
                    <div className="form-field-group">
                      <label className="field-label">Website</label>
                      <input
                        type="url"
                        className="form-input"
                        value={formState.website}
                        onChange={(e) => setFormState({ ...formState, website: e.target.value })}
                      />
                    </div>

                    {/* Location Input */}
                    <div className="form-field-group">
                      <label className="field-label">Location</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formState.location}
                        onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                      />
                    </div>

                    {/* Social Links List */}
                    <div className="form-field-group">
                      <label className="field-label">Social Links</label>
                      <div className="social-links-list">
                        {socialLinks.map((social) => (
                          <div key={social.id} className="social-link-row">
                            <input
                              type="url"
                              className="form-input"
                              value={social.url}
                              onChange={(e) => {
                                const newLinks = [...socialLinks];
                                const target = newLinks.find((item) => item.id === social.id);
                                if (target) target.url = e.target.value;
                                setSocialLinks(newLinks);
                              }}
                            />
                            <button
                              type="button"
                              className="remove-link-btn"
                              onClick={() => handleRemoveSocialLink(social.id)}
                            >
                              <HugeiconsIcon icon={Remove01Icon} size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="add-link-btn"
                        onClick={handleAddSocialLink}
                      >
                        <HugeiconsIcon icon={Add01Icon} size={16} />
                        <span>Add Link</span>
                      </button>
                    </div>

                    {/* Save Changes Primary Button */}
                    <div className="form-submit-row">
                      <button type="submit" className="save-changes-primary-btn">
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'account-settings' && (
                <div className="tab-pane">
                  <header className="pane-header">
                    <h3 className="pane-title">Account Settings</h3>
                    <p className="pane-desc">Manage security, email address, and authentication.</p>
                  </header>
                  <div className="pane-placeholder-box">
                    <p>Primary Email: <strong>makima@publicsafety.jp</strong></p>
                    <p>Two-Factor Authentication: <span className="badge-active">Enabled</span></p>
                  </div>
                </div>
              )}

              {activeTab === 'saved-collections' && (
                <div className="tab-pane">
                  <header className="pane-header">
                    <h3 className="pane-title">Saved Collections</h3>
                    <p className="pane-desc">Your bookmarked and curated Makima artwork sets.</p>
                  </header>
                  <div className="pane-placeholder-box">
                    <p>📁 14 Saved Artworks in "Public Safety Dossier"</p>
                  </div>
                </div>
              )}

              {activeTab === 'likes' && (
                <div className="tab-pane">
                  <header className="pane-header">
                    <h3 className="pane-title">Liked Artworks</h3>
                    <p className="pane-desc">Artworks you have liked across the gallery.</p>
                  </header>
                  <div className="pane-placeholder-box">
                    <p>❤️ 1,240 Liked Creations</p>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="tab-pane">
                  <header className="pane-header">
                    <h3 className="pane-title">Viewing History</h3>
                    <p className="pane-desc">Artworks recently viewed during this session.</p>
                  </header>
                  <div className="pane-placeholder-box">
                    <p>🕒 38 Recently Viewed Items</p>
                  </div>
                </div>
              )}

              {activeTab === 'following' && (
                <div className="tab-pane">
                  <header className="pane-header">
                    <h3 className="pane-title">Following (142)</h3>
                    <p className="pane-desc">Artists and creators you are following.</p>
                  </header>
                  <div className="pane-placeholder-box">
                    <p>👥 Following Kuroi, akame_29, silentgraphy, _tempura...</p>
                  </div>
                </div>
              )}

              {activeTab === 'followers' && (
                <div className="tab-pane">
                  <header className="pane-header">
                    <h3 className="pane-title">Followers (48.9K)</h3>
                    <p className="pane-desc">Devoted members following Public Safety HQ.</p>
                  </header>
                  <div className="pane-placeholder-box">
                    <p>⭐ 48,912 Followers</p>
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="tab-pane">
                  <header className="pane-header">
                    <h3 className="pane-title">Privacy Settings</h3>
                    <p className="pane-desc">Control profile visibility and activity status.</p>
                  </header>
                  <div className="pane-placeholder-box">
                    <p>🔒 Public Safety Clearance: Private Access Active</p>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="tab-pane">
                  <header className="pane-header">
                    <h3 className="pane-title">Notifications</h3>
                    <p className="pane-desc">Manage alerts for new artworks and mentions.</p>
                  </header>
                  <div className="pane-placeholder-box">
                    <p>🔔 Email & In-App Alerts Enabled</p>
                  </div>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="tab-pane">
                  <header className="pane-header">
                    <h3 className="pane-title">Appearance</h3>
                    <p className="pane-desc">Customize theme aesthetic and color accents.</p>
                  </header>
                  <div className="pane-placeholder-box">
                    <p>🎨 Current Theme: Luxury Editorial Light (#F8F6F2)</p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ProfileDrawer;
