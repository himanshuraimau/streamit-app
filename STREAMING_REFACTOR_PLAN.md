# StreamIt - Streaming Refactor Plan

## 🎯 Goal

Refactor the streaming workflow to be more intuitive: **Setup stream details FIRST, then go live**.

---

## 📊 Current State Analysis

### Current Pages

#### 1. `/dashboard/keys` Page
**Purpose**: Generate and manage RTMP keys

**Current Flow**:
```
1. Creator visits Keys page
2. Clicks "Generate Key" button
3. Backend creates Stream in DB with defaults:
   - title: "Untitled Stream"
   - thumbnail: null
   - isChatEnabled: true
4. Displays serverUrl + streamKey
5. Creator copies credentials for OBS
```

**Issues**:
- ❌ Stream created without meaningful metadata
- ❌ "Untitled Stream" looks unprofessional
- ❌ No way to set thumbnail
- ❌ Keys generated before creator knows what they're streaming
- ❌ Separate from stream management

#### 2. `/dashboard/streams` Page
**Purpose**: View stream status, edit settings, monitor live stream

**Current Features**:
- Stream status card (live/offline, viewer count)
- Edit title (with edit mode toggle)
- Chat settings toggles
- Live stream preview (StreamPlayer component)
- Polls status every 5 seconds

**Issues**:
- ❌ Edit mode complexity for title
- ❌ No thumbnail upload UI
- ❌ Assumes stream already exists
- ❌ No past streams history
- ❌ Settings scattered in local state

### Current Database Schema

```prisma
model Stream {
  id                    String   @id @default(cuid())
  title                 String   @db.Text
  thumbnail             String?  @db.Text
  
  // Streaming infrastructure
  ingressId             String?  @unique
  serverUrl             String?  @db.Text
  streamKey             String?  @db.Text
  
  // Stream status
  isLive                Boolean  @default(false)
  
  // Chat settings
  isChatEnabled         Boolean  @default(true)
  isChatDelayed         Boolean  @default(false)
  isChatFollowersOnly   Boolean  @default(false)
  
  userId                String   @unique
  user                  User     @relation(...)
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

**Missing**:
- ❌ `description` field for stream details
- ❌ Stream history/sessions (multiple streams over time)
- ❌ `endedAt` timestamp

### Current API Endpoints

```typescript
// Creator endpoints (exist)
POST   /api/stream/ingress           // Create stream key
DELETE /api/stream/ingress           // Delete stream key
GET    /api/stream/credentials       // Get serverUrl + streamKey
GET    /api/stream/info              // Get stream configuration
PUT    /api/stream/info              // Update title/thumbnail
PUT    /api/stream/chat-settings     // Update chat settings
GET    /api/stream/status            // Get live status + viewers

// Missing endpoints
GET    /api/stream/past              // Get past streams history
POST   /api/stream/create            // Create stream with metadata first
```

### Current Frontend Components

```
/dashboard/keys/index.tsx
  - StreamCredentials display
  - Generate/Reset key buttons
  - Instructions
  
/dashboard/streams/index.tsx
  - Stream status cards
  - Title editor (with edit mode)
  - Chat settings toggles
  - StreamPlayer preview
  - Status polling

/hooks/useStream.ts
  - streamInfo state
  - streamStatus state
  - createIngress()
  - updateStreamInfo()
  - updateChatSettings()
  - fetchStreamStatus()
```

**Missing**:
- ❌ Stream setup modal/form
- ❌ Thumbnail upload component
- ❌ Browser streaming component (LiveKit publisher)
- ❌ Past streams list

---

## 🎨 Proposed New Flow

### User Experience

```
📱 Dashboard → Streams Page

┌─────────────────────────────────────────────┐
│  Streams                          [+ Create] │
├─────────────────────────────────────────────┤
│                                              │
│  No active stream                            │
│  Start streaming by creating a new stream   │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │ Past Streams                          │  │
│  ├──────────────────────────────────────┤  │
│  │ • Gaming Session - Nov 1, 2025       │  │
│  │ • Q&A Stream - Oct 30, 2025          │  │
│  │ • Morning Coffee Chat - Oct 28       │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘

