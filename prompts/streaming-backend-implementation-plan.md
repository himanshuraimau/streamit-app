# Streaming Backend Implementation Plan

## Overview
This document outlines the complete implementation plan for adding LiveKit-based streaming functionality to the Node.js backend. The implementation will focus on **Creator routes and functionality first**, with user/viewer routes to be implemented later.

---

## Current State Analysis

### Existing Infrastructure
✅ **Database Schema**: Already includes Stream, Follow, and Block models  
✅ **Authentication**: Better Auth with JWT sessions in place  
✅ **File Uploads**: S3 integration for file management  
✅ **Creator Applications**: Complete creator onboarding system  

### Dependencies to Add
```json
{
  "livekit-server-sdk": "^2.14.0"
}
```

### Environment Variables Required
```env
# LiveKit Configuration (to be added to .env)
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
```

---

## Phase 1: Core Streaming Infrastructure (Creator Focus)

### 1.1 LiveKit Service Layer
**File**: `src/services/livekit.service.ts`

**Purpose**: Centralized LiveKit SDK operations

**Methods**:
- `createIngressClient()` - Initialize ingress client
- `createRoomClient()` - Initialize room client  
- `createAccessTokenService()` - Initialize token generation
- `resetUserIngresses(userId)` - Clean up existing ingresses/rooms
- `createStreamIngress(userId, ingressType)` - Create RTMP/WHIP ingress
- `deleteIngress(ingressId)` - Remove specific ingress
- `listActiveRooms()` - Get all active LiveKit rooms
- `getRoomParticipants(roomId)` - Get participants in a room

**Key Features**:
- Singleton pattern for client reuse
- Error handling and retry logic
- Logging for debugging
- Support for both RTMP and WHIP ingress types

---

### 1.2 Stream Service Layer
**File**: `src/services/stream.service.ts`

**Purpose**: Business logic for stream management

**Methods**:

#### Creator Operations
- `getCreatorStream(userId)` - Get creator's stream configuration
- `createStreamIngress(userId, options)` - Create stream key & ingress
  - Validates user is approved creator
  - Calls LiveKit service to create ingress
  - Saves ingress details to database
  - Returns stream key and server URL
- `resetStreamIngress(userId)` - Reset stream key (regenerate)
- `updateStreamInfo(userId, data)` - Update title, thumbnail
- `updateChatSettings(userId, settings)` - Update chat configuration
- `deleteStream(userId)` - Remove stream configuration

#### Stream Status
- `setStreamLive(userId, isLive)` - Update live status (called by webhook)
- `getStreamStatus(userId)` - Get current stream status

#### Validation
- `validateCreatorApproved(userId)` - Ensure user is approved creator
- `validateStreamOwnership(userId, streamId)` - Verify ownership

---

### 1.3 Token Service Layer  
**File**: `src/services/token.service.ts`

**Purpose**: Generate LiveKit access tokens for joining rooms

**Methods**:
- `generateCreatorToken(userId, roomId)` - Token with publish permissions
- `generateViewerToken(viewerId, hostId, username)` - Token for viewing
- `generateGuestToken(hostId, guestName)` - Token for anonymous viewers
- `validateTokenRequest(hostId, viewerId?)` - Check blocks/permissions

**Token Configuration**:
- **Creator**: `canPublish: true`, `canPublishData: true`
- **Viewer**: `canPublish: false`, `canPublishData: true` (for chat)
- **Guest**: `canPublish: false`, `canPublishData: false` (or true for chat)

---

### 1.4 Webhook Handler Service
**File**: `src/services/webhook.service.ts`

**Purpose**: Process LiveKit webhook events

**Methods**:
- `validateWebhookSignature(body, signature)` - Verify webhook authenticity
- `handleIngressStarted(event)` - Mark stream as live
- `handleIngressEnded(event)` - Mark stream as offline
- `handleRoomFinished(event)` - Clean up room data
- `handleParticipantJoined(event)` - Track viewer join
- `handleParticipantLeft(event)` - Track viewer leave

---

## Phase 2: API Routes (Creator Focus)

### 2.1 Stream Management Routes
**File**: `src/routes/stream.route.ts`

```typescript
// Creator Routes (Authenticated + Approved Creator Required)
POST   /api/stream/ingress              - Create stream key
DELETE /api/stream/ingress              - Reset/delete ingress
GET    /api/stream/info                 - Get own stream info
PUT    /api/stream/info                 - Update stream title/thumbnail
PUT    /api/stream/chat-settings        - Update chat settings

// Stream Status
GET    /api/stream/status               - Get own stream status
```

---

### 2.2 Webhook Routes
**File**: `src/routes/webhook.route.ts`

```typescript
// Public endpoint (secured by LiveKit signature)
POST   /api/webhook/livekit             - Receive LiveKit events
```

---

## Phase 3: Controllers

### 3.1 Stream Controller
**File**: `src/controllers/stream.controller.ts`

**Methods**:

