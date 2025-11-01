# Quick Start Guide - Creator Streaming

## Prerequisites

1. **Backend running** on `http://localhost:3000`
2. **LiveKit server** configured and running
3. **Creator account** with APPROVED status

## Setup Steps

### 1. Environment Configuration

Create/update `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_BETTER_AUTH_URL=http://localhost:3000
VITE_LIVEKIT_WS_URL=wss://your-livekit-server.com
```

Replace `wss://your-livekit-server.com` with your actual LiveKit WebSocket URL.

### 2. Start Frontend

```bash
cd frontend
bun run dev
```

### 3. Test Stream Key Generation

1. Login as approved creator
2. Navigate to **Dashboard → Keys**
3. Click **"Generate Key"**
4. You should see Server URL and Stream Key

### 4. Configure OBS

1. Open OBS Studio
2. Settings → Stream
3. Service: **Custom**
4. Server: Paste your Server URL
5. Stream Key: Paste your Stream Key
6. Click **OK**

### 5. Start Streaming

1. In OBS: Click **"Start Streaming"**
2. In Browser: Go to **Dashboard → Streams**
3. Wait 5-10 seconds
4. Your stream should appear in preview!

### 6. Test Chat

1. Type a message in chat input
2. Press Enter
3. Message should appear instantly

### 7. Test Settings

1. Edit stream title
2. Toggle chat on/off
3. Try followers-only mode
4. Try delayed chat mode

## Troubleshooting

### "No authentication token found"
- Make sure you're logged in
- Check browser console for auth errors
- Try logging out and back in

### Stream not showing
- Wait 10-15 seconds after starting OBS
- Check OBS is actually streaming (red dot)
- Verify stream key in OBS matches dashboard
- Check browser console for errors

### Chat not working
- Ensure chat is enabled in settings
- Check LiveKit WebSocket connection
- Verify you're not in followers-only mode (unless you follow yourself)

## Success Indicators

✅ Stream key generates successfully
✅ OBS connects without errors
✅ Video appears in dashboard preview
✅ Live indicator shows "LIVE"
✅ Viewer count shows "1" (you)
✅ Chat messages send and receive
✅ Title edits save successfully
✅ Chat settings toggle immediately

## Next Steps

Once everything works:
1. Test with actual streaming content
2. Invite others to view (coming in Phase 3)
3. Monitor viewer count during streams
4. Experiment with chat settings
5. Try regenerating stream keys

**Frontend streaming is now fully functional!** 🎉
