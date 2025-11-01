# Streaming API - Quick Reference

## 🔑 Authentication
All endpoints require: `Authorization: Bearer <token>`

## 📡 Endpoints

### Create Stream Key
```bash
POST /api/stream/ingress
Body: { "ingressType": "RTMP" }
```

### Get Stream Info
```bash
GET /api/stream/info
```

### Update Stream
```bash
PUT /api/stream/info
Body: { "title": "New Title", "thumbnail": "url" }
```

### Update Chat
```bash
PUT /api/stream/chat-settings
Body: { "isChatEnabled": true, "isChatFollowersOnly": false }
```

### Check Status
```bash
GET /api/stream/status
```

### Delete Stream Key
```bash
DELETE /api/stream/ingress
```

## 🎥 OBS Setup
1. Get stream key from `/api/stream/ingress`
2. Settings → Stream
3. Service: Custom
4. Server: (use `serverUrl`)
5. Stream Key: (use `streamKey`)

## ⚙️ Environment
```env
LIVEKIT_URL=wss://...
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
```

## 🔗 Webhook
Configure in LiveKit dashboard:
- URL: `https://your-backend.com/api/webhook/livekit`
- Events: `ingress_started`, `ingress_ended`

## 📝 Requirements
- User must be authenticated
- Creator application must be APPROVED
- LiveKit credentials configured

## ✅ Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden (not approved creator)
- 404: Not Found
- 500: Server Error