#### Ingress Management
- `createIngress(req, res)` - POST /api/stream/ingress
  - Validates user is approved creator
  - Accepts `{ ingressType: 'RTMP' | 'WHIP' }` (default: RTMP)
  - Calls `StreamService.createStreamIngress()`
  - Returns stream key and server URL
  - **Response**: `{ ingressId, serverUrl, streamKey, userId }`

- `deleteIngress(req, res)` - DELETE /api/stream/ingress
  - Validates ownership
  - Removes ingress and resets stream
  - Cleans up LiveKit room
  - **Response**: `{ message: 'Stream ingress deleted successfully' }`

#### Stream Info Management
- `getStreamInfo(req, res)` - GET /api/stream/info
  - Returns creator's stream configuration
  - Includes title, thumbnail, chat settings
  - **Response**: `{ stream: {...} }`

- `updateStreamInfo(req, res)` - PUT /api/stream/info
  - Accepts `{ title?, thumbnail? }`
  - Updates stream metadata
  - **Response**: `{ stream: {...} }`

#### Chat Settings
- `updateChatSettings(req, res)` - PUT /api/stream/chat-settings
  - Accepts `{ isChatEnabled, isChatDelayed, isChatFollowersOnly }`
  - Updates chat configuration
  - **Response**: `{ stream: {...} }`

#### Status
- `getStreamStatus(req, res)` - GET /api/stream/status
  - Returns live status and viewer count
  - **Response**: `{ isLive, viewerCount, startedAt? }`

---

### 3.2 Webhook Controller
**File**: `src/controllers/webhook.controller.ts`

**Methods**:
- `handleLiveKitWebhook(req, res)` - POST /api/webhook/livekit
  - Validates webhook signature
  - Routes events to webhook service
  - Updates database based on event type
  - Returns 200 OK for all valid webhooks

**Event Handlers**:
- `INGRESS_STARTED` → Set `isLive = true`
- `INGRESS_ENDED` → Set `isLive = false`
- `ROOM_FINISHED` → Clean up room data

---

## Phase 4: Middleware

### 4.1 Creator Verification Middleware
**File**: `src/middleware/creator.middleware.ts`

**Purpose**: Ensure user is an approved creator

```typescript
export const requireCreator = async (req, res, next) => {
  const userId = req.user.id;
  
  const application = await prisma.creatorApplication.findUnique({
    where: { userId },
    select: { status: true }
  });
  
  if (!application || application.status !== 'APPROVED') {
    return res.status(403).json({ 
      error: 'Creator access required. Please apply and get approved.' 
    });
  }
  
  next();
};
```

---

### 4.2 Webhook Verification Middleware
**File**: `src/middleware/webhook.middleware.ts`

**Purpose**: Validate LiveKit webhook signatures

```typescript
export const verifyLiveKitWebhook = (req, res, next) => {
  const signature = req.headers['livekit-signature'];
  
  // Verify signature using LiveKit SDK
  const isValid = WebhookService.validateSignature(
    req.body, 
    signature
  );
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }
  
  next();
};
```

---

## Phase 5: Validations

### 5.1 Stream Validation Schemas
**File**: `src/lib/validations/stream.validation.ts`

```typescript
// Create ingress
export const createIngressSchema = z.object({
  ingressType: z.enum(['RTMP', 'WHIP']).default('RTMP'),
});

// Update stream info
export const updateStreamInfoSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  thumbnail: z.string().url().optional(),
});

// Update chat settings
export const updateChatSettingsSchema = z.object({
  isChatEnabled: z.boolean().optional(),
  isChatDelayed: z.boolean().optional(),
  isChatFollowersOnly: z.boolean().optional(),
});
```

---

## Phase 6: TypeScript Types

### 6.1 Stream Types
**File**: `src/types/stream.types.ts`

```typescript
export interface CreateIngressRequest {
  ingressType: 'RTMP' | 'WHIP';
}

export interface IngressResponse {
  ingressId: string;
  serverUrl: string;
  streamKey: string;
  userId: string;
}

export interface UpdateStreamInfoRequest {
  title?: string;
  thumbnail?: string;
}

export interface UpdateChatSettingsRequest {
  isChatEnabled?: boolean;
  isChatDelayed?: boolean;
  isChatFollowersOnly?: boolean;
}

export interface StreamStatusResponse {
  isLive: boolean;
  viewerCount: number;
  startedAt?: Date;
}

export interface LiveKitWebhookEvent {
  event: string;
  room?: {
    name: string;
    sid: string;
  };
  participant?: {
    identity: string;
    sid: string;
  };
  ingressInfo?: {
    ingressId: string;
    state: {
      status: number;
    };
  };
}
```

---

## Phase 7: Integration Steps

### Step 1: Install Dependencies
```bash
cd backend
bun add livekit-server-sdk
```

### Step 2: Environment Configuration
Add LiveKit credentials to `.env`:
```env
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
```

### Step 3: Database Preparation
The `Stream` model already exists in schema. No migration needed.

