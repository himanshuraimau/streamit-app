Creators can stream directly from their camera by joining the LiveKit room as WebRTC publishers instead of pushing RTMP from OBS. Below is a full “artifact-style” design: schema, backend, and frontend code.[1][2]

***

## 1. Updated schema design

Goal: support **two modes** of streaming:

- `WEBRTC` – creator uses in-app camera (no OBS).
- `RTMP` – legacy OBS/ingress flow.

```prisma
model Stream {
  id          String  @id @default(cuid())
  title       String  @db.Text
  description String? @db.Text
  thumbnail   String? @db.Text

  // LiveKit Ingress (RTMP) – optional
  ingressId String?  @unique
  serverUrl String?  @db.Text
  streamKey String?  @db.Text

  // Streaming mode: WEBRTC or RTMP
  mode String @default("WEBRTC")

  // Status
  isLive Boolean @default(false)

  // Chat settings
  isChatEnabled       Boolean @default(true)
  isChatDelayed       Boolean @default(false)
  isChatFollowersOnly Boolean @default(false)

  // Creator (1:1 relationship)
  userId String @unique
  user   User   @relation(fields: [userId], references: [id])
}
```

- Keep RTMP fields nullable so old OBS flow still works.
- `mode` can drive UI (which “Go Live” option to show).

---

## 2. Backend: tokens & live state

### 2.1 Creator WebRTC token (publish from browser)

You already have token generation; this extends it to expose a **publish-capable** token for the creator.[3][4]

#### Token service (Node/TS, LiveKit server SDK)

```ts
// backend/src/services/token.service.ts
import { AccessToken } from 'livekit-server-sdk'; // or '@livekit/server-sdk'
import { config } from '../config';

export class TokenService {
  static async generateCreatorToken(userId: string, roomId: string) {
    const at = new AccessToken(config.LIVEKIT_API_KEY, config.LIVEKIT_API_SECRET, {
      identity: userId,
      ttl: '1h',
    });

    at.addGrant({
      roomJoin: true,
      room: roomId,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt(); // v2 API.[web:35]
    return token;
  }

  static async generateCreatorViewerToken(userId: string, roomId: string) {
    const at = new AccessToken(config.LIVEKIT_API_KEY, config.LIVEKIT_API_SECRET, {
      identity: `Host-${userId}`,
      ttl: '1h',
    });

    at.addGrant({
      roomJoin: true,
      room: roomId,
      canPublish: false,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();
    return token;
  }

  // existing viewer/guest token methods stay as they are
}
```

This follows LiveKit’s recommended pattern for generating JWTs with grants.[5][3]

#### Creator WebRTC token endpoint

```ts
// backend/src/controllers/stream.controller.ts
import { Request, Response } from 'express';
import { StreamService } from '../services/stream.service';
import { TokenService } from '../services/token.service';

export class StreamController {
  static async getCreatorWebRTCToken(req: Request, res: Response) {
    const userId = req.user.id; // assume auth middleware

    const stream = await StreamService.getStreamByUserId(userId);
    if (!stream) {
      return res.status(404).json({ message: 'Stream not found' });
    }

    const roomId = stream.userId; // your convention

    const token = await TokenService.generateCreatorToken(userId, roomId);

    return res.json({
      token,
      wsUrl: process.env.LIVEKIT_URL,
      roomId,
    });
  }
}
```

Route:

```ts
// backend/src/routes/stream.route.ts
import { Router } from 'express';
import { StreamController } from '../controllers/stream.controller';
import { requireAuth, requireCreator } from '../middleware/auth';

const router = Router();

router.post(
  '/stream/creator-webrtc-token',
  requireAuth,
  requireCreator,
  StreamController.getCreatorWebRTCToken,
);

export default router;
```

### 2.2 Live status for browser streaming

Because browser publishers don’t trigger `ingress_started`, add explicit endpoints to toggle `isLive`:

