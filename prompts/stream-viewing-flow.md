# Stream Viewing & Creator Dashboard Flow

## Overview
This document explains how users join and watch streams, and how creators monitor their own streams in the dashboard. The system uses **LiveKit** for real-time WebRTC streaming with **OBS** as the broadcast source.

---

## Architecture Summary

```
Creator → OBS → LiveKit Ingress → LiveKit Room → Viewers (via WebRTC)
                                              ↓
                                        Creator Dashboard
```

- **Creator streams via OBS** (not browser) to LiveKit Ingress
- **Viewers** connect to LiveKit Room with viewer tokens
- **Creator dashboard** uses the same viewer token to watch their own stream

---

## 1. User Joining a Stream (Public Viewer)

### Route
```
GET /[username]
```

### Flow Diagram
```
User visits /{username}
    ↓
Fetch user + stream data
    ↓
Check permissions (following, blocked)
    ↓
Generate viewer token
    ↓
Join LiveKit room
    ↓
Render video + chat
```

### Step 1: Page Load & User Validation

**File:** `src/app/(browse)/[username]/page.tsx`

```typescript
const UserPage = async ({ params }: UserPageProps) => {
  const { username } = await params;
  
  // Fetch user by username
  const user = await getUserByUsername(username);

  // Validate user and stream exist
  if (!user || !user.stream) {
    notFound();
  }

  // Check relationship status
  const isFollowing = await isFollowingUser(user.id);
  const isBlocked = await isBlockedByUser(user.id);

  // Block access if viewer is blocked
  if (isBlocked) {
    notFound();
  }

  return (
    <StreamPlayer user={user} stream={user.stream} isFollowing={isFollowing} />
  );
};
```

**Key checks:**
- User exists and has a stream
- Viewer is not blocked by the host
- Following status for chat permissions

---

### Step 2: Token Generation

**File:** `src/hooks/use-viewer-token.ts`

```typescript
export const useViewerToken = (hostIdentity: string) => {
  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [identity, setIdentity] = useState("");

  useEffect(() => {
    const createToken = async () => {
      const viewerToken = await createViewerToken(hostIdentity);
      setToken(viewerToken);

      // Decode JWT to extract user info
      const decodedToken = jwtDecode(viewerToken);
      const name = decodedToken?.name;
      const identity = decodedToken?.sub || decodedToken?.jti;

      setIdentity(identity);
      setName(name);
    };

    createToken();
  }, [hostIdentity]);

  return { token, name, identity };
};
```

**File:** `src/actions/token.ts`

```typescript
export const createViewerToken = async (hostIdentity: string) => {
  // Get current user or create guest identity
  let self;
  try {
    self = await getSelf();
  } catch {
    const id = v4();
    const username = `guest-${Math.floor(Math.random() * 100000)}`;
    self = { id, username };
  }

  // Validate host exists
  const host = await getUserById(hostIdentity);
  if (!host) {
    throw new Error("Host not found");
  }

  // Check if blocked
  const isBlocked = await isBlockedByUser(host.id);
  if (isBlocked) {
    throw new Error("User is blocked");
  }

  // Special identity prefix for host
  const isHost = self.id === host.id;
  const tokenIdentity = isHost ? `Host-${self.id}` : self.id.toString();

  // Create LiveKit token
  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    {
      identity: tokenIdentity,
      name: self.username,
    }
  );

  // Grant permissions
  token.addGrant({
    room: host.id,              // Room name = host user ID
    roomJoin: true,             // Can join room
    canPublish: false,          // Cannot publish audio/video
    canPublishData: true,       // Can send chat messages
  });

  return await token.toJwt();
};
```

**Token Grants:**
- `room: host.id` - Each creator has their own room (named by their user ID)
- `roomJoin: true` - Permission to join the room
- `canPublish: false` - Viewers cannot broadcast video/audio
- `canPublishData: true` - Viewers can send chat messages

**Guest Users:**
- If no authenticated user, creates temporary guest identity
- Format: `guest-{random5digits}`

---

### Step 3: Join LiveKit Room

**File:** `src/components/stream-player/index.tsx`

