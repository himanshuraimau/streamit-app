# Streaming Backend - Implementation Guide

## 🎥 Overview

This document describes the complete streaming functionality implementation using LiveKit. The backend provides comprehensive streaming capabilities for approved creators and viewers.

**📘 For detailed Phase 2 documentation**, see [PHASE_2_VIEWER_SOCIAL.md](./PHASE_2_VIEWER_SOCIAL.md)

---

## ✅ What's Been Implemented

### Services Layer
- **LiveKitService** - Direct LiveKit SDK operations (ingress, rooms, clients)
- **StreamService** - Business logic for stream management
- **TokenService** - Generate access tokens for LiveKit rooms (creator/viewer/guest)
- **WebhookService** - Process LiveKit events (stream start/stop)

### API Routes - Phase 1 (Creator Features)
```
POST   /api/stream/ingress            - Create stream key
DELETE /api/stream/ingress            - Delete stream key
GET    /api/stream/info               - Get stream configuration
PUT    /api/stream/info               - Update title/thumbnail
PUT    /api/stream/chat-settings      - Update chat settings
GET    /api/stream/status             - Get live status & viewer count
POST   /api/webhook/livekit           - Receive LiveKit events
GET    /api/webhook/livekit/health    - Webhook health check
```

### API Routes - Phase 2 (Viewer & Social Features)
```
# Viewer Endpoints
GET    /api/viewer/stream/:username   - View stream by username
POST   /api/viewer/token              - Get viewer token (auth/guest)
GET    /api/viewer/live               - Get all live streams
GET    /api/viewer/recommended        - Get recommended streams
GET    /api/viewer/following          - Get followed creators' streams
GET    /api/viewer/search             - Search streams

# Social Endpoints
POST   /api/social/follow/:userId     - Follow approved creator
DELETE /api/social/follow/:userId     - Unfollow creator
GET    /api/social/follow/:userId     - Check follow status
GET    /api/social/followers/:userId  - Get followers list
GET    /api/social/following/:userId  - Get following list
POST   /api/social/block/:userId      - Block user
DELETE /api/social/block/:userId      - Unblock user
GET    /api/social/creators           - Browse all creators
GET    /api/social/creator/:username  - Get creator profile
```

### Middleware
- **requireCreator** - Ensures user is an approved creator
- **verifyLiveKitWebhook** - Validates LiveKit webhook signatures

### Database
Uses existing `Stream`, `Follow`, `Block` models in Prisma schema (no migration needed)

---

## 🔧 Setup Instructions

### 1. Environment Variables

Add these to your `.env` file:

```env
# LiveKit Configuration
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
```

**How to get LiveKit credentials:**

#### Option A: LiveKit Cloud (Recommended for production)
1. Go to https://cloud.livekit.io/
2. Sign up for a free account
3. Create a new project
4. Copy your credentials from the project settings

#### Option B: Self-hosted LiveKit (For development)
1. Install LiveKit server: https://docs.livekit.io/home/self-hosting/deployment/
2. Generate API keys using `livekit-cli generate-keys`
3. Use the generated keys in your `.env`

### 2. Install Dependencies

Dependencies are already installed (`livekit-server-sdk@2.14.0`)

### 3. Configure LiveKit Webhooks

In your LiveKit dashboard or config:

1. Set webhook URL: `https://your-backend-url.com/api/webhook/livekit`
2. Enable these events:
   - `ingress_started`
   - `ingress_ended`
   - `room_finished`
   - `participant_joined` (optional)
   - `participant_left` (optional)

---

## 📡 API Usage

### For Creators

#### 1. Create Stream Key

```bash
POST /api/stream/ingress
Authorization: Bearer <token>

# Request Body
{
  "ingressType": "RTMP"  # or "WHIP"
}

# Response
{
  "success": true,
  "data": {
    "ingressId": "IN_xxxxx",
    "serverUrl": "rtmp://your-livekit-server.com/live",
    "streamKey": "xxxxx-xxxxx-xxxxx",
    "userId": "user-id"
  },
  "message": "Stream key created successfully"
}
```

**Use these credentials in OBS:**
- **Server**: `serverUrl`
- **Stream Key**: `streamKey`

#### 2. Get Stream Info

