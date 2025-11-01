# StreamIt - Creator Streaming Flow Documentation

## 🎯 Overview

This document explains how the streaming system works from a creator's perspective, covering the entire lifecycle from setup to going live.

---

## 📋 Prerequisites

### Creator Requirements
1. **Approved Creator Status**: User must have an approved creator application (`status: APPROVED`)
2. **Authentication**: Must be logged in with valid JWT token
3. **LiveKit Setup**: Backend must be configured with LiveKit credentials

### System Components
- **Frontend**: React app with TanStack Query for data fetching
- **Backend**: Node.js/Express with LiveKit SDK integration
- **Database**: PostgreSQL with Prisma ORM
- **Streaming Service**: LiveKit (handles video ingestion & distribution)

---

## 🚀 Complete Streaming Workflow

### Phase 1: Generate Stream Key (One-Time Setup)

**Location**: `/dashboard/keys` page

#### Frontend Flow:
```
1. User visits Keys page
2. Click "Generate Key" button
3. Frontend calls: POST /api/stream/ingress
4. Backend creates LiveKit ingress
5. Credentials returned: serverUrl + streamKey
6. Stored in database (Stream table)
7. Displayed on Keys page (with show/hide toggle)
```

#### What Happens:
```typescript
// Backend Service Flow
StreamService.createStreamIngress()
  ├─> Validates user is approved creator
  ├─> Checks for existing ingress (resets if found)
  ├─> Calls LiveKit to create RTMP ingress
  ├─> Saves to database:
  │   ├─ ingressId (LiveKit identifier)
  │   ├─ serverUrl (RTMP server endpoint)
  │   ├─ streamKey (authentication key)
  │   └─ Default settings (title, chat enabled, etc.)
  └─> Returns credentials to frontend
```

#### Database State After:
```sql
Stream {
  id: "uuid",
  userId: "creator-id",
  ingressId: "livekit-ingress-id",
  serverUrl: "rtmp://live.example.com/live",
  streamKey: "sk_xxxxxxxxxx",
  title: "Untitled Stream",
  isLive: false,
  isChatEnabled: true,
  isChatDelayed: false,
  isChatFollowersOnly: false
}
```

---

### Phase 2: Configure OBS/Streaming Software

**Location**: OBS Studio (or any RTMP-compatible software)

#### Steps:
```
1. Open OBS Studio
2. Go to Settings → Stream
3. Service: Custom
4. Server: [Paste serverUrl from Keys page]
5. Stream Key: [Paste streamKey from Keys page]
6. Click OK
7. Configure your scenes/sources
8. Ready to go live!
```

#### Important Notes:
- **Keep Stream Key Secret**: Never share publicly
- **One Active Stream**: Each key supports one concurrent stream
- **Key Regeneration**: Regenerating invalidates old key immediately

---

### Phase 3: Update Stream Settings (Before/During Stream)

**Location**: `/dashboard/streams` page

#### 3A. Update Stream Title

**Current Implementation**:
```typescript
// Edit mode toggle
1. Click "Edit" button on title field
2. Modify title text
3. Click "Save" button
4. Frontend calls: PUT /api/stream/info { title: "New Title" }
5. Updates database and returns new data
6. UI reflects change immediately
```

**API Endpoint**:
```
PUT /api/stream/info
Body: { title?: string, thumbnail?: string }
Response: { success: true, data: { stream details } }
```

#### 3B. Configure Chat Settings

**Current Implementation**:
```typescript
// Toggle switches for:
1. Chat Enabled/Disabled
2. Chat Delay (anti-spam)
3. Followers-Only Chat

// Each toggle:
Frontend calls: PUT /api/stream/chat-settings { isChatEnabled: true }
Updates immediately in database
No need to restart stream
```

**API Endpoint**:
```
PUT /api/stream/chat-settings
Body: { 
  isChatEnabled?: boolean,
  isChatDelayed?: boolean,
  isChatFollowersOnly?: boolean 
}
Response: { success: true, data: { chat settings } }
```

---

### Phase 4: Start Streaming

#### 4A. Start Broadcast in OBS
```
1. Creator clicks "Start Streaming" in OBS
2. OBS connects to serverUrl with streamKey
3. LiveKit receives RTMP stream
4. LiveKit ingress processes video/audio
5. LiveKit sends webhook to backend: ingress_started
```

