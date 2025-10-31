import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { PostResponse } from '@/types/content';

interface EditPostModalProps {
  post: PostResponse;
  onClose: () => void;
  onUpdate: (postId: string, data: { content?: string; isPublic?: boolean; allowComments?: boolean }) => void;
  isUpdating: boolean;
}

export function EditPostModal({ post, onClose, onUpdate, isUpdating }: EditPostModalProps) {
  const [content, setContent] = useState(post.content || '');
  const [isPublic, setIsPublic] = useState(post.isPublic);
  const [allowComments, setAllowComments] = useState(post.allowComments);

  const handleSubmit = () => {
    onUpdate(post.id, {
      content: content.trim() || undefined,
      isPublic,
      allowComments,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Post</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Content Input */}
          <div>
            <Label htmlFor="content" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Content
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="mt-1 min-h-[120px]"
            />
          </div>

          {/* Settings */}
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <Label htmlFor="public" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Public Post
              </Label>
              <Switch
                id="public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="comments" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Allow Comments
              </Label>
              <Switch
                id="comments"
                checked={allowComments}
                onCheckedChange={setAllowComments}
              />
            </div>
          </div>

          {/* Media Preview (if any) */}
          {post.media && post.media.length > 0 && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Media (cannot be edited)
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {post.media.slice(0, 4).map((media) => (
                  <div key={media.id} className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    {media.type === 'VIDEO' ? (
                      <img
                        src={media.thumbnailUrl || media.url}
                        alt="Video thumbnail"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={media.url}
                        alt="Media"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isUpdating}>
            {isUpdating ? 'Updating...' : 'Update Post'}
          </Button>
        </div>
      </div>
    </div>
  );
}