```typescript
export const StreamPlayer = ({ user, stream, isFollowing }: StreamPlayerProps) => {
  // Get viewer token
  const { token, name, identity } = useViewerToken(user.id);
  const { collapsed } = useChatSidebar((state) => state);

  // Wait for token
  if (!token || !name || !identity) {
    return <StreamPlayerSkeleton />;
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_WS_URL!}
      className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 h-full"
    >
      {/* Video Section */}
      <div className="col-span-2 xl:col-span-2 2xl:col-span-5">
        <Video hostName={user.username} hostIdentity={user.id} />
        <Header hostName={user.username} hostIdentity={user.id} />
        <InfoCard hostIdentity={user.id} name={stream.title} />
        <AboutCard hostName={user.username} bio={user.bio} />
      </div>

      {/* Chat Sidebar */}
      <div className="col-span-1">
        <Chat
          hostName={user.username}
          hostIdentity={user.id}
          viewerName={name}
          isFollowing={isFollowing}
          isChatEnabled={stream.isChatEnabled}
          isChatDelayed={stream.isChatDelayed}
          isChatFollowersOnly={stream.isChatFollowersOnly}
        />
      </div>
    </LiveKitRoom>
  );
};
```

**Environment Variable:**
- `NEXT_PUBLIC_LIVEKIT_WS_URL` - LiveKit WebSocket server URL (e.g., `wss://your-livekit.com`)

---

### Step 4: Video Component - Stream States

**File:** `src/components/stream-player/video.tsx`

```typescript
export const Video = ({ hostName, hostIdentity }: VideoProps) => {
  const connectionState = useConnectionState();
  const participant = useRemoteParticipant(hostIdentity);
  
  // Get host's video/audio tracks
  const tracks = useTracks([
    Track.Source.Camera,
    Track.Source.Microphone,
  ]).filter((track) => track.participant.identity === hostIdentity);

  let content;

  // State 1: Offline - Connected but host not streaming
  if (!participant && connectionState === ConnectionState.Connected) {
    content = <OfflineVideo username={hostName} />;
  } 
  // State 2: Loading - Connecting or waiting for tracks
  else if (!participant || tracks.length === 0) {
    content = <LoadingVideo label={connectionState} />;
  } 
  // State 3: Live - Host is streaming
  else {
    content = <LiveVideo participant={participant} />;
  }

  return <div className="aspect-video border-b group relative">{content}</div>;
};
```

**Video States:**

| State | Condition | Display |
|-------|-----------|---------|
| **Offline** | Connected to room, but host not publishing | Offline placeholder |
| **Loading** | No participant or no tracks yet | Loading spinner |
| **Live** | Host is streaming with tracks | Live video player |

**File:** `src/components/stream-player/live-video.tsx`

```typescript
export const LiveVideo = ({ participant }: LiveVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Attach host tracks to video element
  useTracks([Track.Source.Camera, Track.Source.Microphone])
    .filter((track) => track.participant.identity === participant.identity)
    .forEach((track) => {
      if (videoRef.current) {
        track.publication.track?.attach(videoRef.current);
      }
    });

  return (
    <div className="relative h-full flex">
      <video ref={videoRef} width="100%" />
      <VolumeControl />
      <FullscreenControl />
    </div>
  );
};
```

---

### Step 5: Chat Component

**File:** `src/components/stream-player/chat.tsx`

```typescript
export const Chat = ({
  hostName,
  hostIdentity,
  viewerName,
  isFollowing,
  isChatEnabled,
  isChatDelayed,
  isChatFollowersOnly,
}: ChatProps) => {
  const connectionState = useConnectionState();
  const participant = useRemoteParticipant(hostIdentity);
  
  // Chat only works when host is online
  const isOnline = participant && connectionState === ConnectionState.Connected;
  const isHidden = !isChatEnabled || !isOnline;

  // LiveKit chat hook
  const { chatMessages: messages, send } = useChat();

  const onSubmit = () => {
    if (!send) return;
    send(value);
    setValue("");
  };

  return (
    <div className="flex flex-col bg-background border-l">
      <ChatHeader />
      <ChatList messages={messages} isHidden={isHidden} />
      <ChatForm
        onSubmit={onSubmit}
        isHidden={isHidden}
        isFollowersOnly={isChatFollowersOnly}
        isDelayed={isChatDelayed}
        isFollowing={isFollowing}
      />
    </div>
  );
};
```

**Chat Features:**
- Real-time messaging via LiveKit data channel
- **Chat disabled** if `isChatEnabled: false` or host offline
- **Followers-only** mode: Non-followers cannot send messages
- **Delayed mode**: Messages appear after delay
- Guest users can view but typically cannot send messages

---

## 2. Creator Watching Their Own Stream (Dashboard)

### Route
```
GET /u/[username]
```

