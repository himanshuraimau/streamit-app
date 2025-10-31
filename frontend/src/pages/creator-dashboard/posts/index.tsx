import { useState } from 'react';
import { useMyPosts, useUpdatePost } from '@/hooks/useContent';
import { PostFeed } from '../content-upload/_components/PostFeed';
import { EditPostModal } from '../content-upload/_components/edit-post-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, BarChart3, Eye, Heart, MessageCircle } from 'lucide-react';
import type { PostResponse } from '@/types/content';

export default function PostsManagement() {
  const [editingPost, setEditingPost] = useState<PostResponse | null>(null);
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');
  
  const myPostsQuery = useMyPosts({ limit: 10 });
  const updatePost = useUpdatePost();

  const allPosts = myPostsQuery.data?.pages.flatMap(page => 
    page.success ? page.data?.posts || [] : []
  ) || [];

  // Filter posts based on selected filter
  const filteredPosts = allPosts.filter(post => {
    if (filter === 'public') return post.isPublic;
    if (filter === 'private') return !post.isPublic;
    return true;
  });

  // Calculate stats
  const stats = {
    total: allPosts.length,
    public: allPosts.filter(p => p.isPublic).length,
    private: allPosts.filter(p => !p.isPublic).length,
    totalLikes: allPosts.reduce((sum, p) => sum + p.likesCount, 0),
    totalComments: allPosts.reduce((sum, p) => sum + p.commentsCount, 0),
  };

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Posts Management</h1>
          <p className="text-zinc-400">View and manage all your posts</p>
        </div>
        <Button 
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          onClick={() => window.location.href = '/creator-dashboard/content-upload'}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Post
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-zinc-400 text-sm">Total Posts</p>
              <p className="text-white text-xl font-semibold">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-zinc-400 text-sm">Public</p>
              <p className="text-white text-xl font-semibold">{stats.public}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-zinc-400 text-sm">Private</p>
              <p className="text-white text-xl font-semibold">{stats.private}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <Heart className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-zinc-400 text-sm">Total Likes</p>
              <p className="text-white text-xl font-semibold">{stats.totalLikes}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-zinc-400 text-sm">Total Comments</p>
              <p className="text-white text-xl font-semibold">{stats.totalComments}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-zinc-800">
        <div className="flex space-x-8">
          {[
            { id: 'all', label: `All Posts (${stats.total})` },
            { id: 'public', label: `Public (${stats.public})` },
            { id: 'private', label: `Private (${stats.private})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors ${
                filter === tab.id
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-zinc-400 hover:text-white hover:border-zinc-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Feed */}
      <div className="max-w-4xl">
        <PostFeed
          posts={filteredPosts}
          isLoading={myPostsQuery.isLoading}
          hasNextPage={myPostsQuery.hasNextPage || false}
          isFetchingNextPage={myPostsQuery.isFetchingNextPage}
          fetchNextPage={myPostsQuery.fetchNextPage}
          onEditPost={handleEditPost}
          emptyMessage={
            filter === 'all' 
              ? "You haven't created any posts yet. Create your first post!"
              : `No ${filter} posts found.`
          }
        />
      </div>

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