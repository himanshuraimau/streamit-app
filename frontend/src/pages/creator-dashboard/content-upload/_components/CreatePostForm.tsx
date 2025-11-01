import { useState, useRef } from 'react';
import { Image, Video, X, Upload, Globe, Lock, MessageCircle, MessageCircleOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCreatePost } from '@/hooks/useContent';
import { useSession } from '@/lib/auth-client';
import type { CreatePostInput, PostType } from '@/types/content';

interface CreatePostFormProps {
  onSuccess?: () => void;
}

export function CreatePostForm({ onSuccess }: CreatePostFormProps) {
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();
  const createPost = useCreatePost();


  const isCreator = true;

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    fileArray.forEach(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isGif = file.type === 'image/gif';

      // Check if user is creator
      if (!isCreator && (isImage || isVideo || isGif)) {
        errors.push('Only creators can upload media files');
        return;
      }

      // Check file size (10MB for images, 100MB for videos)
      const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        errors.push(`${file.name} is too large (max ${isVideo ? '100MB' : '10MB'})`);
        return;
      }

      // Check file type
      if (!(isImage || isVideo || isGif)) {
        errors.push(`${file.name} is not a supported media file`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      alert('Some files were skipped:\n' + errors.join('\n'));
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 10)); // Max 10 files
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const determinePostType = (): PostType => {
    if (selectedFiles.length === 0) return 'TEXT';

    const hasImages = selectedFiles.some(f => f.type.startsWith('image/'));
    const hasVideos = selectedFiles.some(f => f.type.startsWith('video/'));
    const hasGifs = selectedFiles.some(f => f.type === 'image/gif');

    if (hasVideos && (hasImages || hasGifs)) return 'MIXED';
    if (hasVideos) return 'VIDEO';
    if (hasImages || hasGifs) return 'IMAGE';

    return 'TEXT';
  };

  const handleSubmit = async () => {
    if (!content.trim() && selectedFiles.length === 0) {
      alert('Please add some content or media to your post.');
      return;
    }

    const postData: CreatePostInput = {
      content: content.trim() || undefined,
      type: determinePostType(),
      isPublic,
      allowComments,
      media: selectedFiles.length > 0 ? selectedFiles : undefined,
    };

    try {
      await createPost.mutateAsync(postData);

      // Reset form
      setContent('');
      setSelectedFiles([]);
      setIsPublic(true);
      setAllowComments(true);

      // Show success message
      alert('Post created successfully!');

      onSuccess?.();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* User Info */}
          <div className="flex items-center space-x-3">
            <img
              src={session?.user?.image || '/default-avatar.png'}
              alt={session?.user?.name || 'User'}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {session?.user?.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{session?.user?.email?.split('@')[0] || 'user'}
              </p>
            </div>
          </div>

          {/* Content Input */}
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="min-h-[120px] resize-none border-none shadow-none text-lg placeholder:text-gray-400"
          />

          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${dragOver
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => isCreator && fileInputRef.current?.click()}
          >
            {selectedFiles.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      {file.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {file.name}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {isCreator
                    ? 'Drop images or videos here, or click to select'
                    : 'Media uploads are available for creators only'
                  }
                </p>
                {isCreator && (
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    disabled={!isCreator}
                  >
                    <Image className="w-4 h-4 mr-2" />
                    Choose Files
                  </Button>
                )}
                <div className="mt-4 text-sm text-gray-500">
                  <p>Supported: JPG, PNG, GIF, MP4, WebM</p>
                  <p>Max size: 10MB for images, 100MB for videos</p>
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/webm,video/mov"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />

          {/* Post Settings */}
          <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Switch
                id="public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
              <Label htmlFor="public" className="flex items-center space-x-2">
                {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span>{isPublic ? 'Public' : 'Private'}</span>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="comments"
                checked={allowComments}
                onCheckedChange={setAllowComments}
              />
              <Label htmlFor="comments" className="flex items-center space-x-2">
                {allowComments ? <MessageCircle className="w-4 h-4" /> : <MessageCircleOff className="w-4 h-4" />}
                <span>Allow Comments</span>
              </Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={createPost.isPending || (!content.trim() && selectedFiles.length === 0)}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              size="lg"
            >
              {createPost.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating Post...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Create Post
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}