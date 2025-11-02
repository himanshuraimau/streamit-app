# Streaming Implementation Plan - React + Node.js

## 🎯 Overview
This plan adapts the Next.js streaming flow to your React + Node.js architecture while maintaining the same LiveKit WebRTC functionality for viewing streams and real-time chat.

## 📋 Current Issues Analysis

### ❌ Problem 1: Creators Cannot See Their Own Stream
**Current State:**
- Creators watch via dashboard but likely need special handling
- Token generation may not properly identify creator viewing own stream

**Root Cause:**
- Missing "Host-{userId}" identity prefix for creator tokens
- No distinction between creator viewing and regular viewers

### ❌ Problem 2: Anonymous Users Cannot Watch Streams
**Current State:**
- Guest token generation exists but may not be properly wired
- Frontend might require authentication when it shouldn't

**Root Cause:**
- Frontend may be blocking unauthenticated users
- Guest name generation working but validation might fail

### ❌ Problem 3: Chat Not Working
**Current State:**
- LiveKit components likely not properly integrated
- Real-time messaging via data channel may not be connected

**Root Cause:**
- Missing LiveKit React components setup (`<LiveKitRoom>`, `useChat()`)
- WebRTC data channel permissions or initialization issues

---

## 🏗️ Architecture Comparison

### Original Next.js Flow
```
User → Next.js Page → Server Action → Token Generation → LiveKit Room
```

### Your React + Node.js Flow
```
User → React Page → API Call → Node.js Controller → Token Generation → LiveKit Room
```

**Key Difference:** API-based instead of Server Actions, but LiveKit integration stays identical.

---

## 📦 Phase 1: Install LiveKit React Components

### Dependencies Needed
```json
{
  "@livekit/components-react": "^2.0.0",
  "@livekit/components-styles": "^1.0.12",
  "livekit-client": "^2.0.0"
}
```

### Installation
```bash
cd frontend
BUN install @livekit/components-react @livekit/components-styles livekit-client
```

---

## 🔧 Phase 2: Fix Backend Token Generation

### Task 2.1: Add Creator Self-View Token Method

**File:** `/backend/src/services/token.service.ts`

**Add new method:**
```typescript
/**
 * Generate viewer token for creator watching their own stream
 * Uses "Host-{userId}" identity prefix to distinguish from regular viewers
 */
static async generateCreatorViewerToken(
  userId: string,
  roomId: string
): Promise<string> {
  try {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error('Missing LiveKit API credentials');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, name: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    console.log(`[TokenService] Generating creator self-view token for ${user.username}`);

    // Use "Host-" prefix to identify creator in participant list
    const hostIdentity = `Host-${userId}`;

    const token = new AccessToken(apiKey, apiSecret, {
      identity: hostIdentity,
      name: user.name || user.username,
    });

    token.addGrant({
      room: roomId,
      roomJoin: true,
      canPublish: false,      // Creator views via OBS, not browser
      canPublishData: true,   // Can send chat messages
      canSubscribe: true,     // Can see video/audio from OBS
    });

    const jwt = await token.toJwt();
    console.log(`[TokenService] Creator self-view token generated`);
    return jwt;
  } catch (error) {
    console.error('[TokenService] Error generating creator self-view token:', error);
    throw error;
  }
}
```

### Task 2.2: Update ViewerController to Handle Creator Self-View

**File:** `/backend/src/controllers/viewer.controller.ts`

