# Live Streaming System Documentation

This document provides a comprehensive overview of how live streaming works in StreamIt, covering both backend and frontend implementations.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   OBS/Encoder   │────▶│    LiveKit      │────▶│    Viewers      │
│   (RTMP/WHIP)   │     │    Server       │     │   (Browser)     │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 │ Webhooks
                                 ▼
                        ┌─────────────────┐
                        │  Backend API    │
                        │  (Express.js)   │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   PostgreSQL    │
                        │   (Prisma)      │
                        └─────────────────┘
```

## Key Components

### 1. LiveKit Integration
- **Provider**: LiveKit Cloud (or self-hosted)
- **Protocols**: RTMP (OBS) and WHIP (browser-based)
- **Features**: Real-time video/audio streaming, chat via data channels

### 2. Backend Services

| Service | File | Purpose |
|---------|------|---------|
| LiveKitService | `backend/src/services/livekit.service.ts` | LiveKit SDK operations (ingress, rooms) |
| StreamService | `backend/src/services/stream.service.ts` | Stream business logic |
| TokenService | `backend/src/services/token.service.ts` | JWT token generation for viewers |
| WebhookService | `backend/src/services/webhook.service.ts` | LiveKit webhook processing |

### 3. Frontend Components

| Component | File | Purpose |
|-----------|------|---------|
| StreamPlayer | `frontend/src/components/stream/stream-player.tsx` | Main player wrapper |
| StreamLayout | `frontend/src/pages/watch/_components/stream-layout.tsx` | LiveKit room + video + chat layout |
| VideoComponent | `frontend/src/pages/watch/_components/video-component.tsx` | Video display |
| ChatComponent | `frontend/src/pages/watch/_components/chat-component.tsx` | Live chat |

---

## Database Schema (Stream Model)

```prisma
model Stream {
  id          String  @id @default(cuid())
  title       String  @db.Text
  description String? @db.Text
  thumbnail   String? @db.Text

  // LiveKit Infrastructure
  ingressId String? @unique  // LiveKit ingress ID
  serverUrl String? @db.Text // RTMP server URL
  streamKey String? @db.Text // Stream key for OBS

  // Status
  isLive Boolean @default(false)

  // Chat Settings
  isChatEnabled       Boolean @default(true)
  isChatDelayed       Boolean @default(false)
  isChatFollowersOnly Boolean @default(false)

  // Creator (1:1 relationship)
  userId String @unique
  user   User   @relation(...)
}
```

---

## Flow 1: Creator Sets Up Stream

### Step 1: Generate Stream Key (Keys Page)

**Frontend**: `frontend/src/pages/creator-dashboard/keys/index.tsx`

```typescript
// User clicks "Generate Key"
const response = await streamApi.createIngress('RTMP');
// Returns: { serverUrl, streamKey, ingressId }
```

**API Call**: `POST /api/stream/ingress`

**Backend Flow**:
1. `StreamController.createIngress()` validates creator is approved
2. `StreamService.createStreamIngress()` calls LiveKit
3. `LiveKitService.createIngress()` creates RTMP ingress
4. Database updated with `ingressId`, `serverUrl`, `streamKey`

### Step 2: Configure OBS

Creator copies credentials to OBS:
- **Server URL**: `rtmp://...` (from `serverUrl`)
- **Stream Key**: `sk_...` (from `streamKey`)

---

## Flow 2: Creator Goes Live

### Step 1: Start Streaming in OBS

When OBS connects and starts streaming:

1. **LiveKit receives RTMP stream**
2. **LiveKit sends webhook** to backend: `ingress_started`

### Step 2: Webhook Processing

**Endpoint**: `POST /api/webhook/livekit`

**Backend Flow** (`webhook.service.ts`):
```typescript
// ingress_started event
async handleIngressStarted(event) {
  const ingressId = event.ingressInfo?.ingressId;
  await StreamService.setStreamLive(ingressId, true);
  // Updates: stream.isLive = true
}
```

### Step 3: Stream Goes Offline

When OBS stops streaming:
1. LiveKit sends `ingress_ended` webhook
2. Backend sets `stream.isLive = false`

---

## Flow 3: Viewer Watches Stream

### Step 1: Navigate to Stream

**URL**: `/:username/live`

**Frontend**: `frontend/src/pages/watch/index.tsx`

```typescript
// Fetch stream info
const response = await viewerApi.getStreamByUsername(username);
// Returns stream metadata (no sensitive data like streamKey)
```

### Step 2: Get Viewer Token

**Frontend**: `frontend/src/components/stream/stream-player.tsx`

```typescript
// Request token to join LiveKit room
const response = await streamApi.getViewerToken(hostId, guestName);
// Returns: { token, identity, name, wsUrl }
```

**API Call**: `POST /api/viewer/token`

**Backend Flow** (`viewer.controller.ts` → `token.service.ts`):

```typescript
// For authenticated users
const token = await TokenService.generateViewerToken(viewerId, hostId, viewerName);

// For guests
const token = await TokenService.generateGuestToken(hostId, guestName);
```

**Token Permissions**:
| User Type | canPublish | canPublishData | canSubscribe |
|-----------|------------|----------------|--------------|
| Creator (OBS) | ✅ | ✅ | ✅ |
| Creator (self-view) | ❌ | ✅ | ✅ |
| Viewer | ❌ | ✅ (chat) | ✅ |
| Guest | ❌ | ✅ (chat) | ✅ |

### Step 3: Connect to LiveKit Room

**Frontend**: `frontend/src/pages/watch/_components/stream-layout.tsx`

