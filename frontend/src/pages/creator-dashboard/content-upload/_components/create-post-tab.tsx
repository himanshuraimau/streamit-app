import { CreatePostForm } from './CreatePostForm';

export function CreatePostTab() {
  const handlePostSuccess = () => {
    // Could show a success message or redirect
    console.log('Post created successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold text-white mb-2">Create New Post</h2>
        <p className="text-zinc-400">Share your thoughts, images, or videos with the community</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <CreatePostForm onSuccess={handlePostSuccess} />
      </div>
    </div>
  );
}