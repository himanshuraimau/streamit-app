# Implementation Plan: Live Streaming Viewer Features

## Overview

This implementation plan breaks down the Live Streaming Viewer Features into discrete coding tasks. The implementation follows a bottom-up approach: starting with backend infrastructure, then frontend utilities, followed by UI components, and finally integration.

## Tasks

- [x] 1. Database Schema Updates
  - [x] 1.1 Add StreamReport model to Prisma schema
    - Create StreamReport model with fields: id, streamId, reporterId, reason, description, status, reviewedAt, reviewedBy
    - Add ReportReason enum (INAPPROPRIATE_CONTENT, HARASSMENT, SPAM, VIOLENCE, COPYRIGHT, OTHER)
    - Add ReportStatus enum (PENDING, REVIEWED, RESOLVED, DISMISSED)
    - Add relation to Stream and User models
    - _Requirements: 2.3_
  - [x] 1.2 Add StreamStats model to Prisma schema
    - Create StreamStats model with fields: id, streamId, peakViewers, totalViewers, totalLikes, totalGifts, totalCoins, startedAt, endedAt
    - Add one-to-one relation with Stream model
    - _Requirements: 9.2, 9.3_
  - [x] 1.3 Update Stream model with startedAt field
    - Add optional startedAt DateTime field to Stream model
    - Update go-live logic to set startedAt when stream starts
    - _Requirements: 1.1, 1.3_
  - [x] 1.4 Run database migration
    - Generate and apply Prisma migration
    - Verify schema changes in database
    - _Requirements: 1.1, 2.3, 9.2_

- [x] 2. Backend API - Penny Tip Endpoint
  - [x] 2.1 Create penny tip service function
    - Implement sendPennyTip in PaymentService
    - Deduct 1 coin from sender wallet
    - Credit 1 coin to creator wallet
    - Create GiftTransaction record with coinAmount=1
    - Handle insufficient balance error
    - _Requirements: 3.3, 3.4, 3.6_
  - [ ]* 2.2 Write property test for penny tip balance changes
    - **Property 2: Penny Tip Deduction**
    - **Property 3: Penny Tip Credit**
    - **Validates: Requirements 3.3, 3.4**
  - [x] 2.3 Create penny tip controller and route
    - Add POST /api/payment/penny-tip endpoint
    - Validate request body (creatorId, streamId)
    - Return transaction result and remaining balance
    - _Requirements: 3.3, 3.4_

- [x] 3. Backend API - Report Stream Endpoint
  - [x] 3.1 Create stream report service function
    - Implement createReport in StreamService
    - Validate stream exists and is live
    - Create StreamReport record
    - _Requirements: 2.3_
  - [x] 3.2 Create report controller and route
    - Add POST /api/stream/report endpoint
    - Validate request body (streamId, reason, description)
    - Implement rate limiting (5 reports/hour per user)
    - _Requirements: 2.3, 2.4_

- [x] 4. Backend API - Stream Summary Endpoint
  - [x] 4.1 Create stream summary service function
    - Implement getStreamSummary in StreamService
    - Calculate totalViewers, peakViewers from StreamStats
    - Calculate topGifter from GiftTransaction aggregation
    - _Requirements: 9.2, 9.3_
  - [ ]* 4.2 Write property test for top gifter calculation
    - **Property 11: Top Gifter Calculation**
    - **Validates: Requirements 9.3**
  - [x] 4.3 Create summary controller and route
    - Add GET /api/stream/:streamId/summary endpoint
    - Return stream statistics
    - _Requirements: 9.2, 9.3_

- [x] 5. Backend - Update Stream Go-Live Logic
  - [x] 5.1 Update go-live to set startedAt and create StreamStats
    - Set startedAt timestamp when stream goes live
    - Create StreamStats record for the stream
    - _Requirements: 1.1, 1.3_
  - [x] 5.2 Update end-stream to set endedAt in StreamStats
    - Set endedAt timestamp when stream ends
    - Calculate final statistics
    - _Requirements: 9.2_

