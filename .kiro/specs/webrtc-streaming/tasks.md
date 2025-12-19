# Implementation Plan

- [x] 1. Database schema migration
  - [x] 1.1 Create Prisma migration to remove ingress fields from Stream model
    - Remove ingressId, serverUrl, streamKey columns
    - Remove unique index on ingressId
    - _Requirements: 6.1_
  - [ ]* 1.2 Write property test for stream model
    - **Property 8: Stream setup creates valid record**
    - **Validates: Requirements 5.2**

- [x] 2. Backend service updates
  - [x] 2.1 Simplify StreamService - remove ingress methods
    - Remove createStreamIngress, deleteStreamIngress, addIngressToStream
    - Keep setStreamLive method (now takes userId instead of ingressId)
    - Add createOrUpdateStream method for setup
    - _Requirements: 6.4_
  - [x] 2.2 Update TokenService for WebRTC flow
    - Ensure generateCreatorToken has canPublish=true
    - Remove generateCreatorViewerToken (no longer needed)
    - _Requirements: 1.2, 4.1_
  - [ ]* 2.3 Write property tests for token generation
    - **Property 5: Viewer tokens are subscribe-only**
    - **Property 6: Authenticated viewer identity matches userId**
    - **Property 7: Guest viewer identity has guest prefix**
    - **Validates: Requirements 4.1, 4.3, 4.4**

- [x] 3. Backend controller and routes
  - [x] 3.1 Add new stream controller methods
    - goLive: Get publish token + set isLive=true
    - endStream: Set isLive=false
    - setupStream: Create/update stream metadata
    - _Requirements: 1.3, 2.3, 5.2_
  - [x] 3.2 Update stream routes
    - Add POST /go-live, POST /end-stream, POST /setup
    - Remove POST /ingress, DELETE /ingress, GET /credentials, POST /creator-token
    - _Requirements: 6.2_
  - [ ]* 3.3 Write property tests for stream status
    - **Property 1: Go live sets stream status to live**
    - **Property 2: End stream sets status to offline**
    - **Property 3: Title update preserves live status**
    - **Property 4: Chat settings persist correctly**
    - **Validates: Requirements 1.3, 2.3, 2.5, 3.3**

- [x] 4. Checkpoint - Backend tests passing
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Backend cleanup
  - [x] 5.1 Delete LiveKit ingress service
    - Remove backend/src/services/livekit.service.ts entirely
    - _Requirements: 6.4_
  - [x] 5.2 Simplify webhook service
    - Remove handleIngressStarted and handleIngressEnded handlers
    - Keep room/participant event handlers for analytics
    - _Requirements: 6.4_
  - [x] 5.3 Update viewer controller
    - Remove any ingress-related logic from getStreamByUsername
    - Ensure getViewerToken works without ingress fields
    - _Requirements: 4.1, 4.2_

- [x] 6. Frontend API client updates
  - [x] 6.1 Update stream API client
    - Add goLive(), endStream(), setupStream() methods
    - Remove createIngress(), deleteIngress(), getStreamCredentials()
    - _Requirements: 1.1, 2.3, 5.2_
  - [x] 6.2 Update useStream hook
    - Remove ingress-related state and methods
    - Add goLive, endStream methods
    - _Requirements: 1.1, 2.3_

- [x] 7. Frontend Go Live page
  - [x] 7.1 Create GoLivePage component
    - Show setup form if no stream exists
    - Show "Go Live" button if stream exists
    - Handle permission requests for camera/mic
    - _Requirements: 1.1, 1.5, 5.1, 5.3_
  - [x] 7.2 Create CreatorStreamControls component
    - Camera on/off toggle button
    - Microphone mute/unmute toggle button
    - End stream button
    - Viewer count display
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 7.3 Create CreatorLiveView component
    - Self-preview video showing creator's camera
    - Stream controls integration
    - Chat panel alongside video
    - Title editing while live
    - _Requirements: 1.4, 2.5, 3.1, 3.2, 3.3_

- [x] 8. Checkpoint - Frontend streaming works
  - Ensure all tests pass, ask the user if questions arise.

- [-] 9. Frontend cleanup and navigation
  - [x] 9.1 Delete Keys page
    - Remove frontend/src/pages/creator-dashboard/keys/ folder
    - _Requirements: 6.3_
  - [x] 9.2 Update creator dashboard sidebar
    - Remove "Keys" menu item
    - Rename "Streams" to "Go Live"
    - _Requirements: 6.3_
  - [x] 9.3 Update App routes
    - Remove /creator-dashboard/keys route
    - Update /creator-dashboard/streams to use new GoLivePage
    - _Requirements: 6.3_
  - [-] 9.4 Update streams page components
    - Remove stream-credentials.tsx
    - Remove create-stream-form.tsx (replace with setup form in GoLivePage)
    - Update stream-viewer.tsx for WebRTC
    - _Requirements: 6.3_

- [ ] 10. Viewer experience verification
  - [ ] 10.1 Verify viewer flow works with WebRTC streams
    - Test authenticated viewer joining
    - Test guest viewer joining
    - Test offline state display
    - _Requirements: 4.2, 4.5_

- [ ] 11. Final Checkpoint - All tests passing
  - Ensure all tests pass, ask the user if questions arise.