```bash
GET /api/stream/info
Authorization: Bearer <token>

# Response
{
  "success": true,
  "data": {
    "id": "stream-id",
    "title": "My Stream",
    "thumbnail": "https://...",
    "isLive": false,
    "isChatEnabled": true,
    "isChatDelayed": false,
    "isChatFollowersOnly": false,
    "userId": "user-id",
    "createdAt": "2025-11-01T...",
    "updatedAt": "2025-11-01T..."
  }
}
```

#### 3. Update Stream Info

```bash
PUT /api/stream/info
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "My Awesome Stream",
  "thumbnail": "https://cdn.example.com/thumbnail.jpg"
}

# Response
{
  "success": true,
  "data": {
    "id": "stream-id",
    "title": "My Awesome Stream",
    "thumbnail": "https://cdn.example.com/thumbnail.jpg",
    "updatedAt": "2025-11-01T..."
  },
  "message": "Stream info updated successfully"
}
```

#### 4. Update Chat Settings

```bash
PUT /api/stream/chat-settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "isChatEnabled": true,
  "isChatDelayed": false,
  "isChatFollowersOnly": true
}

# Response
{
  "success": true,
  "data": {
    "isChatEnabled": true,
    "isChatDelayed": false,
    "isChatFollowersOnly": true
  },
  "message": "Chat settings updated successfully"
}
```

#### 5. Get Stream Status

```bash
GET /api/stream/status
Authorization: Bearer <token>

# Response
{
  "success": true,
  "data": {
    "isLive": true,
    "viewerCount": 42,
    "title": "My Stream",
    "thumbnail": "https://...",
    "isChatEnabled": true,
    "isChatDelayed": false,
    "isChatFollowersOnly": false
  }
}
```

#### 6. Delete Stream Key

```bash
DELETE /api/stream/ingress
Authorization: Bearer <token>

# Response
{
  "success": true,
  "message": "Stream key deleted successfully"
}
```

---

## 🎬 Streaming Workflow

### Creator Flow

1. **Apply & Get Approved**
   - Submit creator application
   - Wait for admin approval
   - Status must be `APPROVED`

2. **Generate Stream Key**
   - POST to `/api/stream/ingress`
   - Receive RTMP URL and stream key
   - Configure OBS with these credentials

3. **Start Streaming**
   - Start streaming in OBS
   - LiveKit sends `ingress_started` webhook
   - Backend marks stream as `isLive: true`

4. **Manage Stream**
   - Update title/thumbnail while live
   - Change chat settings in real-time
   - Monitor viewer count

5. **Stop Streaming**
   - Stop streaming in OBS
   - LiveKit sends `ingress_ended` webhook
   - Backend marks stream as `isLive: false`

---

## 🔒 Security

### Authentication & Authorization

1. **Creator Verification**
   - All routes require valid JWT session
   - `requireCreator` middleware checks approval status
   - Only `APPROVED` creators can access streaming features

2. **Webhook Security**
   - Webhooks validated using LiveKit signatures
   - Invalid signatures are rejected with 401
   - `verifyLiveKitWebhook` middleware handles validation

3. **Stream Ownership**
   - Users can only manage their own streams
   - Stream key never exposed in regular endpoints
   - Only returned during creation

---

## 🐛 Error Handling

### Common Errors