Click [+ Create] Button
         ↓

┌─────────────────────────────────────────────┐
│  Create New Stream                      [×]  │
├─────────────────────────────────────────────┤
│                                              │
│  Stream Title *                              │
│  ┌──────────────────────────────────────┐  │
│  │ My Gaming Session                     │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  Description (Optional)                      │
│  ┌──────────────────────────────────────┐  │
│  │ Playing Valorant with viewers!        │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  Thumbnail (Optional)                        │
│  ┌──────────────────────────────────────┐  │
│  │ [📤 Upload Image] or [🎨 Use Default] │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  Chat Settings                               │
│  ☑ Enable Chat                               │
│  ☐ Followers-Only Chat                       │
│  ☐ Slow Mode (30s delay)                     │
│                                              │
│  ┌─────────────────┐  ┌─────────────────┐  │
│  │ 📹 Go Live      │  │ 🔑 Use OBS      │  │
│  │ In Browser      │  │ (Generate Keys) │  │
│  └─────────────────┘  └─────────────────┘  │
│                                              │
└─────────────────────────────────────────────┘
```

### Flow Diagrams

#### Option A: Browser Streaming (New Feature)

```
Creator clicks "Go Live in Browser"
         ↓
┌─────────────────────────────────────────────┐
│  Select Devices                              │
├─────────────────────────────────────────────┤
│  Camera: [Dropdown: HD Webcam]               │
│  Microphone: [Dropdown: Blue Yeti]           │
│  Screen Share: [ ] Include screen            │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │  Preview                              │  │
│  │  [Shows camera preview]               │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  [🔴 Start Streaming]                        │
└─────────────────────────────────────────────┘
         ↓
Backend Flow:
1. Create Stream record with metadata
2. Create LiveKit ingress (WHIP for browser)
3. Return LiveKit publish token
4. Frontend initializes LiveKit publisher
5. Video/audio published to LiveKit room
6. Webhook marks stream as live
         ↓
Stream Active - Monitoring View
```

#### Option B: OBS Streaming (Existing + Improved)

```
Creator clicks "Use OBS (Generate Keys)"
         ↓
Backend Flow:
1. Create Stream record with metadata
2. Create LiveKit RTMP ingress
3. Return serverUrl + streamKey
         ↓
