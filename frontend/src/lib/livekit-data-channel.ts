/**
 * LiveKit Data Channel Integration for Stream Engagement Events
 * 
 * This module provides types and handlers for real-time engagement events
 * sent via LiveKit's data channels during live streams.
 * 
 * Requirements: 4.1, 4.2, 4.3
 */

import { Room, RoomEvent, RemoteParticipant } from 'livekit-client';
import type { EngagementEvent } from '@/components/stream/engagement-popup';
import type { StreamSummary } from '@/lib/api/stream';

/**
 * Data channel message types for stream engagement events
 * 
 * - gift: When a viewer sends a gift to the creator
 * - join: When a new viewer joins the stream
 * - like: When a viewer sends a penny tip (like)
 * - top_fan: Periodic notification for top fan of the week
 * - stream_ended: When the stream ends, includes summary data
 */
export type DataChannelMessageType = 'gift' | 'join' | 'like' | 'top_fan' | 'stream_ended';

/**
 * Gift message - sent when a viewer sends a gift
 * Requirements: 4.1
 */
export interface GiftMessage {
  type: 'gift';
  senderId: string;
  senderName: string;
  giftName: string;
  giftImage: string;
  coinAmount: number;
}

/**
 * Join message - sent when a new viewer joins
 * Requirements: 4.2
 */
export interface JoinMessage {
  type: 'join';
  userId: string;
  username: string;
}

/**
 * Like message - sent when a viewer sends a penny tip
 * Requirements: 4.1 (part of engagement)
 */
export interface LikeMessage {
  type: 'like';
  userId: string;
  username: string;
}

/**
 * Top fan message - periodic notification for top fan
 * Requirements: 4.3
 */
export interface TopFanMessage {
  type: 'top_fan';
  userId: string;
  username: string;
  totalCoins: number;
}

/**
 * Stream ended message - sent when stream ends with summary
 */
export interface StreamEndedMessage {
  type: 'stream_ended';
  summary: StreamSummary;
}

/**
 * Union type for all data channel messages
 */
export type DataChannelMessage =
  | GiftMessage
  | JoinMessage
  | LikeMessage
  | TopFanMessage
  | StreamEndedMessage;

/**
 * Callback type for handling engagement events
 */
export type EngagementEventHandler = (event: EngagementEvent) => void;

/**
 * Callback type for handling stream ended events
 */
export type StreamEndedHandler = (summary: StreamSummary) => void;

/**
 * Options for data channel event handlers
 */
export interface DataChannelHandlerOptions {
  onEngagementEvent?: EngagementEventHandler;
  onStreamEnded?: StreamEndedHandler;
}

/**
 * Sends an engagement event to all participants via LiveKit data channel
 * 
 * Uses RELIABLE delivery to ensure guaranteed message delivery.
 * 
 * @param room - The LiveKit Room instance
 * @param message - The data channel message to send
 * @returns Promise that resolves when the message is sent
 * 
 * Requirements: 4.1, 4.2, 4.3
 */
export async function sendEngagementEvent(
  room: Room,
  message: DataChannelMessage
): Promise<void> {
  if (!room || !room.localParticipant) {
    console.warn('[DataChannel] Cannot send event: Room or local participant not available');
    return;
  }

  try {
    const data = new TextEncoder().encode(JSON.stringify(message));
    await room.localParticipant.publishData(data, { reliable: true });
    console.log('[DataChannel] Sent engagement event:', message.type);
  } catch (error) {
    console.error('[DataChannel] Failed to send engagement event:', error);
    throw error;
  }
}

/**
 * Parses a data channel payload into a DataChannelMessage
 * 
 * @param payload - The raw Uint8Array payload from LiveKit
 * @returns The parsed message or null if parsing fails
 */
export function parseDataChannelMessage(payload: Uint8Array): DataChannelMessage | null {
  try {
    const text = new TextDecoder().decode(payload);
    const message = JSON.parse(text) as DataChannelMessage;
    
    // Validate message has required type field
    if (!message || !message.type) {
      console.warn('[DataChannel] Invalid message: missing type field');
      return null;
    }
    
    return message;
  } catch (error) {
    console.error('[DataChannel] Failed to parse data channel message:', error);
    return null;
  }
}

