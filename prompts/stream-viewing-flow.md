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

### Step 5: Chat System (Real-time Messaging)

The chat system uses **LiveKit's data channel** for real-time messaging between all participants in the room.

#### Chat Architecture

```
Viewer → LiveKit Data Channel → All Participants (including Creator)
```

---

#### 5.1 Main Chat Component

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

  const [value, setValue] = useState("");
  
  // LiveKit's useChat hook - handles data channel messaging
  const { chatMessages: messages, send } = useChat();

  // Sort messages by timestamp (newest first for reverse display)
  const reversedMessages = useMemo(() => {
    return messages.sort((a, b) => b.timestamp - a.timestamp);
  }, [messages]);

  const onSubmit = () => {
    if (!send) return;
    send(value);  // Send via LiveKit data channel
    setValue("");
  };

  const onChange = (value: string) => {
    setValue(value);
  };

  return (
    <div className="flex flex-col bg-background border-l border-b pt-0 h-[calc(100vh-80px)]">
      <ChatHeader />
      {variant === ChatVariant.CHAT && (
        <>
          <ChatList messages={reversedMessages} isHidden={isHidden} />
          <ChatForm
            onSubmit={onSubmit}
            value={value}
            onChange={onChange}
            isHidden={isHidden}
            isFollowersOnly={isChatFollowersOnly}
            isDelayed={isChatDelayed}
            isFollowing={isFollowing}
          />
        </>
      )}
      {variant === ChatVariant.COMMUNITY && (
        <ChatCommunity viewerName={viewerName} hostName={hostName} />
      )}
    </div>
  );
};
```

**Key Points:**
- `useChat()` from `@livekit/components-react` provides `chatMessages` and `send()` function
- Chat is **disabled** when:
  - `isChatEnabled: false` (host disabled it)
  - Host is offline (`!isOnline`)
- Messages are broadcast to **all participants** in the room via data channel
- Supports two variants: **CHAT** (messages) and **COMMUNITY** (participant list)

---

#### 5.2 Chat Form (Message Input)

**File:** `src/components/stream-player/chat-form.tsx`

```typescript
export const ChatForm = ({
  onSubmit,
  value,
  onChange,
  isHidden,
  isFollowersOnly,
  isFollowing,
  isDelayed,
}: ChatFormProps) => {
  const [isDelayBlocked, setIsDelayBlocked] = useState(false);

  // Check permissions
  const isFollowersOnlyAndNotFollowing = isFollowersOnly && !isFollowing;
  const isDisabled = isHidden || isDelayBlocked || isFollowersOnlyAndNotFollowing;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!value || isDisabled) return;

    // Delayed chat mode - 3 second cooldown
    if (isDelayed && !isDelayBlocked) {
      setIsDelayBlocked(true);
      setTimeout(() => {
        setIsDelayBlocked(false);
        onSubmit();
      }, 3000);
    } else {
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-y-4 p-3">
      <div className="w-full">
        <ChatInfo isDelayed={isDelayed} isFollowersOnly={isFollowersOnly} />
        <Input
          onChange={(e) => onChange(e.target.value)}
          value={value}
          disabled={isDisabled}
          placeholder="Send a message"
        />
      </div>
      <Button type="submit" variant="primary" size="sm" disabled={isDisabled}>
        Chat
      </Button>
    </form>
  );
};
```

**Chat Restrictions:**
- **Followers-only mode:** Non-followers cannot send messages (`isFollowersOnly && !isFollowing`)
- **Delayed mode:** 3-second cooldown between messages (`isDelayed`)
- **Chat disabled:** Input is hidden if chat is off or host offline

---

#### 5.3 Message Display

**File:** `src/components/stream-player/chat-list.tsx`

```typescript
export const ChatList = ({ messages, isHidden }: ChatListProps) => {
  if (isHidden || !messages || messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          {isHidden ? "Chat is disabled" : "Welcome to the chat!"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col-reverse overflow-y-auto p-3 h-full">
      {messages.map((message) => (
        <ChatMessage key={message.timestamp} data={message} />
      ))}
    </div>
  );
};
```

**File:** `src/components/stream-player/chat-message.tsx`

```typescript
export const ChatMessage = ({ data }: ChatMessageProps) => {
  const color = stringToColor(data.from?.name || "");

  return (
    <div className="flex gap-2 p-2 rounded-md hover:bg-white/5">
      <p className="text-sm text-white/40">
        {moment(data.timestamp).format("HH:mm")}
      </p>
      <div className="flex flex-wrap items-baseline gap-1 grow">
        <p className="text-sm font-semibold whitespace-nowrap">
          <span className="truncate" style={{ color: color }}>
            {data.from?.name}
          </span>:
        </p>
        <p className="text-sm break-all">{data.message}</p>
      </div>
    </div>
  );
};
```

**Message Structure:**
```typescript
interface ReceivedChatMessage {
  timestamp: number;          // Unix timestamp
  from?: {
    name: string;             // Username (from JWT token)
    identity: string;         // User ID or guest ID
  };
  message: string;            // Message content
}
```

**Message Display Features:**
- Timestamp in `HH:mm` format
- Color-coded usernames (generated from name hash)
- Scrollable list (newest at bottom)
- Empty state when no messages

---

#### 5.4 How Chat Messages Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      CHAT MESSAGE FLOW                          │
└─────────────────────────────────────────────────────────────────┘

User types message
    ↓
ChatForm validates (followers-only, delay, etc.)
    ↓
onSubmit() called
    ↓
send(value) - LiveKit useChat hook
    ↓
Message sent via LiveKit Data Channel
    ↓
LiveKit server broadcasts to all participants
    ↓
All clients receive via useChat() hook
    ↓
messages array updates automatically
    ↓
ChatList re-renders with new message
    ↓
ChatMessage displays formatted message
```

**Key Technical Details:**

1. **Data Channel Communication:**
   - LiveKit uses WebRTC data channels (not WebSockets) for chat
   - Messages are sent peer-to-server-to-peers
   - Server handles broadcast to all room participants

2. **Token Permission:**
   ```typescript
   token.addGrant({
     canPublishData: true,  // Required for sending chat messages
   });
   ```

3. **Message Broadcasting:**
   - When ANY participant sends a message, ALL participants receive it
   - This includes the creator watching their dashboard
   - Messages are not persisted (lost on page refresh)

4. **Real-time Updates:**
   - `useChat()` hook automatically updates `chatMessages` array
   - React re-renders components when new messages arrive
   - No manual WebSocket handling needed

---

#### 5.5 Chat Features Summary

| Feature | Description | Implementation |
|---------|-------------|----------------|
| **Real-time messaging** | Instant message delivery | LiveKit data channel |
| **Followers-only** | Only followers can chat | Client-side validation in `ChatForm` |
| **Delayed mode** | 3-second cooldown | `setTimeout` + state in `ChatForm` |
| **Guest viewing** | Guests can see chat | Token generated for guests |
| **Guest sending** | Guests typically blocked | Checked via `isFollowing` logic |
| **Chat toggle** | Enable/disable chat | `isChatEnabled` flag from database |
| **Offline handling** | Chat hidden when offline | Checks `isOnline` status |
| **Color-coded names** | Unique colors per user | `stringToColor()` hash function |
| **Timestamps** | Message time display | Unix timestamp → formatted time |
| **Community view** | Show participant list | `ChatVariant.COMMUNITY` mode |

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

## 7. Deep Dive: Chat System Architecture

### How LiveKit Chat Works

**LiveKit provides a built-in chat system** via WebRTC data channels, wrapped in React hooks for easy integration.

#### Core Hook: `useChat()`

```typescript
import { useChat } from '@livekit/components-react';

const { chatMessages, send } = useChat();
```

**What it provides:**
- `chatMessages: ReceivedChatMessage[]` - Array of all received messages
- `send: (message: string) => void` - Function to send messages

**Under the hood:**
- Uses WebRTC data channels (not HTTP or WebSockets)
- Messages sent via `send()` are broadcast to all room participants
- Automatically updates `chatMessages` when new messages arrive
- No manual connection management needed

---

### Chat Flow Detailed

#### Sending a Message

```typescript
// Step 1: User types in input
<Input value={value} onChange={(e) => setValue(e.target.value)} />

// Step 2: User submits form
const handleSubmit = () => {
  send(value);  // Sends via LiveKit data channel
  setValue("");
};

// Step 3: LiveKit handles the rest
// - Message encoded and sent via WebRTC data channel
// - LiveKit server receives and broadcasts to all participants
// - All clients' useChat() hooks receive the message
```

#### Receiving Messages

```typescript
// useChat() automatically provides updated messages
const { chatMessages } = useChat();

// React re-renders when messages update
<ChatList messages={chatMessages} />

// Each message rendered individually
{messages.map(message => (
  <ChatMessage key={message.timestamp} data={message} />
))}
```

---

### Chat Permissions & Validation

**All validation is CLIENT-SIDE** (not enforced by LiveKit server):

```typescript
// 1. Chat enabled check
const isHidden = !isChatEnabled || !isOnline;
if (isHidden) return null;

// 2. Followers-only check
const isFollowersOnlyAndNotFollowing = isFollowersOnly && !isFollowing;

// 3. Delay check (cooldown)
if (isDelayed && !isDelayBlocked) {
  setIsDelayBlocked(true);
  setTimeout(() => {
    setIsDelayBlocked(false);
    onSubmit();
  }, 3000);
}

// 4. Disable input if any restriction applies
const isDisabled = isHidden || isDelayBlocked || isFollowersOnlyAndNotFollowing;
```

**Important:** These are UI-level restrictions. A determined user could bypass them by modifying client code. For production, consider server-side validation via LiveKit webhooks or custom server logic.

---

### Chat vs Video Tracks

**Key Distinction:**

| Aspect | Video/Audio Tracks | Chat Messages |
|--------|-------------------|---------------|
| **Protocol** | WebRTC media tracks | WebRTC data channel |
| **Permission** | `canPublish: false` (viewers) | `canPublishData: true` |
| **Direction** | Unidirectional (host → viewers) | Bidirectional (all participants) |
| **Bandwidth** | High (video streaming) | Low (text messages) |
| **Hook** | `useTracks()`, `useRemoteParticipant()` | `useChat()` |
| **Source** | OBS via ingress | Browser via `send()` |

**Why viewers can't publish video but can chat:**
```typescript
token.addGrant({
  canPublish: false,      // Cannot publish video/audio tracks
  canPublishData: true,   // CAN publish data (chat messages)
});
```

---

### Message Structure

**What LiveKit provides in each message:**

```typescript
interface ReceivedChatMessage {
  timestamp: number;       // When message was sent (Unix ms)
  from?: {
    name: string;          // From JWT token.name
    identity: string;      // From JWT token.identity (user ID)
  };
  message: string;         // The actual message content
}
```

**Where the data comes from:**
- `timestamp` - Generated by LiveKit when message received
- `from.name` - From JWT token (`name: self.username`)
- `from.identity` - From JWT token (`identity: tokenIdentity`)
- `message` - The string passed to `send(message)`

---

### Why Chat Works Without Database

**Chat is entirely in-memory:**
1. No database writes when messages sent
2. Messages only exist in LiveKit room state
3. When all participants leave, messages are gone
4. Page refresh = lose all chat history

**If you need persistent chat:**
- Use LiveKit webhooks to capture `data_received` events
- Store messages in database
- Load historical messages on page load
- Merge with live messages from `useChat()`

---

### Guest Users & Chat

**Guest flow:**
```typescript
// In createViewerToken()
try {
  self = await getSelf();  // Try to get authenticated user
} catch {
  // No auth, create guest
  const id = v4();
  const username = `guest-${Math.floor(Math.random() * 100000)}`;
  self = { id, username };
}
```

**Guest in chat:**
- Name appears as `guest-12345`
- Can view messages (always)
- Can send messages if NOT `isFollowersOnly` (guest can't be following)
- Identity is random UUID (not linked to any account)

---

### Chat Variants

The app supports two chat views:

**1. CHAT Variant (default):**
```typescript
{variant === ChatVariant.CHAT && (
  <>
    <ChatList messages={reversedMessages} />
    <ChatForm onSubmit={onSubmit} />
  </>
)}
```
Shows message list and input form.

**2. COMMUNITY Variant:**
```typescript
{variant === ChatVariant.COMMUNITY && (
  <ChatCommunity viewerName={viewerName} hostName={hostName} />
)}
```
Shows list of participants in the room (not implemented in detail here).

Users can toggle between views via `ChatHeader` controls.

---

### Performance Considerations

**Message Sorting:**
```typescript
const reversedMessages = useMemo(() => {
  return messages.sort((a, b) => b.timestamp - a.timestamp);
}, [messages]);
```
- Uses `useMemo` to avoid re-sorting on every render
- Sorts newest-first for reverse flex display (newest at bottom visually)

**Color Generation:**
```typescript
const color = stringToColor(data.from?.name || "");
```
- Deterministic color from username hash
- Same user = same color across sessions
- Helps identify users visually

**Virtual Scrolling:**
- Not implemented in this codebase
- For high-traffic streams, consider `react-window` or `react-virtualized`
- Current implementation renders ALL messages (could lag with 1000+ messages)

---

## Summary: How Everything Connects

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLETE SYSTEM FLOW                         │
└─────────────────────────────────────────────────────────────────┘

1. Creator generates stream keys (RTMP URL + key)
2. Creator starts OBS → LiveKit Ingress
3. LiveKit webhook → Database: isLive = true
4. Viewer visits /{username}
5. Frontend requests viewer token (JWT)
6. Token grants: roomJoin=true, canPublish=false, canPublishData=true
7. Browser connects to LiveKit via WebSocket + WebRTC
8. Video: Subscribe to host's camera/mic tracks → Display in <video>
9. Chat: Join data channel → Send/receive via useChat()
10. Creator dashboard: Same flow, but identity = "Host-{userId}"
11. All participants (viewers + creator) see same chat in real-time
```

---

**End of Document**

---

## Quick Reference

### Key Files
- **Stream viewing:** `src/app/(browse)/[username]/page.tsx`
- **Creator dashboard:** `src/app/(dashboard)/u/[username]/(home)/page.tsx`
- **Token generation:** `src/actions/token.ts`
- **Stream player:** `src/components/stream-player/index.tsx`
- **Video component:** `src/components/stream-player/video.tsx`
- **Chat system:** `src/components/stream-player/chat.tsx`
- **Ingress setup:** `src/actions/ingress.ts`
- **LiveKit webhook:** `src/app/api/webhook/livekit/route.ts`

### Key Concepts
- 🎥 **Video source:** OBS → LiveKit Ingress (not browser)
- 👀 **Viewing:** All participants (including creator) use viewer tokens
- 💬 **Chat:** WebRTC data channel via `useChat()` hook
- 🔐 **Auth:** JWT tokens with room-specific grants
- 🔄 **Real-time:** LiveKit handles WebRTC complexity
- 📡 **State sync:** Webhooks update database (`isLive`, etc.)

