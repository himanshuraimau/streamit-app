/**
 * LiveKit webhook event types
 */

export interface LiveKitRoom {
  sid?: string;
  name?: string;
  emptyTimeout?: number;
  maxParticipants?: number;
  creationTime?: number;
  turnPassword?: string;
  metadata?: string;
  numParticipants?: number;
  activeRecording?: boolean;
}

export interface LiveKitParticipant {
  sid?: string;
  identity?: string;
  state?: number;
  metadata?: string;
  joinedAt?: number;
  name?: string;
  version?: number;
  permission?: Record<string, unknown>;
  region?: string;
  isPublisher?: boolean;
}

export interface LiveKitTrack {
  sid?: string;
  type?: string;
  name?: string;
  muted?: boolean;
  width?: number;
  height?: number;
  simulcast?: boolean;
  disableDtx?: boolean;
  source?: string;
  layers?: unknown[];
  mimeType?: string;
  mid?: string;
}

export interface LiveKitEgressInfo {
  egressId?: string;
  roomId?: string;
  roomName?: string;
  status?: number;
  startedAt?: number;
  endedAt?: number;
  error?: string;
}

export interface LiveKitWebhookEvent {
  event?: string;
  room?: LiveKitRoom;
  participant?: LiveKitParticipant;
  track?: LiveKitTrack;
  egressInfo?: LiveKitEgressInfo;
  id?: string;
  createdAt?: number;
  numDropped?: number;
}
