import { useState } from 'react';
import { useMyPosts, useUpdatePost } from '@/hooks/useContent';
import { PostFeed } from './PostFeed';
import { EditPostModal } from './edit-post-modal';
import type { PostResponse } from '@/types/content';

export function MyPostsTab() {
  const [editingPost, setEditingPost] = useState<PostResponse | null>(null);
  
  const myPostsQuery = useMyPosts({ limit: 10 });
  const updatePost = useUpdatePost();

  const allPosts = myPostsQuery.data?.pages.flatMap(page => 
    page.success ? page.data?.posts || [] : []
  ) || [];

  const handleEditPost = (post: PostResponse) => {
    setEditingPost(post);
  };

  const handleUpdatePost = async (postId: string, data: { content?: string; isPublic?: boolean; allowComments?: boolean }) => {
    try {
      await updatePost.mutateAsync({ postId, data });
      setEditingPost(null);
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold text-white mb-2">My Posts</h2>
        <p className="text-zinc-400">Manage and view all your posts</p>
      </div>

      <PostFeed
        posts={allPosts}
        isLoading={myPostsQuery.isLoading}
        hasNextPage={myPostsQuery.hasNextPage || false}
        isFetchingNextPage={myPostsQuery.isFetchingNextPage}
        fetchNextPage={myPostsQuery.fetchNextPage}
        onEditPost={handleEditPost}
        emptyMessage="You haven't created any posts yet. Share your first post!"
      />

      {/* Edit Post Modal */}
      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onUpdate={handleUpdatePost}
          isUpdating={updatePost.isPending}
        />
      )}
    </div>
  );
}