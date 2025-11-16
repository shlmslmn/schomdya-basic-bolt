# Media Page Database Connection Guide

## Current State

The `src/pages/Media.tsx` currently uses static mock data. Here's how to connect it to the database.

## What Needs to Change

### 1. Import New Hooks

**Add to top of Media.tsx:**
```typescript
import { useMedia, useMediaLike, useCreatorFollow } from '../hooks/useMedia';
```

### 2. Fetch Media by Type

**Replace static mediaContent with:**
```typescript
export default function Media() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stream');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // NEW: Fetch media based on active tab
  const mediaTypeMap = {
    stream: 'music-video|movie',
    listen: 'audio-music',
    blog: 'blog',
    gallery: 'gallery',
    resources: 'resource'
  };

  // For simplicity, fetch from multiple types or separate calls
  const { media: mediaItems, loading, error } = useMedia(
    undefined, // Don't filter by type, get all
    selectedCategory !== 'all' ? selectedCategory : undefined,
    50
  );

  // Filter by active tab type
  const filteredMedia = mediaItems.filter(item => {
    const types = mediaTypeMap[activeTab as keyof typeof mediaTypeMap];
    return types?.split('|').includes(item.type);
  });

  // ... rest of component
}
```

### 3. Create Media Item Component

**Add new component for reusability:**
```typescript
function MediaCard({ item, activeTab }) {
  const { user } = useAuth();
  const { isLiked, likesCount, toggleLike } = useMediaLike(item.id);
  const { isFollowing, followsCount, toggleFollow } = useCreatorFollow(item.creator_id);

  const handleFollow = () => {
    if (!user) {
      navigate('/signin');
      return;
    }
    toggleFollow();
  };

  const handleLike = () => {
    if (!user) {
      navigate('/signin');
      return;
    }
    toggleLike();
  };

  return (
    <div className="glass-effect rounded-2xl overflow-hidden hover-lift group">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-800">
        <img
          src={item.thumbnail_url}
          alt={item.title}
          className="w-full h-full object-cover"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {activeTab === 'stream' && <Play className="w-12 h-12 text-white" />}
          {activeTab === 'listen' && <Headphones className="w-12 h-12 text-white" />}
          {/* ... other icons */}
        </div>

        {/* Premium Badge */}
        {item.is_premium && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold rounded-full">
            PREMIUM
          </div>
        )}

        {/* Duration/Read Time */}
        {item.duration && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
            {item.duration}
          </div>
        )}
        {item.read_time && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
            {item.read_time}
          </div>
        )}
      </div>

      {/* Content Info */}
      <div className="p-4">
        <h3 className="text-white font-semibold mb-2 line-clamp-2">{item.title}</h3>
        <p className="text-gray-400 text-sm mb-3">{item.creator?.name || 'Unknown Creator'}</p>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
          {activeTab === 'stream' && (
            <>
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>{formatNumber(item.view_count)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Heart className="w-4 h-4" />
                <span>{formatNumber(likesCount)}</span>
              </div>
            </>
          )}
          {activeTab === 'listen' && (
            <div className="flex items-center space-x-1">
              <Play className="w-4 h-4" />
              <span>{formatNumber(item.view_count)} plays</span>
            </div>
          )}
          {activeTab === 'gallery' && (
            <div className="flex items-center space-x-1">
              <Heart className="w-4 h-4" />
              <span>{formatNumber(likesCount)}</span>
            </div>
          )}
          {activeTab === 'resources' && (
            <>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>{item.rating?.toFixed(1) || '0.0'}</span>
              </div>
              <div className="text-rose-400 font-bold">
                UGX {formatNumber(item.price || 0)}
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {activeTab === 'resources' ? (
            <>
              <button className="flex-1 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium">
                Buy Now
              </button>
              <button className="p-2 glass-effect text-gray-400 hover:text-white rounded-lg transition-colors">
                <Download className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleFollow}
                className="flex-1 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              <button
                onClick={handleLike}
                className={`p-2 rounded-lg transition-colors ${
                  isLiked
                    ? 'bg-red-500/20 text-red-400'
                    : 'glass-effect text-gray-400 hover:text-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-400' : ''}`} />
              </button>
              <button className="p-2 glass-effect text-gray-400 hover:text-white rounded-lg transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Premium Subscription CTA */}
        {item.is_premium && user?.tier === 'free' && (
          <div className="mt-3 p-3 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border border-yellow-400/30 rounded-lg">
            <p className="text-yellow-400 text-xs mb-2">Premium content - Subscribe to unlock</p>
            <button className="w-full py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold rounded">
              Subscribe Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to format large numbers
function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return String(num);
}
```