┌─────────────────────────────────────────────┐
│  Stream Keys Generated                       │
├─────────────────────────────────────────────┤
│  Your stream "My Gaming Session" is ready!  │
│                                              │
│  Server URL:                                 │
│  ┌──────────────────────────────────────┐  │
│  │ rtmp://live.streamit.io/live  [Copy]  │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  Stream Key:                                 │
│  ┌──────────────────────────────────────┐  │
│  │ sk_xxxxxxxxxxxx  [👁][Copy]           │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  📋 Instructions:                            │
│  1. Open OBS Studio                          │
│  2. Go to Settings → Stream                  │
│  3. Service: Custom                          │
│  4. Paste Server URL and Stream Key          │
│  5. Click "Start Streaming" in OBS           │
│                                              │
│  [✓ I've Configured OBS]                     │
└─────────────────────────────────────────────┘
         ↓
Creator configures OBS and starts streaming
         ↓
Webhook marks stream as live
         ↓
Stream Active - Monitoring View
```

#### Stream Monitoring View (While Live)

```
┌─────────────────────────────────────────────┐
│  🔴 LIVE  My Gaming Session    👥 42 viewers │
├─────────────────────────────────────────────┤
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │                                       │  │
│  │     [Live Stream Preview Video]      │  │
│  │                                       │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  Stream Details                              │
│  Title: My Gaming Session         [Edit]    │
│  Description: Playing Valorant...            │
│                                              │
│  Chat Settings                               │
│  ☑ Chat Enabled                              │
│  ☐ Followers-Only                            │
│                                              │
│  [🛑 End Stream]                             │
└─────────────────────────────────────────────┘
```

---

## 🛠️ Implementation Plan

### Phase 1: Backend Changes

#### 1.1 Database Schema Updates

Add `description` field to Stream model:

```prisma
model Stream {
  id                    String   @id @default(cuid())
  title                 String   @db.Text
  description           String?  @db.Text  // NEW
  thumbnail             String?  @db.Text
  
  // ... rest of fields
}
```

**Migration**:
```bash
cd backend
npx prisma migrate dev --name add_stream_description
```

#### 1.2 New API Endpoint: Create Stream with Metadata

**File**: `backend/src/controllers/stream.controller.ts`

```typescript
/**
 * Create stream with metadata (new flow)
 * POST /api/stream/create
 */
static async createStreamWithMetadata(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const { title, description, thumbnail, chatSettings, streamMethod } = req.body;
    
    // Validate
    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }
    
    // Create stream record first
    const stream = await StreamService.createStreamWithMetadata(userId, {
      title,
      description,
      thumbnail,
      isChatEnabled: chatSettings?.isChatEnabled ?? true,
      isChatDelayed: chatSettings?.isChatDelayed ?? false,
      isChatFollowersOnly: chatSettings?.isChatFollowersOnly ?? false,
    });
    
    // Generate ingress based on method
    const ingressType = streamMethod === 'browser' ? 'WHIP' : 'RTMP';
    const ingress = await LiveKitService.createIngress(userId, ingressType);
    
    // Update stream with ingress details
    const updatedStream = await StreamService.updateStreamIngress(userId, {
      ingressId: ingress.ingressId,
      serverUrl: ingress.url,
      streamKey: ingress.streamKey,
    });
    
    res.json({
      success: true,
      data: {
        stream: updatedStream,
        credentials: {
          serverUrl: ingress.url,
          streamKey: ingress.streamKey,
        },
        streamMethod,
      },
      message: 'Stream created successfully'
    });
  } catch (error) {
    console.error('[StreamController] Error creating stream:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create stream'
    });
  }
}
```

#### 1.3 New API Endpoint: Get Past Streams

**File**: `backend/src/services/stream.service.ts`

```typescript
/**
 * Get past streams for a creator
 * Note: Current schema only supports one active stream per user
 * This will return historical data once we track stream sessions
 */
static async getPastStreams(userId: string, limit: number = 10, offset: number = 0) {
  // For now, just return the current stream if it exists and was live before
  const stream = await prisma.stream.findUnique({
    where: { userId },
  });
  
  if (!stream) {
    return { streams: [], total: 0 };
  }
  
  // TODO: Once we add StreamSession model, query historical streams
  return {
    streams: stream.isLive ? [] : [stream],
    total: stream.isLive ? 0 : 1,
  };
}
```

#### 1.4 Update Routes

**File**: `backend/src/routes/stream.route.ts`

```typescript
// Add new route
router.post(
  '/create',
  requireAuth,
  requireCreator,
  StreamController.createStreamWithMetadata
);

