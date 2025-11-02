# 🎯 Streaming Implementation Tasks

## 📌 Overview
This file breaks down the implementation into actionable tasks to fix:
1. ❌ Creators cannot see their own stream
2. ❌ Anonymous users cannot watch streams  
3. ❌ Chat functionality not working

---

## ✅ Task Checklist

### Phase 1: Install Dependencies

- [ ] **TASK-1.1**: Install LiveKit React packages
  ```bash
  cd frontend
  npm install @livekit/components-react @livekit/components-styles livekit-client
  ```
  **Files Changed:** `package.json`
  **Estimated Time:** 2 minutes

---

### Phase 2: Backend - Fix Token Generation

- [ ] **TASK-2.1**: Add `generateCreatorViewerToken` method to TokenService
  - **File:** `/backend/src/services/token.service.ts`
  - **What:** Add method that generates token with `Host-{userId}` identity prefix
  - **Why:** Allow creator to view their own stream while being identifiable
  - **Lines:** Add after line 50 (after `generateCreatorToken`)
  - **Estimated Time:** 10 minutes

- [ ] **TASK-2.2**: Update `ViewerController.getViewerToken` to detect creator
  - **File:** `/backend/src/controllers/viewer.controller.ts`
  - **What:** Check if `viewerId === hostId`, call `generateCreatorViewerToken` if true
  - **Why:** Route creator self-view requests to correct token generator
  - **Lines:** Modify lines 69-130
  - **Estimated Time:** 15 minutes

- [ ] **TASK-2.3**: Test token generation endpoints
  - **What:** Test with Postman/curl:
    - Regular viewer token
    - Guest token  
    - Creator self-view token
  - **Expected:** All return valid JWT tokens
  - **Estimated Time:** 10 minutes

---

### Phase 3: Frontend - Implement LiveKit Components

- [ ] **TASK-3.1**: Replace VideoComponent with LiveKit integration
  - **File:** `/frontend/src/pages/watch/_components/video-component.tsx`
  - **What:** Use `useRemoteParticipant`, `useTracks`, `useConnectionState` hooks
  - **Why:** Properly display video stream from LiveKit WebRTC
  - **Key Changes:**
    - Import from `@livekit/components-react`
    - Filter tracks by `hostIdentity`
    - Handle 3 states: Offline, Loading, Live
  - **Estimated Time:** 30 minutes

- [ ] **TASK-3.2**: Replace ChatComponent with LiveKit chat
  - **File:** `/frontend/src/pages/watch/_components/chat-component.tsx`
  - **What:** Use `useChat()` hook for real-time messaging
  - **Why:** Enable WebRTC data channel communication
  - **Key Changes:**
    - Import `useChat` from `@livekit/components-react`
    - Use `chatMessages` array for display
    - Use `send()` function for sending messages
    - Handle followers-only, delayed chat logic
  - **Estimated Time:** 45 minutes

- [ ] **TASK-3.3**: Update StreamLayout to wrap in LiveKitRoom
  - **File:** `/frontend/src/pages/watch/_components/stream-layout.tsx`
  - **What:** Wrap grid layout in `<LiveKitRoom>` component
  - **Why:** Establish WebRTC connection to LiveKit server
  - **Key Changes:**
    - Import `LiveKitRoom` and styles
    - Pass `token` and `wsUrl` props
    - Set `connect={true}`, `audio={false}`, `video={false}`
  - **Estimated Time:** 20 minutes

- [ ] **TASK-3.4**: Verify StreamPlayer component
  - **File:** `/frontend/src/components/stream/stream-player.tsx`
  - **What:** Ensure it correctly fetches token and passes to StreamLayout
  - **Why:** This is the orchestrator component
  - **Check:** Token fetch, guest name generation, error handling
  - **Estimated Time:** 10 minutes

---

### Phase 4: Test Scenarios

- [ ] **TASK-4.1**: Test Anonymous User Viewing
  - **Steps:**
    1. Open incognito window
    2. Navigate to `/:username` (e.g., `/johndoe`)
    3. Check: Video displays, chat works, guest name generated
  - **Expected:** Auto-guest name like "HappyPanda123", can see + chat
  - **Estimated Time:** 10 minutes

- [ ] **TASK-4.2**: Test Authenticated User Viewing
  - **Steps:**
    1. Sign in as regular user
    2. Navigate to another creator's stream
    3. Check: Real username in chat, follow button works
  - **Expected:** See stream, username correct, chat functional
  - **Estimated Time:** 10 minutes

