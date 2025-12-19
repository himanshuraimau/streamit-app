# Migration Plan: OBS (RTMP) → Browser WebRTC Streaming

This document outlines the step-by-step migration from OBS-based RTMP streaming to browser-based WebRTC streaming.

## Overview

**Current State**: Creators use OBS to push RTMP streams via LiveKit ingress
**Target State**: Creators stream directly from browser using camera/mic via WebRTC

## Changes Summary

| Layer | Remove/Deprecate | Add/Modify |
|-------|------------------|------------|
| Schema | `ingressId`, `serverUrl`, `streamKey` fields | `mode` field (optional, for future hybrid) |
| Backend | Ingress endpoints, LiveKit ingress service | WebRTC token endpoint, start/stop browser stream |
| Frontend | Keys page, OBS credentials UI | "Go Live" page with camera controls |

---

## Phase 1: Database Schema

### File: `backend/prisma/schema.prisma`

**Changes to Stream model:**

```prisma
model Stream {
  id          String  @id @default(cuid())
  title       String  @db.Text
  description String? @db.Text
  thumbnail   String? @db.Text

  // REMOVE these fields (or keep nullable for backward compat during migration)
  // ingressId String? @unique  -- DEPRECATED
  // serverUrl String? @db.Text -- DEPRECATED  
  // streamKey String? @db.Text -- DEPRECATED

  // Stream status
  isLive Boolean @default(false)

  // Chat settings (unchanged)
  isChatEnabled       Boolean @default(true)
  isChatDelayed       Boolean @default(false)
  isChatFollowersOnly Boolean @default(false)

  // Creator relationship (unchanged)
  userId String @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Gift relationships (unchanged)
  giftTransactions GiftTransaction[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([title])
  @@index([isLive])
  @@map("stream")
}
```

**Migration SQL:**
```sql
-- Remove ingress-related columns
ALTER TABLE "stream" DROP COLUMN IF EXISTS "ingressId";
ALTER TABLE "stream" DROP COLUMN IF EXISTS "serverUrl";
ALTER TABLE "stream" DROP COLUMN IF EXISTS "streamKey";

-- Drop the unique index on ingressId
DROP INDEX IF EXISTS "stream_ingressId_key";
```

---

## Phase 2: Backend Changes

### 2.1 Remove/Deprecate Files

| File | Action |
|------|--------|
| `backend/src/services/livekit.service.ts` | DELETE (ingress management no longer needed) |
| `backend/src/services/webhook.service.ts` | SIMPLIFY (remove ingress handlers, keep room events) |

### 2.2 Modify Stream Service

**File: `backend/src/services/stream.service.ts`**

Remove:
- `createStreamIngress()` 
- `deleteStreamIngress()`
- `addIngressToStream()`

Add:
- `setStreamLiveByUserId(userId, isLive)` - for browser stream start/stop

```typescript
// NEW METHOD
static async setStreamLiveByUserId(userId: string, isLive: boolean): Promise<Stream> {
  return await prisma.stream.update({
    where: { userId },
    data: { isLive },
  });
}

// SIMPLIFIED createStream (no ingress)
static async createStream(
  userId: string,
  data: { title: string; description?: string; thumbnail?: string }
): Promise<Stream> {
  await this.validateCreatorApproved(userId);
  
  return await prisma.stream.upsert({
    where: { userId },
    update: {
      title: data.title,
      description: data.description,
      thumbnail: data.thumbnail,
    },
    create: {
      userId,
      title: data.title,
      description: data.description,
      thumbnail: data.thumbnail,
      isLive: false,
      isChatEnabled: true,
    },
  });
}
```

### 2.3 Modify Stream Controller

**File: `backend/src/controllers/stream.controller.ts`**

Remove:
- `createIngress()`
- `deleteIngress()`
- `getStreamCredentials()`
- `createStreamWithMetadata()` (replace with simpler version)

Add:
```typescript
// Get WebRTC token for creator to publish
static async getCreatorWebRTCToken(req: Request, res: Response) {
  const userId = req.user!.id;
  
  const stream = await StreamService.getCreatorStream(userId);
  if (!stream) {
    return res.status(404).json({ success: false, error: 'Stream not found' });
  }

  const token = await TokenService.generateCreatorToken(userId, userId);
  
  res.json({
    success: true,
    data: {
      token,
      wsUrl: process.env.LIVEKIT_URL,
      roomId: userId,
    },
  });
}

// Start browser stream (set isLive = true)
static async startBrowserStream(req: Request, res: Response) {
  const userId = req.user!.id;
  await StreamService.setStreamLiveByUserId(userId, true);
  res.json({ success: true, message: 'Stream started' });
}

// Stop browser stream (set isLive = false)
static async stopBrowserStream(req: Request, res: Response) {
  const userId = req.user!.id;
  await StreamService.setStreamLiveByUserId(userId, false);
  res.json({ success: true, message: 'Stream stopped' });
}
```

