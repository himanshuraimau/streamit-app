import { WebhookReceiver } from 'livekit-server-sdk';

/**
 * Webhook Service - Process LiveKit webhook events
 * Handles room and participant events for analytics
 * Note: Stream live status is now managed via WebRTC go-live/end-stream endpoints
 */
export class WebhookService {
  private static receiver: WebhookReceiver | null = null;

  /**
   * Get or create WebhookReceiver instance
   */
  private static getReceiver(): WebhookReceiver {
    if (!this.receiver) {
      const apiKey = process.env.LIVEKIT_API_KEY;
      const apiSecret = process.env.LIVEKIT_API_SECRET;

      if (!apiKey || !apiSecret) {
        throw new Error('Missing LiveKit API credentials');
      }

      this.receiver = new WebhookReceiver(apiKey, apiSecret);
      console.log('[WebhookService] WebhookReceiver initialized');
    }

    return this.receiver;
  }

  /**
   * Validate webhook signature
   * @param body - Raw webhook body (string)
   * @param signature - Signature from header
   * @returns Validated webhook event
   */
  static async validateAndParse(body: string, signature: string) {
    try {
      const receiver = this.getReceiver();
      const event = await receiver.receive(body, signature);
      console.log(`[WebhookService] Valid webhook received: ${event.event}`);
      return event;
    } catch (error) {
      console.error('[WebhookService] Invalid webhook signature:', error);
      throw new Error('Invalid webhook signature');
    }
  }

  /**
   * Handle room finished event
   * Called when a room is closed
   * @param event - Webhook event
   */
  static async handleRoomFinished(event: any): Promise<void> {
    try {
      const roomName = event.room?.name;
      
      if (!roomName) {
        console.warn('[WebhookService] No room name in room_finished event');
        return;
      }

      console.log(`[WebhookService] Room finished: ${roomName}`);
      // Additional cleanup if needed
    } catch (error) {
      console.error('[WebhookService] Error handling room_finished:', error);
      // Don't throw error for cleanup operations
    }
  }

  /**
   * Handle participant joined event
   * Can be used for analytics/tracking
   * @param event - Webhook event
   */
  static async handleParticipantJoined(event: any): Promise<void> {
    try {
      const roomName = event.room?.name;
      const participantIdentity = event.participant?.identity;
      
      console.log(
        `[WebhookService] Participant ${participantIdentity} joined room ${roomName}`
      );
      // Can add analytics tracking here
    } catch (error) {
      console.error('[WebhookService] Error handling participant_joined:', error);
      // Don't throw error for non-critical events
    }
  }

  /**
   * Handle participant left event
   * Can be used for analytics/tracking
   * @param event - Webhook event
   */
  static async handleParticipantLeft(event: any): Promise<void> {
    try {
      const roomName = event.room?.name;
      const participantIdentity = event.participant?.identity;
      
      console.log(
        `[WebhookService] Participant ${participantIdentity} left room ${roomName}`
      );
      // Can add analytics tracking here
    } catch (error) {
      console.error('[WebhookService] Error handling participant_left:', error);
      // Don't throw error for non-critical events
    }
  }

  /**
   * Handle track published event
   * Called when a participant publishes a track (audio/video)
   * @param event - Webhook event
   */
  static async handleTrackPublished(event: any): Promise<void> {
    try {
      const roomName = event.room?.name;
      const participantIdentity = event.participant?.identity;
      const trackSid = event.track?.sid;
      const trackType = event.track?.type; // 'AUDIO' or 'VIDEO'
      
      console.log(
        `[WebhookService] Track published - Room: ${roomName}, Participant: ${participantIdentity}, Type: ${trackType}, SID: ${trackSid}`
      );
      // Can add analytics tracking here
    } catch (error) {
      console.error('[WebhookService] Error handling track_published:', error);
      // Don't throw error for non-critical events
    }
  }

  /**
   * Handle track unpublished event
   * Called when a participant unpublishes a track
   * @param event - Webhook event
   */
  static async handleTrackUnpublished(event: any): Promise<void> {
    try {
      const roomName = event.room?.name;
      const participantIdentity = event.participant?.identity;
      const trackSid = event.track?.sid;
      const trackType = event.track?.type;
      
      console.log(
        `[WebhookService] Track unpublished - Room: ${roomName}, Participant: ${participantIdentity}, Type: ${trackType}, SID: ${trackSid}`
      );
      // Can add analytics tracking here
    } catch (error) {
      console.error('[WebhookService] Error handling track_unpublished:', error);
      // Don't throw error for non-critical events
    }
  }

  /**
   * Process webhook event
   * Routes event to appropriate handler based on event type
   * Note: ingress_started and ingress_ended events are no longer handled
   * as stream status is managed via WebRTC go-live/end-stream endpoints
   * @param event - Validated webhook event
   */
  static async processEvent(event: any): Promise<void> {
    try {
      const eventType = event.event;
      console.log(`[WebhookService] Processing event: ${eventType}`);

      switch (eventType) {
        case 'room_finished':
          await this.handleRoomFinished(event);
          break;
        
        case 'participant_joined':
          await this.handleParticipantJoined(event);
          break;
        
        case 'participant_left':
          await this.handleParticipantLeft(event);
          break;
        
        case 'track_published':
          await this.handleTrackPublished(event);
          break;
        
        case 'track_unpublished':
          await this.handleTrackUnpublished(event);
          break;
        
        default:
          console.log(`[WebhookService] Unhandled event type: ${eventType}`);
      }
    } catch (error) {
      console.error('[WebhookService] Error processing event:', error);
      throw error;
    }
  }
}