### 4. Update Grid Rendering

**Replace the media grid mapping:**
```typescript
{/* Content Grid */}
<div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {loading ? (
    <>
      {[...Array(8)].map((_, i) => (
        <div key={i} className="glass-effect rounded-2xl animate-pulse">
          <div className="aspect-video bg-gray-700 rounded-t-2xl" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-gray-700 rounded w-3/4" />
            <div className="h-3 bg-gray-700 rounded w-1/2" />
          </div>
        </div>
      ))}
    </>
  ) : filteredMedia.length > 0 ? (
    filteredMedia.map((item) => (
      <MediaCard key={item.id} item={item} activeTab={activeTab} />
    ))
  ) : (
    <div className="text-center col-span-full py-12">
      <p className="text-gray-400">No content found. Try a different category.</p>
    </div>
  )}
</div>
```

### 5. Update Search Filtering

**Add search functionality:**
```typescript
// Filter media by search query
const searchFilteredMedia = filteredMedia.filter(item =>
  item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
  item.description?.toLowerCase().includes(searchQuery.toLowerCase())
);
```

Then use `searchFilteredMedia` instead of `filteredMedia` in the grid.

## Complete Example Integration

Here's a minimal example showing the key changes:

```typescript
import React, { useState } from 'react';
import { useMedia, useMediaLike, useCreatorFollow } from '../hooks/useMedia';
import { useAuth } from '../context/AuthContext';

export default function Media() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('stream');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fetch media from database
  const { media: allMedia, loading, error } = useMedia(
    undefined,
    selectedCategory !== 'all' ? selectedCategory : undefined,
    50
  );

  // Filter by tab
  const mediaTypeMap = {
    stream: ['music-video', 'movie'],
    listen: ['audio-music'],
    blog: ['blog'],
    gallery: ['gallery'],
    resources: ['resource']
  };

  const filteredByType = allMedia.filter(item =>
    mediaTypeMap[activeTab as keyof typeof mediaTypeMap].includes(item.type)
  );

  // Filter by search
  const finalMedia = filteredByType.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-playfair font-bold text-white mb-2">Media</h1>
          <p className="text-gray-300">Celebrate amazing content from creators.</p>
        </div>

        {/* Tabs, Search, Filter UI - same as before */}

        {/* Content Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading && <p className="text-white">Loading...</p>}
          {error && <p className="text-red-400">Error: {error}</p>}
          {finalMedia.map(item => (
            <MediaItemCard key={item.id} item={item} activeTab={activeTab} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MediaItemCard({ item, activeTab }) {
  // Implementation as shown above
}
```

## Real-Time Updates

The hooks automatically handle real-time updates:
- When user A likes media
- User B sees the count increase in real-time
- No page refresh needed
- Works across tabs

## Testing the Connection

### 1. Run Seed Function
First populate the database with sample media

### 2. Sign In
Log in with your account

### 3. Visit Media Page
See media items load from database

### 4. Test Like Button
- Click heart
- See count increase instantly
- Open another tab
- See count update in real-time

### 5. Test Follow Button
- Click follow
- See button state change instantly
- Open another browser window
- See follower count increase

### 6. Test Search
- Type in search box
- Results filter in real-time

## Migration Path

If you have static media data to preserve:

```typescript
// Option 1: Import static data and insert into DB
async function migrateStaticData() {
  const { data, error } = await supabase.from('media').insert(
    staticMediaContent.map(item => ({
      creator_id: userId,
      title: item.title,
      type: item.type,
      // ... map all fields
    }))
  );
}

// Option 2: Use static data as fallback
const media = loading ? staticContent : fetchedContent;
```

## Performance Considerations

1. **Pagination:** Limit results for faster loading
2. **Lazy Loading:** Load images on demand
3. **Caching:** Consider memoizing filtered results
4. **Batch Updates:** Group related operations
5. **Unsubscribe:** Hooks clean up automatically

## Troubleshooting

### Media Not Showing
1. Run seed function
2. Check media table has rows
3. Verify RLS allows viewing
4. Check browser console

### Likes Not Persisting
1. Verify user is authenticated
2. Check media_likes table
3. Verify RLS policies
4. Check browser localStorage

### Real-Time Not Working
1. Refresh page
2. Check browser console
3. Verify Realtime enabled in Supabase
4. Check network tab

## Next Steps

1. Copy the MediaCard component code
2. Update Media.tsx imports
3. Replace static data with useMedia()
4. Test all interactions
5. Deploy when ready

The database is ready. Update Media.tsx and you're done!