**Modify `getViewerToken` method:**
```typescript
static async getViewerToken(req: Request, res: Response) {
  try {
    const { hostId, guestName } = req.body;

    if (!hostId) {
      return res.status(400).json({
        success: false,
        error: 'Host ID is required',
      });
    }

    const viewerId = req.user?.id;
    const viewerName = req.user?.name || req.user?.username || guestName;

    // NEW: Check if viewer IS the host (creator watching own stream)
    const isCreator = viewerId && viewerId === hostId;

    let token: string;
    let identity: string;
    let name: string;

    if (isCreator) {
      // Generate special creator viewer token
      token = await TokenService.generateCreatorViewerToken(viewerId!, hostId);
      identity = `Host-${viewerId}`;
      name = viewerName!;
      console.log(`[ViewerController] Generated creator self-view token`);
    } else if (viewerId && viewerName) {
      // Regular authenticated viewer
      const validation = await TokenService.validateTokenRequest(hostId, viewerId);
      if (!validation.valid) {
        return res.status(403).json({
          success: false,
          error: validation.reason || 'Access denied',
        });
      }

      token = await TokenService.generateViewerToken(viewerId, hostId, viewerName);
      identity = viewerId;
      name = viewerName;
    } else if (guestName) {
      // Guest viewer
      const validation = await TokenService.validateTokenRequest(hostId);
      if (!validation.valid) {
        return res.status(403).json({
          success: false,
          error: validation.reason || 'Access denied',
        });
      }

      token = await TokenService.generateGuestToken(hostId, guestName);
      identity = `guest-${Date.now()}`;
      name = guestName;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Guest name is required for anonymous viewers',
      });
    }

    res.json({
      success: true,
      data: {
        token,
        identity,
        name,
        wsUrl: process.env.LIVEKIT_URL || '',
      },
    });
  } catch (error) {
    // ... error handling
  }
}
```

---

## 🎨 Phase 3: Implement LiveKit Components in Frontend

### Task 3.1: Create LiveKit Video Component

**File:** `/frontend/src/pages/watch/_components/video-component.tsx`

**Replace with proper LiveKit integration:**

```typescript
import { useEffect, useRef } from 'react';
import { 
  useConnectionState,
  useRemoteParticipant,
  useTracks,
  VideoTrack,
  ConnectionState
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Loader2, WifiOff } from 'lucide-react';

interface VideoComponentProps {
  hostIdentity: string;
  hostName: string;
}

export function VideoComponent({ hostIdentity, hostName }: VideoComponentProps) {
  const connectionState = useConnectionState();
  const participant = useRemoteParticipant(hostIdentity);
  
  // Get video track from host
  const tracks = useTracks([Track.Source.Camera])
    .filter((track) => track.participant.identity === hostIdentity);

  // State 1: Offline - Connected but host not streaming
  if (!participant && connectionState === ConnectionState.Connected) {
    return <OfflineVideo username={hostName} />;
  }

  // State 2: Loading - Connecting or waiting for tracks
  if (!participant || tracks.length === 0) {
    return <LoadingVideo connectionState={connectionState} />;
  }

  // State 3: Live - Host is streaming
  const videoTrack = tracks[0];
  return (
    <div className="relative aspect-video bg-zinc-900 rounded-lg overflow-hidden">
      <VideoTrack 
        trackRef={videoTrack} 
        className="w-full h-full object-contain"
      />
      <LiveBadge />
    </div>
  );
}

function OfflineVideo({ username }: { username: string }) {
  return (
    <div className="aspect-video bg-zinc-900 rounded-lg border border-zinc-800 flex items-center justify-center">
      <div className="text-center space-y-4 px-6">
        <WifiOff className="w-16 h-16 text-zinc-600 mx-auto" />
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Stream Offline</h3>
          <p className="text-zinc-400">
            {username} is not streaming right now
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingVideo({ connectionState }: { connectionState: ConnectionState }) {
  return (
    <div className="aspect-video bg-zinc-900 rounded-lg border border-zinc-800 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto" />
        <p className="text-zinc-400">
          {connectionState === ConnectionState.Connecting ? 'Connecting...' : 'Loading stream...'}
        </p>
      </div>
    </div>
  );
}

function LiveBadge() {
  return (
    <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
      <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
      <span className="text-white font-semibold text-sm">LIVE</span>
    </div>
  );
}
```

### Task 3.2: Create LiveKit Chat Component

**File:** `/frontend/src/pages/watch/_components/chat-component.tsx`

