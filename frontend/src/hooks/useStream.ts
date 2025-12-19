import { useState, useCallback, useEffect } from 'react';
import { streamApi } from '@/lib/api/stream';
import type { StreamInfo, StreamStatus, GoLiveResponse, SetupStreamRequest, SetupStreamResponse } from '@/lib/api/stream';
import { toast } from 'sonner';

export function useStream() {
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);
  const [streamStatus, setStreamStatus] = useState<StreamStatus | null>(null);
  const [liveData, setLiveData] = useState<GoLiveResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch stream info
  const fetchStreamInfo = useCallback(async () => {
    try {
      setLoading(true);
      const response = await streamApi.getStreamInfo();
      
      if (response.success && response.data) {
        setStreamInfo(response.data);
      }
    } catch (err) {
      console.error('Error fetching stream info:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stream info');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch stream status
  const fetchStreamStatus = useCallback(async () => {
    try {
      const response = await streamApi.getStreamStatus();
      
      if (response.success && response.data) {
        setStreamStatus(response.data);
        setStreamInfo(response.data.stream);
      }
    } catch (err) {
      console.error('Error fetching stream status:', err);
    }
  }, []);

  // Setup stream - Create or update stream metadata before going live
  // Requirements: 5.2
  const setupStream = useCallback(async (data: SetupStreamRequest): Promise<SetupStreamResponse | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await streamApi.setupStream(data);
      
      if (response.success && response.data) {
        // Update stream info with the setup response
        setStreamInfo(prev => ({
          ...prev,
          id: response.data!.id,
          title: response.data!.title,
          description: response.data!.description,
          isLive: response.data!.isLive,
          isChatEnabled: response.data!.isChatEnabled,
          isChatDelayed: response.data!.isChatDelayed,
          isChatFollowersOnly: response.data!.isChatFollowersOnly,
          thumbnail: prev?.thumbnail ?? null,
          userId: prev?.userId ?? '',
        }));
        toast.success('Stream setup complete!');
        return response.data;
      } else {
        const errorMsg = response.error || 'Failed to setup stream';
        setError(errorMsg);
        toast.error(errorMsg);
        return null;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to setup stream';
      console.error('[useStream] setupStream error:', err);
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Go live - Get publish token and set stream status to live
  // Requirements: 1.1, 1.3
  const goLive = useCallback(async (): Promise<GoLiveResponse | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await streamApi.goLive();
      
      if (response.success && response.data) {
        setLiveData(response.data);
        // Update stream info with live status
        setStreamInfo(prev => prev ? {
          ...prev,
          isLive: true,
          title: response.data!.stream.title,
        } : null);
        toast.success('You are now live!');
        return response.data;
      } else {
        const errorMsg = response.error || response.message || 'Failed to go live';
        setError(errorMsg);
        toast.error(errorMsg);
        return null;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to go live';
      console.error('[useStream] goLive error:', err);
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // End stream - Set stream status to offline
  // Requirements: 2.3
  const endStream = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await streamApi.endStream();
      
      if (response.success) {
        setLiveData(null);
        // Update stream info with offline status
        setStreamInfo(prev => prev ? {
          ...prev,
          isLive: false,
        } : null);
        toast.success('Stream ended');
        return true;
      } else {
        const errorMsg = response.error || 'Failed to end stream';
        setError(errorMsg);
        toast.error(errorMsg);
        return false;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to end stream';
      console.error('[useStream] endStream error:', err);
      setError(errorMsg);
      toast.error(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update stream info
  const updateStreamInfo = useCallback(async (data: { title?: string; thumbnail?: string }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await streamApi.updateStreamInfo(data);
      
      if (response.success && response.data) {
        setStreamInfo(response.data);
        toast.success('Stream info updated successfully');
        return response.data;
      } else {
        const errorMsg = response.error || 'Failed to update stream info';
        setError(errorMsg);
        toast.error(errorMsg);
        return null;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update stream info';
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update chat settings
  const updateChatSettings = useCallback(async (data: {
    isChatEnabled?: boolean;
    isChatDelayed?: boolean;
    isChatFollowersOnly?: boolean;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await streamApi.updateChatSettings(data);
      
      if (response.success && response.data) {
        setStreamInfo(response.data);
        toast.success('Chat settings updated successfully');
        return response.data;
      } else {
        const errorMsg = response.error || 'Failed to update chat settings';
        setError(errorMsg);
        toast.error(errorMsg);
        return null;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update chat settings';
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStreamInfo();
  }, [fetchStreamInfo]);

  return {
    streamInfo,
    streamStatus,
    liveData,
    loading,
    error,
    setupStream,
    goLive,
    endStream,
    updateStreamInfo,
    updateChatSettings,
    fetchStreamInfo,
    fetchStreamStatus,
  };
}