- [ ] **TASK-4.3**: Test Creator Self-View
  - **Steps:**
    1. Sign in as creator
    2. Start streaming via OBS
    3. Navigate to `/creator-dashboard/streams` or `/:own-username`
    4. Check: Video from OBS displays, identity shows as `Host-{userId}`
  - **Expected:** See own stream, can chat, marked as HOST
  - **Estimated Time:** 15 minutes

- [ ] **TASK-4.4**: Test Chat Restrictions
  - **Setup:** Create stream with different chat settings
  - **Test Cases:**
    - Followers-only: Non-follower blocked, follower allowed
    - Delayed chat: 3-second cooldown enforced
    - Chat disabled: Input hidden
  - **Expected:** All restrictions work correctly
  - **Estimated Time:** 20 minutes

- [ ] **TASK-4.5**: Test Offline Behavior
  - **Steps:**
    1. Stop OBS stream (don't end via dashboard)
    2. Refresh page
    3. Check: "Stream Offline" placeholder shows
  - **Expected:** Graceful offline state, no errors
  - **Estimated Time:** 5 minutes

---

### Phase 5: Bug Fixes & Polish

- [ ] **TASK-5.1**: Fix CORS issues (if any)
  - **File:** `/backend/src/index.ts`
  - **What:** Ensure LiveKit URLs are in CORS whitelist
  - **Estimated Time:** 5 minutes

- [ ] **TASK-5.2**: Add loading states
  - **Files:** Video and Chat components
  - **What:** Show spinners during connection
  - **Estimated Time:** 10 minutes

- [ ] **TASK-5.3**: Add error boundaries
  - **Files:** StreamLayout
  - **What:** Catch and display WebRTC errors gracefully
  - **Estimated Time:** 15 minutes

- [ ] **TASK-5.4**: Test with multiple viewers
  - **What:** Open stream in multiple tabs/browsers
  - **Expected:** All viewers see same video, chat syncs
  - **Estimated Time:** 10 minutes

---

## 🎯 Priority Order

### HIGH PRIORITY (Core Functionality)
1. TASK-2.1 → TASK-2.2: Fix token generation
2. TASK-3.1: Fix video display
3. TASK-3.2: Fix chat
4. TASK-3.3: Add LiveKitRoom wrapper

### MEDIUM PRIORITY (Usability)
5. TASK-4.1 → TASK-4.3: Test all user types
6. TASK-5.2: Add loading states

### LOW PRIORITY (Polish)
7. TASK-4.4: Test edge cases
8. TASK-5.3: Error boundaries
9. TASK-5.4: Multi-viewer test

---

## 📊 Progress Tracking

| Phase | Tasks Complete | Total Tasks | Status |
|-------|---------------|-------------|---------|
| Phase 1 | 0 | 1 | ⏳ Pending |
| Phase 2 | 0 | 3 | ⏳ Pending |
| Phase 3 | 0 | 4 | ⏳ Pending |
| Phase 4 | 0 | 5 | ⏳ Pending |
| Phase 5 | 0 | 4 | ⏳ Pending |
| **TOTAL** | **0** | **17** | **0%** |

---

## 🐛 Known Issues to Fix

1. **Issue:** Creator cannot see own stream
   - **Root Cause:** No "Host-" prefix in token identity
   - **Fix:** TASK-2.1, TASK-2.2

2. **Issue:** Anonymous users blocked
   - **Root Cause:** Frontend/backend guest token flow incomplete
   - **Fix:** TASK-2.2 (already handles guests)

3. **Issue:** Chat not working
   - **Root Cause:** Missing LiveKit `useChat()` hook
   - **Fix:** TASK-3.2

4. **Issue:** Video not displaying
   - **Root Cause:** Not using LiveKit video components
   - **Fix:** TASK-3.1, TASK-3.3

---

## ✅ Definition of Done

- [ ] Anonymous users can watch streams without signing in
- [ ] Authenticated users see correct username in chat
- [ ] Creators can view their own stream
- [ ] Chat messages send and receive in real-time
- [ ] All chat restrictions (followers-only, delayed) work
- [ ] Offline state displays gracefully
- [ ] No console errors in browser
- [ ] No backend errors in logs
- [ ] Tested with 3+ simultaneous viewers
- [ ] Code reviewed and documented

---

## 📝 Notes

- Keep existing routes (`/:username` for viewing)
- Don't modify OBS streaming setup (working)
- LiveKit server URL must be accessible from browser
- Test with real LiveKit server, not mock

---

**Last Updated:** {current_date}  
**Estimated Total Time:** 4-5 hours