**Replace with proper LiveKit chat:**

```typescript
import { useState, useMemo, useCallback } from 'react';
import { useChat, useConnectionState, useRemoteParticipant, ConnectionState } from '@livekit/components-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageCircle, Lock } from 'lucide-react';
import moment from 'moment';

interface ChatComponentProps {
  hostIdentity: string;
  hostName: string;
  viewerName: string;
  isFollowing: boolean;
  isChatEnabled: boolean;
  isChatDelayed: boolean;
  isChatFollowersOnly: boolean;
}

export function ChatComponent({
  hostIdentity,
  hostName,
  viewerName,
  isFollowing,
  isChatEnabled,
  isChatDelayed,
  isChatFollowersOnly,
}: ChatComponentProps) {
  const [message, setMessage] = useState('');
  const [isDelayBlocked, setIsDelayBlocked] = useState(false);

  const connectionState = useConnectionState();
  const participant = useRemoteParticipant(hostIdentity);
  
  // LiveKit chat hook - handles data channel messaging
  const { chatMessages, send } = useChat();

  // Check if host is online
  const isOnline = participant && connectionState === ConnectionState.Connected;
  const isChatHidden = !isChatEnabled || !isOnline;

  // Sort messages (newest first for reverse display)
  const sortedMessages = useMemo(() => {
    return [...chatMessages].sort((a, b) => b.timestamp - a.timestamp);
  }, [chatMessages]);

  // Check permissions
  const isFollowersOnlyAndNotFollowing = isChatFollowersOnly && !isFollowing;
  const isDisabled = isChatHidden || isDelayBlocked || isFollowersOnlyAndNotFollowing;

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isDisabled || !send) return;

    // Handle delayed chat (3 second cooldown)
    if (isChatDelayed && !isDelayBlocked) {
      setIsDelayBlocked(true);
      setTimeout(() => {
        setIsDelayBlocked(false);
        send(message.trim());
        setMessage('');
      }, 3000);
    } else {
      send(message.trim());
      setMessage('');
    }
  }, [message, isDisabled, isChatDelayed, isDelayBlocked, send]);

  if (isChatHidden) {
    return (
      <Card className="bg-zinc-900 border-zinc-800 h-full flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <MessageCircle className="w-12 h-12 text-zinc-600 mx-auto" />
          <p className="text-zinc-400">
            {!isChatEnabled ? 'Chat is disabled' : 'Waiting for stream...'}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800 flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b border-zinc-800 p-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Stream Chat
        </h3>
        {isChatFollowersOnly && (
          <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Followers only
          </p>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col-reverse space-y-reverse space-y-2">
          {sortedMessages.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-8">
              Be the first to send a message!
            </p>
          ) : (
            sortedMessages.map((msg) => (
              <ChatMessage key={msg.timestamp} message={msg} />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="border-t border-zinc-800 p-4 space-y-2">
        {isFollowersOnlyAndNotFollowing && (
          <p className="text-xs text-yellow-500 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Follow {hostName} to chat
          </p>
        )}
        {isChatDelayed && isDelayBlocked && (
          <p className="text-xs text-blue-400">
            Slow mode: Wait 3 seconds...
          </p>
        )}
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isDisabled ? 'Chat unavailable' : 'Send a message...'}
            disabled={isDisabled}
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
          />
          <Button 
            type="submit" 
            disabled={isDisabled}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
}

interface ChatMessageProps {
  message: {
    timestamp: number;
    from?: {
      name?: string;
      identity: string;
    };
    message: string;
  };
}

function ChatMessage({ message }: ChatMessageProps) {
  const color = stringToColor(message.from?.name || message.from?.identity || 'Anonymous');
  const isHost = message.from?.identity.startsWith('Host-');
  
  return (
    <div className="flex gap-2 p-2 rounded hover:bg-zinc-800/50 transition-colors">
      <span className="text-xs text-zinc-500 shrink-0">
        {moment(message.timestamp).format('HH:mm')}
      </span>
      <div className="flex-1 min-w-0">
        <span 
          className="font-semibold text-sm"
          style={{ color }}
        >
          {message.from?.name || 'Anonymous'}
          {isHost && (
            <span className="ml-1 text-xs bg-purple-600/20 text-purple-400 px-1.5 py-0.5 rounded">
              HOST
            </span>
          )}
        </span>
        <span className="text-zinc-300 text-sm ml-1">
          {message.message}
        </span>
      </div>
    </div>
  );
}

// Generate consistent color from string
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`;
}
```

### Task 3.3: Update Stream Layout with LiveKitRoom

**File:** `/frontend/src/pages/watch/_components/stream-layout.tsx`

**Wrap everything in LiveKitRoom:**

```typescript
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';
import { VideoComponent } from './video-component';
import { ChatComponent } from './chat-component';
import { Card } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import type { ViewerTokenResponse } from '@/lib/api/stream';