#### 4B. Webhook Processing (Backend)
```typescript
POST /api/webhook/livekit (from LiveKit)
  ├─> Verifies webhook signature
  ├─> Processes event: ingress_started
  ├─> Calls WebhookService.handleIngressStarted()
  ├─> Updates database: 
  │   └─> Stream.isLive = true
  └─> Stream is now LIVE
```

#### 4C. Dashboard Updates (Automatic)
```typescript
// Streams page polls every 5 seconds
GET /api/stream/status
  ├─> Returns: { isLive: true, viewerCount: 0 }
  └─> UI shows:
      ├─ "🔴 LIVE" badge
      ├─ Red recording indicator
      └─ Viewer count updates

// StreamPlayer component
- Shows "Loading..." initially
- Receives video tracks from LiveKit
- Displays live preview
- Chat becomes active
```

---

### Phase 5: Monitor Stream (While Live)

**Location**: `/dashboard/streams` page

#### Real-Time Updates:
```typescript
// Auto-polling every 5 seconds
useEffect(() => {
  const interval = setInterval(() => {
    fetchStreamStatus(); // GET /api/stream/status
  }, 5000);
  return () => clearInterval(interval);
}, []);
```

#### What Creator Sees:
```
┌─────────────────────────────────────┐
│ 🔴 LIVE  |  👥 42 Viewers          │
├─────────────────────────────────────┤
│                                     │
│    [Live Stream Preview Video]      │
│                                     │
├─────────────────────────────────────┤
│ Stream Title: My Gaming Session     │
│ Status: 🔴 Broadcasting            │
│ Chat: 💬 Enabled                   │
└─────────────────────────────────────┘
```

#### Available Actions While Live:
- ✅ Update stream title
- ✅ Toggle chat settings
- ✅ Monitor viewer count
- ✅ View live preview
- ✅ Read/moderate chat
- ❌ Cannot change stream key (requires restart)

---

### Phase 6: Stop Streaming

#### 6A. Stop Broadcast in OBS
```
1. Creator clicks "Stop Streaming" in OBS
2. OBS disconnects from LiveKit
3. LiveKit detects stream ended
4. LiveKit sends webhook: ingress_ended
```

#### 6B. Webhook Processing
```typescript
POST /api/webhook/livekit (from LiveKit)
  ├─> Verifies signature
  ├─> Processes event: ingress_ended
  ├─> Calls WebhookService.handleIngressEnded()
  ├─> Updates database:
  │   └─> Stream.isLive = false
  └─> Stream is now OFFLINE
```

#### 6C. Dashboard Updates
```typescript
// Next status poll detects change
GET /api/stream/status
  └─> Returns: { isLive: false, viewerCount: 0 }

// UI updates:
- "🔴 LIVE" → "⚫ Not Streaming"
- Video player shows offline message
- Chat becomes read-only
- Viewer count resets to 0
```

---

## 🔄 Data Flow Diagram

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
│   Creator   │────▶│   Frontend   │────▶│   Backend    │────▶│  Database   │
│    (OBS)    │     │   (React)    │     │  (Node.js)   │     │ (Postgres)  │
└─────────────┘     └──────────────┘     └──────────────┘     └─────────────┘
      │                    │                     │                     │
      │                    │                     ▼                     │
      │                    │              ┌──────────────┐             │
      │                    │              │   LiveKit    │             │
      │                    │              │   Service    │             │
      │                    │              └──────────────┘             │
      │                    │                     │                     │
      └────────────────────┼─────────────────────┘                     │
                           │                                           │
                           └───────────────────────────────────────────┘
```

### Detailed Interaction Flow:

```
1. Generate Key:
   Frontend → Backend → LiveKit → Database → Frontend
   
2. Update Settings:
   Frontend → Backend → Database → Frontend
   
3. Start Stream:
   OBS → LiveKit → Webhook → Backend → Database → Frontend (polling)
   
4. Stop Stream:
   OBS → LiveKit → Webhook → Backend → Database → Frontend (polling)
