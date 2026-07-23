import React, { useState, useEffect, useMemo } from 'react';
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

import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { checkActionRateLimit } from '../../lib/redis';
import './UserProfileView.css';

export function UserProfileView({
  username,
  currentUser,
  artworks = [],
  onBack,
  onOpenSettings,
  onSelectArtwork,
  onOpenAuth
}) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('uploads');
  const [artistProfile, setArtistProfile] = useState(null);
  const [userArtworks, setUserArtworks] = useState([]);
  const [likedArtworks, setLikedArtworks] = useState([]);
  const [savedArtworks, setSavedArtworks] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const isSelf = useMemo(() => {
    if (!username || !currentUser) return false;
    const cleanCurrent = (currentUser.username || '').toLowerCase().replace(/^@/, '');
    const cleanTarget = username.toLowerCase().replace(/^@/, '');
    return cleanCurrent === cleanTarget;
  }, [username, currentUser]);

  // Fetch artist profile, uploaded artworks, and follow status from Supabase
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const fetchProfileAndArtworks = async () => {
      try {
        const cleanHandle = username.startsWith('@') ? username : `@${username}`;
        const rawHandle = username.replace(/^@/, '');

        // Fetch target profile
        const { data: profData, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .or(`handle.eq.${cleanHandle},handle.eq.${rawHandle}`)
          .maybeSingle();

        if (mounted && profData) {
          setArtistProfile(profData);

          // Fetch artist's uploaded artworks
          const { data: artsData } = await supabase
            .from('artworks')
            .select(`
              *,
              artist:profiles!artworks_artist_id_fkey(
                id, display_name, handle, avatar_url
              )
            `)
            .eq('artist_id', profData.id)
            .order('created_at', { ascending: false });

          if (artsData && artsData.length > 0) {
            setUserArtworks(artsData.map((art) => ({
              id: art.id,
              title: art.title,
              artist: profData.display_name,
              artistHandle: profData.handle,
              artistAvatar: profData.avatar_url,
              src: art.image_url,
              likes: art.likes_count ?? 0,
              saves: art.saves_count ?? 0,
              category: art.category,
              aspectRatio: art.aspect_ratio || '1.4',
            })));
          } else {
            // Fallback matching from prop artworks
            const matched = artworks.filter(
              (art) => (art.artistHandle || '').toLowerCase().includes(rawHandle.toLowerCase()) || (art.artist || '').toLowerCase() === rawHandle.toLowerCase()
            );
            setUserArtworks(matched);
          }

          // Check if current user is following target artist
          if (user && profData.id !== user.id) {
            const { data: followData } = await supabase
              .from('follows')
              .select('*')
              .eq('follower_id', user.id)
              .eq('following_id', profData.id)
              .maybeSingle();
            if (mounted) setIsFollowing(!!followData);
          }
        } else {
          // Fallback matching from prop artworks
          const matched = artworks.filter(
            (art) => (art.artistHandle || '').toLowerCase().includes(username.toLowerCase()) || (art.artist || '').toLowerCase() === username.toLowerCase()
          );
          setUserArtworks(matched);
        }
      } catch (err) {
        console.warn('Error loading user profile view:', err.message);
        const matched = artworks.filter(
          (art) => (art.artistHandle || '').toLowerCase().includes(username.toLowerCase()) || (art.artist || '').toLowerCase() === username.toLowerCase()
        );
        setUserArtworks(matched);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProfileAndArtworks();

    return () => {
      mounted = false;
    };
  }, [username, user, artworks]);

  const handleToggleFollow = async () => {
    if (!user) {
      if (onOpenAuth) onOpenAuth('signin');
      return;
    }
    if (!artistProfile || artistProfile.id === user.id) return;

    const rateCheck = await checkActionRateLimit(user.id, 'follow');
    if (!rateCheck.allowed) {
      alert('Action rate limit exceeded. Please wait.');
      return;
    }

    const nextState = !isFollowing;
    setIsFollowing(nextState);

    try {
      if (nextState) {
        await supabase.from('follows').insert({ follower_id: user.id, following_id: artistProfile.id });
      } else {
        await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', artistProfile.id);
      }
    } catch (err) {
      console.warn('Error toggling follow status:', err.message);
    }
  };

  const displayUser = artistProfile ? {
    name: artistProfile.display_name || username,
    username: artistProfile.handle ? artistProfile.handle.replace(/^@/, '') : username,
    avatar: artistProfile.avatar_url || currentUser.avatar,
    bio: artistProfile.bio || 'Control is beautiful.',
    website: artistProfile.website || 'https://makima.gallery',
    location: artistProfile.location || 'Public Safety, Tokyo',
    artworksCount: userArtworks.length,
    likesCount: artistProfile.likes_count ?? 1240,
    followersCount: artistProfile.followers_count ?? '48.9K',
    followingCount: artistProfile.following_count ?? 142,
  } : {
    name: isSelf ? currentUser.name : username,
    username: username,
    avatar: isSelf ? currentUser.avatar : '/images/coming-soon.jpg',
    bio: isSelf ? currentUser.bio : 'Control is beautiful.',
    website: isSelf ? currentUser.website : 'https://makima.gallery',
    location: isSelf ? currentUser.location : 'Public Safety, Tokyo',
    artworksCount: userArtworks.length,
    likesCount: 1240,
    followersCount: '48.9K',
    followingCount: 142,
  };

  return (
    <div className="user-profile-view-root">
      {/* Top Bar Header */}
      <div className="profile-top-bar">
        <button className="back-btn" onClick={onBack}>
          <HugeiconsIcon icon={ArrowLeft02Icon} size={20} />
          <span>Back to Gallery</span>
        </button>
        <h3 className="top-bar-title">@{displayUser.username}</h3>
        {isSelf && (
          <button className="settings-trigger-btn" onClick={onOpenSettings}>
            <HugeiconsIcon icon={Settings02Icon} size={20} />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {/* Banner */}
      <div className="profile-banner-container">
        <img src="/images/hero-bg.webp" alt="Profile Banner" className="profile-banner-img" />
        <div className="banner-overlay" />
      </div>

      {/* Profile Header Info Box */}
      <div className="profile-header-container">
        <div className="profile-avatar-row">
          <img src={displayUser.avatar} alt={displayUser.name} className="profile-large-avatar" />
          {isSelf ? (
            <button className="edit-profile-main-btn" onClick={onOpenSettings}>
              Edit Profile
            </button>
          ) : (
            <button
              className={`edit-profile-main-btn ${isFollowing ? 'following' : ''}`}
              onClick={handleToggleFollow}
              style={{
                backgroundColor: isFollowing ? '#333' : 'var(--color-primary-red, #A63D3D)',
                color: '#fff',
                border: 'none',
              }}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        <div className="profile-identity-box">
          <h1 className="profile-main-name">{displayUser.name}</h1>
          <span className="profile-main-handle">@{displayUser.username}</span>
          <p className="profile-main-bio">{displayUser.bio}</p>

          <div className="profile-meta-row">
            <span className="meta-item">
              <HugeiconsIcon icon={Location01Icon} size={14} />
              {displayUser.location}
            </span>
            <a href={displayUser.website} target="_blank" rel="noreferrer" className="meta-item link">
              <HugeiconsIcon icon={Link01Icon} size={14} />
              {displayUser.website}
            </a>
          </div>

          {/* Stats Bar */}
          <div className="profile-stats-bar">
            <div className="stat-box">
              <span className="stat-number">{displayUser.artworksCount}</span>
              <span className="stat-label">Artworks</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{displayUser.likesCount}</span>
              <span className="stat-label">Likes</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{displayUser.followersCount}</span>
              <span className="stat-label">Followers</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{displayUser.followingCount}</span>
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
            <p>No artworks uploaded yet under @{displayUser.username}.</p>
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
