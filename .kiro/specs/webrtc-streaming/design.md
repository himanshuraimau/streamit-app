# Design Document: WebRTC Browser Streaming

## Overview

This design document outlines the migration from OBS-based RTMP streaming to browser-based WebRTC streaming. The new architecture allows creators to stream directly from their browser using their device's camera and microphone, eliminating the need for external streaming software.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Creator Browser                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Camera    │  │ Microphone  │  │    Stream Controls      │ │
│  └──────┬──────┘  └──────┬──────┘  │ (mute, camera, end)     │ │
│         │                │         └─────────────────────────┘ │
│         └────────┬───────┘                                      │
│                  ▼                                              │
│         ┌────────────────┐                                      │
│         │  LiveKit SDK   │◄──── Publish Token (canPublish=true) │
│         │  (WebRTC)      │                                      │
│         └────────┬───────┘                                      │
└──────────────────┼──────────────────────────────────────────────┘
                   │
                   ▼
          ┌────────────────┐
          │  LiveKit Cloud │
          │    Server      │
          └────────┬───────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
    ▼              ▼              ▼
┌────────┐   ┌────────┐    ┌────────────┐
│Viewer 1│   │Viewer 2│    │  Backend   │
│(WebRTC)│   │(WebRTC)│    │  (Status)  │
└────────┘   └────────┘    └────────────┘
```

## Components and Interfaces

### Backend Components

#### 1. StreamService (Modified)
Simplified service without ingress management.

```typescript
interface StreamService {
  // Stream CRUD
  getCreatorStream(userId: string): Promise<Stream | null>;
  getStreamByUsername(username: string): Promise<StreamWithUser | null>;
  createOrUpdateStream(userId: string, data: StreamData): Promise<Stream>;
  updateStreamInfo(userId: string, data: Partial<StreamData>): Promise<Stream>;
  updateChatSettings(userId: string, settings: ChatSettings): Promise<Stream>;
  
  // Live status (for WebRTC)
  setStreamLive(userId: string, isLive: boolean): Promise<Stream>;
  getStreamStatus(userId: string): Promise<StreamStatus>;
  
  // Discovery
  getLiveStreams(): Promise<StreamWithUser[]>;
  getFollowedStreams(userId: string): Promise<StreamWithUser[]>;
  searchStreams(query: string): Promise<StreamWithUser[]>;
}
```

#### 2. TokenService (Modified)
Token generation for WebRTC streaming.

```typescript
interface TokenService {
  // Creator token - can publish video/audio
  generateCreatorToken(userId: string, roomId: string): Promise<string>;
  
  // Viewer tokens - subscribe only
  generateViewerToken(viewerId: string, hostId: string, username: string): Promise<string>;
  generateGuestToken(hostId: string, guestName: string): Promise<string>;
  
  // Validation
  validateTokenRequest(hostId: string, viewerId?: string): Promise<ValidationResult>;
}
```

#### 3. StreamController (Modified)
New endpoints for WebRTC streaming.

```typescript
// New endpoints
POST /api/stream/go-live      // Get publish token + set isLive=true
POST /api/stream/end-stream   // Set isLive=false
POST /api/stream/setup        // Create/update stream metadata

// Kept endpoints
GET  /api/stream/info         // Get stream info
PUT  /api/stream/info         // Update title/description
PUT  /api/stream/chat-settings // Update chat settings
GET  /api/stream/status       // Get live status + viewer count

// Removed endpoints
POST   /api/stream/ingress       // REMOVED
DELETE /api/stream/ingress       // REMOVED
GET    /api/stream/credentials   // REMOVED
POST   /api/stream/creator-token // REMOVED (replaced by go-live)
```

### Frontend Components

#### 1. GoLivePage (New)
Main streaming page for creators.

```typescript
interface GoLivePageState {
  streamInfo: StreamInfo | null;
  tokenData: { token: string; wsUrl: string; roomId: string } | null;
  isLive: boolean;
  isConnecting: boolean;
  error: string | null;
}
```

#### 2. CreatorStreamControls (New)
Controls for managing the live stream.

```typescript
interface CreatorStreamControlsProps {
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onEndStream: () => void;
  isCameraOn: boolean;
  isMicOn: boolean;
  viewerCount: number;
}
```

#### 3. StreamPreview (New)
Self-preview component showing creator's camera feed.

```typescript
interface StreamPreviewProps {
  localVideoTrack: LocalVideoTrack | null;
  localAudioTrack: LocalAudioTrack | null;
}
```

### API Endpoints

#### POST /api/stream/go-live
Start a live stream and get publish token.

Request: None (uses authenticated user)

Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "wsUrl": "wss://livekit.example.com",
    "roomId": "user-123",
    "stream": {
      "id": "stream-456",
      "title": "My Stream",
      "isLive": true
    }
  }
}
```