router.get(
  '/past',
  requireAuth,
  requireCreator,
  StreamController.getPastStreams
);
```

#### 1.5 Validation Schema

**File**: `backend/src/lib/validations/stream.validation.ts`

```typescript
export const createStreamSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  thumbnail: z.string().url().optional(),
  chatSettings: z.object({
    isChatEnabled: z.boolean().optional(),
    isChatDelayed: z.boolean().optional(),
    isChatFollowersOnly: z.boolean().optional(),
  }).optional(),
  streamMethod: z.enum(['browser', 'obs']).default('obs'),
});
```

---

### Phase 2: Frontend - Stream Setup Modal

#### 2.1 Create StreamSetupModal Component

**File**: `frontend/src/components/stream/stream-setup-modal.tsx`

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';
import { toast } from 'sonner';
import { streamApi } from '@/lib/api/stream';
import { FileUpload } from '@/components/ui/file-upload';
import { Video, Key } from 'lucide-react';

interface StreamSetupModalProps {
  open: boolean;
  onClose: () => void;
  onStreamCreated: (stream: any) => void;
}

export function StreamSetupModal({ open, onClose, onStreamCreated }: StreamSetupModalProps) {
  const [step, setStep] = useState<'setup' | 'credentials'>('setup');
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [chatSettings, setChatSettings] = useState({
    isChatEnabled: true,
    isChatDelayed: false,
    isChatFollowersOnly: false,
  });
  
  // Credentials (after creation)
  const [credentials, setCredentials] = useState<any>(null);

  const handleThumbnailUpload = async (file: File) => {
    try {
      setLoading(true);
      // TODO: Implement S3 upload
      // const uploadedUrl = await uploadToS3(file);
      // setThumbnail(uploadedUrl);
      toast.success('Thumbnail uploaded!');
    } catch (error) {
      toast.error('Failed to upload thumbnail');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStream = async (method: 'browser' | 'obs') => {
    if (!title.trim()) {
      toast.error('Please enter a stream title');
      return;
    }

    try {
      setLoading(true);
      const response = await streamApi.createStreamWithMetadata({
        title: title.trim(),
        description: description.trim() || undefined,
        thumbnail,
        chatSettings,
        streamMethod: method,
      });

      if (response.success && response.data) {
        if (method === 'obs') {
          setCredentials(response.data.credentials);
          setStep('credentials');
        } else {
          // Browser streaming - go directly to live
          onStreamCreated(response.data.stream);
          onClose();
        }
      } else {
        toast.error(response.error || 'Failed to create stream');
      }
    } catch (error) {
      toast.error('Failed to create stream');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-zinc-900 border-zinc-800">
        {step === 'setup' ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-white">Create New Stream</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Title */}
              <div>
                <Label htmlFor="title" className="text-zinc-300">
                  Stream Title <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="title"
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
                <Label htmlFor="description" className="text-zinc-300">
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell viewers what you'll be streaming..."
                  className="bg-zinc-800 border-zinc-700 text-white mt-2 min-h-[80px]"
                  maxLength={1000}
                />
              </div>

              {/* Thumbnail Upload */}
              <div>
                <Label className="text-zinc-300">Thumbnail (Optional)</Label>
                <div className="mt-2">
                  <FileUpload
                    onUpload={handleThumbnailUpload}
                    accept="image/*"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
              </div>

              {/* Chat Settings */}
              <div className="space-y-3 pt-2">
                <Label className="text-zinc-300">Chat Settings</Label>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Enable Chat</span>
                  <Switch
                    checked={chatSettings.isChatEnabled}
                    onCheckedChange={(checked) =>
                      setChatSettings((prev) => ({ ...prev, isChatEnabled: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Followers-Only Chat</span>
                  <Switch
                    checked={chatSettings.isChatFollowersOnly}
                    onCheckedChange={(checked) =>
                      setChatSettings((prev) => ({ ...prev, isChatFollowersOnly: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Slow Mode (30s delay)</span>
                  <Switch
                    checked={chatSettings.isChatDelayed}
                    onCheckedChange={(checked) =>
                      setChatSettings((prev) => ({ ...prev, isChatDelayed: checked }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => handleCreateStream('browser')}
                disabled={loading || !title.trim()}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <Video className="w-4 h-4 mr-2" />
                Go Live in Browser
              </Button>
              
              <Button
                onClick={() => handleCreateStream('obs')}
                disabled={loading || !title.trim()}
                variant="outline"
                className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                <Key className="w-4 h-4 mr-2" />
                Stream with OBS
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-white">Stream Keys Generated</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <p className="text-zinc-400">
                Your stream "{title}" is ready! Copy these credentials to OBS.
              </p>

              {/* Server URL */}
              <div>
                <Label className="text-zinc-300">Server URL</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={credentials?.serverUrl || ''}
                    readOnly
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(credentials?.serverUrl || '');
                      toast.success('Copied to clipboard!');
                    }}
                    variant="outline"
                    className="border-zinc-700"
                  >
                    Copy
                  </Button>
                </div>
              </div>

              {/* Stream Key */}
              <div>
                <Label className="text-zinc-300">Stream Key</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={credentials?.streamKey || ''}
                    readOnly
                    type="password"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(credentials?.streamKey || '');
                      toast.success('Copied to clipboard!');
                    }}
                    variant="outline"
                    className="border-zinc-700"
                  >
                    Copy
                  </Button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Setup Instructions:</h4>
                <ol className="text-sm text-zinc-400 space-y-1 list-decimal list-inside">
                  <li>Open OBS Studio</li>
                  <li>Go to Settings → Stream</li>
                  <li>Service: Custom</li>
                  <li>Paste Server URL and Stream Key</li>
                  <li>Click "Start Streaming" in OBS</li>
                </ol>
              </div>

              <Button
                onClick={() => {
                  onStreamCreated(null);
                  onClose();
                }}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Done - Go to Stream Dashboard
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

---

### Phase 3: Frontend - Refactor Streams Page

#### 3.1 Updated Streams Page

**File**: `frontend/src/pages/creator-dashboard/streams/index.tsx`

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Video } from 'lucide-react';
import { StreamSetupModal } from '@/components/stream/stream-setup-modal';
import { useStream } from '@/hooks/useStream';
import { authClient } from '@/lib/auth-client';

export default function Streams() {
  const { data: session } = authClient.useSession();
  const { streamInfo, streamStatus } = useStream();
  const [showSetupModal, setShowSetupModal] = useState(false);

  const handleStreamCreated = (stream: any) => {
    // Refresh stream data
    // Navigate to monitoring view
  };

  // Has active stream
  if (streamInfo?.ingressId) {
    return (
      <div className="space-y-6">
        {/* Active Stream Monitoring View */}
        {/* ... existing monitoring UI ... */}
      </div>
    );
  }

  // No stream - show empty state
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Streams</h1>
          <p className="text-zinc-400">Create and manage your live streams</p>
        </div>
        <Button
          onClick={() => setShowSetupModal(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Stream
        </Button>
      </div>

      {/* Empty State */}
      <Card className="bg-zinc-900 border-zinc-800 p-12">
        <div className="text-center">
          <Video className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Active Stream</h3>
          <p className="text-zinc-400 mb-6">
            Create a new stream to start broadcasting to your audience
          </p>
          <Button
            onClick={() => setShowSetupModal(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Stream
          </Button>
        </div>
      </Card>

      {/* Past Streams Section */}
      <Card className="bg-zinc-900 border-zinc-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Past Streams</h3>
        <p className="text-zinc-400 text-sm">
          Your streaming history will appear here
        </p>
      </Card>

      {/* Setup Modal */}
      <StreamSetupModal
        open={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        onStreamCreated={handleStreamCreated}
      />
    </div>
  );
}
```

