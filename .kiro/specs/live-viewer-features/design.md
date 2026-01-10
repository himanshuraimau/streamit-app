# Design Document: Live Streaming Viewer Features

## Overview

This design document outlines the technical implementation for enhancing the live streaming viewer experience in StreamIt. The features include real-time engagement elements (duration timer, like button with penny tips, engagement pop-ups), mobile-specific interactions (swipe gestures for immersive mode), privacy controls (hide chat, block users, screen recording protection), and post-stream summary functionality.

The implementation follows the existing StreamIt architecture using React with TypeScript for the frontend, Express.js with Prisma for the backend, and LiveKit for real-time streaming and data channels.

## Architecture

### High-Level Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Watch Stream Page                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              StreamContainer                             │    │
│  │  ┌─────────────────────┐  ┌─────────────────────────┐   │    │
│  │  │   VideoSection      │  │    ChatSection          │   │    │
│  │  │  ┌───────────────┐  │  │  ┌───────────────────┐  │   │    │
│  │  │  │ VideoPlayer   │  │  │  │ ChatComponent     │  │   │    │
│  │  │  └───────────────┘  │  │  │ (with hide toggle)│  │   │    │
│  │  │  ┌───────────────┐  │  │  └───────────────────┘  │   │    │
│  │  │  │StreamControls │  │  │  ┌───────────────────┐  │   │    │
│  │  │  │- Duration     │  │  │  │ BlockedUsersCtx   │  │   │    │
│  │  │  │- Like/Tip     │  │  │  └───────────────────┘  │   │    │
│  │  │  │- Report       │  │  └─────────────────────────┘   │    │
│  │  │  └───────────────┘  │                                │    │
│  │  │  ┌───────────────┐  │                                │    │
│  │  │  │EngagementPops │  │                                │    │
│  │  │  └───────────────┘  │                                │    │
│  │  └─────────────────────┘                                │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              ImmersiveModeOverlay                        │    │
│  │  (Fullscreen video with gesture handlers)                │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              PostStreamSummary (Modal)                   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend    │────▶│   Database   │
│   (React)    │◀────│   (Express)  │◀────│   (Prisma)   │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │
       │                    │
       ▼                    ▼
┌──────────────┐     ┌──────────────┐
│   LiveKit    │◀───▶│   LiveKit    │
│   Client     │     │   Server     │
│ (Data Chan.) │     │              │
└──────────────┘     └──────────────┘
```

### Real-Time Event Flow (via LiveKit Data Channels)

```
Viewer Action (Like/Gift/Join)
        │
        ▼
┌───────────────────┐
│ Frontend Handler  │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐     ┌───────────────────┐
│ Backend API Call  │────▶│ Database Update   │
└─────────┬─────────┘     └───────────────────┘
          │
          ▼
┌───────────────────┐
│ LiveKit Data Msg  │ (Broadcast to all participants)
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ All Viewers       │
│ Receive & Display │
│ Engagement Popup  │
└───────────────────┘
```

## Components and Interfaces

### Frontend Components

#### 1. StreamDurationTimer

Displays elapsed time since stream started.

```typescript
interface StreamDurationTimerProps {
  startedAt: Date | string;
  className?: string;
}

// Component displays: "LIVE • 01:23:45"
```

#### 2. LikeButton (Penny Tip)

Like button with coin indicator and heart animation.

```typescript
interface LikeButtonProps {
  creatorId: string;
  streamId: string;
  disabled?: boolean;
  onSuccess?: () => void;
  onInsufficientBalance?: () => void;
}