```ts
// backend/src/controllers/stream.controller.ts
export class StreamController {
  static async startBrowserStream(req: Request, res: Response) {
    const userId = req.user.id;
    await StreamService.setStreamLiveByUserId(userId, true);
    return res.json({ success: true });
  }

  static async stopBrowserStream(req: Request, res: Response) {
    const userId = req.user.id;
    await StreamService.setStreamLiveByUserId(userId, false);
    return res.json({ success: true });
  }
}
```

Stream service:

```ts
// backend/src/services/stream.service.ts
import { prisma } from '../lib/prisma';

export class StreamService {
  static async setStreamLiveByUserId(userId: string, isLive: boolean) {
    return prisma.stream.update({
      where: { userId },
      data: { isLive },
    });
  }

  static async getStreamByUserId(userId: string) {
    return prisma.stream.findUnique({ where: { userId } });
  }
}
```

Routes:

```ts
router.post(
  '/stream/start-browser',
  requireAuth,
  requireCreator,
  StreamController.startBrowserStream,
);

router.post(
  '/stream/stop-browser',
  requireAuth,
  requireCreator,
  StreamController.stopBrowserStream,
);
```

RTMP ingress webhooks (`ingress_started` / `ingress_ended`) remain untouched for OBS users.

***

## 3. Frontend: creator “Go Live” with camera

Use LiveKit’s React components to auto-publish camera/mic when the creator joins the room.[6][7][8]

### 3.1 API client methods

```ts
// frontend/src/lib/api/stream.ts
import { api } from './client';

export const streamApi = {
  // existing methods ...

  getCreatorWebRTCToken() {
    return api.post('/stream/creator-webrtc-token');
  },

  startBrowserStream() {
    return api.post('/stream/start-browser');
  },

  stopBrowserStream() {
    return api.post('/stream/stop-browser');
  },
};
```

### 3.2 Creator live page (React)

```tsx
// frontend/src/pages/creator-dashboard/live/index.tsx
import { useState } from 'react';
import { LiveKitRoom } from '@livekit/components-react'; // or 'livekit-react'[web:41]
import '@livekit/components-styles'; // if you use their default styles
import { streamApi } from '@/lib/api/stream';

type CreatorTokenResponse = {
  token: string;
  wsUrl: string;
  roomId: string;
};

export default function CreatorLivePage() {
  const [tokenData, setTokenData] = useState<CreatorTokenResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    try {
      setLoading(true);
      await streamApi.startBrowserStream();
      const res = await streamApi.getCreatorWebRTCToken();
      setTokenData(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    await streamApi.stopBrowserStream();
    setTokenData(null); // unmounts LiveKitRoom → disconnects
  };

  if (!tokenData) {
    return (
      <div className="creator-live-start">
        <button onClick={handleStart} disabled={loading}>
          {loading ? 'Starting…' : 'Go Live with Camera'}
        </button>
      </div>
    );
  }

  return (
    <div className="creator-live-room">
      <button onClick={handleStop}>End Stream</button>

      <LiveKitRoom
        token={tokenData.token}
        serverUrl={tokenData.wsUrl}
        connect={true}
        video={{ facingMode: 'user' }} // auto-publish camera[web:18][web:31]
        audio={true}                   // auto-publish mic
        data-lk-theme="default"
      >
        {/* You can render a preview and chat here */}
        {/* For example, a simple component showing local + remote tracks */}
        {/* Or reuse parts of your existing StreamLayout component */}
      </LiveKitRoom>
    </div>
  );
}
```

- `video` and `audio` props cause LiveKit to request camera/mic permissions and publish tracks automatically after connecting.[7][6]
- This is the simplest way to let creators “tap and start streaming” without manual track handling.

### 3.3 More manual control (optional)

If you need custom UI for “Mute / Unmute / Camera off”, use the underlying `livekit-client` room API.[9][1]

Example pattern:

