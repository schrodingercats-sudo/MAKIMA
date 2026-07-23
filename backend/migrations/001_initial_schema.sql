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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- PostgreSQL tsvector generated column for full-text search across titles, descriptions, and tags
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || array_to_string(tags, ' '))
    ) STORED
);

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
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('like', 'comment', 'follow')),
    artwork_id UUID REFERENCES public.artworks(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. COLLECTIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 9. COLLECTION_ARTWORKS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.collection_artworks (
    collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    artwork_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (collection_id, artwork_id)
);

-- ----------------------------------------------------------------------------
-- 10. FCM TOKENS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fcm_tokens (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, token)
);

-- ----------------------------------------------------------------------------
-- INDEXES & FULL-TEXT SEARCH GIN INDEX
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_artworks_artist_id ON public.artworks(artist_id);
CREATE INDEX IF NOT EXISTS idx_artworks_category ON public.artworks(category);
CREATE INDEX IF NOT EXISTS idx_artworks_created_at ON public.artworks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_artworks_likes_count ON public.artworks(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_artworks_search_vector ON public.artworks USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_comments_artwork_id ON public.comments(artwork_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

-- ----------------------------------------------------------------------------
-- FUNCTIONS & TRIGGERS
-- ----------------------------------------------------------------------------

-- Function 1: Automatic User Profile Creation on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, handle, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'handle', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '/images/coming-soon.jpg')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function 2: Update Artwork Likes Count Trigger Function
CREATE OR REPLACE FUNCTION public.update_artwork_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.artworks SET likes_count = likes_count + 1 WHERE id = NEW.artwork_id;
        UPDATE public.profiles SET likes_count = likes_count + 1 WHERE id = NEW.user_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.artworks SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.artwork_id;
        UPDATE public.profiles SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.user_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_like_count_update ON public.likes;
CREATE TRIGGER trigger_like_count_update
    AFTER INSERT OR DELETE ON public.likes
    FOR EACH ROW EXECUTE FUNCTION public.update_artwork_likes_count();

-- Function 3: Update Artwork Saves Count Trigger Function
CREATE OR REPLACE FUNCTION public.update_artwork_saves_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.artworks SET saves_count = saves_count + 1 WHERE id = NEW.artwork_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.artworks SET saves_count = GREATEST(0, saves_count - 1) WHERE id = OLD.artwork_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_save_count_update ON public.bookmarks;
CREATE TRIGGER trigger_save_count_update
    AFTER INSERT OR DELETE ON public.bookmarks
    FOR EACH ROW EXECUTE FUNCTION public.update_artwork_saves_count();

-- Function 4: Create Notification on Activity Trigger Function
CREATE OR REPLACE FUNCTION public.create_notification_on_activity()
RETURNS TRIGGER AS $$
DECLARE
    target_user UUID;
BEGIN
    IF (TG_TABLE_NAME = 'likes') THEN
        SELECT artist_id INTO target_user FROM public.artworks WHERE id = NEW.artwork_id;
        IF (target_user IS NOT NULL AND target_user <> NEW.user_id) THEN
            INSERT INTO public.notifications (recipient_id, source_id, type, artwork_id)
            VALUES (target_user, NEW.user_id, 'like', NEW.artwork_id);
        END IF;
    ELSIF (TG_TABLE_NAME = 'comments') THEN
        SELECT artist_id INTO target_user FROM public.artworks WHERE id = NEW.artwork_id;
        IF (target_user IS NOT NULL AND target_user <> NEW.user_id) THEN
            INSERT INTO public.notifications (recipient_id, source_id, type, artwork_id)
            VALUES (target_user, NEW.user_id, 'comment', NEW.artwork_id);
        END IF;
    ELSIF (TG_TABLE_NAME = 'follows') THEN
        IF (NEW.following_id <> NEW.follower_id) THEN
            INSERT INTO public.notifications (recipient_id, source_id, type)
            VALUES (NEW.following_id, NEW.follower_id, 'follow');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_on_like ON public.likes;
CREATE TRIGGER trigger_notify_on_like
    AFTER INSERT ON public.likes
    FOR EACH ROW EXECUTE FUNCTION public.create_notification_on_activity();

DROP TRIGGER IF EXISTS trigger_notify_on_comment ON public.comments;
CREATE TRIGGER trigger_notify_on_comment
    AFTER INSERT ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.create_notification_on_activity();

DROP TRIGGER IF EXISTS trigger_notify_on_follow ON public.follows;
CREATE TRIGGER trigger_notify_on_follow
    AFTER INSERT ON public.follows
    FOR EACH ROW EXECUTE FUNCTION public.create_notification_on_activity();

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES ON ALL TABLES
-- ----------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. ARTWORKS POLICIES
DROP POLICY IF EXISTS "Public artworks are viewable by everyone" ON public.artworks;
CREATE POLICY "Public artworks are viewable by everyone" ON public.artworks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own artworks" ON public.artworks;
CREATE POLICY "Users can insert own artworks" ON public.artworks FOR INSERT WITH CHECK (auth.uid() = artist_id);

DROP POLICY IF EXISTS "Users can update own artworks" ON public.artworks;
CREATE POLICY "Users can update own artworks" ON public.artworks FOR UPDATE USING (auth.uid() = artist_id);

DROP POLICY IF EXISTS "Users can delete own artworks" ON public.artworks;
CREATE POLICY "Users can delete own artworks" ON public.artworks FOR DELETE USING (auth.uid() = artist_id);

-- 3. LIKES POLICIES
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;
CREATE POLICY "Likes are viewable by everyone" ON public.likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own likes" ON public.likes;
CREATE POLICY "Users can insert own likes" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own likes" ON public.likes;
CREATE POLICY "Users can delete own likes" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- 4. BOOKMARKS POLICIES
DROP POLICY IF EXISTS "Bookmarks viewable by owner" ON public.bookmarks;
CREATE POLICY "Bookmarks viewable by owner" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can insert own bookmarks" ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can delete own bookmarks" ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

-- 5. COMMENTS POLICIES
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own comments" ON public.comments;
CREATE POLICY "Users can insert own comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- 6. FOLLOWS POLICIES
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
CREATE POLICY "Follows are viewable by everyone" ON public.follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own follows" ON public.follows;
CREATE POLICY "Users can insert own follows" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can delete own follows" ON public.follows;
CREATE POLICY "Users can delete own follows" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- 7. NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "Notifications viewable by recipient" ON public.notifications;
CREATE POLICY "Notifications viewable by recipient" ON public.notifications FOR SELECT USING (auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Recipient can update notification status" ON public.notifications;
CREATE POLICY "Recipient can update notification status" ON public.notifications FOR UPDATE USING (auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = recipient_id);

-- 8. COLLECTIONS POLICIES
DROP POLICY IF EXISTS "Public collections viewable by everyone" ON public.collections;
CREATE POLICY "Public collections viewable by everyone" ON public.collections FOR SELECT USING (is_private = false OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own collections" ON public.collections;
CREATE POLICY "Users can insert own collections" ON public.collections FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own collections" ON public.collections;
CREATE POLICY "Users can update own collections" ON public.collections FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own collections" ON public.collections;
CREATE POLICY "Users can delete own collections" ON public.collections FOR DELETE USING (auth.uid() = user_id);

-- 9. COLLECTION_ARTWORKS POLICIES
DROP POLICY IF EXISTS "Collection artworks viewable if collection viewable" ON public.collection_artworks;
CREATE POLICY "Collection artworks viewable if collection viewable" ON public.collection_artworks FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND (c.is_private = false OR c.user_id = auth.uid()))
);

DROP POLICY IF EXISTS "Collection owner can manage collection artworks" ON public.collection_artworks;
CREATE POLICY "Collection owner can manage collection artworks" ON public.collection_artworks FOR ALL USING (
    EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid())
);

-- 10. FCM TOKENS POLICIES
DROP POLICY IF EXISTS "FCM tokens viewable by owner" ON public.fcm_tokens;
CREATE POLICY "FCM tokens viewable by owner" ON public.fcm_tokens FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own fcm tokens" ON public.fcm_tokens;
CREATE POLICY "Users can insert own fcm tokens" ON public.fcm_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own fcm tokens" ON public.fcm_tokens;
CREATE POLICY "Users can update own fcm tokens" ON public.fcm_tokens FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own fcm tokens" ON public.fcm_tokens;
CREATE POLICY "Users can delete own fcm tokens" ON public.fcm_tokens FOR DELETE USING (auth.uid() = user_id);
