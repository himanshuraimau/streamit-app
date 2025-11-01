import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { contentApi } from '@/lib/api/content';
import type {
  CreatePostInput,
  UpdatePostInput,
  CreateCommentInput,
  FeedQuery,
  PostResponse,
} from '@/types/content';

// Query keys
export const contentKeys = {
  all: ['content'] as const,
  posts: () => [...contentKeys.all, 'posts'] as const,
  post: (id: string) => [...contentKeys.posts(), id] as const,
  myPosts: (query?: FeedQuery) => [...contentKeys.posts(), 'my', query] as const,
  userPosts: (userId: string, query?: FeedQuery) => [...contentKeys.posts(), 'user', userId, query] as const,
  feed: (query?: FeedQuery) => [...contentKeys.all, 'feed', query] as const,
  publicFeed: (query?: FeedQuery) => [...contentKeys.all, 'publicFeed', query] as const,
  comments: (postId: string) => [...contentKeys.all, 'comments', postId] as const,
};

// Hooks for posts
export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePostInput) => contentApi.createPost(data),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: contentKeys.posts() });
      queryClient.invalidateQueries({ queryKey: contentKeys.feed() });
      queryClient.invalidateQueries({ queryKey: contentKeys.publicFeed() });
    },
  });
};

export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: UpdatePostInput }) =>
      contentApi.updatePost(postId, data),
    onSuccess: (response, { postId }) => {
      // Update the specific post in cache
      queryClient.setQueryData(contentKeys.post(postId), response);
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: contentKeys.posts() });
      queryClient.invalidateQueries({ queryKey: contentKeys.feed() });
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => contentApi.deletePost(postId),
    onSuccess: (_, postId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: contentKeys.post(postId) });
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: contentKeys.posts() });
      queryClient.invalidateQueries({ queryKey: contentKeys.feed() });
      queryClient.invalidateQueries({ queryKey: contentKeys.publicFeed() });
    },
  });
};

export const usePost = (postId: string) => {
  return useQuery({
    queryKey: contentKeys.post(postId),
    queryFn: () => contentApi.getPost(postId),
    enabled: !!postId,
  });
};

export const useMyPosts = (query: FeedQuery = {}) => {
  return useInfiniteQuery({
    queryKey: contentKeys.myPosts(query),
    queryFn: ({ pageParam }) => contentApi.getMyPosts({ ...query, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.success && lastPage.data?.hasMore) {
        return lastPage.data.nextCursor;
      }
      return undefined;
    },
  });
};

export const useUserPosts = (userId: string, query: FeedQuery = {}) => {
  return useInfiniteQuery({
    queryKey: contentKeys.userPosts(userId, query),
    queryFn: ({ pageParam }) => contentApi.getUserPosts(userId, { ...query, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.success && lastPage.data?.hasMore) {
        return lastPage.data.nextCursor;
      }
      return undefined;
    },
    enabled: !!userId,
  });
};

// Hooks for feeds
export const useFeed = (query: FeedQuery = {}) => {
  return useInfiniteQuery({
    queryKey: contentKeys.feed(query),
    queryFn: ({ pageParam }) => contentApi.getFeed({ ...query, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.success && lastPage.data?.hasMore) {
        return lastPage.data.nextCursor;
      }
      return undefined;
    },
  });
};

export const usePublicFeed = (query: FeedQuery = {}) => {
  return useInfiniteQuery({
    queryKey: contentKeys.publicFeed(query),
    queryFn: ({ pageParam }) => contentApi.getPublicFeed({ ...query, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.success && lastPage.data?.hasMore) {
        return lastPage.data.nextCursor;
      }
      return undefined;
    },
  });
};

// Hooks for likes
export const useTogglePostLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => contentApi.togglePostLike(postId),
    onSuccess: (response, postId) => {
      if (response.success && response.data) {
        // Update post in cache with new like status
        const updatePost = (post: PostResponse) => ({
          ...post,
          isLiked: response.data!.isLiked,
          likesCount: response.data!.likesCount,
        });

        // Update specific post
        queryClient.setQueryData(contentKeys.post(postId), (old: any) => {
          if (old?.success && old.data) {
            return { ...old, data: updatePost(old.data) };
          }
          return old;
        });

        // Update in all feed queries
        queryClient.setQueriesData({ queryKey: contentKeys.feed() }, (old: any) => {
          if (old?.pages) {
            return {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                data: page.data ? {
                  ...page.data,
                  posts: page.data.posts.map((post: PostResponse) =>
                    post.id === postId ? updatePost(post) : post
                  ),
                } : page.data,
              })),
            };
          }
          return old;
        });

        // Update in public feed
        queryClient.setQueriesData({ queryKey: contentKeys.publicFeed() }, (old: any) => {
          if (old?.pages) {
            return {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                data: page.data ? {
                  ...page.data,
                  posts: page.data.posts.map((post: PostResponse) =>
                    post.id === postId ? updatePost(post) : post
                  ),
                } : page.data,
              })),
            };
          }
          return old;
        });
      }
    },
  });
};

// Hooks for comments
export const usePostComments = (postId: string) => {
  return useQuery({
    queryKey: contentKeys.comments(postId),
    queryFn: () => contentApi.getPostComments(postId),
    enabled: !!postId,
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommentInput) => contentApi.addComment(data),
    onSuccess: (_, { postId }) => {
      // Invalidate comments for this post
      queryClient.invalidateQueries({ queryKey: contentKeys.comments(postId) });

      // Update post comment count in cache
      const updatePostCommentCount = (post: PostResponse) => ({
        ...post,
        commentsCount: post.commentsCount + 1,
      });

      // Update specific post
      queryClient.setQueryData(contentKeys.post(postId), (old: any) => {
        if (old?.success && old.data) {
          return { ...old, data: updatePostCommentCount(old.data) };
        }
        return old;
      });

      // Update in feed queries
      queryClient.setQueriesData({ queryKey: contentKeys.feed() }, (old: any) => {
        if (old?.pages) {
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: page.data ? {
                ...page.data,
                posts: page.data.posts.map((post: PostResponse) =>
                  post.id === postId ? updatePostCommentCount(post) : post
                ),
              } : page.data,
            })),
          };
        }
        return old;
      });
    },
  });
};