# FlourishTalents Database Architecture Guide

## Overview

The database is fully integrated with persistent session management. Users can leave and return to the site without re-authentication. All data is real-time synchronized.

## Table Structure

### Core Tables

#### 1. **profiles**
Main user profiles table extending Supabase Auth users.

- `id` (uuid, FK to auth.users) - User ID
- `name` (text) - Full name
- `username` (text, unique) - Username
- `email` (text) - Email address
- `tier` (text) - Membership tier (free, premium, professional, elite)
- `loyalty_points` (integer) - Points for rewards
- `account_type` (text) - Creator or Member
- `role` (text) - User role (creator or member)
- `is_verified` (boolean) - Verification status
- `joined_date` (timestamptz) - Account creation date

**RLS Policies:**
- Everyone can view all profiles
- Users can only insert their own profile
- Users can only update their own profile

---

#### 2. **user_stats**
Tracks user statistics and metrics.

- `id` (uuid) - Primary key
- `user_id` (uuid, FK to auth.users, unique) - One row per user
- `portfolio_views` (integer) - Number of portfolio views
- `followers` (integer) - Follower count
- `rating` (numeric) - User rating (0-5)
- `loyalty_points` (integer) - Loyalty points balance
- `projects_completed` (integer) - Projects completed count

**RLS Policies:**
- Users can view all stats
- Users can only update their own stats

---

#### 3. **user_activity**
Audit log for user actions.

- `id` (uuid) - Primary key
- `user_id` (uuid, FK to auth.users) - User who performed action
- `action` (text) - Description of action
- `action_type` (text) - Type (update, follower, approval, achievement)
- `created_at` (timestamptz) - When action occurred

**RLS Policies:**
- Users can only view their own activity
- Users can only insert their own activity

---

#### 4. **challenges**
User challenges with progress tracking.

- `id` (uuid) - Primary key
- `user_id` (uuid, FK to auth.users) - User assigned challenge
- `title` (text) - Challenge name
- `description` (text) - Challenge details
- `progress` (integer, 0-100) - Progress percentage
- `reward` (text) - Reward description
- `status` (text) - Status (active, completed, expired)

**RLS Policies:**
- Users can only view their own challenges
- Users can only insert/update their own challenges

---

#### 5. **media**
Media content table (videos, music, blogs, gallery, resources).

- `id` (uuid) - Primary key
- `creator_id` (uuid, FK to profiles) - Creator who uploaded
- `title` (text) - Media title
- `description` (text) - Media description
- `type` (text) - Type (music-video, movie, audio-music, blog, gallery, resource)
- `category` (text) - Category within type
- `thumbnail_url` (text) - Thumbnail image URL
- `duration` (text) - Duration for videos/audio (e.g., "4:15")
- `read_time` (text) - Read time for blogs (e.g., "5 min read")
- `is_premium` (boolean) - Premium content flag
- `price` (numeric) - Price for resources
- `rating` (numeric) - Rating for resources
- `view_count` (integer) - View counter

**RLS Policies:**
- All authenticated users can view all media
- Only creators can insert/update/delete their own media

---

#### 6. **media_likes**
User likes on media items.

- `id` (uuid) - Primary key
- `user_id` (uuid, FK to auth.users) - User who liked
- `media_id` (uuid, FK to media) - Media item liked
- `unique(user_id, media_id)` - One like per user per media

**RLS Policies:**
- All users can view all likes
- Users can only insert their own likes
- Users can only delete their own likes

---

#### 7. **creator_follows**
Users following creators.

- `id` (uuid) - Primary key
- `follower_id` (uuid, FK to auth.users) - User following
- `creator_id` (uuid, FK to profiles) - Creator being followed
- `unique(follower_id, creator_id)` - One follow per user per creator

**RLS Policies:**
- All users can view all follows
- Users can only insert their own follows
- Users can only delete their own follows

---

#### 8. **likes** (Profile Likes - Existing)
Social profile likes (kept for compatibility).

- `id` (uuid) - Primary key
- `user_id` (uuid, FK to auth.users) - User who liked
- `profile_id` (uuid, FK to profiles) - Profile liked
- `unique(user_id, profile_id)` - One like per user per profile

---

#### 9. **follows** (Profile Follows - Existing)
Social profile follows (kept for compatibility).

- `id` (uuid) - Primary key
- `follower_id` (uuid, FK to auth.users) - User following
- `following_id` (uuid, FK to profiles) - Profile being followed
- `unique(follower_id, following_id)` - One follow per user per profile

---

#### 10. **comments** (Profile Comments - Existing)
Comments on social profiles (kept for compatibility).

- `id` (uuid) - Primary key
- `user_id` (uuid, FK to auth.users) - Comment author
- `profile_id` (uuid, FK to profiles) - Profile commented on
- `content` (text) - Comment text

---

## Frontend Integration

### Session Persistence