### Key Difference
**The creator does NOT publish through the browser**. They use the same viewer token to watch their own stream. The actual video/audio comes from **OBS → LiveKit Ingress**.

### Flow Diagram
```
Creator dashboard
    ↓
Verify creator identity
    ↓
Generate viewer token (with Host- prefix)
    ↓
Join LiveKit room as viewer
    ↓
Watch their own stream from OBS
```

---

### Step 1: Authentication & Authorization

**File:** `src/app/(dashboard)/u/[username]/(home)/page.tsx`

```typescript
const CreatorPage = async ({ params }: CreatorPageProps) => {
  const externalUser = await currentUser(); // Clerk auth
  const { username } = await params;
  const user = await getUserByUsername(username);

  // Verify user is the creator
  if (!user || user.externalUserId !== externalUser?.id || !user.stream) {
    throw new Error("Unauthorized");
  }

  // Use same StreamPlayer component
  return (
    <div className="h-full">
      <StreamPlayer user={user} stream={user.stream} isFollowing />
    </div>
  );
};
```

**Authorization Check:**
- `user.externalUserId === externalUser?.id` - User can only access their own dashboard
- `isFollowing` is always `true` for creator

---

### Step 2: Special Host Token Identity

**File:** `src/actions/token.ts`

```typescript
const isHost = self.id === host.id;
const tokenIdentity = isHost ? `Host-${self.id}` : self.id.toString();
```

**Token Identity:**
- **Regular viewer:** `{userId}` (e.g., `"abc-123-def"`)
- **Creator viewing own stream:** `Host-{userId}` (e.g., `"Host-abc-123-def"`)

This allows the system to distinguish the creator in the participant list while still giving them viewer-only permissions.

---

### Step 3: Same StreamPlayer Component

The creator uses the **identical** `StreamPlayer` component as viewers:

```typescript
<StreamPlayer user={user} stream={user.stream} isFollowing />
```

**What the creator sees:**
- ✅ Live video from their OBS stream
- ✅ Real-time chat
- ✅ Viewer count
- ✅ Stream metadata (title, thumbnail)
- ✅ Full chat moderation controls

**What the creator does NOT do:**
- ❌ Publish video/audio from browser
- ❌ Use webcam/microphone in browser

---

## 3. Complete Streaming Setup Flow

### Phase 1: Stream Key Generation

**Route:** `/u/[username]/keys`

**Action:** `src/actions/ingress.ts`

```typescript
export const resetIngresses = async () => {
  const self = await getSelf();
  const stream = await db.stream.findUnique({
    where: { userId: self.id }
  });

  if (!stream) {
    throw new Error("Stream not found");
  }

  // Delete old ingress if exists
  if (stream.ingressId) {
    await ingressClient.deleteIngress(stream.ingressId);
  }

  // Create new RTMP ingress
  const ingress = await ingressClient.createIngress(
    IngressInput.RTMP_INPUT,
    {
      name: self.username,
      roomName: self.id,
      participantIdentity: self.id,
      participantName: self.username,
    }
  );

  // Save to database
  await db.stream.update({
    where: { userId: self.id },
    data: {
      ingressId: ingress.ingressId,
      serverUrl: ingress.url,
      streamKey: ingress.streamKey,
    }
  });

  return { serverUrl: ingress.url, streamKey: ingress.streamKey };
};
```

**Result:**
- `serverUrl` - RTMP ingest URL (e.g., `rtmp://your-server.com/live`)
- `streamKey` - Unique stream key
- `ingressId` - LiveKit ingress identifier

---

### Phase 2: OBS Configuration

**Settings:**
```
Service: Custom
Server: {serverUrl from above}
Stream Key: {streamKey from above}
```

**Example:**
```
Server: rtmp://livekit.example.com/live
Stream Key: SK_abc123def456
```

---

### Phase 3: LiveKit Webhook Sets isLive

**File:** `src/app/api/webhook/livekit/route.ts`

```typescript
export async function POST(req: Request) {
  const body = await req.text();
  const headerPayload = headers();
  const authorization = headerPayload.get("Authorization");

  // Verify webhook signature
  const event = await WebhookReceiver.receive(
    body,
    authorization!,
    process.env.LIVEKIT_WEBHOOK_SECRET!
  );

  // When ingress starts (OBS connects)
  if (event.event === "ingress_started") {
    await db.stream.update({
      where: { ingressId: event.ingressInfo.ingressId },
      data: { isLive: true }
    });
  }

  // When ingress ends (OBS disconnects)
  if (event.event === "ingress_ended") {
    await db.stream.update({
      where: { ingressId: event.ingressInfo.ingressId },
      data: { isLive: false }
    });
  }

  return new Response("OK", { status: 200 });
}
```