```tsx
import { useLiveKitRoom } from '@livekit/components-react';[web:31]

function ManualControls() {
  const { room } = useLiveKitRoom({ connect: false });

  const enableCamAndMic = async () => {
    if (!room) return;
    await room.localParticipant.setCameraEnabled(true);   // publish camera[web:27]
    await room.localParticipant.setMicrophoneEnabled(true); // publish mic[web:27]
  };

  const disableCamAndMic = async () => {
    if (!room) return;
    await room.localParticipant.setCameraEnabled(false);
    await room.localParticipant.setMicrophoneEnabled(false);
  };

  return (
    <div>
      <button onClick={enableCamAndMic}>Start Camera</button>
      <button onClick={disableCamAndMic}>Stop Camera</button>
    </div>
  );
}
```

This follows the LiveKit docs for publishing camera/mic via `room.localParticipant`.[1][9]

***

## 4. Viewer flow (unchanged)

Viewers continue to:

- Fetch stream via `GET /api/viewer/stream/:username`.
- Request viewer token via `POST /api/viewer/token`.
- Join `LiveKitRoom` with subscribe-only permissions, same as your current `StreamLayout`.[8][9]

Because both RTMP ingress and browser WebRTC publishing end up as tracks in the same room, the viewer code does not care which source is used.[10][11]

***

## 5. Putting it together (artifact summary)

**Core design:**

- Schema: add `mode` (WEBRTC/RTMP), keep RTMP fields optional.
- Backend:
  - `POST /api/stream/creator-webrtc-token` → full publish token for creator.
  - `POST /api/stream/start-browser` & `/stop-browser` → set `isLive` for browser streams.
  - Reuse existing viewer token + webhook logic for RTMP.
- Frontend:
  - Add “Go Live with Camera” page in creator dashboard.
  - Call start-browser → get creator token → mount `LiveKitRoom` with `video` + `audio` props for instant camera streaming.[6][7]
  - End stream → call stop-browser and unmount room.

If you paste your current `TokenService` + `stream.route.ts` files, a line-by-line diff can be prepared in the same style so you can drop it directly into your repo.


Creators can stream directly from their camera by joining the LiveKit room as WebRTC publishers instead of pushing RTMP from OBS. Below is a full “artifact-style” design: schema, backend, and frontend code.[1][2]

***

## 1. Updated schema design

Goal: support **two modes** of streaming:

- `WEBRTC` – creator uses in-app camera (no OBS).
- `RTMP` – legacy OBS/ingress flow.

```prisma
model Stream {
  id          String  @id @default(cuid())
  title       String  @db.Text
  description String? @db.Text
  thumbnail   String? @db.Text

  // LiveKit Ingress (RTMP) – optional
  ingressId String?  @unique
  serverUrl String?  @db.Text
  streamKey String?  @db.Text

  // Streaming mode: WEBRTC or RTMP
  mode String @default("WEBRTC")

  // Status
  isLive Boolean @default(false)

  // Chat settings
  isChatEnabled       Boolean @default(true)
  isChatDelayed       Boolean @default(false)
  isChatFollowersOnly Boolean @default(false)

  // Creator (1:1 relationship)
  userId String @unique
  user   User   @relation(fields: [userId], references: [id])
}
```

- Keep RTMP fields nullable so old OBS flow still works.
- `mode` can drive UI (which “Go Live” option to show).

---

## 2. Backend: tokens & live state

### 2.1 Creator WebRTC token (publish from browser)

You already have token generation; this extends it to expose a **publish-capable** token for the creator.[3][4]

#### Token service (Node/TS, LiveKit server SDK)

