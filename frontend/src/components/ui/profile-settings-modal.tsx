import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { User, Image as ImageIcon, Lock, Loader2, Upload, Check } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface ProfileSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileSettingsModal({ open, onClose }: ProfileSettingsModalProps) {
  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();
  
  // Profile tab state
  const [name, setName] = useState(session?.user?.name || '');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Avatar tab state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Security tab state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Load profile data when modal opens
  useEffect(() => {
    const loadProfile = async () => {
      if (!open) return;
      
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/viewer/profile`, {
          credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load profile');
        }

        // Populate form fields
        setName(data.name || session?.user?.name || '');
        setUsername(data.username || '');
        setBio(data.bio || '');
      } catch (error) {
        console.error('Failed to load profile:', error);
        // Fallback to session data
        setName(session?.user?.name || '');
        setUsername('');
        setBio('');
      }
    };

    loadProfile();
  }, [open, session?.user?.name]);

  const handleProfileUpdate = async () => {
    try {
      setIsUpdatingProfile(true);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/viewer/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name, username, bio }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      toast.success('Profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['session'] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    try {
      setIsUploadingAvatar(true);

      const formData = new FormData();
      formData.append('avatar', selectedFile);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/viewer/avatar`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload avatar');
      }

      toast.success('Avatar uploaded successfully!');
      queryClient.invalidateQueries({ queryKey: ['session'] });
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      setIsChangingPassword(true);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/viewer/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Profile Settings</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Manage your profile information, avatar, and security settings
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-800">
            <TabsTrigger value="profile" className="data-[state=active]:bg-zinc-700">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="avatar" className="data-[state=active]:bg-zinc-700">
              <ImageIcon className="w-4 h-4 mr-2" />
              Avatar
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-zinc-700">
              <Lock className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-zinc-300 text-sm">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 bg-zinc-800 border-zinc-700 text-white"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <Label htmlFor="username" className="text-zinc-300 text-sm">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1.5 bg-zinc-800 border-zinc-700 text-white"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <Label htmlFor="bio" className="text-zinc-300 text-sm">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="mt-1.5 bg-zinc-800 border-zinc-700 text-white min-h-[100px]"
                  placeholder="Tell us about yourself..."
                  maxLength={500}
                />
                <p className="text-xs text-zinc-500 mt-1">{bio.length}/500 characters</p>
              </div>

              <div>
                <Label className="text-zinc-300 text-sm">Email</Label>
                <Input
                  value={session?.user?.email || ''}
                  disabled
                  className="mt-1.5 bg-zinc-800/50 border-zinc-700 text-zinc-400"
                />
                <p className="text-xs text-zinc-500 mt-1">Email cannot be changed</p>
              </div>

              <Button
                onClick={handleProfileUpdate}
                disabled={isUpdatingProfile}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                {isUpdatingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Avatar Tab */}
          <TabsContent value="avatar" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                {/* Current Avatar */}
                <div className="relative">
                  <img
                    src={previewUrl || session?.user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session?.user?.name}`}
                    alt="Avatar"
                    className="w-32 h-32 rounded-full object-cover border-4 border-zinc-700"
                  />
                </div>

                {/* File Input */}
                <div className="w-full">
                  <Label htmlFor="avatar-upload" className="text-zinc-300 text-sm block mb-2">
                    Choose New Avatar
                  </Label>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="bg-zinc-800 border-zinc-700 text-white file:bg-zinc-700 file:text-white file:border-0 file:mr-4"
                  />
                  <p className="text-xs text-zinc-500 mt-2">
                    Supported: JPG, PNG, WebP (Max 5MB)
                  </p>
                </div>

                {selectedFile && (
                  <div className="w-full p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                    <p className="text-sm text-zinc-300">Selected: {selectedFile.name}</p>
                    <p className="text-xs text-zinc-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
              </div>

              <Button
                onClick={handleAvatarUpload}
                disabled={!selectedFile || isUploadingAvatar}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                {isUploadingAvatar ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Avatar
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="current-password" className="text-zinc-300 text-sm">
                  Current Password
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1.5 bg-zinc-800 border-zinc-700 text-white"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <Label htmlFor="new-password" className="text-zinc-300 text-sm">
                  New Password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1.5 bg-zinc-800 border-zinc-700 text-white"
                  placeholder="Enter new password"
                />
                <p className="text-xs text-zinc-500 mt-1">Minimum 8 characters</p>
              </div>

              <div>
                <Label htmlFor="confirm-password" className="text-zinc-300 text-sm">
                  Confirm New Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1.5 bg-zinc-800 border-zinc-700 text-white"
                  placeholder="Confirm new password"
                />
              </div>

              <Button
                onClick={handlePasswordChange}
                disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Change Password
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
