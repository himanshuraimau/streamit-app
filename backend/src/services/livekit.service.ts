import {
  IngressClient,
  RoomServiceClient,
  IngressInput,
  type CreateIngressOptions,
} from 'livekit-server-sdk';

/**
 * LiveKit Service - Centralized LiveKit SDK operations
 * Handles ingress creation, room management, and client initialization
 */
export class LiveKitService {
  private static ingressClient: IngressClient | null = null;
  private static roomClient: RoomServiceClient | null = null;

  /**
   * Get or create IngressClient instance (singleton pattern)
   */
  private static getIngressClient(): IngressClient {
    if (!this.ingressClient) {
      const livekitUrl = process.env.LIVEKIT_URL;
      const apiKey = process.env.LIVEKIT_API_KEY;
      const apiSecret = process.env.LIVEKIT_API_SECRET;

      if (!livekitUrl || !apiKey || !apiSecret) {
        throw new Error(
          'Missing LiveKit configuration. Please set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET in your environment variables.'
        );
      }

      this.ingressClient = new IngressClient(livekitUrl, apiKey, apiSecret);
      console.log('[LiveKit] IngressClient initialized');
    }

    return this.ingressClient;
  }

  /**
   * Get or create RoomServiceClient instance (singleton pattern)
   */
  private static getRoomClient(): RoomServiceClient {
    if (!this.roomClient) {
      const livekitUrl = process.env.LIVEKIT_URL;
      const apiKey = process.env.LIVEKIT_API_KEY;
      const apiSecret = process.env.LIVEKIT_API_SECRET;

      if (!livekitUrl || !apiKey || !apiSecret) {
        throw new Error(
          'Missing LiveKit configuration. Please set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET in your environment variables.'
        );
      }

      this.roomClient = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
      console.log('[LiveKit] RoomServiceClient initialized');
    }

    return this.roomClient;
  }

  /**
   * Create a new ingress for streaming
   * @param userId - User ID (will be used as room name)
   * @param ingressType - Type of ingress (RTMP or WHIP)
   * @returns Ingress details including stream key and server URL
   */
  static async createIngress(
    userId: string,
    ingressType: 'RTMP' | 'WHIP' = 'RTMP'
  ) {
    try {
      const ingressClient = this.getIngressClient();

      // Map ingress type to LiveKit IngressInput enum
      const inputType =
        ingressType === 'RTMP' 
          ? IngressInput.RTMP_INPUT 
          : IngressInput.WHIP_INPUT;

      // Configure ingress options
      const options: CreateIngressOptions = {
        name: `${userId}-ingress`,
        roomName: userId, // Use userId as room name
        participantName: userId,
        participantIdentity: userId,
      };

      console.log(`[LiveKit] Creating ${ingressType} ingress for user ${userId}`);
      const ingress = await ingressClient.createIngress(inputType, options);

      console.log(`[LiveKit] Ingress created successfully: ${ingress.ingressId}`);
      return {
        ingressId: ingress.ingressId,
        url: ingress.url,
        streamKey: ingress.streamKey,
      };
    } catch (error) {
      console.error('[LiveKit] Error creating ingress:', error);
      throw new Error(
        `Failed to create ingress: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete an ingress
   * @param ingressId - The ingress ID to delete
   */
  static async deleteIngress(ingressId: string): Promise<void> {
    try {
      const ingressClient = this.getIngressClient();
      console.log(`[LiveKit] Deleting ingress: ${ingressId}`);
      await ingressClient.deleteIngress(ingressId);
      console.log(`[LiveKit] Ingress deleted successfully: ${ingressId}`);
    } catch (error) {
      console.error('[LiveKit] Error deleting ingress:', error);
      throw new Error(
        `Failed to delete ingress: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * List all ingresses for a room
   * @param roomName - The room name (userId)
   */
  static async listIngresses(roomName?: string) {
    try {
      const ingressClient = this.getIngressClient();
      console.log(`[LiveKit] Listing ingresses${roomName ? ` for room: ${roomName}` : ''}`);
      const ingresses = await ingressClient.listIngress({ roomName });
      return ingresses;
    } catch (error) {
      console.error('[LiveKit] Error listing ingresses:', error);
      throw new Error(
        `Failed to list ingresses: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete a room
   * @param roomName - The room name to delete
   */
  static async deleteRoom(roomName: string): Promise<void> {
    try {
      const roomClient = this.getRoomClient();
      console.log(`[LiveKit] Deleting room: ${roomName}`);
      await roomClient.deleteRoom(roomName);
      console.log(`[LiveKit] Room deleted successfully: ${roomName}`);
    } catch (error) {
      // Room might not exist, which is fine
      if (error instanceof Error && error.message.includes('not found')) {
        console.log(`[LiveKit] Room ${roomName} does not exist, skipping deletion`);
        return;
      }
      console.error('[LiveKit] Error deleting room:', error);
      throw new Error(
        `Failed to delete room: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * List all active rooms
   */
  static async listRooms() {
    try {
      const roomClient = this.getRoomClient();
      console.log('[LiveKit] Listing all rooms');
      const rooms = await roomClient.listRooms();
      return rooms;
    } catch (error) {
      console.error('[LiveKit] Error listing rooms:', error);
      throw new Error(
        `Failed to list rooms: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get participants in a room
   * @param roomName - The room name
   */
  static async listParticipants(roomName: string) {
    try {
      const roomClient = this.getRoomClient();
      console.log(`[LiveKit] Listing participants for room: ${roomName}`);
      const participants = await roomClient.listParticipants(roomName);
      return participants;
    } catch (error) {
      console.error('[LiveKit] Error listing participants:', error);
      throw new Error(
        `Failed to list participants: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Reset all ingresses and rooms for a user
   * This is called before creating a new ingress to ensure clean state
   * @param userId - User ID
   */
  static async resetUserIngresses(userId: string): Promise<void> {
    try {
      console.log(`[LiveKit] Resetting ingresses for user: ${userId}`);

      // List all ingresses for this user's room
      const ingresses = await this.listIngresses(userId);

      // Delete all existing ingresses
      for (const ingress of ingresses) {
        if (ingress.ingressId) {
          await this.deleteIngress(ingress.ingressId);
        }
      }

      // Delete the room
      await this.deleteRoom(userId);

      console.log(`[LiveKit] Reset complete for user: ${userId}`);
    } catch (error) {
      console.error('[LiveKit] Error resetting user ingresses:', error);
      // Don't throw error here, as this is a cleanup operation
      // We want to continue even if some cleanup fails
    }
  }
}
