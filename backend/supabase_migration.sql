-- ============================================================
-- MAKIMA GALLERY — Complete Pure SQL Supabase Database Schema
-- Paste directly into: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  handle TEXT UNIQUE NOT NULL DEFAULT '',
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '/images/coming-soon.jpg',
  website TEXT DEFAULT '',
  location TEXT DEFAULT '',
  social_links JSONB DEFAULT '{"twitter": "", "instagram": ""}'::jsonb,
  followers_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  artworks_count INT DEFAULT 0,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-generate profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, handle, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'preferred_username', split_part(NEW.email, '@', 1)), ' ', '_')) || '_' || SUBSTR(NEW.id::TEXT, 1, 4),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '/images/coming-soon.jpg')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. ARTWORKS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT NOT NULL,
  thumbnail_url TEXT DEFAULT '',
  blur_data_url TEXT DEFAULT '',
  category TEXT DEFAULT 'Digital Art',
  media TEXT DEFAULT 'Illustration',
  media_type TEXT DEFAULT 'Illustration',
  tags TEXT[] DEFAULT '{}',
  aspect_ratio NUMERIC(4,2) DEFAULT 1.40,
  width INT DEFAULT 0,
  height INT DEFAULT 0,
  is_animated BOOLEAN DEFAULT FALSE,
  likes_count INT DEFAULT 0,
  saves_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  views_count INT DEFAULT 0,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Search vector trigger function
CREATE OR REPLACE FUNCTION public.artworks_search_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_artworks_search ON public.artworks;
CREATE TRIGGER trigger_artworks_search
  BEFORE INSERT OR UPDATE ON public.artworks
  FOR EACH ROW EXECUTE FUNCTION public.artworks_search_update();

CREATE INDEX IF NOT EXISTS idx_artworks_search ON public.artworks USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_artworks_artist ON public.artworks(artist_id);
CREATE INDEX IF NOT EXISTS idx_artworks_category ON public.artworks(category);
CREATE INDEX IF NOT EXISTS idx_artworks_created ON public.artworks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_artworks_likes ON public.artworks(likes_count DESC);

-- ============================================================
-- 3. COLLECTIONS / BOARDS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Board',
  description TEXT DEFAULT '',
  cover_image_url TEXT DEFAULT '',
  is_private BOOLEAN DEFAULT FALSE,
  artwork_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collections_user ON public.collections(user_id);

-- ============================================================
-- 4. LIKES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  artwork_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, artwork_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_artwork ON public.likes(artwork_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON public.likes(user_id);

-- ============================================================
-- 5. SAVES / BOOKMARKS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  artwork_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, artwork_id)
);

CREATE INDEX IF NOT EXISTS idx_saves_artwork ON public.saves(artwork_id);
CREATE INDEX IF NOT EXISTS idx_saves_user ON public.saves(user_id);
CREATE INDEX IF NOT EXISTS idx_saves_collection ON public.saves(collection_id);

-- ============================================================
-- 6. COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  artwork_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  content TEXT,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_artwork ON public.comments(artwork_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.comments(user_id);

-- ============================================================
-- 7. FOLLOWS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

-- ============================================================
-- 8. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'save', 'mention')),
  artwork_id UUID REFERENCES public.artworks(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  message TEXT DEFAULT '',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, is_read, created_at DESC);

-- ============================================================
-- 9. TRIGGERS — Auto-update Counts & Notifications
-- ============================================================

-- Likes count trigger
CREATE OR REPLACE FUNCTION public.update_artwork_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.artworks SET likes_count = likes_count + 1 WHERE id = NEW.artwork_id;
    INSERT INTO public.notifications (recipient_id, sender_id, type, artwork_id)
    SELECT a.artist_id, NEW.user_id, 'like', NEW.artwork_id
    FROM public.artworks a
    WHERE a.id = NEW.artwork_id AND a.artist_id != NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.artworks SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.artwork_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_artwork_likes ON public.likes;
CREATE TRIGGER trigger_artwork_likes
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.update_artwork_likes_count();

-- Saves count trigger
CREATE OR REPLACE FUNCTION public.update_artwork_saves_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.artworks SET saves_count = saves_count + 1 WHERE id = NEW.artwork_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.artworks SET saves_count = GREATEST(saves_count - 1, 0) WHERE id = OLD.artwork_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_artwork_saves ON public.saves;
CREATE TRIGGER trigger_artwork_saves
  AFTER INSERT OR DELETE ON public.saves
  FOR EACH ROW EXECUTE FUNCTION public.update_artwork_saves_count();