interface StreamLayoutProps {
  token: ViewerTokenResponse | null;
  loading: boolean;
  error: string | null;
  streamInfo: {
    title: string;
    description?: string;
    isChatEnabled: boolean;
    isChatDelayed: boolean;
    isChatFollowersOnly: boolean;
  };
  hostName: string;
  hostIdentity: string;
  isFollowing: boolean;
  onRetry: () => void;
  variant?: 'viewer' | 'creator';
}

export function StreamLayout({
  token,
  loading,
  error,
  streamInfo,
  hostName,
  hostIdentity,
  isFollowing,
  onRetry,
  variant = 'viewer',
}: StreamLayoutProps) {
  // Loading state
  if (loading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800 p-8">
        <div className="flex items-center justify-center space-x-3">
          <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
          <p className="text-white">Connecting to stream...</p>
        </div>
      </Card>
    );
  }

  // Error state
  if (error || !token) {
    return (
      <Card className="bg-zinc-900 border-zinc-800 p-8">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-white font-semibold">Failed to connect</p>
          <p className="text-zinc-400 text-sm">{error || 'Unable to generate access token'}</p>
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  // Connected state - LiveKit Room
  return (
    <LiveKitRoom
      token={token.token}
      serverUrl={token.wsUrl}
      connect={true}
      audio={false}
      video={false}
      className="h-full"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Video Section */}
        <div className="lg:col-span-2 space-y-4">
          <VideoComponent 
            hostIdentity={hostIdentity}
            hostName={hostName}
          />
          
          {/* Stream Info */}
          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <h2 className="text-xl font-bold text-white">{streamInfo.title}</h2>
            {streamInfo.description && (
              <p className="text-zinc-400 mt-2">{streamInfo.description}</p>
            )}
          </Card>
        </div>

        {/* Chat Section */}
        <div className="lg:col-span-1">
          <ChatComponent
            hostIdentity={hostIdentity}
            hostName={hostName}
            viewerName={token.name}
            isFollowing={isFollowing}
            isChatEnabled={streamInfo.isChatEnabled}
            isChatDelayed={streamInfo.isChatDelayed}
            isChatFollowersOnly={streamInfo.isChatFollowersOnly}
          />
        </div>
      </div>
    </LiveKitRoom>
  );
}
```

---

## 🔐 Phase 4: Update Frontend API Client

### Task 4.1: Ensure Token API Supports All Cases

**File:** `/frontend/src/lib/api/stream.ts`

**Verify getViewerToken method:**

```typescript
export interface ViewerTokenResponse {
  token: string;
  identity: string;
  name: string;
  wsUrl: string;
}