**Webhook Events:**
- `ingress_started` → Sets `isLive: true`
- `ingress_ended` → Sets `isLive: false`

---

### Phase 4: Viewing Flow

```
OBS Streaming → LiveKit Ingress → LiveKit Room
                                        ↓
                    ┌───────────────────┴────────────────────┐
                    ↓                                        ↓
            Creator Dashboard                          Public Viewers
         (viewer token with Host- prefix)         (viewer tokens)
```

**Both use identical viewing mechanism:**
1. Generate viewer token
2. Join LiveKit room
3. Subscribe to host's video/audio tracks
4. Participate in chat

---

## 4. Database Schema

**File:** `prisma/schema.prisma`

```prisma
model Stream {
  id                  String   @id @default(uuid())
  title               String   @db.Text
  thumbnail           String?  @db.Text
  
  // LiveKit ingress config
  ingressId           String?  @unique
  serverUrl           String?  @db.Text
  streamKey           String?  @db.Text
  
  // Stream state
  isLive              Boolean  @default(false)
  
  // Chat settings
  isChatEnabled       Boolean  @default(true)
  isChatDelayed       Boolean  @default(false)
  isChatFollowersOnly Boolean  @default(false)
  
  // Relations
  userId              String   @unique
  user                User     @relation(fields: [userId], references: [id])
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

**Key Fields:**
- `ingressId` - Links to LiveKit ingress
- `serverUrl` + `streamKey` - OBS configuration
- `isLive` - Updated by webhook
- Chat settings - Enforced client-side

---

## 5. Environment Variables

**Required:**

```env
# LiveKit
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
LIVEKIT_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_LIVEKIT_WS_URL=wss://your-livekit-server.com

# Database
DATABASE_URL=postgresql://...

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

---

## 6. Key Takeaways

### For Viewers
1. ✅ Join any public stream by visiting `/{username}`
2. ✅ Get viewer token (JWT) with room join permissions
3. ✅ Connect to LiveKit room via WebSocket
4. ✅ Subscribe to host's video/audio tracks
5. ✅ Participate in chat (if allowed)

### For Creators
1. ✅ Generate stream keys in dashboard (`/u/{username}/keys`)
2. ✅ Configure OBS with `serverUrl` and `streamKey`
3. ✅ Start streaming in OBS (triggers webhook → `isLive: true`)
4. ✅ View own stream in dashboard (`/u/{username}`)
5. ✅ Use **viewer token** (not publisher) - media comes from OBS
6. ✅ Monitor chat and interact with viewers

### Technical Architecture
- **Separation of concerns**: OBS handles encoding/streaming, browser handles viewing
- **Same component**: Creator and viewers use identical `StreamPlayer`
- **Token-based auth**: LiveKit JWT controls room access and permissions
- **Real-time sync**: Webhooks keep database state in sync with LiveKit
- **Scalable**: LiveKit handles WebRTC complexity and routing

---

## Summary Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         STREAMING FLOW                          │
└─────────────────────────────────────────────────────────────────┘

Creator                          LiveKit                    Viewers
   │                               │                           │
   │ 1. Generate Keys              │                           │
   │ ───────────────────────────>  │                           │
   │ (serverUrl, streamKey)        │                           │
   │                               │                           │
   │ 2. OBS: Start Stream          │                           │
   │ ═══════════════════════════>  │                           │
   │    (RTMP to ingress)          │                           │
   │                               │                           │
   │                               │ 3. Webhook: isLive=true   │
   │                               │ ────────────> DB          │
   │                               │                           │
   │ 4. Open Dashboard             │                           │
   │ ───────────────────────────>  │                           │
   │    Generate viewer token      │                           │
   │    (Host-{userId})            │                           │
   │                               │                           │
   │ 5. Join as Viewer             │ 6. Viewer visits page     │
   │ <─────────────────────────────┼───────────────────────────│
   │   WebRTC connection           │   Generate viewer token   │
   │                               │   ({userId})              │
   │                               │                           │
   │ 7. Watch own stream ◄─────────┤─────────> Watch stream    │
   │    Subscribe to tracks        │           Subscribe       │
   │                               │                           │
   │ 8. Send chat ◄────────────────┤─────────> Send chat       │
   │    (via data channel)         │           (via data)      │
   │                               │                           │
```

---

**End of Document**