---

### Phase 4: Browser Streaming Integration

#### 4.1 LiveKit Publisher Component

**File**: `frontend/src/components/stream/browser-publisher.tsx`

```tsx
import { useEffect, useState } from 'react';
import { LocalVideoTrack, LocalAudioTrack, createLocalVideoTrack, createLocalAudioTrack } from 'livekit-client';
import { LiveKitRoom, VideoTrack, AudioTrack } from '@livekit/components-react';
import { Button } from '@/components/ui/button';
import { Video as VideoIcon, VideoOff, Mic, MicOff } from 'lucide-react';

interface BrowserPublisherProps {
  token: string;
  serverUrl: string;
  onDisconnect: () => void;
}

export function BrowserPublisher({ token, serverUrl, onDisconnect }: BrowserPublisherProps) {
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoTrack, setVideoTrack] = useState<LocalVideoTrack | null>(null);
  const [audioTrack, setAudioTrack] = useState<LocalAudioTrack | null>(null);

  useEffect(() => {
    // Initialize tracks
    const initTracks = async () => {
      try {
        const video = await createLocalVideoTrack();
        const audio = await createLocalAudioTrack();
        setVideoTrack(video);
        setAudioTrack(audio);
      } catch (error) {
        console.error('Failed to get media devices:', error);
      }
    };

    initTracks();

    return () => {
      videoTrack?.stop();
      audioTrack?.stop();
    };
  }, []);

  const toggleVideo = () => {
    if (videoTrack) {
      videoTrack.setEnabled(!videoEnabled);
      setVideoEnabled(!videoEnabled);
    }
  };

  const toggleAudio = () => {
    if (audioTrack) {
      audioTrack.setEnabled(!audioEnabled);
      setAudioEnabled(!audioEnabled);
    }
  };

  return (
    <div className="space-y-4">
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        video={videoTrack}
        audio={audioTrack}
      >
        {/* Video Preview */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          {videoTrack && (
            <VideoTrack track={videoTrack} />
          )}
          {!videoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
              <VideoOff className="w-12 h-12 text-zinc-600" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={toggleVideo}
            variant={videoEnabled ? "outline" : "destructive"}
            size="lg"
          >
            {videoEnabled ? <VideoIcon /> : <VideoOff />}
          </Button>
          
          <Button
            onClick={toggleAudio}
            variant={audioEnabled ? "outline" : "destructive"}
            size="lg"
          >
            {audioEnabled ? <Mic /> : <MicOff />}
          </Button>

          <Button
            onClick={onDisconnect}
            variant="destructive"
            size="lg"
          >
            End Stream
          </Button>
        </div>
      </LiveKitRoom>
    </div>
  );
}
```

