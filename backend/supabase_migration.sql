-- ============================================================
-- MAKIMA GALLERY — Complete Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ============================================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  handle TEXT UNIQUE NOT NULL DEFAULT '',
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  website TEXT DEFAULT '',
  twitter TEXT DEFAULT '',
  instagram TEXT DEFAULT '',
  followers_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  artworks_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-generate handle from email on insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, handle, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'preferred_username', split_part(NEW.email, '@', 1)), ' ', '_')) || '_' || SUBSTR(NEW.id::TEXT, 1, 4),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. ARTWORKS
-- ============================================================
CREATE TABLE public.artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT NOT NULL,
  thumbnail_url TEXT DEFAULT '',
  blur_data_url TEXT DEFAULT '',  -- tiny base64 blur placeholder
  category TEXT DEFAULT 'Digital Art',
  media TEXT DEFAULT 'Illustration',
  tags TEXT[] DEFAULT '{}',
  aspect_ratio NUMERIC(4,2) DEFAULT 1.0,
  width INT DEFAULT 0,
  height INT DEFAULT 0,
  is_animated BOOLEAN DEFAULT FALSE,
  likes_count INT DEFAULT 0,
  saves_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  views_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Full-text search vector
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(tags, ' '), '')), 'C')
  ) STORED
);

CREATE INDEX idx_artworks_search ON public.artworks USING GIN(search_vector);
CREATE INDEX idx_artworks_artist ON public.artworks(artist_id);
CREATE INDEX idx_artworks_category ON public.artworks(category);
CREATE INDEX idx_artworks_created ON public.artworks(created_at DESC);
CREATE INDEX idx_artworks_likes ON public.artworks(likes_count DESC);

-- ============================================================
-- 3. LIKES
-- ============================================================
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  artwork_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, artwork_id)
);

CREATE INDEX idx_likes_artwork ON public.likes(artwork_id);
CREATE INDEX idx_likes_user ON public.likes(user_id);

-- ============================================================
-- 4. SAVES / BOOKMARKS
-- ============================================================
CREATE TABLE public.saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  artwork_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, artwork_id)
);

-- We need to create collections first, so let's reorder:
-- Drop saves temporarily and recreate after collections
DROP TABLE IF EXISTS public.saves;

-- ============================================================
-- 5. COLLECTIONS / BOARDS
-- ============================================================
CREATE TABLE public.collections (
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

CREATE INDEX idx_collections_user ON public.collections(user_id);

-- Now recreate saves with collection FK
CREATE TABLE public.saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  artwork_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, artwork_id)
);

CREATE INDEX idx_saves_artwork ON public.saves(artwork_id);
CREATE INDEX idx_saves_user ON public.saves(user_id);
CREATE INDEX idx_saves_collection ON public.saves(collection_id);

-- ============================================================
-- 6. COMMENTS (with threaded replies)
-- ============================================================
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  artwork_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_comments_artwork ON public.comments(artwork_id);
CREATE INDEX idx_comments_user ON public.comments(user_id);
CREATE INDEX idx_comments_parent ON public.comments(parent_id);

-- ============================================================
-- 7. FOLLOWS
-- ============================================================
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

-- ============================================================
-- 8. NOTIFICATIONS
-- ============================================================
CREATE TABLE public.notifications (
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

CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_sender ON public.notifications(sender_id);

-- ============================================================
-- 9. DATABASE TRIGGERS — Auto-update counts
-- ============================================================

-- Like count trigger
CREATE OR REPLACE FUNCTION public.update_artwork_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.artworks SET likes_count = likes_count + 1 WHERE id = NEW.artwork_id;
    -- Create notification (don't notify yourself)
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

CREATE TRIGGER trigger_artwork_likes
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.update_artwork_likes_count();

-- Save count trigger
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

CREATE TRIGGER trigger_artwork_saves
  AFTER INSERT OR DELETE ON public.saves
  FOR EACH ROW EXECUTE FUNCTION public.update_artwork_saves_count();

-- Comment count trigger
CREATE OR REPLACE FUNCTION public.update_artwork_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.artworks SET comments_count = comments_count + 1 WHERE id = NEW.artwork_id;
    -- Create notification (don't notify yourself)
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

CREATE TRIGGER trigger_artwork_comments
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_artwork_comments_count();

-- Follow count trigger
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    -- Create notification
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

CREATE TRIGGER trigger_follow_counts
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.update_follow_counts();

-- Artwork count per profile trigger
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

CREATE TRIGGER trigger_profile_artworks
  AFTER INSERT OR DELETE ON public.artworks
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_artworks_count();

-- Updated_at auto-timestamp trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_artworks_updated_at BEFORE UPDATE ON public.artworks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_collections_updated_at BEFORE UPDATE ON public.collections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- PROFILES: anyone can read, only owner can update
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ARTWORKS: anyone can read, auth users can insert, only artist can update/delete
CREATE POLICY "Artworks are viewable by everyone"
  ON public.artworks FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create artworks"
  ON public.artworks FOR INSERT WITH CHECK (auth.uid() = artist_id);

CREATE POLICY "Artists can update own artworks"
  ON public.artworks FOR UPDATE USING (auth.uid() = artist_id);

CREATE POLICY "Artists can delete own artworks"
  ON public.artworks FOR DELETE USING (auth.uid() = artist_id);

-- LIKES: anyone can read, auth users can insert/delete own
CREATE POLICY "Likes are viewable by everyone"
  ON public.likes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like"
  ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike own likes"
  ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- SAVES: owner can read own, auth users can insert/delete own
CREATE POLICY "Users can view own saves"
  ON public.saves FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can save"
  ON public.saves FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave own saves"
  ON public.saves FOR DELETE USING (auth.uid() = user_id);

-- COMMENTS: anyone can read, auth users can insert, only author can update/delete
CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment"
  ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- FOLLOWS: anyone can read, auth users can insert/delete own
CREATE POLICY "Follows are viewable by everyone"
  ON public.follows FOR SELECT USING (true);

CREATE POLICY "Authenticated users can follow"
  ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- NOTIFICATIONS: only recipient can read, system creates them
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Users can mark own notifications read"
  ON public.notifications FOR UPDATE USING (auth.uid() = recipient_id);

-- COLLECTIONS: owner can CRUD, public collections viewable by all
CREATE POLICY "Public collections viewable by everyone"
  ON public.collections FOR SELECT USING (is_private = false OR auth.uid() = user_id);

CREATE POLICY "Authenticated users can create collections"
  ON public.collections FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
  ON public.collections FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON public.collections FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 11. ENABLE REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.artworks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;

-- ============================================================
-- 12. STORAGE BUCKETS (run separately in Storage settings or via API)
-- ============================================================
-- NOTE: Buckets must be created via Supabase Dashboard → Storage → New Bucket
-- Bucket 1: "artworks" (Public, 10MB max, image/jpeg, image/png, image/webp, image/gif)
-- Bucket 2: "avatars"  (Public, 2MB max, image/jpeg, image/png, image/webp)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('artworks', 'artworks', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: anyone can read, auth users can upload to their own folder
CREATE POLICY "Public artwork images" ON storage.objects
  FOR SELECT USING (bucket_id = 'artworks');

CREATE POLICY "Auth users can upload artworks" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'artworks' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own artwork images" ON storage.objects
  FOR DELETE USING (bucket_id = 'artworks' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public avatar images" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Auth users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- DONE! Your Makima Gallery database is ready.
-- ============================================================