async getViewerToken(
  hostId: string, 
  guestName?: string
): Promise<ApiResponse<ViewerTokenResponse>> {
  try {
    // Automatically includes auth token if available via authClient
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/api/viewer/token`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ hostId, guestName }),
    });

    return await response.json();
  } catch (err) {
    console.error('Error fetching viewer token:', err);
    return {
      success: false,
      error: 'Failed to get viewer token',
    };
  }
}
```

---

## ✅ Phase 5: Testing Checklist

### Test 1: Anonymous User Viewing
1. Open incognito/private window
2. Navigate to `/{username}` or `/watch?username={username}`
3. **Expected:** Auto-generate guest name, show stream + chat
4. **Verify:** Can see video, can send messages, username shows as guest

### Test 2: Authenticated User Viewing
1. Sign in as regular user
2. Navigate to creator's stream
3. **Expected:** Show stream with real username
4. **Verify:** Username correct, chat works, follow status accurate

### Test 3: Creator Self-View
1. Sign in as creator
2. Start stream via OBS
3. Navigate to own stream page
4. **Expected:** See own video feed from OBS, identity shows as `Host-{userId}`
5. **Verify:** Video displays, chat works, can interact

### Test 4: Chat Restrictions
1. Test with `isChatFollowersOnly: true`
   - Non-follower should see "Follow to chat" message
   - Follower should be able to chat
2. Test with `isChatDelayed: true`
   - Should enforce 3-second cooldown between messages
3. Test with `isChatEnabled: false`
   - Should show "Chat disabled" message

### Test 5: Offline Behavior
1. Stop OBS stream
2. Refresh page
3. **Expected:** Show "Stream Offline" placeholder
4. **Verify:** No errors, graceful offline state

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot read property 'send' of undefined"
**Solution:** Ensure `<LiveKitRoom>` wraps components using `useChat()`

### Issue: "No video tracks found"
**Solution:** 
- Check OBS is streaming to correct RTMP URL
- Verify ingress is created (`ingressId` exists)
- Check LiveKit webhook is updating `isLive` status

### Issue: "Blocked by CORS"
**Solution:** 
- Add LiveKit URL to CORS whitelist in backend
- Ensure `LIVEKIT_URL` is accessible from browser

### Issue: Guest users see authentication error
**Solution:**
- Check `optionalAuth` middleware is applied to `/api/viewer/token`
- Verify `guestName` is being sent in request body

---

## 📝 Environment Variables Checklist

### Backend (.env)
```env
LIVEKIT_API_KEY=your_key
LIVEKIT_API_SECRET=your_secret
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_WEBHOOK_SECRET=your_webhook_secret
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
VITE_LIVEKIT_URL=wss://your-livekit-server.com
```

---

## 🚀 Deployment Order

1. ✅ Install LiveKit React packages
2. ✅ Update backend token service (creator self-view)
3. ✅ Update viewer controller (detect creator)
4. ✅ Replace frontend video component with LiveKit
5. ✅ Replace frontend chat component with LiveKit
6. ✅ Update stream layout with LiveKitRoom wrapper
7. ✅ Test all three scenarios (anonymous, authenticated, creator)
8. ✅ Verify chat permissions and restrictions work

---

## 📚 Key Differences from Next.js

| Aspect | Next.js (Original) | React + Node.js (Yours) |
|--------|-------------------|-------------------------|
| **Routing** | File-based (`/[username]`) | React Router (`/:username`) |
| **Data Fetching** | Server Components | useEffect + API calls |
| **Token Generation** | Server Actions | REST API endpoints |
| **Auth** | Clerk middleware | better-auth with JWT |
| **LiveKit Integration** | Same | Same (no change) |

**Bottom Line:** LiveKit components and logic stay exactly the same. Only the data fetching and authentication layers differ.

---

## 🎯 Success Criteria

- [ ] Anonymous users can watch streams without logging in
- [ ] Authenticated users see their real username in chat
- [ ] Creators can view their own stream with "Host-{userId}" identity
- [ ] Chat messages send/receive in real-time via data channel
- [ ] Followers-only chat restriction works correctly
- [ ] Delayed chat (3s cooldown) works correctly
- [ ] Offline state shows graceful placeholder
- [ ] No CORS or authentication errors

---

**END OF PLAN**