### 2.4 Update Routes

**File: `backend/src/routes/stream.route.ts`**

```typescript
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireCreator } from '../middleware/creator.middleware';
import { StreamController } from '../controllers/stream.controller';

const router = Router();

// Stream CRUD
router.post('/create', requireAuth, requireCreator, StreamController.createStream);
router.get('/info', requireAuth, requireCreator, StreamController.getStreamInfo);
router.put('/info', requireAuth, requireCreator, StreamController.updateStreamInfo);
router.put('/chat-settings', requireAuth, requireCreator, StreamController.updateChatSettings);
router.get('/status', requireAuth, requireCreator, StreamController.getStreamStatus);

// WebRTC streaming (NEW)
router.post('/creator-webrtc-token', requireAuth, requireCreator, StreamController.getCreatorWebRTCToken);
router.post('/start-browser', requireAuth, requireCreator, StreamController.startBrowserStream);
router.post('/stop-browser', requireAuth, requireCreator, StreamController.stopBrowserStream);

// REMOVE these routes:
// router.post('/ingress', ...)
// router.delete('/ingress', ...)
// router.get('/credentials', ...)
// router.post('/creator-token', ...) -- replaced by creator-webrtc-token

export default router;
```

### 2.5 Simplify Webhook Service

**File: `backend/src/services/webhook.service.ts`**

Remove ingress handlers since browser streams don't trigger them:
- `handleIngressStarted()` - REMOVE
- `handleIngressEnded()` - REMOVE

Keep for analytics (optional):
- `handleParticipantJoined()`
- `handleParticipantLeft()`
- `handleRoomFinished()`

---

## Phase 3: Frontend Changes

### 3.1 Update API Client

**File: `frontend/src/lib/api/stream.ts`**

Remove:
- `createIngress()`
- `deleteIngress()`
- `getStreamCredentials()`
- `createStreamWithMetadata()` (simplify)
- `getCreatorViewToken()` (replaced)

Add:
```typescript
// Get WebRTC token for creator to publish
async getCreatorWebRTCToken(): Promise<ApiResponse<{
  token: string;
  wsUrl: string;
  roomId: string;
}>> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/stream/creator-webrtc-token`, {
    method: 'POST',
    headers,
  });
  return response.json();
}

// Start browser stream
async startBrowserStream(): Promise<ApiResponse<{ message: string }>> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/stream/start-browser`, {
    method: 'POST',
    headers,
  });
  return response.json();
}

// Stop browser stream
async stopBrowserStream(): Promise<ApiResponse<{ message: string }>> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/stream/stop-browser`, {
    method: 'POST',
    headers,
  });
  return response.json();
}

// Simplified create stream (no ingress)
async createStream(data: {
  title: string;
  description?: string;
  thumbnail?: string;
}): Promise<ApiResponse<StreamInfo>> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/stream/create`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  return response.json();
}
```

### 3.2 Remove Keys Page

**DELETE**: `frontend/src/pages/creator-dashboard/keys/` (entire folder)

### 3.3 Rewrite Streams Page

**File: `frontend/src/pages/creator-dashboard/streams/index.tsx`**

Replace with "Go Live" functionality:

```tsx
import { useState, useEffect } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import { streamApi } from '@/lib/api/stream';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff } from 'lucide-react';

export default function StreamsPage() {
  const [streamInfo, setStreamInfo] = useState(null);
  const [tokenData, setTokenData] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStreamInfo();
  }, []);

  const fetchStreamInfo = async () => {
    const res = await streamApi.getStreamInfo();
    if (res.success) setStreamInfo(res.data);
  };

  const handleGoLive = async () => {
    setLoading(true);
    try {
      // 1. Set stream as live in DB
      await streamApi.startBrowserStream();
      
      // 2. Get WebRTC token
      const tokenRes = await streamApi.getCreatorWebRTCToken();
      if (tokenRes.success) {
        setTokenData(tokenRes.data);
        setIsLive(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEndStream = async () => {
    await streamApi.stopBrowserStream();
    setTokenData(null);
    setIsLive(false);
  };

  // Not live - show "Go Live" button
  if (!isLive || !tokenData) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Go Live</h1>
        
        {/* Stream setup form if no stream exists */}
        {!streamInfo && <CreateStreamForm onCreated={fetchStreamInfo} />}
        
        {/* Go Live button */}
        {streamInfo && (
          <Card className="bg-zinc-900 border-zinc-800 p-8 text-center">
            <Video className="w-16 h-16 text-purple-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Ready to stream?</h2>
            <p className="text-zinc-400 mb-6">
              Click below to start streaming from your camera
            </p>
            <Button
              onClick={handleGoLive}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3"
            >
              {loading ? 'Starting...' : '🔴 Go Live'}
            </Button>
          </Card>
        )}
      </div>
    );
  }

  // Live - show LiveKit room with camera
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <h1 className="text-2xl font-bold text-white">You're Live!</h1>
        </div>
        <Button
          onClick={handleEndStream}
          variant="destructive"
        >
          End Stream
        </Button>
      </div>

      <LiveKitRoom
        token={tokenData.token}
        serverUrl={tokenData.wsUrl}
        connect={true}
        video={true}  // Auto-publish camera
        audio={true}  // Auto-publish mic
        className="h-[600px]"
      >
        <CreatorStreamLayout streamInfo={streamInfo} />
      </LiveKitRoom>
    </div>
  );
}
```