```tsx
<LiveKitRoom
  token={token.token}
  serverUrl={token.wsUrl}
  connect={true}
>
  <VideoComponent hostIdentity={hostId} />
  <ChatComponent ... />
</LiveKitRoom>
```

---

## Flow 4: Creator Watches Own Stream

When creator views their stream in the dashboard:

**API Call**: `POST /api/stream/creator-token`

**Token Identity**: `Host-{userId}` (prefixed to avoid conflicts with OBS identity)

**Permissions**: Subscribe-only (no publish, since OBS is publishing)

---

## API Endpoints Summary

### Stream Management (Creator-only, requires auth + creator approval)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/stream/create` | Create stream with metadata + ingress |
| POST | `/api/stream/ingress` | Generate stream key (legacy) |
| DELETE | `/api/stream/ingress` | Delete stream key |
| GET | `/api/stream/info` | Get stream info (no key) |
| GET | `/api/stream/credentials` | Get stream key + server URL |
| PUT | `/api/stream/info` | Update title/thumbnail |
| PUT | `/api/stream/chat-settings` | Update chat settings |
| GET | `/api/stream/status` | Get live status + viewer count |
| POST | `/api/stream/creator-token` | Get token for self-view |

### Viewer Endpoints (Public/Optional Auth)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/viewer/stream/:username` | Get stream by username |
| POST | `/api/viewer/token` | Get viewer token |
| GET | `/api/viewer/live` | Get all live streams |
| GET | `/api/viewer/following` | Get followed creators' streams |
| GET | `/api/viewer/recommended` | Get recommended streams |

### Webhook Endpoint

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/webhook/livekit` | Receive LiveKit webhooks |

---

## LiveKit Service Methods

```typescript
class LiveKitService {
  // Ingress Management
  static async createIngress(userId, ingressType: 'RTMP' | 'WHIP')
  static async deleteIngress(ingressId)
  static async listIngresses(roomName?)
  static async resetUserIngresses(userId)

  // Room Management
  static async deleteRoom(roomName)
  static async listRooms()
  static async listParticipants(roomName)
}
```

---

## Token Service Methods

```typescript
class TokenService {
  // Token Generation
  static async generateCreatorToken(userId, roomId)      // Full publish permissions
  static async generateCreatorViewerToken(userId, roomId) // Subscribe-only for self-view
  static async generateViewerToken(viewerId, hostId, username)
  static async generateGuestToken(hostId, guestName)

  // Validation
  static async validateTokenRequest(hostId, viewerId?)
  static async isUserBlocked(userId, blockerId)
  static async isFollowing(followerId, followingId)
}
```

---

## Webhook Events Handled

| Event | Handler | Action |
|-------|---------|--------|
| `ingress_started` | `handleIngressStarted` | Set `isLive = true` |
| `ingress_ended` | `handleIngressEnded` | Set `isLive = false` |
| `room_finished` | `handleRoomFinished` | Cleanup (logging) |
| `participant_joined` | `handleParticipantJoined` | Analytics (logging) |
| `participant_left` | `handleParticipantLeft` | Analytics (logging) |
| `track_published` | `handleTrackPublished` | Analytics (logging) |
| `track_unpublished` | `handleTrackUnpublished` | Analytics (logging) |

---

## Environment Variables

### Backend
```env
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
```

### Frontend
```env
VITE_API_URL=http://localhost:3000
```

---

## Frontend State Management

### useStream Hook (`frontend/src/hooks/useStream.ts`)

```typescript
const {
  ingress,           // Current ingress data
  streamInfo,        // Stream metadata
  streamStatus,      // Live status + viewer count
  loading,
  error,
  createIngress,     // Generate stream key
  deleteIngress,     // Reset stream key
  updateStreamInfo,  // Update title/thumbnail
  updateChatSettings,
  fetchStreamInfo,
  fetchStreamStatus,
} = useStream();
```

---

## Chat System

Chat uses LiveKit's data channel feature:
- Messages sent via `canPublishData` permission
- Real-time delivery to all room participants
- Settings controlled by creator:
  - `isChatEnabled`: Enable/disable chat
  - `isChatDelayed`: Add delay to messages
  - `isChatFollowersOnly`: Restrict to followers

---

## Key Files Reference

### Backend
- `backend/src/services/livekit.service.ts` - LiveKit SDK wrapper
- `backend/src/services/stream.service.ts` - Stream business logic
- `backend/src/services/token.service.ts` - JWT token generation
- `backend/src/services/webhook.service.ts` - Webhook handlers
- `backend/src/controllers/stream.controller.ts` - Stream API handlers
- `backend/src/controllers/viewer.controller.ts` - Viewer API handlers
- `backend/src/routes/stream.route.ts` - Stream routes
- `backend/src/routes/viewer.route.ts` - Viewer routes

### Frontend
- `frontend/src/lib/api/stream.ts` - API client
- `frontend/src/hooks/useStream.ts` - Stream state hook
- `frontend/src/components/stream/stream-player.tsx` - Player component
- `frontend/src/pages/watch/index.tsx` - Watch page
- `frontend/src/pages/watch/_components/stream-layout.tsx` - LiveKit room layout
- `frontend/src/pages/creator-dashboard/streams/index.tsx` - Stream manager
- `frontend/src/pages/creator-dashboard/keys/index.tsx` - Keys manager

---

## Room Naming Convention

- **Room Name**: Creator's `userId`
- **Creator Identity (OBS)**: `userId`
- **Creator Identity (self-view)**: `Host-{userId}`
- **Viewer Identity**: `userId` (authenticated) or `guest-{timestamp}-{random}` (guest)