-- Comments count trigger
CREATE OR REPLACE FUNCTION public.update_artwork_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.artworks SET comments_count = comments_count + 1 WHERE id = NEW.artwork_id;
    INSERT INTO public.notifications (recipient_id, sender_id, type, artwork_id, comment_id)
    SELECT a.artist_id, NEW.user_id, 'comment', NEW.artwork_id, NEW.id
    FROM public.artworks a
    WHERE a.id = NEW.artwork_id AND a.artist_id != NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.artworks SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.artwork_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_artwork_comments ON public.comments;
CREATE TRIGGER trigger_artwork_comments
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_artwork_comments_count();

-- Follow counts trigger
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    INSERT INTO public.notifications (recipient_id, sender_id, type)
    VALUES (NEW.following_id, NEW.follower_id, 'follow');
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
    UPDATE public.profiles SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.following_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_follow_counts ON public.follows;
CREATE TRIGGER trigger_follow_counts
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.update_follow_counts();

-- Artworks count per profile trigger
CREATE OR REPLACE FUNCTION public.update_profile_artworks_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET artworks_count = artworks_count + 1 WHERE id = NEW.artist_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET artworks_count = GREATEST(artworks_count - 1, 0) WHERE id = OLD.artist_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_profile_artworks ON public.artworks;
CREATE TRIGGER trigger_profile_artworks
  AFTER INSERT OR DELETE ON public.artworks
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_artworks_count();

-- ============================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Clean existing policies cleanly
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Artworks are viewable by everyone" ON public.artworks;
DROP POLICY IF EXISTS "Authenticated users can create artworks" ON public.artworks;
DROP POLICY IF EXISTS "Artists can update own artworks" ON public.artworks;
DROP POLICY IF EXISTS "Artists can delete own artworks" ON public.artworks;
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;
DROP POLICY IF EXISTS "Authenticated users can like" ON public.likes;
DROP POLICY IF EXISTS "Users can unlike own likes" ON public.likes;
DROP POLICY IF EXISTS "Users can view own saves" ON public.saves;
DROP POLICY IF EXISTS "Authenticated users can save" ON public.saves;
DROP POLICY IF EXISTS "Users can unsave own saves" ON public.saves;
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can comment" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
DROP POLICY IF EXISTS "Authenticated users can follow" ON public.follows;
DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can mark own notifications read" ON public.notifications;
DROP POLICY IF EXISTS "Public collections viewable by everyone" ON public.collections;
DROP POLICY IF EXISTS "Authenticated users can create collections" ON public.collections;
DROP POLICY IF EXISTS "Users can update own collections" ON public.collections;
DROP POLICY IF EXISTS "Users can delete own collections" ON public.collections;

-- PROFILES POLICIES
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ARTWORKS POLICIES
CREATE POLICY "Artworks are viewable by everyone"
  ON public.artworks FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create artworks"
  ON public.artworks FOR INSERT WITH CHECK (auth.uid() = artist_id);

CREATE POLICY "Artists can update own artworks"
  ON public.artworks FOR UPDATE USING (auth.uid() = artist_id);

CREATE POLICY "Artists can delete own artworks"
  ON public.artworks FOR DELETE USING (auth.uid() = artist_id);

-- LIKES POLICIES
CREATE POLICY "Likes are viewable by everyone"
  ON public.likes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like"
  ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike own likes"
  ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- SAVES POLICIES
CREATE POLICY "Users can view own saves"
  ON public.saves FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can save"
  ON public.saves FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave own saves"
  ON public.saves FOR DELETE USING (auth.uid() = user_id);

-- COMMENTS POLICIES
CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment"
  ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- FOLLOWS POLICIES
CREATE POLICY "Follows are viewable by everyone"
  ON public.follows FOR SELECT USING (true);

CREATE POLICY "Authenticated users can follow"
  ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Users can mark own notifications read"
  ON public.notifications FOR UPDATE USING (auth.uid() = recipient_id);

-- COLLECTIONS POLICIES
CREATE POLICY "Public collections viewable by everyone"
  ON public.collections FOR SELECT USING (is_private = false OR auth.uid() = user_id);

CREATE POLICY "Authenticated users can create collections"
  ON public.collections FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
  ON public.collections FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON public.collections FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 11. STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('artworks', 'artworks', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public artwork images" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can upload artworks" ON storage.objects;
DROP POLICY IF EXISTS "Public avatar images" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can upload avatars" ON storage.objects;

CREATE POLICY "Public artwork images" ON storage.objects
  FOR SELECT USING (bucket_id = 'artworks');

CREATE POLICY "Auth users can upload artworks" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'artworks' AND auth.role() = 'authenticated');

CREATE POLICY "Public avatar images" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Auth users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
