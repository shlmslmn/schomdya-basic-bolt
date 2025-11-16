/*
  # Complete FlourishTalents App Schema

  1. Extended Profiles Table
    - `id` (uuid, primary key, references auth.users)
    - `name` (text)
    - `username` (text, unique)
    - `email` (text)
    - `avatar_url` (text)
    - `bio` (text)
    - `tier` (text: 'free', 'premium', 'professional', 'elite')
    - `loyalty_points` (integer)
    - `account_type` (text: 'creator', 'member')
    - `role` (text: 'creator', 'member')
    - `is_verified` (boolean)
    - `profile_image` (text)
    - `joined_date` (timestamptz)
    - `created_at` (timestamptz)

  2. User Stats Table
    - Tracks portfolio views, followers, rating, etc.
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users)
    - `portfolio_views` (integer)
    - `followers` (integer)
    - `rating` (numeric)
    - `loyalty_points` (integer)
    - `projects_completed` (integer)
    - `updated_at` (timestamptz)

  3. User Activity Table
    - Tracks user actions (portfolio updates, followers, approvals)
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users)
    - `action` (text)
    - `action_type` (text: 'update', 'follower', 'approval', 'achievement')
    - `created_at` (timestamptz)

  4. Challenges Table
    - User challenges with progress tracking
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users)
    - `title` (text)
    - `description` (text)
    - `progress` (integer, 0-100)
    - `reward` (text)
    - `status` (text: 'active', 'completed', 'expired')
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  5. Media Table
    - Media content (videos, music, blog posts, gallery, resources)
    - `id` (uuid, primary key)
    - `creator_id` (uuid, references profiles)
    - `title` (text)
    - `description` (text)
    - `type` (text: 'music-video', 'movie', 'audio-music', 'blog', 'gallery', 'resource')
    - `category` (text)
    - `thumbnail_url` (text)
    - `duration` (text) - For videos/audio
    - `read_time` (text) - For blog posts
    - `is_premium` (boolean)
    - `price` (numeric) - For resources
    - `rating` (numeric) - For resources
    - `view_count` (integer)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  6. Media Likes Table
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users)
    - `media_id` (uuid, references media)
    - `created_at` (timestamptz)
    - Unique constraint on (user_id, media_id)

  7. Creator Follows Table (extending existing)
    - Already exists for profile follows
    - Reusing for media creators

  Security:
    - RLS enabled on all tables
    - Users can only see appropriate data
    - Users can only modify their own data
    - Public data viewable to authenticated users
*/

-- Extended Profiles Table
ALTER TABLE IF EXISTS profiles DROP CONSTRAINT IF EXISTS profiles_pkey CASCADE;

DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  username text UNIQUE NOT NULL,
  email text NOT NULL,
  avatar_url text DEFAULT '',
  bio text DEFAULT '',
  tier text DEFAULT 'free' CHECK (tier IN ('free', 'premium', 'professional', 'elite')),
  loyalty_points integer DEFAULT 0,
  account_type text DEFAULT 'member' CHECK (account_type IN ('creator', 'member')),
  role text DEFAULT 'member' CHECK (role IN ('creator', 'member')),
  is_verified boolean DEFAULT false,
  profile_image text,
  joined_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- User Stats Table
CREATE TABLE IF NOT EXISTS user_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  portfolio_views integer DEFAULT 0,
  followers integer DEFAULT 0,
  rating numeric DEFAULT 0.0,
  loyalty_points integer DEFAULT 0,
  projects_completed integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats"
  ON user_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view other stats"
  ON user_stats FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own stats"
  ON user_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User Activity Table
CREATE TABLE IF NOT EXISTS user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  action text NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('update', 'follower', 'approval', 'achievement')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity"
  ON user_activity FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity"
  ON user_activity FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Challenges Table
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  reward text NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own challenges"
  ON challenges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenges"
  ON challenges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenges"
  ON challenges FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Media Table
CREATE TABLE IF NOT EXISTS media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('music-video', 'movie', 'audio-music', 'blog', 'gallery', 'resource')),
  category text NOT NULL,
  thumbnail_url text,
  duration text,
  read_time text,
  is_premium boolean DEFAULT false,
  price numeric DEFAULT 0.0,
  rating numeric DEFAULT 0.0,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public media is viewable by authenticated users"
  ON media FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert media as creators"
  ON media FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own media"
  ON media FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own media"
  ON media FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- Media Likes Table
CREATE TABLE IF NOT EXISTS media_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES media ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, media_id)
);

ALTER TABLE media_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Media likes are viewable by everyone"
  ON media_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own media likes"
  ON media_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own media likes"
  ON media_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Creator Follows Table (extended from existing)
CREATE TABLE IF NOT EXISTS creator_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, creator_id)
);

ALTER TABLE creator_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creator follows are viewable by everyone"
  ON creator_follows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own follows"
  ON creator_follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete own follows"
  ON creator_follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_user_id ON challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_media_creator_id ON media(creator_id);
CREATE INDEX IF NOT EXISTS idx_media_likes_media_id ON media_likes(media_id);
CREATE INDEX IF NOT EXISTS idx_media_likes_user_id ON media_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_follows_creator_id ON creator_follows(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_follows_follower_id ON creator_follows(follower_id);
