import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Home01Icon,
  UserGroupIcon,
  Image01Icon,
  Clock01Icon,
  Bookmark02Icon,
  Settings02Icon,
  Search01Icon,
  GridIcon,
  Menu01Icon,
  Upload01Icon,
  FavouriteIcon,
  ArrowLeft02Icon,
  SparklesIcon,
  ArrowDown01Icon
} from '@hugeicons/core-free-icons';

import { INITIAL_ARTWORKS, PAGINATED_MORE_ARTWORKS, CURRENT_USER } from '../../data/galleryData';
import ProfileDrawer from './ProfileDrawer';
import UploadModal from './UploadModal';
import ArtworkModal from './ArtworkModal';
import UserProfileView from './UserProfileView';
import './GalleryPage.css';

export function GalleryPage({ onBackToTribute }) {
  // Global State Management
  const [artworks, setArtworks] = useState(INITIAL_ARTWORKS);
  const [currentUser, setCurrentUser] = useState(CURRENT_USER);
  const [profileOpen, setProfileOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [activeProfileView, setActiveProfileView] = useState(null); // username string or null

  // Interactive Filters State
  const [activeTab, setActiveTab] = useState('For You'); // 'For You' | 'Trending' | 'Latest' | 'Following'
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedMedia, setSelectedMedia] = useState('All Media');
  const [sortBy, setSortBy] = useState('Trending');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Search State with Debounce
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchInputRef = useRef(null);

  // Interaction State
  const [likedArtworks, setLikedArtworks] = useState(new Set(['art-1', 'art-3', 'art-6']));
  const [savedArtworks, setSavedArtworks] = useState(new Set(['art-2', 'art-3']));

  // Infinite Scroll Pagination State
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef(null);

  // Debounce search input (~300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Keyboard Shortcuts (⌘K or / to focus search, Esc to close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Infinite Scroll Listener (~80% scroll height)
  useEffect(() => {
    const handleScroll = () => {
      if (!hasMore || isLoadingMore) return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      if ((scrollTop + clientHeight) / scrollHeight >= 0.8) {
        setIsLoadingMore(true);
        setTimeout(() => {
          setArtworks((prev) => [...prev, ...PAGINATED_MORE_ARTWORKS]);
          setHasMore(false); // All paginated items loaded
          setIsLoadingMore(false);
        }, 800);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore]);

  // Like Toggle Handler
  const handleToggleLike = (artId) => {
    setLikedArtworks((prev) => {
      const next = new Set(prev);
      if (next.has(artId)) {
        next.delete(artId);
      } else {
        next.add(artId);
      }
      return next;
    });
  };

  // Save Toggle Handler
  const handleToggleSave = (artId) => {
    setSavedArtworks((prev) => {
      const next = new Set(prev);
      if (next.has(artId)) {
        next.delete(artId);
      } else {
        next.add(artId);
      }
      return next;
    });
  };

  // Filtered & Sorted Artworks Pipeline
  const filteredArtworks = useMemo(() => {
    return artworks.filter((art) => {
      // Search query filter
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        const matchesTitle = art.title.toLowerCase().includes(query);
        const matchesArtist = art.artist.toLowerCase().includes(query) || art.artistHandle.toLowerCase().includes(query);
        const matchesTag = art.tags?.some((t) => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesArtist && !matchesTag) return false;
      }

      // Category filter
      if (selectedCategory !== 'All Categories' && art.category !== selectedCategory) {
        return false;
      }

      // Media filter
      if (selectedMedia !== 'All Media' && art.media !== selectedMedia) {
        return false;
      }

      // Filter Tabs
      if (activeTab === 'Trending') {
        return art.likes > 3000;
      } else if (activeTab === 'Following') {
        return art.artist === 'akame_29' || art.artist === 'Kuroi' || art.artist === 'silentgraphy';
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'Latest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === 'Most Liked') {
        return b.likes - a.likes;
      }
      return b.likes - a.likes; // Default Trending
    });
  }, [artworks, debouncedSearch, selectedCategory, selectedMedia, activeTab, sortBy]);

  // Render User Profile Page if navigating to /profile/:username
  if (activeProfileView) {
    return (
      <UserProfileView
        username={activeProfileView}
        currentUser={currentUser}
        artworks={artworks}
        onBack={() => setActiveProfileView(null)}
        onOpenSettings={() => {
          setActiveProfileView(null);
          setProfileOpen(true);
        }}
        onSelectArtwork={(art) => setSelectedArtwork(art)}
      />
    );
  }

  return (
    <div className={`gallery-app-root ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} ref={scrollContainerRef}>
      {/* FIXED TOP NAVIGATION BAR */}
      <header className="gallery-top-header">
        <div className="header-left">
          <button className="gallery-logo-btn" onClick={onBackToTribute} title="Back to Landing Tribute">
            <span className="logo-text">MAKIMA</span>
            <span className="logo-kanji">マキマ</span>
          </button>
        </div>

        {/* Center Header Links */}
        <nav className="gallery-header-nav">
          <button className="header-nav-link" onClick={onBackToTribute}>Home</button>
          <button className="header-nav-link" onClick={onBackToTribute}>Story</button>
          <button className="header-nav-link" onClick={onBackToTribute}>Relations</button>
          <button className="header-nav-link active">
            Gallery
            <span className="nav-active-dot" />
          </button>
          <button className="header-nav-link" onClick={onBackToTribute}>Timeline</button>
          <button className="header-nav-link" onClick={onBackToTribute}>About</button>
        </nav>

        {/* Right Header Avatar Trigger */}
        <div className="header-right">
          <button
            className="top-profile-avatar-btn"
            onClick={() => setProfileOpen(!profileOpen)}
            aria-label="Toggle Profile Menu"
          >
            <img src={currentUser.avatar} alt={currentUser.name} className="top-avatar-img" />
          </button>
        </div>
      </header>

      {/* FIXED LEFT SIDEBAR */}
      <aside className="gallery-left-sidebar">
        <div className="sidebar-brand-icon">
          <HugeiconsIcon icon={SparklesIcon} size={22} />
        </div>

        <nav className="sidebar-nav">
          <button className="sidebar-item" onClick={onBackToTribute} title="Home">
            <HugeiconsIcon icon={Home01Icon} size={20} />
            <span className="sidebar-label">Home</span>
          </button>

          <button className="sidebar-item" onClick={() => setActiveTab('Following')} title="People">
            <HugeiconsIcon icon={UserGroupIcon} size={20} />
            <span className="sidebar-label">People</span>
          </button>

          <button className="sidebar-item active" title="Gallery">
            <HugeiconsIcon icon={Image01Icon} size={20} />
            <span className="sidebar-label">Gallery</span>
            <span className="sidebar-active-pill" />
          </button>

          <button className="sidebar-item" onClick={onBackToTribute} title="Timeline">
            <HugeiconsIcon icon={Clock01Icon} size={20} />
            <span className="sidebar-label">Timeline</span>
          </button>

          <button className="sidebar-item" onClick={() => setActiveTab('Saved')} title="Saved">
            <HugeiconsIcon icon={Bookmark02Icon} size={20} />
            <span className="sidebar-label">Saved</span>
          </button>
        </nav>

        {/* Bottom Sidebar Controls */}
        <div className="sidebar-footer">
          <button
            className="sidebar-collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title="Collapse Sidebar"
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} size={18} />
          </button>

          <button
            className="sidebar-item settings-item"
            onClick={() => setProfileOpen(true)}
            title="Settings"
          >
            <HugeiconsIcon icon={Settings02Icon} size={20} />
            <span className="sidebar-label">Settings</span>
          </button>
        </div>
      </aside>

      {/* MAIN GALLERY CONTENT WRAPPER */}
      <main className="gallery-main-layout">
        {/* Gallery Title & Search Header */}
        <div className="gallery-title-search-row">
          <div className="gallery-title-box">
            <h1 className="gallery-page-title">
              Gallery <span className="title-star">⁺</span>
            </h1>
            <p className="gallery-page-subtitle">Explore fan artworks from around the world.</p>
          </div>

          {/* Instant Search Bar */}
          <div className="gallery-search-bar">
            <HugeiconsIcon icon={Search01Icon} size={18} className="search-icon" />
            <input
              type="text"
              ref={searchInputRef}
              className="gallery-search-input"
              placeholder="Search artworks, artists, tags..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <span className="shortcut-badge">⌘K</span>
          </div>
        </div>

        {/* FILTER BAR ROW (Tabs, Dropdowns, View Mode, Upload) */}
        <div className="gallery-filter-toolbar">
          {/* Left Category Tabs */}
          <div className="filter-tabs-group">
            {['For You', 'Trending', 'Latest', 'Following'].map((tab) => (
              <button
                key={tab}
                className={`filter-tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                <span>{tab}</span>
                {activeTab === tab && <span className="tab-dot" />}
              </button>
            ))}
          </div>

          {/* Right Controls: Category Dropdown, Media Dropdown, View Toggles, Upload */}
          <div className="filter-dropdowns-group">
            {/* Category Select Dropdown */}
            <div className="custom-select-wrapper">
              <select
                className="filter-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="All Categories">All Categories</option>
                <option value="Editorial">Editorial</option>
                <option value="Digital Art">Digital Art</option>
                <option value="Fan Art">Fan Art</option>
                <option value="Vector">Vector</option>
                <option value="Concept">Concept</option>
              </select>
              <HugeiconsIcon icon={ArrowDown01Icon} size={14} className="select-arrow" />
            </div>

            {/* Media Select Dropdown */}
            <div className="custom-select-wrapper">
              <select
                className="filter-select"
                value={selectedMedia}
                onChange={(e) => setSelectedMedia(e.target.value)}
              >
                <option value="All Media">All Media</option>
                <option value="Illustration">Illustration</option>
                <option value="Animation">Animation</option>
                <option value="3D Render">3D Render</option>
                <option value="Photography">Photography</option>
              </select>
              <HugeiconsIcon icon={ArrowDown01Icon} size={14} className="select-arrow" />
            </div>

            {/* View Mode Grid/List Toggles */}
            <div className="view-mode-toggle-group">
              <button
                className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <HugeiconsIcon icon={GridIcon} size={18} />
              </button>
              <button
                className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <HugeiconsIcon icon={Menu01Icon} size={18} />
              </button>
            </div>

            {/* Upload Button Trigger */}
            <button className="upload-trigger-primary-btn" onClick={() => setUploadOpen(true)}>
              <HugeiconsIcon icon={Upload01Icon} size={16} />
              <span>Upload</span>
            </button>
          </div>
        </div>

        {/* MASONRY GALLERY GRID */}
        {filteredArtworks.length === 0 ? (
          <div className="empty-gallery-state">
            <h3>No artworks found matching "{debouncedSearch}"</h3>
            <p>Try clearing your search query or selecting a different category filter.</p>
            <button className="reset-filter-btn" onClick={() => { setSearchInput(''); setSelectedCategory('All Categories'); setActiveTab('For You'); }}>
              Reset Filters
            </button>
          </div>
        ) : (
          <div className={`masonry-gallery-container ${viewMode === 'list' ? 'list-layout' : ''}`}>
            {filteredArtworks.map((art) => {
              const isLiked = likedArtworks.has(art.id);
              const isSaved = savedArtworks.has(art.id);

              return (
                <motion.div
                  key={art.id}
                  className="masonry-artwork-card"
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setSelectedArtwork(art)}
                >
                  <div className="card-image-wrapper">
                    <img src={art.src} alt={art.title} className="artwork-image" loading="lazy" />

                    {/* Animated WebP / Video Badge */}
                    {art.isAnimated && (
                      <div className="video-badge" title="Animated Art">
                        <span>📹</span>
                      </div>
                    )}

                    {/* Hover Action Buttons (Like & Save) */}
                    <div className="card-hover-actions">
                      <button
                        className={`hover-action-btn ${isLiked ? 'liked' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLike(art.id);
                        }}
                        title={isLiked ? 'Unlike' : 'Like'}
                      >
                        <HugeiconsIcon icon={FavouriteIcon} size={16} />
                      </button>

                      <button
                        className={`hover-action-btn ${isSaved ? 'saved' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSave(art.id);
                        }}
                        title={isSaved ? 'Unsave' : 'Save'}
                      >
                        <HugeiconsIcon icon={Bookmark02Icon} size={16} />
                      </button>
                    </div>

                    {/* Bottom Artist Overlay Bar */}
                    <div className="card-artist-overlay">
                      <div
                        className="artist-info-group"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveProfileView(art.artist);
                        }}
                      >
                        <img src={art.artistAvatar} alt={art.artist} className="artist-card-avatar" />
                        <span className="artist-card-name">{art.artist}</span>
                      </div>

                      <div className="card-likes-count">
                        <HugeiconsIcon icon={FavouriteIcon} size={13} />
                        <span>{(art.likes / 1000).toFixed(1)}K</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Infinite Scroll Spinner Indicator */}
        {isLoadingMore && (
          <div className="infinite-scroll-spinner-row">
            <div className="spinner-dots" />
            <span>Loading more fan artworks...</span>
          </div>
        )}

        {/* FOOTER NOTICE */}
        <footer className="gallery-page-footer">
          <span className="copyright-text">&copy; 2025 Makima Gallery. All rights reserved.</span>
          <div className="footer-links">
            <button className="footer-link">Guidelines</button>
            <button className="footer-link">Terms</button>
            <button className="footer-link">Privacy</button>
            <button className="footer-link">Contact</button>
          </div>
        </footer>
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="mobile-bottom-nav">
        <button className="mobile-nav-item" onClick={onBackToTribute}>
          <HugeiconsIcon icon={Home01Icon} size={20} />
          <span>Home</span>
        </button>
        <button className="mobile-nav-item active">
          <HugeiconsIcon icon={Image01Icon} size={20} />
          <span>Gallery</span>
        </button>
        <button className="mobile-nav-item upload-btn" onClick={() => setUploadOpen(true)}>
          <HugeiconsIcon icon={Upload01Icon} size={22} />
        </button>
        <button className="mobile-nav-item" onClick={() => setActiveTab('Saved')}>
          <HugeiconsIcon icon={Bookmark02Icon} size={20} />
          <span>Saved</span>
        </button>
        <button className="mobile-nav-item" onClick={() => setProfileOpen(true)}>
          <HugeiconsIcon icon={Settings02Icon} size={20} />
          <span>Profile</span>
        </button>
      </nav>

      {/* PROFILE DRAWER OVERLAY */}
      <ProfileDrawer
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        currentUser={currentUser}
        onNavigateProfile={(uname) => {
          setProfileOpen(false);
          setActiveProfileView(uname);
        }}
        onUpdateUser={(updated) => setCurrentUser(updated)}
      />

      {/* UPLOAD MODAL */}
      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploadSuccess={(newArt) => {
          setArtworks([newArt, ...artworks]);
        }}
      />

      {/* ARTWORK DETAIL MODAL */}
      <ArtworkModal
        artwork={selectedArtwork}
        onClose={() => setSelectedArtwork(null)}
        isLiked={selectedArtwork ? likedArtworks.has(selectedArtwork.id) : false}
        isSaved={selectedArtwork ? savedArtworks.has(selectedArtwork.id) : false}
        onToggleLike={handleToggleLike}
        onToggleSave={handleToggleSave}
        onNavigateArtist={(uname) => {
          setSelectedArtwork(null);
          setActiveProfileView(uname);
        }}
      />
    </div>
  );
}

export default GalleryPage;
