# Requirements Document

## Introduction

This specification defines the migration from OBS-based RTMP streaming to browser-based WebRTC streaming for the StreamIt platform. The goal is to enable creators to go live directly from their browser using their device's camera and microphone, eliminating the need for external streaming software like OBS. This makes streaming accessible to mobile users and simplifies the creator experience.

## Glossary

- **WebRTC**: Web Real-Time Communication protocol for browser-based audio/video streaming
- **LiveKit**: The real-time video/audio infrastructure provider used by StreamIt
- **Creator**: An approved user who can broadcast live streams
- **Viewer**: A user watching a live stream (authenticated or guest)
- **Room**: A LiveKit room where the stream is broadcast (named after creator's userId)
- **Publish Token**: A JWT token with permissions to publish audio/video tracks
- **Subscribe Token**: A JWT token with permissions to view audio/video tracks
- **Stream**: The database record containing stream metadata and status

## Requirements

### Requirement 1

**User Story:** As a creator, I want to start a live stream directly from my browser using my camera and microphone, so that I can go live without needing external software like OBS.

#### Acceptance Criteria

1. WHEN a creator clicks "Go Live" THEN the System SHALL request camera and microphone permissions from the browser
2. WHEN permissions are granted THEN the System SHALL connect to the LiveKit room and publish the creator's audio/video tracks
3. WHEN the creator successfully connects THEN the System SHALL update the stream status to live in the database
4. WHEN the creator is live THEN the System SHALL display a self-preview of their camera feed
5. IF camera or microphone permissions are denied THEN the System SHALL display a clear error message explaining how to grant permissions

### Requirement 2

**User Story:** As a creator, I want full control over my stream while broadcasting, so that I can manage my audio, video, and stream settings in real-time.

#### Acceptance Criteria

1. WHEN a creator is live THEN the System SHALL display controls to toggle camera on/off
2. WHEN a creator is live THEN the System SHALL display controls to toggle microphone mute/unmute
3. WHEN a creator clicks "End Stream" THEN the System SHALL disconnect from LiveKit and set stream status to offline
4. WHEN a creator is live THEN the System SHALL display the current viewer count
5. WHEN a creator is live THEN the System SHALL allow editing the stream title without interrupting the broadcast

### Requirement 3

**User Story:** As a creator, I want to see and interact with my chat while streaming, so that I can engage with my audience.

#### Acceptance Criteria

1. WHEN a creator is live THEN the System SHALL display the live chat alongside the video preview
2. WHEN a creator sends a chat message THEN the System SHALL broadcast it to all viewers in the room
3. WHEN a creator is live THEN the System SHALL allow toggling chat settings (enabled, delayed, followers-only)

### Requirement 4

**User Story:** As a viewer, I want to watch live streams from creators, so that I can enjoy their content in real-time.

#### Acceptance Criteria

1. WHEN a viewer navigates to a live stream THEN the System SHALL request a subscribe-only token from the backend
2. WHEN a viewer joins a live stream THEN the System SHALL display the creator's video and audio
3. WHEN a viewer is authenticated THEN the System SHALL use their user identity for the token
4. WHEN a viewer is not authenticated THEN the System SHALL generate a guest identity with a random name
5. WHEN the creator ends the stream THEN the System SHALL display an "offline" state to viewers

### Requirement 5

**User Story:** As a creator, I want to set up my stream before going live, so that I can configure the title, description, and chat settings.

#### Acceptance Criteria

1. WHEN a creator has no stream configured THEN the System SHALL display a setup form for title and description
2. WHEN a creator submits the setup form THEN the System SHALL create or update the stream record in the database
3. WHEN a creator has a stream configured THEN the System SHALL display the "Go Live" option

### Requirement 6

**User Story:** As a system administrator, I want to remove the OBS/RTMP infrastructure, so that the codebase is simplified and maintenance is reduced.

#### Acceptance Criteria

1. WHEN the migration is complete THEN the System SHALL remove the ingressId, serverUrl, and streamKey fields from the Stream model
2. WHEN the migration is complete THEN the System SHALL remove the ingress-related API endpoints
3. WHEN the migration is complete THEN the System SHALL remove the Keys page from the creator dashboard
4. WHEN the migration is complete THEN the System SHALL remove the LiveKit ingress service code
