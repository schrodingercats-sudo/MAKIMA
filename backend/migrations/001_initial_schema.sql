-- ============================================================================
-- Makima Fan Art Gallery - Initial Database Migration Schema
-- Database: PostgreSQL (Supabase)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ----------------------------------------------------------------------------
-- 1. PROFILES TABLE (Extends Supabase Auth users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    handle TEXT UNIQUE NOT NULL,
    avatar_url TEXT DEFAULT '/images/coming-soon.jpg',
    bio TEXT DEFAULT '',
    website TEXT DEFAULT '',
    location TEXT DEFAULT '',
    social_links JSONB DEFAULT '{"x": "", "instagram": "", "youtube": ""}'::jsonb,
    following_count INT DEFAULT 0,
    followers_count INT DEFAULT 0,
    artworks_count INT DEFAULT 0,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. ARTWORKS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.artworks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    image_url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    blur_hash TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Editorial', 'Digital Art', 'Fan Art', 'Vector', 'Concept')),
    media_type TEXT NOT NULL CHECK (media_type IN ('Illustration', 'Animation', '3D Render', 'Photography')),
    is_animated BOOLEAN DEFAULT FALSE,
    aspect_ratio TEXT DEFAULT '1.4',
    tags TEXT[] DEFAULT '{}',
    likes_count INT DEFAULT 0,
    saves_count INT DEFAULT 0,
    artist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    search_vector tsvector,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search vector trigger function (fixes PostgreSQL 42P17 immutable generation error)
CREATE OR REPLACE FUNCTION public.artworks_search_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tsvectorupdate ON public.artworks;
CREATE TRIGGER tsvectorupdate
  BEFORE INSERT OR UPDATE ON public.artworks
  FOR EACH ROW EXECUTE FUNCTION public.artworks_search_trigger();

-- ----------------------------------------------------------------------------
-- 3. LIKES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.likes (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    artwork_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, artwork_id)
);

-- ----------------------------------------------------------------------------
-- 4. BOOKMARKS TABLE (Saves)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookmarks (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    artwork_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, artwork_id)
);

-- ----------------------------------------------------------------------------
-- 5. COMMENTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    artwork_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) > 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. FOLLOWS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT cant_follow_self CHECK (follower_id <> following_id)
);

-- ----------------------------------------------------------------------------
-- 7. NOTIFICATIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'save')),
    artwork_id UUID REFERENCES public.artworks(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. INDEXES FOR HIGH-PERFORMANCE SEARCH & FEED RETRIEVAL
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_artworks_search_vector ON public.artworks USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_artworks_category ON public.artworks(category);
CREATE INDEX IF NOT EXISTS idx_artworks_media_type ON public.artworks(media_type);
CREATE INDEX IF NOT EXISTS idx_artworks_likes_count ON public.artworks(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_artworks_created_at ON public.artworks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_artworks_artist_id ON public.artworks(artist_id);
CREATE INDEX IF NOT EXISTS idx_comments_artwork_id ON public.artworks(id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);
