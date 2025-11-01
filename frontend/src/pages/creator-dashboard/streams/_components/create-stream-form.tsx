import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Radio } from 'lucide-react';
import { FileUpload } from '@/components/ui/file-upload';
import { toast } from 'sonner';

interface CreateStreamFormProps {
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  thumbnail: string | null;
  setThumbnail: (thumbnail: string | null) => void;
  chatSettings: {
    isChatEnabled: boolean;
    isChatDelayed: boolean;
    isChatFollowersOnly: boolean;
  };
  setChatSettings: React.Dispatch<React.SetStateAction<{
    isChatEnabled: boolean;
    isChatDelayed: boolean;
    isChatFollowersOnly: boolean;
  }>>;
  onSubmit: () => void;
  isCreating: boolean;
}

export function CreateStreamForm({
  title,
  setTitle,
  description,
  setDescription,
  thumbnail,
  setThumbnail,
  chatSettings,
  setChatSettings,
  onSubmit,
  isCreating,
}: CreateStreamFormProps) {
  return (
    <Card className="bg-zinc-900 border-zinc-800 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-purple-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Radio className="w-10 h-10 text-purple-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Start Your Stream</h2>
          <p className="text-zinc-400">
            Set up your stream details to get your streaming credentials
          </p>
        </div>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="newTitle" className="text-zinc-300 text-sm font-medium">
              Stream Title <span className="text-red-400">*</span>
            </Label>
            <Input
              id="newTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Gaming Session"
              className="bg-zinc-800 border-zinc-700 text-white mt-2"
              maxLength={200}
            />
            <p className="text-xs text-zinc-500 mt-1">
              {title.length}/200 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-zinc-300 text-sm font-medium">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers what you'll be streaming..."
              className="bg-zinc-800 border-zinc-700 text-white mt-2 min-h-24"
              maxLength={1000}
            />
            <p className="text-xs text-zinc-500 mt-1">
              {description.length}/1000 characters
            </p>
          </div>

          {/* Thumbnail Upload */}
          <div>
            <Label className="text-zinc-300 text-sm font-medium mb-2 block">
              Thumbnail (Optional)
            </Label>
            {thumbnail && (
              <div className="mb-3 p-2 bg-zinc-800 border border-zinc-700 rounded-lg">
                <p className="text-xs text-green-400 mb-2">✓ Thumbnail uploaded</p>
                <div className="relative w-full h-32 rounded overflow-hidden bg-zinc-900">
                  <img 
                    src={thumbnail} 
                    alt="Stream thumbnail" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setThumbnail(null);
                    toast.info('Thumbnail removed');
                  }}
                  className="mt-2 text-xs text-red-400 hover:text-red-300"
                >
                  Remove thumbnail
                </button>
              </div>
            )}
            <FileUpload
              accept="image/*"
              maxSize={5}
              purpose="stream-thumbnail"
              onUploadComplete={(url) => {
                console.log('[CreateStreamForm] Thumbnail uploaded:', url);
                setThumbnail(url);
                toast.success('Thumbnail uploaded!');
              }}
              onUploadError={(error) => {
                console.error('[CreateStreamForm] Upload error:', error);
                toast.error(error || 'Failed to upload thumbnail');
              }}
              placeholder="Click to upload thumbnail (max 5MB)"
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          {/* Chat Settings */}
          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <Label className="text-zinc-300 text-sm font-medium">Chat Settings</Label>
            
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <span className="text-sm text-zinc-300">Enable Chat</span>
                <p className="text-xs text-zinc-500">Allow viewers to chat during stream</p>
              </div>
              <Switch
                checked={chatSettings.isChatEnabled}
                onCheckedChange={(checked) =>
                  setChatSettings((prev) => ({ ...prev, isChatEnabled: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <span className="text-sm text-zinc-300">Followers-Only Chat</span>
                <p className="text-xs text-zinc-500">Only followers can send messages</p>
              </div>
              <Switch
                checked={chatSettings.isChatFollowersOnly}
                onCheckedChange={(checked) =>
                  setChatSettings((prev) => ({ ...prev, isChatFollowersOnly: checked }))
                }
                disabled={!chatSettings.isChatEnabled}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <span className="text-sm text-zinc-300">Slow Mode</span>
                <p className="text-xs text-zinc-500">3-second delay between messages</p>
              </div>
              <Switch
                checked={chatSettings.isChatDelayed}
                onCheckedChange={(checked) =>
                  setChatSettings((prev) => ({ ...prev, isChatDelayed: checked }))
                }
                disabled={!chatSettings.isChatEnabled}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isCreating || !title.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            size="lg"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating Stream...
              </>
            ) : (
              <>
                <Radio className="w-4 h-4 mr-2" />
                Generate Stream Keys
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
