# Quick Start Guide

## Database Ready ✅

Your complete database schema is deployed and ready to use.

## What Works Now

### ✅ Session Persistence
- Users stay logged in across tab switches
- Sessions persist indefinitely
- No manual re-authentication needed
- Token auto-refresh prevents expiration

### ✅ User Profiles
- Sign-up/sign-in creates profile entry
- User data stored securely
- Profile updates save to database

### ✅ User Statistics
- Portfolio views tracked
- Followers counted
- Ratings maintained
- Loyalty points recorded

### ✅ Activity Logging
- User actions tracked
- Real-time activity feed
- Challenge progress monitored

### ✅ Media Content Management
- 10 sample media items available
- Support for 5 content types:
  - Music Videos
  - Movies/Films
  - Audio/Music
  - Blog Posts
  - Gallery/Photography
  - Resources/Downloads

### ✅ Real-Time Interactions
- **Likes:** Click heart → instant update → database sync → real-time broadcast
- **Follows:** Click follow → instant update → database sync → real-time broadcast
- **Counts:** Updates visible immediately to all connected users

## 5-Minute Setup

### Step 1: Seed Sample Data
```bash
# After signing up/logging in, call:
curl -X POST "https://YOUR_SUPABASE_URL/functions/v1/seed-media-data" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

Or add this to your app after login:
```typescript
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seed-media-data`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
    }
  }
);
```

### Step 2: Test Real-Time Features
1. Visit Media page
2. Click heart to like media
3. See count update instantly
4. Open in another tab
5. Like count updates in real-time

### Step 3: Test Session Persistence
1. Like some media
2. Close all tabs
3. Reopen the site
4. You're still logged in
5. Your likes are still there

## Using Hooks

### Fetch Media Items
```typescript
import { useMedia } from '../hooks/useMedia';

function MyComponent() {
  const { media, loading, error } = useMedia('music-video', 'all', 50);

  return (
    <div>
      {media.map(item => (
        <div key={item.id}>
          <h3>{item.title}</h3>
          <p>Likes: {item.likes_count}</p>
        </div>
      ))}
    </div>
  );
}
```

### Like a Media Item
```typescript
import { useMediaLike } from '../hooks/useMedia';

function LikeButton({ mediaId }) {
  const { isLiked, likesCount, toggleLike, loading } = useMediaLike(mediaId);

  return (
    <button onClick={toggleLike} disabled={loading}>
      {isLiked ? '❤️' : '🤍'} {likesCount}
    </button>
  );
}
```

### Follow a Creator
```typescript
import { useCreatorFollow } from '../hooks/useMedia';

function FollowButton({ creatorId }) {
  const { isFollowing, followsCount, toggleFollow } = useCreatorFollow(creatorId);

  return (
    <button onClick={toggleFollow}>
      {isFollowing ? 'Following' : 'Follow'} ({followsCount})
    </button>
  );
}
```

### Get User Stats
```typescript
import { useUserStats } from '../hooks/useUserStats';

function StatsDisplay() {
  const { stats, loading } = useUserStats();

  return (
    <div>
      <p>Views: {stats?.portfolio_views}</p>
      <p>Followers: {stats?.followers}</p>
      <p>Rating: {stats?.rating}</p>
    </div>
  );
}
```

### Get User Activity
```typescript
import { useUserActivity } from '../hooks/useUserActivity';

function ActivityFeed() {
  const { activities } = useUserActivity(10);

  return (
    <div>
      {activities.map(activity => (
        <p key={activity.id}>{activity.action}</p>
      ))}
    </div>
  );
}
```

## Database Tables at a Glance

| Table | Purpose | Access |
|-------|---------|--------|
| `profiles` | User profiles | Public view, own edit |
| `user_stats` | User metrics | Own view/edit |
| `user_activity` | Action log | Own view |
| `challenges` | User challenges | Own view/edit |
| `media` | Content items | Public view, creator edit |
| `media_likes` | Media likes | Public view, own edit |
| `creator_follows` | Follow relationships | Public view, own edit |
| `likes` | Profile likes | Public view, own edit |
| `follows` | Profile follows | Public view, own edit |
| `comments` | Profile comments | Public view, own edit |

## Real-Time Updates Flow

```
User Action (Like/Follow)
    ↓
Optimistic UI Update (Instant)
    ↓
Database Insert (Async)
    ↓
Broadcast to All Clients (Real-time)
    ↓
Other Users See Update
```

## Debugging

### Check if Logged In
```typescript
const { data: { session } } = await supabase.auth.getSession();
console.log(session?.user?.id);
```

### Check User Profile
```typescript
const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
console.log(data);
```

### Verify Media Exists
```typescript
const { data } = await supabase.from('media').select('*').limit(5);
console.log(data);
```

### Check Your Likes
```typescript
const { data } = await supabase.from('media_likes').select('*').eq('user_id', userId);
console.log(data);
```

## Troubleshooting

### Likes/Follows Not Appearing
1. Check browser console for errors
2. Verify you're authenticated
3. Refresh the page
4. Check RLS policies in Supabase dashboard

### Session Not Persisting
- This shouldn't happen - automatic
- Clear browser cache and retry
- Check localStorage is enabled
- Verify VITE_SUPABASE_URL is correct

### Media Not Loading
1. Run seed function first
2. Check media table isn't empty
3. Verify profiles table has your user
4. Check RLS policies allow viewing

### Real-Time Not Working
1. Check browser console for connection errors
2. Verify Realtime is enabled in Supabase
3. Refresh page to reconnect
4. Try in incognito/private mode

## Environment Variables

Already configured in `.env`:
```
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

No additional configuration needed.

## Performance Tips

1. **Use Pagination:** Add limit to useMedia()
2. **Unsubscribe:** Hooks clean up on unmount
3. **Batch Updates:** Combine related operations
4. **Caching:** Consider memoizing results
5. **Monitor:** Check Network tab for frequency

## Security

All RLS policies are production-ready:
- ✅ Users can't view others' private data
- ✅ Users can't modify others' data
- ✅ Public data is viewable
- ✅ All operations are logged
- ✅ Foreign keys prevent orphaned data

## Next Steps

1. **Verify Setup:**
   - Sign up new account
   - Check profile in database

2. **Load Sample Data:**
   - Call seed function
   - Verify media appears

3. **Test Interactions:**
   - Like media items
   - Follow creators
   - Check real-time updates

4. **Monitor Performance:**
   - Open DevTools Network tab
   - Watch for real-time events
   - Check database query logs

## Support Files

- **DATABASE_GUIDE.md** - Complete schema documentation
- **IMPLEMENTATION_SUMMARY.md** - Full architecture overview
- **QUICK_START.md** - This file

## Key Takeaways

✅ **Sessions persist automatically** - No sign-in needed after first login
✅ **Real-time updates work instantly** - See likes/follows as they happen
✅ **Database is secure** - RLS prevents unauthorized access
✅ **Original features preserved** - Social profiles still work
✅ **Production ready** - Can deploy to production now

Have fun building! 🚀
