/**
 * TypeScript types for streaming functionality
 */

// Ingress types
export interface CreateIngressRequest {
  ingressType: 'RTMP' | 'WHIP';
}

export interface IngressResponse {
  ingressId: string;
  serverUrl: string;
  streamKey: string;
  userId: string;
}

// Stream info types
export interface UpdateStreamInfoRequest {
  title?: string;
  thumbnail?: string;
}

export interface StreamInfoResponse {
  id: string;
  title: string;
  thumbnail: string | null;
  isLive: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Chat settings types
export interface UpdateChatSettingsRequest {
  isChatEnabled?: boolean;
  isChatDelayed?: boolean;
  isChatFollowersOnly?: boolean;
}

export interface ChatSettingsResponse {
  isChatEnabled: boolean;
  isChatDelayed: boolean;
  isChatFollowersOnly: boolean;
}

// Stream status types
export interface StreamStatusResponse {
  isLive: boolean;
  viewerCount: number;
  title: string;
  thumbnail: string | null;
  isChatEnabled: boolean;
  isChatDelayed: boolean;
  isChatFollowersOnly: boolean;
}

// Token types
export interface GetViewerTokenRequest {
  hostId: string;
  viewerId?: string;
  guestName?: string;
}

export interface TokenResponse {
  token: string;
  identity: string;
  name: string;
}

// LiveKit webhook event types
export interface LiveKitWebhookEvent {
  event: string;
  createdAt?: number;
  id?: string;
  room?: {
    sid: string;
    name: string;
    emptyTimeout?: number;
    maxParticipants?: number;
    creationTime?: number;
    turnPassword?: string;
    enabledCodecs?: Array<{
      mime: string;
      fmtpLine?: string;
    }>;
    metadata?: string;
    numParticipants?: number;
    activeRecording?: boolean;
  };
  participant?: {
    sid: string;
    identity: string;
    state?: string;
    tracks?: Array<{
      sid: string;
      type: string;
      name?: string;
      muted?: boolean;
      width?: number;
      height?: number;
      simulcast?: boolean;
      disableDtx?: boolean;
      source?: string;
    }>;
    metadata?: string;
    joinedAt?: number;
    name?: string;
    version?: number;
    permission?: {
      canSubscribe?: boolean;
      canPublish?: boolean;
      canPublishData?: boolean;
      hidden?: boolean;
      recorder?: boolean;
    };
    region?: string;
    isPublisher?: boolean;
  };
  ingressInfo?: {
    ingressId: string;
    name?: string;
    streamKey?: string;
    url?: string;
    inputType?: number;
    bypassTranscoding?: boolean;
    audio?: {
      name?: string;
      source?: number;
      preset?: number;
      options?: {
        audioBitrate?: number;
        audioFrequency?: number;
        dtx?: boolean;
      };
    };
    video?: {
      name?: string;
      source?: number;
      preset?: number;
      options?: {
        videoBitrate?: number;
        layers?: Array<{
          quality?: number;
          width?: number;
          height?: number;
          bitrate?: number;
          ssrc?: number;
        }>;
      };
    };
    roomName?: string;
    participantIdentity?: string;
    participantName?: string;
    reusable?: boolean;
    state?: {
      status: number;
      error?: string;
      video?: {
        mimeType?: string;
        avgBitrate?: number;
        width?: number;
        height?: number;
        framerate?: number;
      };
      audio?: {
        mimeType?: string;
        avgBitrate?: number;
        channels?: number;
        sampleRate?: number;
      };
      roomId?: string;
      startedAt?: number;
      endedAt?: number;
      updatedAt?: number;
      resourceId?: string;
    };
  };
  egressInfo?: {
    egressId: string;
    roomId?: string;
    status?: number;
    startedAt?: number;
    endedAt?: number;
    error?: string;
  };
  track?: {
    sid: string;
    type?: string;
    name?: string;
    muted?: boolean;
    width?: number;
    height?: number;
  };
}

// Stream list types
export interface StreamListItem {
  id: string;
  title: string;
  thumbnail: string | null;
  isLive: boolean;
  user: {
    id: string;
    username: string;
    name: string;
    image: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
}
