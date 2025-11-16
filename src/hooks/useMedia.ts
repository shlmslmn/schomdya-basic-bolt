import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface MediaItem {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  type: 'music-video' | 'movie' | 'audio-music' | 'blog' | 'gallery' | 'resource';
  category: string;
  thumbnail_url: string;
  duration?: string;
  read_time?: string;
  is_premium: boolean;
  price?: number;
  rating?: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface MediaItemWithStats extends MediaItem {
  creator?: { name: string; username: string };
  likes_count: number;
  is_liked_by_user: boolean;
  follows_count: number;
  is_followed_by_user: boolean;
}

export function useMedia(type?: string, category?: string, limit: number = 50) {
  const { user } = useAuth();
  const [media, setMedia] = useState<MediaItemWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      let query = supabase.from('media').select('*');

      if (type) {
        query = query.eq('type', type);
      }
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data: mediaData, error: mediaError } = await query
        .order('created_at', { ascending: false })
        .limit(limit);

      if (mediaError) throw mediaError;

      if (mediaData) {
        const enrichedMedia = await Promise.all(
          mediaData.map(async (item) => {
            const [creatorRes, likesRes, followsRes] = await Promise.all([
              supabase.from('profiles').select('name, username').eq('id', item.creator_id).single(),
              supabase.from('media_likes').select('*', { count: 'exact' }).eq('media_id', item.id),
              supabase.from('creator_follows').select('*', { count: 'exact' }).eq('creator_id', item.creator_id),
            ]);

            const isLiked = user
              ? (await supabase.from('media_likes').select('*').eq('media_id', item.id).eq('user_id', user.id).maybeSingle()).data !== null
              : false;

            const isFollowed = user
              ? (await supabase.from('creator_follows').select('*').eq('creator_id', item.creator_id).eq('follower_id', user.id).maybeSingle()).data !== null
              : false;

            return {
              ...item,
              creator: creatorRes.data,
              likes_count: likesRes.count || 0,
              is_liked_by_user: !!isLiked,
              follows_count: followsRes.count || 0,
              is_followed_by_user: !!isFollowed,
            };
          })
        );

        setMedia(enrichedMedia);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch media';
      setError(errorMessage);
      console.error('Error fetching media:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [type, category, limit, user?.id]);

  return { media, loading, error, refetch: fetchMedia };
}

export function useMediaLike(mediaId: string) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const checkLikeStatus = async () => {
    if (!user) return;

    const [likeRes, countRes] = await Promise.all([
      supabase.from('media_likes').select('*').eq('media_id', mediaId).eq('user_id', user.id).maybeSingle(),
      supabase.from('media_likes').select('*', { count: 'exact' }).eq('media_id', mediaId),
    ]);

    setIsLiked(!!likeRes.data);
    setLikesCount(countRes.count || 0);
  };

  const toggleLike = async () => {
    if (!user) return;

    const previousLiked = isLiked;
    const previousCount = likesCount;

    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    setLoading(true);

    try {
      if (previousLiked) {
        await supabase.from('media_likes').delete().eq('media_id', mediaId).eq('user_id', user.id);
      } else {
        await supabase.from('media_likes').insert([{ media_id: mediaId, user_id: user.id }]);
      }
    } catch (error) {
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkLikeStatus();

    const channel = supabase
      .channel(`media-likes-${mediaId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'media_likes',
          filter: `media_id=eq.${mediaId}`,
        },
        () => {
          checkLikeStatus();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [mediaId, user?.id]);

  return { isLiked, likesCount, toggleLike, loading };
}

export function useCreatorFollow(creatorId: string) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followsCount, setFollowsCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const checkFollowStatus = async () => {
    if (!user) return;

    const [followRes, countRes] = await Promise.all([
      supabase
        .from('creator_follows')
        .select('*')
        .eq('creator_id', creatorId)
        .eq('follower_id', user.id)
        .maybeSingle(),
      supabase.from('creator_follows').select('*', { count: 'exact' }).eq('creator_id', creatorId),
    ]);

    setIsFollowing(!!followRes.data);
    setFollowsCount(countRes.count || 0);
  };

  const toggleFollow = async () => {
    if (!user) return;

    const previousFollowing = isFollowing;
    const previousCount = followsCount;

    setIsFollowing(!isFollowing);
    setFollowsCount(isFollowing ? followsCount - 1 : followsCount + 1);
    setLoading(true);

    try {
      if (previousFollowing) {
        await supabase
          .from('creator_follows')
          .delete()
          .eq('creator_id', creatorId)
          .eq('follower_id', user.id);
      } else {
        await supabase.from('creator_follows').insert([
          {
            creator_id: creatorId,
            follower_id: user.id,
          },
        ]);
      }
    } catch (error) {
      setIsFollowing(previousFollowing);
      setFollowsCount(previousCount);
      console.error('Error toggling follow:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkFollowStatus();

    const channel = supabase
      .channel(`creator-follows-${creatorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'creator_follows',
          filter: `creator_id=eq.${creatorId}`,
        },
        () => {
          checkFollowStatus();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [creatorId, user?.id]);

  return { isFollowing, followsCount, toggleFollow, loading };
}