```

---

## 🎛️ API Endpoints Reference

### Creator Endpoints (Require Auth + Approved Creator)

| Method | Endpoint | Purpose | When Used |
|--------|----------|---------|-----------|
| POST | `/api/stream/ingress` | Generate stream key | Keys page - initial setup |
| DELETE | `/api/stream/ingress` | Delete stream key | Keys page - reset key |
| GET | `/api/stream/credentials` | Get serverUrl + streamKey | Keys page - display |
| GET | `/api/stream/info` | Get stream configuration | Streams page - load data |
| PUT | `/api/stream/info` | Update title/thumbnail | Streams page - edit title |
| PUT | `/api/stream/chat-settings` | Update chat config | Streams page - toggle chat |
| GET | `/api/stream/status` | Get live status + viewers | Streams page - polling |

### Webhook Endpoint (Internal)

| Method | Endpoint | Purpose | Caller |
|--------|----------|---------|--------|
| POST | `/api/webhook/livekit` | Process stream events | LiveKit Server |

---

## 🐛 Current Issues & Concerns

### 1. **State Management Issues**

**Problem**: Stream settings scattered across multiple locations
```typescript
// Streams page manages local state
const [title, setTitle] = useState('');
const [chatSettings, setChatSettings] = useState({...});

// useStream hook also manages state
const [streamInfo, setStreamInfo] = useState(null);
const [streamStatus, setStreamStatus] = useState(null);

// Result: State can become out of sync
```

**Impact**:
- Editing title requires toggle mode (edit/save flow)
- Chat toggles update immediately but don't optimistically update UI
- Status polling can overwrite unsaved changes
- No loading states during updates

**Recommendation**:
- Use single source of truth (React Query or Zustand)
- Implement optimistic updates for better UX
- Add proper loading/error states
- Remove edit mode, make inline editing

---

### 2. **Stream Key Management Confusion**

**Problem**: Multiple ways to access credentials
```typescript
// Keys page: Uses getStreamCredentials()
const credentials = await streamApi.getStreamCredentials();

// Streams page: Uses getStreamInfo() 
const info = await streamApi.getStreamInfo();

// useStream hook: Merges data from both sources
const merged = { ...info, ...credentials };
```

**Impact**:
- Confusing for developers
- Redundant API calls
- Credentials not available in stream info by default (security)
- Hook has complex merging logic

**Recommendation**:
- Keys page: Use `getStreamCredentials()` only
- Streams page: Use `getStreamInfo()` only (no streamKey needed)
- Remove credential merging from useStream hook
- Clear separation of concerns

---

### 3. **No Stream Title Persistence**

**Problem**: Title only stored in database, not in LiveKit room metadata

**Impact**:
- Viewers see outdated title until page refresh
- Title not available in LiveKit room metadata
- Can't update room title via LiveKit API

**Recommendation**:
- Consider updating LiveKit room metadata when title changes
- Or accept database as single source of truth (simpler)

---

### 4. **Polling for Status Updates**

**Problem**: Frontend polls every 5 seconds for status
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    fetchStreamStatus(); // API call every 5 seconds
  }, 5000);
}, []);
```

**Impact**:
- Unnecessary API calls when stream is offline
- 5-second delay detecting live/offline changes
- Battery drain on mobile devices

**Recommendation**:
- Implement WebSocket for real-time updates
- Or use EventSource (Server-Sent Events)
- Or increase polling interval when offline (30s)
- Stop polling when page not visible

---

### 5. **Chat Settings Not Real-Time**

**Problem**: Chat settings changes don't propagate to viewers immediately

**Current Flow**:
```
1. Creator toggles chat setting
2. Backend updates database
3. Viewers must refresh to see change
```

**Impact**:
- Viewers can send messages even when chat disabled
- Followers-only mode not enforced until refresh
- Poor user experience

**Recommendation**:
- Send LiveKit data message when settings change
- Viewers listen for settings updates
- Apply settings immediately without refresh

---

### 6. **No Stream Title History**

**Problem**: Only current title stored, no history

**Impact**:
- Can't track title changes over time
- No audit trail
- Can't show "previously titled as..."

**Recommendation** (Low Priority):
- Add `StreamHistory` table for title changes
- Or use database audit logs
- Or accept current simple approach

---

### 7. **Thumbnail Upload Not Implemented**

**Problem**: API accepts thumbnail URL but no upload flow

**Current State**:
```typescript
// API ready
PUT /api/stream/info { thumbnail: "url" }

// But frontend has no upload UI
// Keys page: No thumbnail field
// Streams page: No thumbnail field
```

**Impact**:
- Can't set stream thumbnails
- Home page shows default/no thumbnail
- Poor visual appeal on browse page