```ts
// backend/src/services/token.service.ts
import { AccessToken } from 'livekit-server-sdk'; // or '@livekit/server-sdk'
import { config } from '../config';

export class TokenService {
  static async generateCreatorToken(userId: string, roomId: string) {
    const at = new AccessToken(config.LIVEKIT_API_KEY, config.LIVEKIT_API_SECRET, {
      identity: userId,
      ttl: '1h',
    });

    at.addGrant({
      roomJoin: true,
      room: roomId,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt(); // v2 API.[web:35]
    return token;
  }

  static async generateCreatorViewerToken(userId: string, roomId: string) {
    const at = new AccessToken(config.LIVEKIT_API_KEY, config.LIVEKIT_API_SECRET, {
      identity: `Host-${userId}`,
      ttl: '1h',
    });

    at.addGrant({
      roomJoin: true,
      room: roomId,
      canPublish: false,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();
    return token;
  }

  // existing viewer/guest token methods stay as they are
}
```

This follows LiveKit’s recommended pattern for generating JWTs with grants.[5][3]

#### Creator WebRTC token endpoint

```ts
// backend/src/controllers/stream.controller.ts
import { Request, Response } from 'express';
import { StreamService } from '../services/stream.service';
import { TokenService } from '../services/token.service';

export class StreamController {
  static async getCreatorWebRTCToken(req: Request, res: Response) {
    const userId = req.user.id; // assume auth middleware

    const stream = await StreamService.getStreamByUserId(userId);
    if (!stream) {
      return res.status(404).json({ message: 'Stream not found' });
    }

    const roomId = stream.userId; // your convention

    const token = await TokenService.generateCreatorToken(userId, roomId);

    return res.json({
      token,
      wsUrl: process.env.LIVEKIT_URL,
      roomId,
    });
  }
}
```

Route:

```ts
// backend/src/routes/stream.route.ts
import { Router } from 'express';
import { StreamController } from '../controllers/stream.controller';
import { requireAuth, requireCreator } from '../middleware/auth';

const router = Router();

router.post(
  '/stream/creator-webrtc-token',
  requireAuth,
  requireCreator,
  StreamController.getCreatorWebRTCToken,
);

export default router;
```

### 2.2 Live status for browser streaming

Because browser publishers don’t trigger `ingress_started`, add explicit endpoints to toggle `isLive`:

```ts
// backend/src/controllers/stream.controller.ts
export class StreamController {
  static async startBrowserStream(req: Request, res: Response) {
    const userId = req.user.id;
    await StreamService.setStreamLiveByUserId(userId, true);
    return res.json({ success: true });
  }

  static async stopBrowserStream(req: Request, res: Response) {
    const userId = req.user.id;
    await StreamService.setStreamLiveByUserId(userId, false);
    return res.json({ success: true });
  }
}
```

Stream service:

```ts
// backend/src/services/stream.service.ts
import { prisma } from '../lib/prisma';

export class StreamService {
  static async setStreamLiveByUserId(userId: string, isLive: boolean) {
    return prisma.stream.update({
      where: { userId },
      data: { isLive },
    });
  }

  static async getStreamByUserId(userId: string) {
    return prisma.stream.findUnique({ where: { userId } });
  }
}
```

Routes:

```ts
router.post(
  '/stream/start-browser',
  requireAuth,
  requireCreator,
  StreamController.startBrowserStream,
);

router.post(
  '/stream/stop-browser',
  requireAuth,
  requireCreator,
  StreamController.stopBrowserStream,
);
```

RTMP ingress webhooks (`ingress_started` / `ingress_ended`) remain untouched for OBS users.

***

## 3. Frontend: creator “Go Live” with camera

Use LiveKit’s React components to auto-publish camera/mic when the creator joins the room.[6][7][8]

### 3.1 API client methods

```ts
// frontend/src/lib/api/stream.ts
import { api } from './client';

export const streamApi = {
  // existing methods ...

  getCreatorWebRTCToken() {
    return api.post('/stream/creator-webrtc-token');
  },

  startBrowserStream() {
    return api.post('/stream/start-browser');
  },

  stopBrowserStream() {
    return api.post('/stream/stop-browser');
  },
};
```

### 3.2 Creator live page (React)