| Error | Status | Cause | Solution |
|-------|--------|-------|----------|
| `Authentication required` | 401 | No token provided | Include Bearer token in Authorization header |
| `Creator approval required` | 403 | User not approved | Wait for creator application approval |
| `Stream not found` | 404 | No stream created | Create stream key first |
| `Invalid webhook signature` | 401 | Bad webhook signature | Check LiveKit webhook configuration |
| `Failed to create ingress` | 500 | LiveKit error | Check LiveKit credentials and server status |

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed description",
  "details": []  // Validation errors (if applicable)
}
```

---

## 📊 Database Schema

The Stream model (already exists in schema):

```prisma
model Stream {
  id                    String   @id @default(cuid())
  title                 String   @db.Text
  thumbnail             String?  @db.Text
  
  // Streaming infrastructure
  ingressId             String?  @unique
  serverUrl             String?  @db.Text
  streamKey             String?  @db.Text
  
  // Stream status
  isLive                Boolean  @default(false)
  
  // Chat settings
  isChatEnabled         Boolean  @default(true)
  isChatDelayed         Boolean  @default(false)
  isChatFollowersOnly   Boolean  @default(false)
  
  // Creator relationship
  userId                String   @unique
  user                  User     @relation(...)
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

---

## 🧪 Testing

### Manual Testing with OBS

1. **Create Stream Key**
   ```bash
   curl -X POST http://localhost:3000/api/stream/ingress \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"ingressType":"RTMP"}'
   ```

2. **Configure OBS**
   - Settings → Stream
   - Service: Custom
   - Server: (use `serverUrl` from response)
   - Stream Key: (use `streamKey` from response)

3. **Start Streaming**
   - Click "Start Streaming" in OBS
   - Check stream status API to verify `isLive: true`

4. **Test Chat Settings**
   - Update settings while live
   - Verify changes are persisted

5. **Stop Streaming**
   - Click "Stop Streaming" in OBS
   - Verify `isLive: false` in status API

### Testing with cURL

```bash
# 1. Get stream info
curl http://localhost:3000/api/stream/info \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Update stream title
curl -X PUT http://localhost:3000/api/stream/info \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Live Coding Session"}'

# 3. Enable followers-only chat
curl -X PUT http://localhost:3000/api/stream/chat-settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isChatFollowersOnly":true}'

# 4. Get stream status
curl http://localhost:3000/api/stream/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# 5. Delete stream key
curl -X DELETE http://localhost:3000/api/stream/ingress \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 Logs

All services log important events:

```
[LiveKit] IngressClient initialized
[LiveKit] Creating RTMP ingress for user clxxx
[LiveKit] Ingress created successfully: IN_xxxxx
[StreamService] Creating ingress for user: clxxx
[StreamService] Ingress created successfully for user: clxxx
[WebhookService] Valid webhook received: ingress_started
[WebhookService] Stream started for ingress: IN_xxxxx
[StreamService] Stream is now LIVE for user: clxxx
```

Monitor logs to debug issues and track stream events.

---

## 🚀 Next Steps (Phase 2 - Not Implemented Yet)

### Viewer Routes
- `GET /api/stream/:username` - View stream by username
- `POST /api/stream/token/:hostId` - Get viewer token
- `GET /api/stream/live` - List all live streams
- `GET /api/stream/recommended` - Get recommended streams

### Frontend Integration
- React components with LiveKit React SDK
- Stream player with video/chat
- Live stream discovery page
- Creator dashboard

### Advanced Features
- Stream analytics (viewers over time)
- Stream recording/VOD
- Multi-bitrate streaming
- Clips and highlights
- Raid and host features

---

## 🔗 Resources

- [LiveKit Documentation](https://docs.livekit.io/)
- [LiveKit Server SDK](https://github.com/livekit/server-sdk-js)
- [OBS Studio](https://obsproject.com/)
- [Prisma Documentation](https://www.prisma.io/docs)

---

## 💡 Tips

1. **Testing Locally**: Use LiveKit Cloud for easier testing
2. **Webhook Issues**: Check webhook URL is publicly accessible
3. **OBS Settings**: Use H.264 codec, 1080p @ 30fps, 5000 kbps bitrate
4. **Stream Key**: Regenerate if compromised using DELETE then POST
5. **Chat**: Implement chat restrictions based on follower status

---

## ❓ Troubleshooting

### Stream Won't Start
- Check LiveKit credentials are correct
- Verify ingress was created successfully
- Check OBS is using correct server URL and stream key
- Look for errors in backend logs

### Webhook Not Received
- Verify webhook URL is publicly accessible
- Check LiveKit webhook configuration
- Test webhook endpoint: `GET /api/webhook/livekit/health`
- Check authorization header in webhook requests

### Stream Not Going Live
- Check webhook is being received
- Verify `ingress_started` event is processed
- Check database for `isLive` status
- Look for errors in `WebhookService` logs

### Creator Can't Access Routes
- Verify user is authenticated
- Check creator application status is `APPROVED`
- Check `requireCreator` middleware is working
- Verify JWT token is valid

---

**End of Documentation**
