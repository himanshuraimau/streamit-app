# Streaming Application Migration Guide

## Overview
This guide outlines the architecture of a LiveKit-based streaming platform built with Next.js and how to migrate it to a Node.js backend + React frontend setup.

## Current Architecture

### Database Schema (Prisma)
```prisma
model User {
  id             String  @id @default(uuid())
  username       String  @unique
  imageUrl       String
  externalUserId String  @unique
  bio            String?
  
  following  Follow[] @relation("Following")
  followedBy Follow[] @relation("FollowedBy")
  blocking   Block[]  @relation("Blocking")
  blockedBy  Block[]  @relation("BlockedBy")
  stream     Stream?
}

model Stream {
  id           String  @id @default(uuid())
  title        String
  thumbnail    String?
  
  ingressId    String? @unique
  serverUrl    String?
  streamKey    String?
  
  isLive                Boolean @default(false)
  isChatEnabled         Boolean @default(true)
  isChatDelayed         Boolean @default(false)
  isChatFollowersOnly   Boolean @default(false)
  
  userId       String  @unique
  user         User    @relation(fields: [userId], references: [id])
}
```

### Core Components

#### 1. LiveKit Configuration
- **Environment Variables Required:**
  - `LIVEKIT_URL` - LiveKit server URL
  - `LIVEKIT_API_KEY` - API key for server operations
  - `LIVEKIT_API_SECRET` - API secret for authentication
  - `NEXT_PUBLIC_LIVEKIT_WS_URL` - WebSocket URL for client connections

#### 2. Ingress Management (Stream Key Creation)
**File:** `src/actions/ingress.ts`

**Purpose:** Creates streaming endpoints for broadcasters

**Key Functions:**
- `resetIngresses()` - Cleans up existing ingress points and rooms
- `createIngress()` - Creates new ingress with stream key and server URL

**Flow:**
1. Delete existing ingresses and rooms for user
2. Create ingress options (RTMP or WHIP)
3. Set video/audio encoding presets
4. Generate ingress with LiveKit client
5. Save ingress ID, server URL, and stream key to database

```typescript
// Key code structure
const ingressClient = new IngressClient(process.env.LIVEKIT_URL!);
const ingress = await ingressClient.createIngress(ingressType, options);
await db.stream.update({
  where: { userId: self.id },
  data: {
    ingressId: ingress.ingressId,
    serverUrl: ingress.url,
    streamKey: ingress.streamKey,
  },
});
```

#### 3. Viewer Token Generation
**File:** `src/actions/token.ts`

**Purpose:** Creates JWT tokens for viewers to join streams

**Flow:**
1. Get current user or create guest user
2. Verify host exists and user isn't blocked
3. Create AccessToken with appropriate permissions
4. Grant room access with publish permissions based on role

```typescript
const token = new AccessToken(apiKey, apiSecret, {
  identity: tokenIdentity,
  name: username,
});

token.addGrant({
  room: hostId,
  roomJoin: true,
  canPublish: false,  // Only host can publish
  canPublishData: true,  // Allow chat messages
});
```

#### 4. Stream Player Component
**File:** `src/components/stream-player/index.tsx`

**Purpose:** Main streaming interface component

**Key Features:**
- LiveKit room connection
- Video player with live/offline states
- Real-time chat integration
- Stream info and controls

```tsx
<LiveKitRoom
  token={token}
  serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_WS_URL!}
>
  <Video hostName={user.username} hostIdentity={user.id} />
  <Chat
    viewerName={name}
    hostName={user.username}
    hostIdentity={user.id}
    isFollowing={isFollowing}
    isChatEnabled={stream.isChatEnabled}
  />
</LiveKitRoom>
```

#### 5. Video Component
**File:** `src/components/stream-player/video.tsx`

**Purpose:** Handles video display with connection states

**States:**
- `OfflineVideo` - When streamer is not broadcasting
- `LoadingVideo` - During connection/buffering
- `LiveVideo` - Active stream playback

#### 6. Chat System
**File:** `src/components/stream-player/chat.tsx`

**Purpose:** Real-time chat using LiveKit's data channel

**Features:**
- Real-time messaging via LiveKit
- Chat moderation (followers-only, delayed)
- Community participant list
- Message history

#### 7. Webhook Handler
**File:** `src/app/api/webhook/livekit/route.ts`

**Purpose:** Handles LiveKit events to update stream status

**Events:**
- `ingress_started` - Sets stream as live
- `ingress_ended` - Sets stream as offline

## Migration to Node.js + React

### Backend (Node.js/Express)

#### 1. Dependencies
```json
{
  "dependencies": {
    "livekit-server-sdk": "^2.14.0",
    "prisma": "^6.16.3",
    "@prisma/client": "^6.16.3",
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0"
  }
}
```

