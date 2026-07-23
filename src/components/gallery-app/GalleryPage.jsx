import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Upload01Icon,
  FavouriteIcon,
  ArrowLeft02Icon,
  SparklesIcon,
  ArrowDown01Icon
} from '@hugeicons/core-free-icons';

import { INITIAL_ARTWORKS, CURRENT_USER } from '../../data/galleryData';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { getCachedTrendingArtworks, cacheTrendingArtworks, checkActionRateLimit } from '../../lib/redis';
import ProgressiveImage from './ProgressiveImage';
import ProfileDrawer from './ProfileDrawer';
import UploadModal from './UploadModal';
import ArtworkModal from './ArtworkModal';
import UserProfileView from './UserProfileView';
import './GalleryPage.css';

const PAGE_SIZE = 20;

export function GalleryPage({ onBackToTribute, onOpenAuth }) {
  const { user, profile } = useAuth();

  // Global State Management
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [activeProfileView, setActiveProfileView] = useState(null); // username string or null

  // Interactive Filters State
  const [activeTab, setActiveTab] = useState('For You'); // 'For You' | 'Trending' | 'Latest' | 'Following' | 'Saved'
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedMedia, setSelectedMedia] = useState('All Media');
  const [sortBy, setSortBy] = useState('Trending');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Search State with Debounce
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchInputRef = useRef(null);

  // User Likes & Saves (Bookmarks) Sets
  const [likedArtworks, setLikedArtworks] = useState(new Set());
  const [savedArtworks, setSavedArtworks] = useState(new Set());

  // Infinite Scroll Pagination State
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef(null);

  // Helper to map DB row to UI format
  const mapDbRowToArtwork = useCallback((art) => {
    const artistObj = art.artist || art.profiles || {};
    return {
      id: art.id,
      title: art.title,
      description: art.description || '',
      artist: artistObj.display_name || art.artist_name || 'Kuroi',
      artistHandle: artistObj.handle ? (artistObj.handle.startsWith('@') ? artistObj.handle : `@${artistObj.handle}`) : '@kuroi_art',
      artistAvatar: artistObj.avatar_url || '/images/coming-soon.jpg',
      artistId: art.artist_id,
      src: art.image_url || '/images/gallery-1.webp',
      thumbnailUrl: art.thumbnail_url || art.image_url,
      blurHash: art.blur_hash || '',
      likes: art.likes_count ?? 0,
      saves: art.saves_count ?? 0,
      category: art.category || 'Editorial',
      media: art.media_type || 'Illustration',
      isAnimated: art.is_animated ?? false,
      aspectRatio: art.aspect_ratio || '1.4',
      tags: art.tags || [],
      createdAt: art.created_at || new Date().toISOString()
    };
  }, []);

  // Primary Fetch Function from Supabase with Redis caching for default query
  const fetchArtworks = useCallback(async (pageIndex = 0, append = false) => {
    if (pageIndex === 0 && !append) {
      setLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      // Check Redis cache for page 0 default trending view
      if (
        pageIndex === 0 &&
        activeTab === 'For You' &&
        selectedCategory === 'All Categories' &&
        selectedMedia === 'All Media' &&
        !debouncedSearch
      ) {
        const cached = await getCachedTrendingArtworks();
        if (cached && Array.isArray(cached) && cached.length > 0) {
          setArtworks(cached);
          setLoading(false);
          setIsLoadingMore(false);
          // Still fetch fresh data asynchronously to update cache
        }
      }

      let query = supabase
        .from('artworks')
        .select(`
          *,
          artist:profiles!artworks_artist_id_fkey(
            id,
            display_name,
            handle,
            avatar_url,
            bio
          )
        `);

      // Category filter
      if (selectedCategory !== 'All Categories') {
        query = query.eq('category', selectedCategory);
      }

      // Media filter
      if (selectedMedia !== 'All Media') {
        query = query.eq('media_type', selectedMedia);
      }

      // Tab filter
      if (activeTab === 'Latest' || sortBy === 'Latest') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('likes_count', { ascending: false });
      }

      // Search query filter (Full Text Search utilizing PostgreSQL search_vector GIN index with fallback)
      if (debouncedSearch) {
        const formattedSearchQuery = debouncedSearch.trim();
        if (formattedSearchQuery) {
          try {
            query = query.textSearch('search_vector', formattedSearchQuery, {
              type: 'websearch',
              config: 'english'
            });
          } catch (err) {
            console.warn('textSearch parameter format error, using fallback filter:', err);
            const safeTerm = `%${formattedSearchQuery}%`;
            query = query.or(`title.ilike.${safeTerm},description.ilike.${safeTerm}`);
          }
        }
      }

      const from = pageIndex * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      let { data, error } = await query;

      // Fallback query if Supabase textSearch encounters a backend error
      if (error && debouncedSearch) {
        console.warn('Supabase search_vector textSearch query notice, executing fallback .or search query:', error.message);
        let fallbackQuery = supabase
          .from('artworks')
          .select(`
            *,
            artist:profiles!artworks_artist_id_fkey(
              id,
              display_name,
              handle,
              avatar_url,
              bio
            )
          `);

        if (selectedCategory !== 'All Categories') {
          fallbackQuery = fallbackQuery.eq('category', selectedCategory);
        }
        if (selectedMedia !== 'All Media') {
          fallbackQuery = fallbackQuery.eq('media_type', selectedMedia);
        }
        if (activeTab === 'Latest' || sortBy === 'Latest') {
          fallbackQuery = fallbackQuery.order('created_at', { ascending: false });
        } else {
          fallbackQuery = fallbackQuery.order('likes_count', { ascending: false });
        }

        const safeTerm = `%${debouncedSearch.trim()}%`;
        fallbackQuery = fallbackQuery.or(`title.ilike.${safeTerm},description.ilike.${safeTerm}`);
        fallbackQuery = fallbackQuery.range(from, to);

        const fallbackRes = await fallbackQuery;
        if (fallbackRes.data && !fallbackRes.error) {
          data = fallbackRes.data;
          error = null;
        }
      }

      if (error) {
        console.warn('Supabase fetch query notice:', error.message);
        // Fallback to initial mock data if DB table isn't ready
        if (pageIndex === 0 && (!artworks || artworks.length === 0)) {
          let mockResults = INITIAL_ARTWORKS;
          if (debouncedSearch) {
            const q = debouncedSearch.toLowerCase().trim();
            mockResults = INITIAL_ARTWORKS.filter((art) =>
              art.title?.toLowerCase().includes(q) ||
              art.description?.toLowerCase().includes(q) ||
              art.artist?.toLowerCase().includes(q) ||
              (art.tags && art.tags.some((t) => t.toLowerCase().includes(q)))
            );
          }
          setArtworks(mockResults);
        }
        setHasMore(false);
      } else if (data) {
        const formatted = data.map(mapDbRowToArtwork);
        if (formatted.length < PAGE_SIZE) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        if (append) {
          setArtworks((prev) => {
            const existingIds = new Set(prev.map((a) => a.id));
            const newItems = formatted.filter((a) => !existingIds.has(a.id));
            return [...prev, ...newItems];
          });
        } else {
          setArtworks(formatted.length > 0 ? formatted : INITIAL_ARTWORKS);
          if (
            pageIndex === 0 &&
            activeTab === 'For You' &&
            selectedCategory === 'All Categories' &&
            selectedMedia === 'All Media' &&
            !debouncedSearch &&
            formatted.length > 0
          ) {
            cacheTrendingArtworks(formatted);
          }
        }
      }
    } catch (err) {
      console.warn('Error fetching artworks:', err.message);
      if (pageIndex === 0 && (!artworks || artworks.length === 0)) {
        setArtworks(INITIAL_ARTWORKS);
      }
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [activeTab, selectedCategory, selectedMedia, sortBy, debouncedSearch, mapDbRowToArtwork]);

  // Initial & Filter Change Trigger
  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchArtworks(0, false);
  }, [fetchArtworks]);

  // Fetch User Liked & Saved Artworks from Supabase when user logged in
  useEffect(() => {
    if (!user) {
      setLikedArtworks(new Set());
      setSavedArtworks(new Set());
      return;
    }

    const fetchUserInteractions = async () => {
      try {
        const [{ data: likesData }, { data: savesData }] = await Promise.all([
          supabase.from('likes').select('artwork_id').eq('user_id', user.id),
          supabase.from('bookmarks').select('artwork_id').eq('user_id', user.id),
        ]);

        if (likesData) {
          setLikedArtworks(new Set(likesData.map((l) => l.artwork_id)));
        }
        if (savesData) {
          setSavedArtworks(new Set(savesData.map((s) => s.artwork_id)));
        }
      } catch (err) {
        console.warn('Error fetching user likes/saves:', err.message);
      }
    };

    fetchUserInteractions();
  }, [user]);

  // Supabase Realtime Subscription for live Like count updates
  useEffect(() => {
    const channel = supabase
      .channel('public-artworks-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'artworks' },
        (payload) => {
          if (payload?.new) {
            setArtworks((prev) =>
              prev.map((a) =>
                a.id === payload.new.id
                  ? {
                      ...a,
                      likes: payload.new.likes_count ?? a.likes,
                      saves: payload.new.saves_count ?? a.saves,
                    }
                  : a
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-detect /gallery/artwork/:id URL on mount
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/gallery/artwork/')) {
      const artId = path.split('/gallery/artwork/')[1];
      const match = artworks.find((a) => a.id === artId) || INITIAL_ARTWORKS.find((a) => a.id === artId);
      if (match) {
        setSelectedArtwork(match);
      }
    }
  }, [artworks]);

  // Debounce search input (~300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Keyboard Shortcuts (⌘K or / to focus search)
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
      if (!hasMore || isLoadingMore || loading) return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      if ((scrollTop + clientHeight) / scrollHeight >= 0.8) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchArtworks(nextPage, true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, loading, page, fetchArtworks]);

  // Like Toggle Handler with Auth protection & Redis rate limiting
  const handleToggleLike = async (artId) => {
    if (!user) {
      if (onOpenAuth) onOpenAuth('signin');
      return;
    }

    // Check Redis rate limit
    const rateCheck = await checkActionRateLimit(user.id, 'like');
    if (!rateCheck.allowed) {
      alert('Action rate limit exceeded. Please wait a moment before liking again.');
      return;
    }

    const isLiked = likedArtworks.has(artId);

    // Optimistic UI update
    setLikedArtworks((prev) => {
      const next = new Set(prev);
      if (isLiked) next.delete(artId);
      else next.add(artId);
      return next;
    });

    setArtworks((prev) =>
      prev.map((a) =>
        a.id === artId ? { ...a, likes: Math.max(0, a.likes + (isLiked ? -1 : 1)) } : a
      )
    );

    try {
      if (isLiked) {
        await supabase.from('likes').delete().eq('user_id', user.id).eq('artwork_id', artId);
      } else {
        await supabase.from('likes').insert({ user_id: user.id, artwork_id: artId });
      }
    } catch (err) {
      console.warn('Error toggling like:', err.message);
    }
  };

  // Save Toggle Handler with Auth protection & Redis rate limiting
  const handleToggleSave = async (artId) => {
    if (!user) {
      if (onOpenAuth) onOpenAuth('signin');
      return;
    }

    const rateCheck = await checkActionRateLimit(user.id, 'save');
    if (!rateCheck.allowed) {
      alert('Action rate limit exceeded. Please wait a moment.');
      return;
    }

    const isSaved = savedArtworks.has(artId);

    // Optimistic UI update
    setSavedArtworks((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(artId);
      else next.add(artId);
      return next;
    });

    setArtworks((prev) =>
      prev.map((a) =>
        a.id === artId ? { ...a, saves: Math.max(0, a.saves + (isSaved ? -1 : 1)) } : a
      )
    );

    try {
      if (isSaved) {
        await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('artwork_id', artId);
      } else {
        await supabase.from('bookmarks').insert({ user_id: user.id, artwork_id: artId });
      }
    } catch (err) {
      console.warn('Error toggling save:', err.message);
    }
  };

  // Handle protected Upload action
  const handleOpenUpload = () => {
    if (!user) {
      if (onOpenAuth) onOpenAuth('signin');
      return;
    }
    setUploadOpen(true);
  };

  // Filtered Artworks in memory
  const filteredArtworks = useMemo(() => {
    return artworks.filter((art) => {
      if (activeTab === 'Saved') {
        return savedArtworks.has(art.id);
      }
      return true;
    });
  }, [artworks, activeTab, savedArtworks]);

  const currentUserData = useMemo(() => {
    if (profile) {
      return {
        name: profile.display_name || user?.email?.split('@')[0] || CURRENT_USER.name,
        username: profile.handle?.replace(/^@/, '') || CURRENT_USER.username,
        avatar: profile.avatar_url || CURRENT_USER.avatar,
        bio: profile.bio || CURRENT_USER.bio,
        website: profile.website || CURRENT_USER.website,
        location: profile.location || CURRENT_USER.location,
        social: profile.social_links || CURRENT_USER.social,
        followingCount: profile.following_count ?? 142,
        followersCount: profile.followers_count ?? '48.9K',
        artworksCount: profile.artworks_count ?? 38,
        likesCount: profile.likes_count ?? 1240,
      };
    }
    return CURRENT_USER;
  }, [profile, user]);

  // Render User Profile Page if navigating to /profile/:username
  if (activeProfileView) {
    return (
      <UserProfileView
        username={activeProfileView}
        currentUser={currentUserData}
        artworks={artworks}
        onBack={() => setActiveProfileView(null)}
        onOpenSettings={() => {
          setActiveProfileView(null);
          setProfileOpen(true);
        }}
        onSelectArtwork={(art) => setSelectedArtwork(art)}
        onOpenAuth={onOpenAuth}
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

        {/* Right Header Avatar / Auth Trigger */}
        <div className="header-right">
          {user ? (
            <button
              className="top-profile-avatar-btn"
              onClick={() => setProfileOpen(!profileOpen)}
              aria-label="Toggle Profile Menu"
            >
              <img src={currentUserData.avatar} alt={currentUserData.name} className="top-avatar-img" />
            </button>
          ) : (
            <button
              className="auth-sign-in-nav-btn"
              onClick={() => onOpenAuth && onOpenAuth('signin')}
              style={{
                backgroundColor: 'var(--color-primary-red, #A63D3D)',
                color: '#fff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Sign In
            </button>
          )}
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

          <button
            className={`sidebar-item ${activeTab === 'Following' ? 'active' : ''}`}
            onClick={() => setActiveTab('Following')}
            title="People"
          >
            <HugeiconsIcon icon={UserGroupIcon} size={20} />
            <span className="sidebar-label">People</span>
          </button>

          <button
            className={`sidebar-item ${activeTab === 'For You' ? 'active' : ''}`}
            onClick={() => setActiveTab('For You')}
            title="Gallery"
          >
            <HugeiconsIcon icon={Image01Icon} size={20} />
            <span className="sidebar-label">Gallery</span>
            {activeTab === 'For You' && <span className="sidebar-active-pill" />}
          </button>

          <button className="sidebar-item" onClick={onBackToTribute} title="Timeline">
            <HugeiconsIcon icon={Clock01Icon} size={20} />
            <span className="sidebar-label">Timeline</span>
          </button>

          <button
            className={`sidebar-item ${activeTab === 'Saved' ? 'active' : ''}`}
            onClick={() => setActiveTab('Saved')}
            title="Saved"
          >
            <HugeiconsIcon icon={Bookmark02Icon} size={20} />
            <span className="sidebar-label">Saved</span>
            {activeTab === 'Saved' && <span className="sidebar-active-pill" />}
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
            onClick={() => {
              if (!user) onOpenAuth && onOpenAuth('signin');
              else setProfileOpen(true);
            }}
            title="Settings"
          >
            <HugeiconsIcon icon={Settings02Icon} size={20} />
            <span className="sidebar-label">Settings</span>
          </button>
        </div>
      </aside>

      {/* MAIN GALLERY CONTENT WRAPPER */}
      <main className={`gallery-main-layout ${selectedArtwork ? 'is-blurred' : ''}`}>
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

        {/* FILTER BAR ROW (Tabs, Dropdowns, Upload) */}
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

          {/* Right Controls: Category Dropdown, Media Dropdown, Upload */}
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

            {/* Upload Button Trigger */}
            <button className="upload-trigger-primary-btn" onClick={handleOpenUpload}>
              <HugeiconsIcon icon={Upload01Icon} size={16} />
              <span>Upload</span>
            </button>
          </div>
        </div>

        {/* MASONRY GALLERY GRID WITH PROGRESSIVE IMAGES */}
        {loading ? (
          <div className="infinite-scroll-spinner-row">
            <div className="spinner-dots" />
            <span>Loading live Supabase artworks...</span>
          </div>
        ) : filteredArtworks.length === 0 ? (
          <div className="empty-gallery-state">
            <h3>No artworks found matching "{debouncedSearch}"</h3>
            <p>Try clearing your search query or selecting a different category filter.</p>
            <button
              className="reset-filter-btn"
              onClick={() => {
                setSearchInput('');
                setSelectedCategory('All Categories');
                setSelectedMedia('All Media');
                setActiveTab('For You');
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="masonry-gallery-container">
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
                    {/* Render with Stage 4 Progressive Image Component */}
                    <ProgressiveImage
                      src={art.src}
                      lowResSrc={art.thumbnailUrl}
                      blurHash={art.blurHash}
                      alt={art.title}
                      aspectRatio={art.aspectRatio}
                      className="artwork-image-progressive"
                    />

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
                        <span>{(art.likes >= 1000 ? `${(art.likes / 1000).toFixed(1)}K` : art.likes)}</span>
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
        <button className="mobile-nav-item upload-btn" onClick={handleOpenUpload}>
          <HugeiconsIcon icon={Upload01Icon} size={22} />
        </button>
        <button className="mobile-nav-item" onClick={() => setActiveTab('Saved')}>
          <HugeiconsIcon icon={Bookmark02Icon} size={20} />
          <span>Saved</span>
        </button>
        <button
          className="mobile-nav-item"
          onClick={() => {
            if (!user) onOpenAuth && onOpenAuth('signin');
            else setProfileOpen(true);
          }}
        >
          <HugeiconsIcon icon={Settings02Icon} size={20} />
          <span>Profile</span>
        </button>
      </nav>

      {/* PROFILE DRAWER OVERLAY */}
      <ProfileDrawer
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        currentUser={currentUserData}
        onNavigateProfile={(uname) => {
          setProfileOpen(false);
          setActiveProfileView(uname);
        }}
        onUpdateUser={() => {}}
      />

      {/* UPLOAD MODAL */}
      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploadSuccess={(newArt) => {
          setArtworks((prev) => [newArt, ...prev]);
        }}
      />

      {/* PINTEREST-STYLE CONTINUOUS ARTWORK VIEWER OVERLAY */}
      <ArtworkModal
        artwork={selectedArtwork}
        allArtworks={artworks}
        onClose={() => {
          setSelectedArtwork(null);
          if (window.location.pathname.includes('/gallery/artwork/')) {
            window.history.pushState({}, '', '/gallery');
          }
        }}
        isLiked={selectedArtwork ? likedArtworks.has(selectedArtwork.id) : false}
        isSaved={selectedArtwork ? savedArtworks.has(selectedArtwork.id) : false}
        onToggleLike={handleToggleLike}
        onToggleSave={handleToggleSave}
        onNavigateArtist={(uname) => {
          setSelectedArtwork(null);
          setActiveProfileView(uname);
        }}
        onSelectArtwork={(art) => setSelectedArtwork(art)}
        onOpenAuth={onOpenAuth}
      />
    </div>
  );
}

export default GalleryPage;