#### POST /api/stream/end-stream
End the live stream.

Request: None (uses authenticated user)

Response:
```json
{
  "success": true,
  "message": "Stream ended"
}
```

#### POST /api/stream/setup
Create or update stream metadata before going live.

Request:
```json
{
  "title": "My Awesome Stream",
  "description": "Welcome to my stream!",
  "isChatEnabled": true,
  "isChatDelayed": false,
  "isChatFollowersOnly": false
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "stream-456",
    "title": "My Awesome Stream",
    "description": "Welcome to my stream!",
    "isLive": false
  }
}
```

## Data Models

### Stream Model (Simplified)

```prisma
model Stream {
  id          String  @id @default(cuid())
  title       String  @db.Text
  description String? @db.Text
  thumbnail   String? @db.Text

  // Status
  isLive Boolean @default(false)

  // Chat settings
  isChatEnabled       Boolean @default(true)
  isChatDelayed       Boolean @default(false)
  isChatFollowersOnly Boolean @default(false)

  // Creator relationship
  userId String @unique
  user   User   @relation(...)

  // Removed fields:
  // ingressId String? - REMOVED
  // serverUrl String? - REMOVED
  // streamKey String? - REMOVED
}
```

### Token Grants

| Token Type | canPublish | canPublishData | canSubscribe | Identity |
|------------|------------|----------------|--------------|----------|
| Creator    | true       | true           | true         | userId   |
| Viewer     | false      | true           | true         | userId   |
| Guest      | false      | true           | true         | guest-{timestamp} |

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Go live sets stream status to live
*For any* creator who successfully calls the go-live endpoint, the stream's isLive field should be set to true in the database.
**Validates: Requirements 1.3**

### Property 2: End stream sets status to offline
*For any* creator who calls the end-stream endpoint, the stream's isLive field should be set to false in the database.
**Validates: Requirements 2.3**

### Property 3: Title update preserves live status
*For any* stream that is currently live, updating the title should not change the isLive status.
**Validates: Requirements 2.5**

### Property 4: Chat settings persist correctly
*For any* chat setting toggle (enabled, delayed, followers-only), the setting should be correctly persisted in the database.
**Validates: Requirements 3.3**

### Property 5: Viewer tokens are subscribe-only
*For any* viewer token generated (authenticated or guest), the token should have canPublish=false.
**Validates: Requirements 4.1**

### Property 6: Authenticated viewer identity matches userId
*For any* authenticated viewer requesting a token, the token identity should match their userId.
**Validates: Requirements 4.3**

### Property 7: Guest viewer identity has guest prefix
*For any* guest viewer requesting a token, the token identity should start with "guest-".
**Validates: Requirements 4.4**

### Property 8: Stream setup creates valid record
*For any* valid stream setup data (non-empty title), a stream record should be created or updated with the correct data.
**Validates: Requirements 5.2**

## Error Handling

### Permission Errors
- Camera/mic permission denied: Display clear instructions for granting permissions
- Browser not supported: Display message about WebRTC requirements

### Connection Errors
- LiveKit connection failed: Retry with exponential backoff, show error after 3 attempts
- Token expired: Automatically refresh token and reconnect

### Stream Errors
- Stream not found: Redirect to setup page
- Not approved creator: Display message about creator application

## Testing Strategy

### Unit Tests
- StreamService methods (CRUD operations, status updates)
- TokenService token generation (verify grants)
- API endpoint handlers (request/response validation)

### Property-Based Tests
Using fast-check for TypeScript:

1. **Stream status properties**: Generate random user IDs and verify go-live/end-stream correctly toggle isLive
2. **Token grant properties**: Generate random viewer requests and verify canPublish is always false
3. **Identity properties**: Generate random authenticated/guest requests and verify identity format
4. **Title update properties**: Generate random titles and verify live status is preserved

### Integration Tests
- Full go-live flow: Setup → Go Live → Verify LiveKit connection
- Full viewer flow: Navigate → Get token → Join room
- End stream flow: End → Verify disconnection → Verify offline status

### E2E Tests (Manual)
- Camera/mic permission flow
- Stream controls (mute, camera toggle)
- Chat interaction
- Viewer experience