// Displays: Gold coin icon with "1" badge
// On click: Heart burst animation + API call
```

#### 3. ReportStreamDialog

Modal dialog for reporting streams.

```typescript
interface ReportStreamDialogProps {
  streamId: string;
  creatorId: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

enum ReportReason {
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  HARASSMENT = 'harassment',
  SPAM = 'spam',
  VIOLENCE = 'violence',
  COPYRIGHT = 'copyright',
  OTHER = 'other'
}
```

#### 4. EngagementPopup

Animated notification for stream events.

```typescript
interface EngagementEvent {
  id: string;
  type: 'gift' | 'join' | 'top_fan';
  username: string;
  giftName?: string;
  giftImage?: string;
  timestamp: number;
}

interface EngagementPopupProps {
  events: EngagementEvent[];
  onDismiss: (eventId: string) => void;
}
```

#### 5. ImmersiveModeOverlay

Fullscreen video with gesture support.

```typescript
interface ImmersiveModeProps {
  isActive: boolean;
  onExit: () => void;
  onDoubleTap: () => void;
  children: React.ReactNode;
}

// Gesture handlers:
// - Swipe right: Exit immersive mode
// - Double tap: Trigger like
```

#### 6. ChatVisibilityToggle

Toggle button for hiding/showing chat.

```typescript
interface ChatVisibilityToggleProps {
  isVisible: boolean;
  onToggle: (visible: boolean) => void;
}
```

#### 7. BlockedUsersContext

Context provider for managing locally blocked users.

```typescript
interface BlockedUsersContextValue {
  blockedUserIds: Set<string>;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  isBlocked: (userId: string) => boolean;
}
```

#### 8. PostStreamSummary

Modal shown when stream ends.

```typescript
interface PostStreamSummaryProps {
  streamId: string;
  creatorId: string;
  creatorName: string;
  creatorImage?: string;
  totalViewers: number;
  topGifter?: {
    userId: string;
    username: string;
    totalCoins: number;
  };
  isFollowing: boolean;
  onFollow: () => void;
  onClose: () => void;
  recommendedStreams: RecommendedStream[];
}
```

### Backend API Endpoints

#### 1. Send Penny Tip

```
POST /api/payment/penny-tip
Authorization: Bearer <token>

Request:
{
  "creatorId": "string",
  "streamId": "string"
}

Response:
{
  "success": true,
  "data": {
    "transactionId": "string",
    "remainingBalance": number
  }
}
```

#### 2. Report Stream

```
POST /api/stream/report
Authorization: Bearer <token>

Request:
{
  "streamId": "string",
  "reason": "inappropriate_content" | "harassment" | "spam" | "violence" | "copyright" | "other",
  "description": "string" (optional)
}

Response:
{
  "success": true,
  "data": {
    "reportId": "string"
  }
}
```

#### 3. Get Stream Summary

```
GET /api/stream/:streamId/summary
Authorization: Bearer <token> (optional)

Response:
{
  "success": true,
  "data": {
    "totalViewers": number,
    "peakViewers": number,
    "topGifter": {
      "userId": "string",
      "username": "string",
      "totalCoins": number
    } | null,
    "totalGifts": number,
    "duration": number
  }
}
```

#### 4. Get Recommended Streams

```
GET /api/viewer/recommended?limit=5&excludeStreamId=<streamId>

Response:
{
  "success": true,
  "data": [
    {
      "id": "string",
      "title": "string",
      "thumbnail": "string",
      "user": {
        "username": "string",
        "name": "string",
        "image": "string"
      },
      "viewerCount": number
    }
  ]
}
```

### LiveKit Data Channel Messages

For real-time engagement events, we use LiveKit's data channels:

```typescript
// Message types sent via LiveKit data channel
type DataChannelMessage = 
  | { type: 'gift'; senderId: string; senderName: string; giftName: string; giftImage: string; coinAmount: number }
  | { type: 'join'; userId: string; username: string }
  | { type: 'like'; userId: string; username: string }
  | { type: 'top_fan'; userId: string; username: string; totalCoins: number }
  | { type: 'stream_ended'; summary: StreamSummary };
```

## Data Models

### New Database Tables

#### StreamReport

```prisma
model StreamReport {
  id          String       @id @default(cuid())
  streamId    String
  stream      Stream       @relation(fields: [streamId], references: [id])
  reporterId  String
  reporter    User         @relation(fields: [reporterId], references: [id])
  reason      ReportReason
  description String?      @db.Text
  status      ReportStatus @default(PENDING)
  reviewedAt  DateTime?
  reviewedBy  String?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([streamId])
  @@index([reporterId])
  @@index([status])
}

enum ReportReason {
  INAPPROPRIATE_CONTENT
  HARASSMENT
  SPAM
  VIOLENCE
  COPYRIGHT
  OTHER
}

enum ReportStatus {
  PENDING
  REVIEWED
  RESOLVED
  DISMISSED
}
```

#### StreamStats (for tracking viewer metrics)

```prisma
model StreamStats {
  id           String   @id @default(cuid())
  streamId     String   @unique
  stream       Stream   @relation(fields: [streamId], references: [id])
  peakViewers  Int      @default(0)
  totalViewers Int      @default(0)
  totalLikes   Int      @default(0)
  totalGifts   Int      @default(0)
  totalCoins   Int      @default(0)
  startedAt    DateTime?
  endedAt      DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### Modified Existing Models

#### Stream Model Updates

```prisma
model Stream {
  // ... existing fields ...
  
  // Add new fields
  startedAt    DateTime?  // When stream went live
  
  // Add relations
  reports      StreamReport[]
  stats        StreamStats?
}
```

### Local Storage Schema

For client-side preferences:

```typescript
interface ViewerPreferences {
  chatVisible: boolean;
  blockedUserIds: string[];
  immersiveModeEnabled: boolean;
}

// Storage key: 'streamit_viewer_prefs'
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Duration Calculation Correctness

*For any* stream start timestamp and current timestamp, the calculated duration should equal the difference between current time and start time, formatted as "HH:MM:SS".

**Validates: Requirements 1.1, 1.3**

### Property 2: Penny Tip Deduction

*For any* viewer with a coin balance >= 1, when they send a penny tip, their wallet balance should decrease by exactly 1 coin.

**Validates: Requirements 3.3**

### Property 3: Penny Tip Credit

*For any* penny tip transaction, the creator's wallet balance should increase by exactly 1 coin (minus any platform commission if applicable).

**Validates: Requirements 3.4**

### Property 4: Engagement Popup Auto-Dismiss

*For any* engagement popup displayed, it should be automatically dismissed after a duration between 3-5 seconds.

**Validates: Requirements 4.4**

### Property 5: Engagement Popup Queue Order

*For any* sequence of engagement events occurring simultaneously, the popups should be displayed in the order they were received (FIFO).

**Validates: Requirements 4.5**

### Property 6: Immersive Mode UI Hiding

*For any* stream in immersive mode, all UI elements (chat panel, controls, overlays) should have visibility set to hidden or display set to none.

**Validates: Requirements 5.2**

### Property 7: Touch Device Gesture Enablement

*For any* device, swipe gestures should only be enabled if the device supports touch input (has 'ontouchstart' in window or navigator.maxTouchPoints > 0).

**Validates: Requirements 5.5**

### Property 8: Chat Visibility Preference Round-Trip

*For any* chat visibility preference (true or false), saving to local storage and then reading back should return the same value.

**Validates: Requirements 6.2, 6.3**

### Property 9: Blocked User Message Filtering

*For any* list of chat messages and a set of blocked user IDs, the filtered messages should contain no messages from blocked users.

**Validates: Requirements 7.2**

### Property 10: Block/Unblock Round-Trip

*For any* user ID, blocking and then unblocking should result in the user not being in the blocked list, and their messages should be visible again.

**Validates: Requirements 7.3, 7.4**

### Property 11: Top Gifter Calculation

*For any* stream with gift transactions, the top gifter should be the user with the highest total coin amount sent during that stream.

**Validates: Requirements 9.3**

### Property 12: Follow Button Conditional Display

*For any* post-stream summary, the follow button should be visible if and only if the viewer is not already following the creator.

**Validates: Requirements 9.4**

## Error Handling

### Frontend Error Handling

| Error Scenario | Handling Strategy |
|----------------|-------------------|
| Penny tip with insufficient balance | Show "Insufficient coins" toast, prompt to purchase |
| Report submission failure | Show error toast, keep dialog open for retry |
| LiveKit connection failure | Show reconnection UI, auto-retry with backoff |
| Local storage unavailable | Fall back to in-memory storage for session |
| Stream ended unexpectedly | Show post-stream summary with available data |

### Backend Error Handling

| Error Scenario | HTTP Status | Response |
|----------------|-------------|----------|
| Invalid penny tip (insufficient balance) | 400 | `{ success: false, error: "Insufficient balance" }` |
| Stream not found | 404 | `{ success: false, error: "Stream not found" }` |
| Unauthorized report | 401 | `{ success: false, error: "Authentication required" }` |
| Rate limit exceeded | 429 | `{ success: false, error: "Too many requests" }` |
| Database error | 500 | `{ success: false, error: "Internal server error" }` |

### Rate Limiting

| Endpoint | Limit |
|----------|-------|
| POST /api/payment/penny-tip | 60 requests/minute per user |
| POST /api/stream/report | 5 requests/hour per user |

## Testing Strategy

### Unit Tests

Unit tests will cover:
- Duration calculation function (formatDuration)
- Blocked user filtering logic
- Chat visibility preference storage/retrieval
- Top gifter calculation from transaction list
- Engagement popup queue management

### Property-Based Tests

Property-based tests using fast-check will validate:
- Duration calculation for arbitrary timestamps
- Penny tip balance changes
- Message filtering with arbitrary blocked user sets
- Preference round-trip persistence
- Popup queue ordering

**Configuration:**
- Minimum 100 iterations per property test
- Use fast-check for TypeScript property-based testing
- Tag format: **Feature: live-viewer-features, Property {number}: {property_text}**

### Integration Tests

Integration tests will cover:
- Penny tip API endpoint with wallet updates
- Report submission flow
- LiveKit data channel message broadcasting
- Post-stream summary data aggregation

### E2E Tests

End-to-end tests will cover:
- Complete penny tip flow (click → animation → balance update)
- Report dialog flow (open → select reason → submit → confirmation)
- Immersive mode gesture navigation
- Post-stream summary display on stream end

## Implementation Notes

### LiveKit Data Channel Integration

For real-time engagement events, use LiveKit's `DataPacket_Kind.RELIABLE` for guaranteed delivery:

```typescript
import { DataPacket_Kind } from 'livekit-client';

// Send engagement event to all participants
const sendEngagementEvent = (room: Room, event: EngagementEvent) => {
  const data = new TextEncoder().encode(JSON.stringify(event));
  room.localParticipant.publishData(data, DataPacket_Kind.RELIABLE);
};

// Receive engagement events
room.on(RoomEvent.DataReceived, (payload, participant) => {
  const event = JSON.parse(new TextDecoder().decode(payload));
  handleEngagementEvent(event);
});
```

### Screen Recording Protection

Screen recording protection is platform-dependent and has limitations:

- **Web browsers**: Limited protection available. Can detect visibility changes via Page Visibility API.
- **Android WebView**: Can set `FLAG_SECURE` via native bridge.
- **iOS WKWebView**: Can set `isScreenCaptureProtected` via native bridge.
- **Desktop**: No reliable protection available.

Implementation will focus on detection and warning rather than prevention on web.

### Gesture Detection Library

Use `react-swipeable` for cross-platform gesture detection:

```typescript
import { useSwipeable } from 'react-swipeable';

const handlers = useSwipeable({
  onSwipedLeft: () => setImmersiveMode(true),
  onSwipedRight: () => setImmersiveMode(false),
  trackMouse: false, // Only track touch
});
```

### Local Storage Keys

```typescript
const STORAGE_KEYS = {
  CHAT_VISIBLE: 'streamit_chat_visible',
  BLOCKED_USERS: 'streamit_blocked_users',
  VIEWER_PREFS: 'streamit_viewer_prefs',
} as const;
```