### Step 4: Implementation Order
1. ✅ Create LiveKit service (`livekit.service.ts`)
2. ✅ Create stream service (`stream.service.ts`)
3. ✅ Create token service (`token.service.ts`)
4. ✅ Create webhook service (`webhook.service.ts`)
5. ✅ Create validation schemas (`stream.validation.ts`)
6. ✅ Create TypeScript types (`stream.types.ts`)
7. ✅ Create middleware (`creator.middleware.ts`, `webhook.middleware.ts`)
8. ✅ Create controllers (`stream.controller.ts`, `webhook.controller.ts`)
9. ✅ Create routes (`stream.route.ts`, `webhook.route.ts`)
10. ✅ Register routes in `index.ts`

### Step 5: Testing Strategy
- Test ingress creation with Postman/cURL
- Test stream key regeneration
- Test chat settings updates
- Simulate webhook events
- Test with actual streaming software (OBS)

---

## Phase 8: Error Handling

### Common Error Scenarios
1. **User not approved creator** → 403 Forbidden
2. **Stream already exists** → Use existing or reset
3. **Invalid LiveKit credentials** → 500 Internal Server Error
4. **Webhook signature mismatch** → 401 Unauthorized
5. **Stream not found** → 404 Not Found

### Error Response Format
```typescript
{
  success: false,
  error: string,
  details?: any
}
```

---

## Phase 9: Future Enhancements (Not in Phase 1)

### Viewer/User Routes (Phase 2)
- `GET /api/stream/:username` - View stream by username
- `GET /api/stream/token/:hostId` - Get viewer token
- `GET /api/stream/live` - List all live streams
- `GET /api/stream/recommended` - Get recommended streams

### Analytics (Phase 3)
- Track viewer counts over time
- Stream duration tracking
- Chat message statistics
- Peak viewer counts

### Advanced Features (Phase 4)
- Multi-bitrate streaming
- DVR/recording capabilities
- Stream scheduling
- Collaboration streams (multiple hosts)
- Clips and highlights

---

## API Documentation Summary

### Creator Endpoints
| Method | Endpoint | Auth | Creator Required | Description |
|--------|----------|------|------------------|-------------|
| POST | `/api/stream/ingress` | ✅ | ✅ | Create stream key |
| DELETE | `/api/stream/ingress` | ✅ | ✅ | Delete stream key |
| GET | `/api/stream/info` | ✅ | ✅ | Get stream info |
| PUT | `/api/stream/info` | ✅ | ✅ | Update stream info |
| PUT | `/api/stream/chat-settings` | ✅ | ✅ | Update chat settings |
| GET | `/api/stream/status` | ✅ | ✅ | Get stream status |

### Webhook Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/webhook/livekit` | Signature | Receive LiveKit events |

---

## Testing Checklist

### Unit Tests
- [ ] LiveKit service methods
- [ ] Stream service business logic
- [ ] Token generation
- [ ] Webhook event handling
- [ ] Validation schemas

### Integration Tests
- [ ] Create ingress flow
- [ ] Update stream info flow
- [ ] Chat settings update flow
- [ ] Webhook event processing
- [ ] Creator middleware validation

### Manual Testing
- [ ] Create stream key via Postman
- [ ] Stream using OBS with generated key
- [ ] Verify stream goes live in database
- [ ] Test chat settings changes
- [ ] Test stream key regeneration
- [ ] Verify webhook events received

---

## Security Considerations

1. **Authentication**: All creator endpoints require valid JWT session
2. **Authorization**: Creator-specific endpoints check approval status
3. **Webhook Security**: Validate LiveKit signatures on all webhook requests
4. **Input Validation**: Use Zod schemas for all user inputs
5. **Rate Limiting**: Consider rate limiting stream creation (future)
6. **Stream Key Security**: Never expose stream keys in logs or client responses

---

## Performance Considerations

1. **Database Queries**: Use selective fields to minimize data transfer
2. **Caching**: Consider caching live stream list (future)
3. **Webhook Processing**: Handle webhooks asynchronously if needed
4. **Connection Pooling**: Reuse LiveKit client instances
5. **Error Recovery**: Implement retry logic for LiveKit API calls

---

## Deployment Notes

1. Ensure LiveKit server is accessible from backend
2. Configure webhook URL in LiveKit dashboard
3. Set up proper CORS for frontend integration
4. Monitor LiveKit webhook delivery
5. Set up logging for stream events
6. Configure alerts for stream failures

---

## Success Criteria

- ✅ Approved creators can generate stream keys
- ✅ Creators can stream using OBS/other software
- ✅ Stream status updates automatically (live/offline)
- ✅ Creators can update stream info and chat settings
- ✅ Webhooks are received and processed correctly
- ✅ All API endpoints are properly authenticated
- ✅ Comprehensive error handling in place

---

## Next Steps After Phase 1

1. Implement viewer/user routes
2. Build React frontend components
3. Integrate LiveKit React SDK
4. Add follow/block functionality to streaming
5. Implement chat moderation features
6. Add stream analytics and insights

---

**End of Implementation Plan**