/**
 * Converts a DataChannelMessage to an EngagementEvent for display
 * 
 * @param message - The data channel message
 * @returns EngagementEvent or null if message type doesn't map to engagement
 */
export function messageToEngagementEvent(message: DataChannelMessage): EngagementEvent | null {
  const baseEvent = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  };

  switch (message.type) {
    case 'gift':
      return {
        ...baseEvent,
        type: 'gift',
        username: message.senderName,
        giftName: message.giftName,
        giftImage: message.giftImage,
      };
    
    case 'join':
      return {
        ...baseEvent,
        type: 'join',
        username: message.username,
      };
    
    case 'like':
      // Likes are handled separately with heart animation
      // but we can still show them as engagement events
      return {
        ...baseEvent,
        type: 'gift', // Display likes as mini-gifts
        username: message.username,
        giftName: 'Penny Tip',
      };
    
    case 'top_fan':
      return {
        ...baseEvent,
        type: 'top_fan',
        username: message.username,
      };
    
    case 'stream_ended':
      // Stream ended is handled separately, not as engagement popup
      return null;
    
    default:
      return null;
  }
}

/**
 * Handles incoming data channel messages and dispatches to appropriate handlers
 * 
 * @param payload - The raw Uint8Array payload from LiveKit
 * @param participant - The participant who sent the message (optional)
 * @param options - Handler callbacks for different event types
 * 
 * Requirements: 4.1, 4.2, 4.3
 */
export function handleEngagementEvent(
  payload: Uint8Array,
  participant: RemoteParticipant | undefined,
  options: DataChannelHandlerOptions
): void {
  const message = parseDataChannelMessage(payload);
  
  if (!message) {
    return;
  }

  console.log('[DataChannel] Received message:', message.type, 'from:', participant?.identity);

  // Handle stream ended separately
  if (message.type === 'stream_ended') {
    if (options.onStreamEnded) {
      options.onStreamEnded(message.summary);
    }
    return;
  }

  // Convert to engagement event and dispatch
  const engagementEvent = messageToEngagementEvent(message);
  if (engagementEvent && options.onEngagementEvent) {
    options.onEngagementEvent(engagementEvent);
  }
}

/**
 * Sets up data channel event listeners on a LiveKit Room
 * 
 * @param room - The LiveKit Room instance
 * @param options - Handler callbacks for different event types
 * @returns Cleanup function to remove listeners
 * 
 * Requirements: 4.1, 4.2, 4.3
 */
export function setupDataChannelListeners(
  room: Room,
  options: DataChannelHandlerOptions
): () => void {
  const handleDataReceived = (
    payload: Uint8Array,
    participant?: RemoteParticipant
  ) => {
    handleEngagementEvent(payload, participant, options);
  };

  room.on(RoomEvent.DataReceived, handleDataReceived);

  console.log('[DataChannel] Data channel listeners set up');

  // Return cleanup function
  return () => {
    room.off(RoomEvent.DataReceived, handleDataReceived);
    console.log('[DataChannel] Data channel listeners removed');
  };
}

/**
 * Helper to create a gift message
 */
export function createGiftMessage(
  senderId: string,
  senderName: string,
  giftName: string,
  giftImage: string,
  coinAmount: number
): GiftMessage {
  return {
    type: 'gift',
    senderId,
    senderName,
    giftName,
    giftImage,
    coinAmount,
  };
}

/**
 * Helper to create a join message
 */
export function createJoinMessage(userId: string, username: string): JoinMessage {
  return {
    type: 'join',
    userId,
    username,
  };
}

/**
 * Helper to create a like message
 */
export function createLikeMessage(userId: string, username: string): LikeMessage {
  return {
    type: 'like',
    userId,
    username,
  };
}

/**
 * Helper to create a top fan message
 */
export function createTopFanMessage(
  userId: string,
  username: string,
  totalCoins: number
): TopFanMessage {
  return {
    type: 'top_fan',
    userId,
    username,
    totalCoins,
  };
}

/**
 * Helper to create a stream ended message
 */
export function createStreamEndedMessage(summary: StreamSummary): StreamEndedMessage {
  return {
    type: 'stream_ended',
    summary,
  };
}