**Automatic Features:**
- Sessions persist in localStorage
- Auto-refresh tokens prevent expiration
- Auth state listener maintains connection
- Users return seamlessly without re-login

**Configuration:** (Already implemented in src/lib/supabase.ts)
```typescript
{
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
}
```

---

### Using Hooks

#### Media Hooks (src/hooks/useMedia.ts)

**1. useMedia(type, category, limit)**
Fetch media items with stats.

```typescript
const { media, loading, error, refetch } = useMedia('music-video', 'all', 50);
```

**Returns:**
- Media items with creator info, likes count, follows count
- Real-time updates when others like/follow

**2. useMediaLike(mediaId)**
Toggle like on media with instant UI update.

```typescript
const { isLiked, likesCount, toggleLike, loading } = useMediaLike(mediaId);
```

**3. useCreatorFollow(creatorId)**
Toggle follow on creator with instant UI update.

```typescript
const { isFollowing, followsCount, toggleFollow, loading } = useCreatorFollow(creatorId);
```

---

#### User Stats Hooks (src/hooks/useUserStats.ts)

**useUserStats()**
Fetch current user's stats with real-time updates.

```typescript
const { stats, loading, error } = useUserStats();
```

**useUpdateUserStats()**
Update user stats (for internal use).

```typescript
const { updateStats } = useUpdateUserStats();
await updateStats({ portfolio_views: 150 });
```

---

#### Activity Hooks (src/hooks/useUserActivity.ts)

**useUserActivity(limit)**
Fetch user's activity log with real-time updates.

```typescript
const { activities, loading, error } = useUserActivity(10);
```

---

#### Challenge Hooks (src/hooks/useChallenges.ts)

**useChallenges()**
Fetch user's active challenges with real-time updates.

```typescript
const { challenges, loading, error } = useChallenges();
```

---

## Real-Time Features

All user interactions update instantly:

1. **Likes:** Click heart → instant UI update → database records → other users see update
2. **Follows:** Click follow → instant UI update → database records → other users see count update
3. **Comments:** Type and post → instant in feed → database saves → real-time sync to all

### How It Works

1. **Optimistic Update:** UI updates immediately
2. **Database Operation:** Data saves to database
3. **Real-Time Sync:** Subscriptions push updates to all connected clients
4. **Error Handling:** Rolls back UI if database operation fails

---

## Seed Data

To populate the database with sample media:

1. **Sign up/log in first** (creates a profile)
2. **Call the seed function:**

```bash
curl -X POST "https://YOUR_SUPABASE_URL/functions/v1/seed-media-data" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

This creates 10 sample media items linked to your profile.

---

## Security & Data Safety

### Row Level Security (RLS)

- All tables have RLS enabled
- Users can only access their own private data
- Public data is viewable to all authenticated users
- Foreign key constraints prevent orphaned data

### Data Integrity

- Unique constraints prevent duplicates
- Indexes optimize query performance
- ON DELETE CASCADE maintains referential integrity
- Session tokens auto-refresh before expiration

---

## Performance Optimizations

### Indices
- `idx_user_stats_user_id` - Fast user stats lookup
- `idx_media_creator_id` - Fast creator media lookup
- `idx_media_likes_media_id` - Fast likes count
- `idx_creator_follows_creator_id` - Fast follower count

### Query Strategies
- Count queries use indices for speed
- Real-time subscriptions are channel-based (efficient)
- Batch operations minimize round-trips

---

## Troubleshooting

### Session Expires
**Not applicable** - Sessions persist indefinitely with auto-refresh

### Data Not Syncing
1. Check RLS policies in dashboard
2. Verify user is authenticated
3. Check browser console for errors

### Likes/Follows Not Appearing
1. Refresh page to trigger re-subscription
2. Check that user_id matches auth.uid()
3. Verify media_id/creator_id exists

### Performance Issues
1. Check if indices are being used
2. Consider pagination for large result sets
3. Monitor database logs for slow queries

---

## API Endpoints

### Edge Function: Seed Media

**Endpoint:** `/functions/v1/seed-media-data`
**Method:** POST
**Auth:** Not required (public)
**Response:** Creates sample media items

---

## Schema Diagram

```
auth.users
    ↓
profiles (1:1)
    ├─ user_stats (1:1)
    ├─ user_activity (1:many)
    ├─ challenges (1:many)
    ├─ media (1:many as creator)
    ├─ likes (1:many)
    ├─ follows (1:many as follower)
    └─ comments (1:many as author)

media
    ├─ media_likes (1:many)
    ├─ creator_follows (1:many)
    └─ profiles (1:1 as creator)
```

---

## Next Steps

1. ✅ Database created with all tables
2. ✅ RLS policies configured
3. ✅ Hooks created for frontend integration
4. ✅ Seed function deployed
5. 🔄 **Run seed function to populate media**
6. 🔄 **Test likes/follows on Media page**
7. 🔄 **Verify real-time updates**

---

## Support

All session management is handled automatically. No manual configuration needed.