- [x] 6. Checkpoint - Backend API Complete
  - Ensure all backend tests pass
  - Verify API endpoints work with manual testing
  - Ask the user if questions arise

- [x] 7. Frontend Utilities - Duration Calculation
  - [x] 7.1 Create formatDuration utility function
    - Implement function to calculate duration from startedAt
    - Format output as "HH:MM:SS"
    - Handle edge cases (null startedAt, future dates)
    - _Requirements: 1.1, 1.3_
  - [ ]* 7.2 Write property test for duration calculation
    - **Property 1: Duration Calculation Correctness**
    - **Validates: Requirements 1.1, 1.3**

- [x] 8. Frontend Utilities - Local Storage Preferences
  - [x] 8.1 Create viewer preferences storage utilities
    - Implement saveChatVisibility and getChatVisibility functions
    - Implement saveBlockedUsers and getBlockedUsers functions
    - Handle localStorage unavailability gracefully
    - _Requirements: 6.2, 6.3, 7.3_
  - [ ]* 8.2 Write property test for chat visibility round-trip
    - **Property 8: Chat Visibility Preference Round-Trip**
    - **Validates: Requirements 6.2, 6.3**
  - [ ]* 8.3 Write property test for blocked users persistence
    - **Property 10: Block/Unblock Round-Trip**
    - **Validates: Requirements 7.3, 7.4**

- [x] 9. Frontend Utilities - Message Filtering
  - [x] 9.1 Create blocked user message filter function
    - Implement filterBlockedMessages function
    - Filter out messages from blocked user IDs
    - _Requirements: 7.2_
  - [ ]* 9.2 Write property test for message filtering
    - **Property 9: Blocked User Message Filtering**
    - **Validates: Requirements 7.2**

- [x] 10. Frontend Component - StreamDurationTimer
  - [x] 10.1 Create StreamDurationTimer component
    - Display live duration in "HH:MM:SS" format
    - Update every second using useEffect interval
    - Show "LIVE" indicator with pulsing dot
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 11. Frontend Component - LikeButton (Penny Tip)
  - [x] 11.1 Create LikeButton component
    - Display gold coin icon with "1" badge
    - Call penny tip API on click
    - Show heart burst animation on success
    - Handle insufficient balance with prompt
    - _Requirements: 3.1, 3.2, 3.3, 3.5_
  - [x] 11.2 Create HeartBurstAnimation component
    - Implement floating hearts animation using framer-motion
    - Trigger on successful penny tip
    - _Requirements: 3.2_

- [x] 12. Frontend Component - ReportStreamDialog
  - [x] 12.1 Create ReportStreamDialog component
    - Create modal dialog with report reason options
    - Implement form with reason selection and optional description
    - Call report API on submit
    - Show success/error feedback
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 13. Frontend Component - EngagementPopup
  - [x] 13.1 Create EngagementPopup component
    - Display animated notification for gifts, joins, top fan
    - Implement auto-dismiss after 3-5 seconds
    - Support queue for multiple simultaneous events
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [ ]* 13.2 Write property test for popup auto-dismiss timing
    - **Property 4: Engagement Popup Auto-Dismiss**
    - **Validates: Requirements 4.4**
  - [ ]* 13.3 Write property test for popup queue order
    - **Property 5: Engagement Popup Queue Order**
    - **Validates: Requirements 4.5**

- [x] 14. Frontend Component - ChatVisibilityToggle
  - [x] 14.1 Create ChatVisibilityToggle component
    - Display toggle button for chat visibility
    - Persist preference to localStorage
    - Restore preference on mount
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 15. Frontend Component - BlockedUsersContext
  - [x] 15.1 Create BlockedUsersContext provider
    - Implement context with blockedUserIds, blockUser, unblockUser, isBlocked
    - Persist to localStorage
    - Provide hook useBlockedUsers
    - _Requirements: 7.2, 7.3, 7.4_
  - [x] 15.2 Add block user context menu to chat messages
    - Add right-click/long-press context menu
    - Show "Block User" option
    - Integrate with BlockedUsersContext
    - _Requirements: 7.1_