**Recommendation**:
- Add thumbnail upload to Streams page
- Use existing S3 upload infrastructure
- Generate thumbnail from stream frame (advanced)

---

## ✨ Recommended Improvements

### 1. Simplify Stream Settings Flow

**Current (Complex)**:
```tsx
// Edit mode with save/cancel
const [isEditingTitle, setIsEditingTitle] = useState(false);
const [title, setTitle] = useState('');

// User must:
1. Click Edit button
2. Type new title
3. Click Save button
```

**Proposed (Simple)**:
```tsx
// Inline editing with auto-save
<Input
  value={title}
  onChange={(e) => {
    setTitle(e.target.value);
    debouncedUpdate(e.target.value); // Auto-save after 1s
  }}
  placeholder="Stream title..."
/>
```

### 2. Add Loading States

```tsx
// Current: No feedback during update
<Switch checked={isChatEnabled} onChange={toggle} />

// Proposed: Show loading state
<Switch 
  checked={isChatEnabled} 
  onChange={toggle}
  disabled={isUpdating}
/>
{isUpdating && <Spinner />}
```

### 3. Add Confirmation Dialogs

```tsx
// Current: Silent updates
updateStreamInfo({ title: newTitle });

// Proposed: Confirm critical changes
const handleGoLive = () => {
  if (!title) {
    toast.error('Please set a stream title first');
    return;
  }
  confirmDialog('Ready to go live?', () => startOBS());
};
```

### 4. Add Stream Analytics Dashboard

**New Page**: `/dashboard/analytics`

Show metrics like:
- Total stream time
- Average viewers
- Peak concurrent viewers
- Chat message count
- Follower growth
- Most active times

### 5. Add Quick Actions

```tsx
// Add to Streams page header
<ButtonGroup>
  <Button onClick={copyStreamUrl}>
    📋 Copy Stream URL
  </Button>
  <Button onClick={openKeysPage}>
    🔑 View Keys
  </Button>
  <Button onClick={testStream}>
    🔬 Test Stream
  </Button>
</ButtonGroup>
```

---

## 🎯 Best Practices for Developers

### 1. Always Check Creator Status

```typescript
// Before allowing stream operations
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { creatorApplication: true }
});

if (user.creatorApplication?.status !== 'APPROVED') {
  throw new Error('Must be approved creator');
}
```

### 2. Never Expose Stream Keys

```typescript
// ❌ Bad: Exposes streamKey
GET /api/stream/info → { streamKey: "sk_xxx", ... }

// ✅ Good: Separate endpoints
GET /api/stream/info → { title, isLive, ... }
GET /api/stream/credentials → { streamKey: "sk_xxx" }
```

### 3. Validate Settings Updates

```typescript
// Use Zod schemas
const updateStreamInfoSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  thumbnail: z.url().optional(),
});

// Validate before processing
const data = updateStreamInfoSchema.parse(req.body);
```

### 4. Handle Webhook Failures Gracefully

```typescript
// Webhook may fail - don't break stream
try {
  await StreamService.setStreamLive(ingressId, true);
} catch (error) {
  console.error('Webhook processing failed:', error);
  // Stream continues, manual status update may be needed
}
```

---

## 📚 Additional Resources

- **LiveKit Documentation**: https://docs.livekit.io/
- **Backend Streaming Guide**: `backend/docs/STREAMING.md`
- **Phase 2 Viewer Features**: `backend/docs/PHASE_2_VIEWER_SOCIAL.md`
- **Stream Schema**: `backend/prisma/schema.prisma`
- **Frontend Stream API**: `frontend/src/lib/api/stream.ts`
- **Frontend Stream Hook**: `frontend/src/hooks/useStream.ts`

---

## 🔍 Quick Reference

### Environment Variables Needed
```env
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
```

### Common Commands
```bash
# Start backend
cd backend && bun dev

# Start frontend  
cd frontend && bun dev

# View logs
# Backend: Check terminal output
# LiveKit: Check LiveKit dashboard
```

### Debugging Tips
```typescript
// Backend: Enable debug logs
console.log('[StreamService] Creating ingress for user:', userId);

// Frontend: Check React Query devtools
// Network tab: Watch for API calls
// Console: Look for "[useStream]" logs
```

---

**Last Updated**: November 1, 2025
**Version**: 1.0
**Maintained By**: Development Team