### 3.4 Update/Create Components

**Keep/Modify:**
- `stream-header.tsx` - Update to show live status
- `stream-stats.tsx` - Keep for viewer count
- `chat-settings-card.tsx` - Keep for chat controls
- `stream-info-card.tsx` - Keep for title editing
- `creator-stream-layout.tsx` - Modify for WebRTC

**Remove:**
- `stream-credentials.tsx` - No longer needed (was for OBS keys)
- `create-stream-form.tsx` - Simplify (remove streamMethod selection)

**Add:**
- `camera-controls.tsx` - Mute/unmute, camera on/off buttons

### 3.5 Update App Routes

**File: `frontend/src/App.tsx`**

Remove Keys route:
```tsx
// REMOVE this import and route
// import Keys from '@/pages/creator-dashboard/keys';
// <Route path="keys" element={<Keys />} />
```

### 3.6 Update Sidebar

**File: `frontend/src/pages/creator-dashboard/_components/creator-sidebar.tsx`**

Remove "Keys" menu item, rename "Streams" to "Go Live":
```tsx
// Change from:
{ icon: Key, label: 'Keys', path: '/creator-dashboard/keys' },
{ icon: Video, label: 'Streams', path: '/creator-dashboard/streams' },

// To:
{ icon: Video, label: 'Go Live', path: '/creator-dashboard/streams' },
```

### 3.7 Update useStream Hook

**File: `frontend/src/hooks/useStream.ts`**

Remove:
- `ingress` state
- `createIngress()`
- `deleteIngress()`

Add:
- `goLive()` - combines startBrowserStream + getCreatorWebRTCToken
- `endStream()` - calls stopBrowserStream

---

## Phase 4: Cleanup

### Files to DELETE

**Backend:**
- `backend/src/services/livekit.service.ts` (entire file)

**Frontend:**
- `frontend/src/pages/creator-dashboard/keys/` (entire folder)
- `frontend/src/pages/creator-dashboard/streams/_components/stream-credentials.tsx`

### Files to SIMPLIFY

**Backend:**
- `backend/src/services/webhook.service.ts` - Remove ingress handlers
- `backend/src/services/stream.service.ts` - Remove ingress methods

---

## Migration Steps (Execution Order)

1. **Schema Migration**
   - Create Prisma migration to remove ingress fields
   - Run migration on dev DB

2. **Backend Updates**
   - Delete `livekit.service.ts`
   - Update `stream.service.ts`
   - Update `stream.controller.ts`
   - Update `stream.route.ts`
   - Simplify `webhook.service.ts`

3. **Frontend Updates**
   - Update `stream.ts` API client
   - Delete keys page
   - Rewrite streams page
   - Update sidebar
   - Update App routes
   - Update useStream hook

4. **Testing**
   - Test "Go Live" flow
   - Test viewer watching
   - Test chat functionality
   - Test stream end

5. **Cleanup**
   - Remove unused imports
   - Update documentation

---

## Viewer Flow (Unchanged)

The viewer experience remains the same:
- Navigate to `/:username/live`
- Fetch stream info via `GET /api/viewer/stream/:username`
- Get viewer token via `POST /api/viewer/token`
- Join LiveKitRoom with subscribe-only permissions

Both RTMP ingress and WebRTC publishing result in tracks in the same LiveKit room, so viewers don't need any changes.

---

## Rollback Plan

If issues arise:
1. Keep ingress fields in schema (nullable)
2. Keep `livekit.service.ts` but don't use it
3. Add feature flag to switch between modes