- [x] 16. Checkpoint - Core Components Complete
  - Ensure all component tests pass
  - Verify components render correctly in isolation
  - Ask the user if questions arise

- [x] 17. Frontend Component - ImmersiveModeOverlay
  - [x] 17.1 Create ImmersiveModeOverlay component
    - Implement fullscreen video overlay
    - Hide all UI elements when active
    - Add swipe gesture handlers using react-swipeable
    - Implement double-tap to like
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [ ]* 17.2 Write property test for immersive mode UI hiding
    - **Property 6: Immersive Mode UI Hiding**
    - **Validates: Requirements 5.2**
  - [x] 17.3 Add touch device detection
    - Implement isTouchDevice utility
    - Only enable swipe gestures on touch devices
    - _Requirements: 5.5_
  - [ ]* 17.4 Write property test for touch device gesture enablement
    - **Property 7: Touch Device Gesture Enablement**
    - **Validates: Requirements 5.5**

- [x] 18. Frontend Component - PostStreamSummary
  - [x] 18.1 Create PostStreamSummary modal component
    - Display total viewers count
    - Display top gifter information
    - Show follow button if not following
    - Display recommended streams grid
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  - [ ]* 18.2 Write property test for follow button conditional display
    - **Property 12: Follow Button Conditional Display**
    - **Validates: Requirements 9.4**
  - [x] 18.3 Implement recommended stream navigation
    - Handle click on recommended stream
    - Navigate to selected stream
    - _Requirements: 9.6_

- [x] 19. Frontend - LiveKit Data Channel Integration
  - [x] 19.1 Create engagement event types and handlers
    - Define DataChannelMessage types (gift, join, like, top_fan, stream_ended)
    - Implement sendEngagementEvent function
    - Implement handleEngagementEvent function
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 19.2 Integrate data channel with EngagementPopup
    - Listen for data channel messages in stream layout
    - Parse and dispatch to EngagementPopup component
    - _Requirements: 4.1, 4.2, 4.3_

- [-] 20. Frontend - Screen Recording Protection
  - [ ] 20.1 Implement screen recording detection
    - Use Page Visibility API for basic detection
    - Show warning overlay when recording detected
    - _Requirements: 8.1, 8.2_

- [ ] 21. Frontend Integration - Update Watch Page
  - [ ] 21.1 Integrate StreamDurationTimer into stream controls
    - Add duration timer to video overlay
    - Pass startedAt from stream data
    - _Requirements: 1.1, 1.2, 1.3_
  - [ ] 21.2 Integrate LikeButton into stream controls
    - Add like button to video overlay
    - Connect to penny tip API
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [ ] 21.3 Integrate ReportStreamDialog
    - Add report icon to stream controls
    - Open dialog on click
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [ ] 21.4 Integrate EngagementPopup overlay
    - Add popup container to stream layout
    - Connect to LiveKit data channel events
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [ ] 21.5 Integrate ChatVisibilityToggle
    - Add toggle to chat header
    - Control chat panel visibility
    - _Requirements: 6.1, 6.2, 6.3_
  - [ ] 21.6 Integrate BlockedUsersContext
    - Wrap stream layout with provider
    - Filter chat messages through context
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [ ] 21.7 Integrate ImmersiveModeOverlay
    - Add immersive mode state to watch page
    - Render overlay when active
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - [ ] 21.8 Integrate PostStreamSummary
    - Listen for stream_ended event
    - Fetch summary data and display modal
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ] 22. Final Checkpoint - All Features Complete
  - Ensure all tests pass
  - Verify all features work end-to-end
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
