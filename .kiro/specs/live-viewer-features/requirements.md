# Requirements Document

## Introduction

This document specifies the requirements for enhancing the Live Streaming Viewer Features in StreamIt. The feature set includes UI elements for viewer engagement (live duration timer, report icon, like/coin button with penny tips), engagement pop-ups for gifts and joins, swipe gesture navigation for mobile immersive mode, privacy features (hide chat, block messages, screen recording protection), and post-stream summary for viewers.

## Glossary

- **Viewer**: A user watching a live stream who is not the creator
- **Creator**: A user who is broadcasting a live stream
- **Stream**: A live video broadcast from a creator to viewers
- **Penny_Tip**: A small coin tip (1 coin) sent to the creator when a viewer taps the like button
- **Immersive_Mode**: A fullscreen viewing mode that hides all UI elements except the video
- **Engagement_Popup**: A temporary notification overlay showing viewer actions (gifts, joins)
- **Stream_Duration**: The elapsed time since the stream started
- **Top_Gifter**: The viewer who has sent the most coins/gifts during the current stream
- **Heart_Burst_Animation**: A visual animation of hearts floating up when the like button is tapped

## Requirements

### Requirement 1: Live Duration Timer Display

**User Story:** As a viewer, I want to see how long the stream has been live, so that I can understand the stream's context and duration.

#### Acceptance Criteria

1. WHEN a viewer joins a live stream, THE Stream_Player SHALL display the live duration timer in the format "HH:MM:SS"
2. WHILE the stream is live, THE Stream_Player SHALL update the duration timer every second
3. WHEN the stream started time is available, THE Stream_Player SHALL calculate duration from the stream start timestamp

### Requirement 2: Report Stream Functionality

**User Story:** As a viewer, I want to report inappropriate streams, so that I can help maintain community standards.

#### Acceptance Criteria

1. THE Stream_Player SHALL display a report icon in the stream controls area
2. WHEN a viewer clicks the report icon, THE System SHALL display a report dialog with reason options
3. WHEN a viewer submits a report, THE System SHALL send the report to the backend and show confirmation
4. IF the report submission fails, THEN THE System SHALL display an error message and allow retry

### Requirement 3: Like Button with Penny Tips

**User Story:** As a viewer, I want to like the stream and tip the creator, so that I can show appreciation during the live stream.

#### Acceptance Criteria

1. THE Stream_Player SHALL display a like/coin button with "1" coin indicator
2. WHEN a viewer taps the like button, THE System SHALL display a heart burst animation
3. WHEN a viewer taps the like button, THE System SHALL deduct 1 coin from the viewer's wallet
4. WHEN a viewer taps the like button, THE System SHALL credit 1 coin to the creator's wallet
5. IF the viewer has insufficient balance, THEN THE System SHALL display a prompt to purchase coins
6. WHEN a penny tip is sent, THE System SHALL record the transaction in the database

### Requirement 4: Engagement Pop-ups

**User Story:** As a viewer, I want to see real-time notifications of stream activity, so that I can feel connected to the community.

#### Acceptance Criteria

1. WHEN a viewer sends a gift, THE System SHALL display a pop-up notification "X sent a gift 🎁" to all viewers
2. WHEN a new viewer joins the stream, THE System SHALL display a pop-up notification "Y joined the stream"
3. THE System SHALL display "Top Fan of the Week: Z" pop-up periodically during the stream
4. WHILE engagement pop-ups are displayed, THE System SHALL auto-dismiss them after 3-5 seconds
5. WHEN multiple pop-ups occur simultaneously, THE System SHALL queue and display them sequentially

### Requirement 5: Swipe Gesture Navigation (Mobile)

**User Story:** As a mobile viewer, I want to use swipe gestures to enter immersive mode, so that I can enjoy a distraction-free viewing experience.

#### Acceptance Criteria

1. WHEN a viewer swipes left on the stream, THE System SHALL enter immersive mode with fullscreen video
2. WHILE in immersive mode, THE System SHALL hide all UI elements (chat, controls, overlays)
3. WHEN a viewer swipes right in immersive mode, THE System SHALL return to normal view
4. WHEN a viewer double-taps in immersive mode, THE System SHALL trigger a like action with heart animation
5. THE System SHALL only enable swipe gestures on touch-enabled devices

### Requirement 6: Hide Chat Option

**User Story:** As a viewer, I want to hide the chat panel, so that I can focus on the stream content.

#### Acceptance Criteria

1. THE Stream_Player SHALL display a toggle button to hide/show the chat panel
2. WHEN a viewer toggles chat visibility, THE System SHALL persist the preference locally
3. WHEN a viewer returns to the stream, THE System SHALL restore their chat visibility preference

### Requirement 7: Block/Mute Viewer Messages

**User Story:** As a viewer, I want to block specific users' messages locally, so that I can customize my chat experience.

#### Acceptance Criteria

1. WHEN a viewer right-clicks or long-presses a chat message, THE System SHALL display a context menu with "Block User" option
2. WHEN a viewer blocks a user, THE System SHALL hide all messages from that user locally
3. THE System SHALL persist blocked users list in local storage
4. WHEN a viewer unblocks a user, THE System SHALL restore visibility of their messages

### Requirement 8: Screen Recording Protection

**User Story:** As a platform operator, I want to prevent screen recording of streams, so that creator content is protected.

#### Acceptance Criteria

1. WHEN the stream player is active, THE System SHALL attempt to detect screen recording
2. IF screen recording is detected, THEN THE System SHALL display a warning overlay
3. THE System SHALL implement platform-specific protections where available (FLAG_SECURE on Android, isScreenCaptureProtected on iOS)
4. THE System SHALL disable AirPlay and screen mirroring during stream playback where technically feasible

### Requirement 9: Post-Stream Summary (Viewer)

**User Story:** As a viewer, I want to see a summary when the stream ends, so that I can see stream highlights and discover more content.

#### Acceptance Criteria

1. WHEN a stream ends, THE System SHALL display a post-stream summary modal to viewers
2. THE Post_Stream_Summary SHALL show total viewers count
3. THE Post_Stream_Summary SHALL show the top gifter of the stream
4. THE Post_Stream_Summary SHALL display a follow creator button if not already following
5. THE Post_Stream_Summary SHALL display recommended other live streams
6. WHEN a viewer clicks a recommended stream, THE System SHALL navigate to that stream