---

### Phase 5: Update API Client

#### 5.1 Add New API Methods

**File**: `frontend/src/lib/api/stream.ts`

```typescript
export interface CreateStreamRequest {
  title: string;
  description?: string;
  thumbnail?: string;
  chatSettings?: {
    isChatEnabled?: boolean;
    isChatDelayed?: boolean;
    isChatFollowersOnly?: boolean;
  };
  streamMethod: 'browser' | 'obs';
}

export interface StreamCredentials {
  serverUrl: string;
  streamKey: string;
}

export interface CreateStreamResponse {
  stream: StreamInfo;
  credentials: StreamCredentials;
  streamMethod: 'browser' | 'obs';
}

export const streamApi = {
  // ... existing methods ...

  // Create stream with metadata
  async createStreamWithMetadata(data: CreateStreamRequest): Promise<ApiResponse<CreateStreamResponse>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/stream/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      return await response.json();
    } catch (error) {
      console.error('Error creating stream:', error);
      throw error;
    }
  },

  // Get past streams
  async getPastStreams(limit = 10, offset = 0): Promise<ApiResponse<{ streams: StreamInfo[], total: number }>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${API_BASE_URL}/api/stream/past?limit=${limit}&offset=${offset}`,
        { method: 'GET', headers }
      );

      return await response.json();
    } catch (error) {
      console.error('Error fetching past streams:', error);
      throw error;
    }
  },
};
```

---

## 📝 Implementation Checklist

### Backend (Estimated: 3-4 hours)

- [ ] **Phase 1.1**: Add `description` field to Stream model
  - [ ] Update schema.prisma
  - [ ] Run migration
  - [ ] Update TypeScript types

- [ ] **Phase 1.2**: Create `createStreamWithMetadata` service method
  - [ ] Add to StreamService
  - [ ] Handle metadata creation
  - [ ] Generate ingress (RTMP or WHIP)

- [ ] **Phase 1.3**: Create controller method
  - [ ] Add to StreamController
  - [ ] Validation with Zod
  - [ ] Error handling

- [ ] **Phase 1.4**: Add API routes
  - [ ] POST `/api/stream/create`
  - [ ] GET `/api/stream/past`

- [ ] **Phase 1.5**: Create validation schemas
  - [ ] `createStreamSchema`
  - [ ] Test validation

### Frontend (Estimated: 6-9 hours)

- [ ] **Phase 2.1**: Create StreamSetupModal component
  - [ ] Modal UI with form
  - [ ] Title input (required)
  - [ ] Description textarea
  - [ ] Thumbnail upload (FileUpload component)
  - [ ] Chat settings toggles
  - [ ] Two action buttons (Browser/OBS)

- [ ] **Phase 2.2**: Implement thumbnail upload
  - [ ] S3 upload integration
  - [ ] Image preview
  - [ ] Upload progress
  - [ ] Error handling

- [ ] **Phase 3.1**: Refactor Streams page
  - [ ] Add "Create Stream" button
  - [ ] Empty state UI
  - [ ] Show modal on click
  - [ ] Handle stream creation callback

- [ ] **Phase 3.2**: Add past streams section
  - [ ] Fetch past streams on load
  - [ ] Display stream cards
  - [ ] Pagination (optional)

- [ ] **Phase 4.1**: Browser streaming component
  - [ ] Device selection
  - [ ] LiveKit publisher integration
  - [ ] Camera/mic preview
  - [ ] Toggle controls
  - [ ] End stream button

- [ ] **Phase 5.1**: Update API client
  - [ ] Add `createStreamWithMetadata` method
  - [ ] Add `getPastStreams` method
  - [ ] Update TypeScript types

### Testing (Estimated: 2 hours)

- [ ] **Backend tests**
  - [ ] Test stream creation with metadata
  - [ ] Test validation
  - [ ] Test both RTMP and WHIP ingress

- [ ] **Frontend tests**
  - [ ] Test modal flow
  - [ ] Test form validation
  - [ ] Test OBS credentials display
  - [ ] Test browser streaming (if implemented)

### Optional Enhancements

- [ ] **Stream scheduling**
  - [ ] Add `scheduledFor` field
  - [ ] Create scheduled streams
  - [ ] Reminder notifications

- [ ] **Stream templates**
  - [ ] Save stream settings as templates
  - [ ] Quick create from template

- [ ] **Stream analytics**
  - [ ] Track stream duration
  - [ ] Peak viewer count
  - [ ] Average watch time

---

## 🎯 Success Criteria

### Must Have (MVP)
✅ Creator sets title BEFORE going live
✅ Creator can choose between Browser or OBS streaming
✅ OBS flow shows credentials after setup
✅ Browser streaming works with device selection
✅ Chat settings configured during setup
✅ Stream created with proper metadata

### Should Have
✅ Thumbnail upload working
✅ Description field functional
✅ Past streams list (even if simple)
✅ Smooth modal UX

### Nice to Have
⭐ Stream templates
⭐ Scheduled streams
⭐ Auto-save draft streams
⭐ Stream analytics

---

## 📊 Impact Assessment

### Developer Experience
- ✅ Clearer code organization
- ✅ Simpler state management
- ✅ Better separation of concerns
- ✅ Easier to test

### User Experience
- ✅ More intuitive flow
- ✅ Professional metadata from start
- ✅ Flexibility (Browser vs OBS)
- ✅ Better onboarding

### Technical Debt
- ✅ Removes edit mode complexity
- ✅ Consolidates stream creation logic
- ⚠️ Adds complexity for browser streaming
- ⚠️ May need to handle stream sessions later

---

## 🚀 Rollout Strategy

### Phase 1: Backend (Week 1)
- Days 1-2: Database migration, service layer
- Days 3-4: API endpoints, testing
- Day 5: Documentation, code review

### Phase 2: Frontend (Week 2)
- Days 1-2: Setup modal component
- Days 3-4: Streams page refactor
- Day 5: Integration testing

### Phase 3: Browser Streaming (Week 3 - Optional)
- Days 1-3: LiveKit publisher integration
- Days 4-5: Device management, testing

### Phase 4: Polish (Week 4)
- Days 1-2: Past streams, thumbnail upload
- Days 3-4: Bug fixes, UX improvements
- Day 5: Final testing, deployment

---

## 📌 Notes

### Migration Path
- Old flow (Keys page) can coexist initially
- Add deprecation notice to Keys page
- Eventually remove Keys page after rollout

### Backward Compatibility
- Existing streams (with default title) still work
- No breaking changes to API
- Gradual migration of creators

### Future Considerations
- Multi-stream support (stream sessions)
- Stream recording/VODs
- Stream highlights/clips
- Advanced analytics

---

**Last Updated**: November 1, 2025
**Status**: Planning Complete - Ready for Implementation
**Estimated Time**: 10-15 hours total development