```tsx
// frontend/src/pages/creator-dashboard/live/index.tsx
import { useState } from 'react';
import { LiveKitRoom } from '@livekit/components-react'; // or 'livekit-react'[web:41]
import '@livekit/components-styles'; // if you use their default styles
import { streamApi } from '@/lib/api/stream';

type CreatorTokenResponse = {
  token: string;
  wsUrl: string;
  roomId: string;
};

export default function CreatorLivePage() {
  const [tokenData, setTokenData] = useState<CreatorTokenResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    try {
      setLoading(true);
      await streamApi.startBrowserStream();
      const res = await streamApi.getCreatorWebRTCToken();
      setTokenData(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    await streamApi.stopBrowserStream();
    setTokenData(null); // unmounts LiveKitRoom → disconnects
  };

  if (!tokenData) {
    return (
      <div className="creator-live-start">
        <button onClick={handleStart} disabled={loading}>
          {loading ? 'Starting…' : 'Go Live with Camera'}
        </button>
      </div>
    );
  }

  return (
    <div className="creator-live-room">
      <button onClick={handleStop}>End Stream</button>

      <LiveKitRoom
        token={tokenData.token}
        serverUrl={tokenData.wsUrl}
        connect={true}
        video={{ facingMode: 'user' }} // auto-publish camera[web:18][web:31]
        audio={true}                   // auto-publish mic
        data-lk-theme="default"
      >
        {/* You can render a preview and chat here */}
        {/* For example, a simple component showing local + remote tracks */}
        {/* Or reuse parts of your existing StreamLayout component */}
      </LiveKitRoom>
    </div>
  );
}
```

- `video` and `audio` props cause LiveKit to request camera/mic permissions and publish tracks automatically after connecting.[7][6]
- This is the simplest way to let creators “tap and start streaming” without manual track handling.

### 3.3 More manual control (optional)

If you need custom UI for “Mute / Unmute / Camera off”, use the underlying `livekit-client` room API.[9][1]

Example pattern:

```tsx
import { useLiveKitRoom } from '@livekit/components-react';[web:31]

function ManualControls() {
  const { room } = useLiveKitRoom({ connect: false });

  const enableCamAndMic = async () => {
    if (!room) return;
    await room.localParticipant.setCameraEnabled(true);   // publish camera[web:27]
    await room.localParticipant.setMicrophoneEnabled(true); // publish mic[web:27]
  };

  const disableCamAndMic = async () => {
    if (!room) return;
    await room.localParticipant.setCameraEnabled(false);
    await room.localParticipant.setMicrophoneEnabled(false);
  };

  return (
    <div>
      <button onClick={enableCamAndMic}>Start Camera</button>
      <button onClick={disableCamAndMic}>Stop Camera</button>
    </div>
  );
}
```

This follows the LiveKit docs for publishing camera/mic via `room.localParticipant`.[1][9]

***

## 4. Viewer flow (unchanged)

Viewers continue to:

- Fetch stream via `GET /api/viewer/stream/:username`.
- Request viewer token via `POST /api/viewer/token`.
- Join `LiveKitRoom` with subscribe-only permissions, same as your current `StreamLayout`.[8][9]

Because both RTMP ingress and browser WebRTC publishing end up as tracks in the same room, the viewer code does not care which source is used.[10][11]

***

## 5. Putting it together (artifact summary)

**Core design:**

- Schema: add `mode` (WEBRTC/RTMP), keep RTMP fields optional.
- Backend:
  - `POST /api/stream/creator-webrtc-token` → full publish token for creator.
  - `POST /api/stream/start-browser` & `/stop-browser` → set `isLive` for browser streams.
  - Reuse existing viewer token + webhook logic for RTMP.
- Frontend:
  - Add “Go Live with Camera” page in creator dashboard.
  - Call start-browser → get creator token → mount `LiveKitRoom` with `video` + `audio` props for instant camera streaming.[6][7]
  - End stream → call stop-browser and unmount room.

If you paste your current `TokenService` + `stream.route.ts` files, a line-by-line diff can be prepared in the same style so you can drop it directly into your repo.