#### 2. API Endpoints Structure
```
/api
  /auth
    POST /login
    POST /register
    GET /me
  /stream
    POST /ingress        # Create stream key
    DELETE /ingress      # Reset ingress
    GET /token/:hostId   # Get viewer token
    GET /:hostId         # Get stream info
  /webhook
    POST /livekit        # Handle LiveKit events
```

#### 3. Core Services

**Ingress Service:**
```javascript
const { IngressClient, RoomServiceClient } = require('livekit-server-sdk');

class IngressService {
  async createIngress(userId, ingressType) {
    // Reset existing ingresses
    await this.resetIngresses(userId);
    
    // Create new ingress
    const ingress = await this.ingressClient.createIngress(ingressType, options);
    
    // Save to database
    await this.prisma.stream.update({
      where: { userId },
      data: {
        ingressId: ingress.ingressId,
        serverUrl: ingress.url,
        streamKey: ingress.streamKey,
      },
    });
    
    return ingress;
  }
}
```

**Token Service:**
```javascript
const { AccessToken } = require('livekit-server-sdk');

class TokenService {
  async createViewerToken(hostId, viewerId) {
    const token = new AccessToken(apiKey, apiSecret, {
      identity: viewerId,
      name: username,
    });

    token.addGrant({
      room: hostId,
      roomJoin: true,
      canPublish: false,
      canPublishData: true,
    });

    return token.toJwt();
  }
}
```

### Frontend (React)

#### 1. Dependencies
```json
{
  "dependencies": {
    "@livekit/components-react": "^2.9.15",
    "livekit-client": "^2.15.11",
    "react": "^18.0.0",
    "axios": "^1.0.0"
  }
}
```

#### 2. Main Components

**StreamPlayer Component:**
```jsx
import { LiveKitRoom } from '@livekit/components-react';

function StreamPlayer({ hostId }) {
  const [token, setToken] = useState(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    // Fetch viewer token from backend
    fetch(`/api/stream/token/${hostId}`)
      .then(res => res.json())
      .then(data => setToken(data.token));
      
    // Fetch stream info
    fetch(`/api/stream/${hostId}`)
      .then(res => res.json())
      .then(data => setStream(data.stream));
  }, [hostId]);

  if (!token || !stream) return <div>Loading...</div>;

  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.REACT_APP_LIVEKIT_WS_URL}
    >
      <VideoComponent hostId={hostId} />
      <ChatComponent 
        hostId={hostId}
        isChatEnabled={stream.isChatEnabled}
      />
    </LiveKitRoom>
  );
}
```

**Video Component:**
```jsx
import { useRemoteParticipant, useTracks } from '@livekit/components-react';

function VideoComponent({ hostId }) {
  const participant = useRemoteParticipant(hostId);
  const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone])
    .filter(track => track.participant.identity === hostId);

  if (!participant) return <OfflineVideo />;
  if (tracks.length === 0) return <LoadingVideo />;
  return <LiveVideo participant={participant} />;
}
```

**Chat Component:**
```jsx
import { useChat } from '@livekit/components-react';

function ChatComponent({ hostId, isChatEnabled }) {
  const { chatMessages, send } = useChat();
  const [message, setMessage] = useState('');

  const sendMessage = () => {
    if (send && message.trim()) {
      send(message);
      setMessage('');
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {chatMessages.map(msg => (
          <div key={msg.timestamp}>
            <strong>{msg.from?.name}:</strong> {msg.message}
          </div>
        ))}
      </div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        disabled={!isChatEnabled}
      />
    </div>
  );
}
```

### Environment Configuration

**Backend (.env):**
```
DATABASE_URL="postgresql://..."
LIVEKIT_URL="wss://your-livekit-server.com"
LIVEKIT_API_KEY="your-api-key"
LIVEKIT_API_SECRET="your-api-secret"
```

**Frontend (.env):**
```
REACT_APP_API_URL="http://localhost:3001"
REACT_APP_LIVEKIT_WS_URL="wss://your-livekit-server.com"
```

### Key Integration Points

1. **Database:** Use Prisma with PostgreSQL for user/stream data
2. **Authentication:** Implement JWT-based auth for API endpoints
3. **Real-time:** LiveKit handles video/audio streaming and chat
4. **Webhooks:** Handle LiveKit events to update stream status
5. **State Management:** Use React state/context for UI state

### Migration Steps

1. Implement LiveKit services (ingress, token, webhook)
2. Create React frontend with LiveKit components
3. Connect frontend to backend APIs
4. Test streaming workflow: ingress creation → token generation → stream viewing
5. Implement chat and additional features

This architecture provides a clean separation between backend stream management and frontend user interface while maintaining real-time capabilities through LiveKit.