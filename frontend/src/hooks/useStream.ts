import { useState, useCallback, useEffect } from 'react';
import { streamApi } from '@/lib/api/stream';
import type { StreamIngress, StreamInfo, StreamStatus } from '@/lib/api/stream';
import { toast } from 'sonner';

export function useStream() {
  const [ingress, setIngress] = useState<StreamIngress | null>(null);
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);
  const [streamStatus, setStreamStatus] = useState<StreamStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

    // Fetch stream info
  const fetchStreamInfo = useCallback(async () => {
    try {
      setLoading(true);
      const response = await streamApi.getStreamInfo();
      
      console.log('[useStream] fetchStreamInfo response:', response);
      
      if (response.success && response.data) {
        // Preserve existing credentials when updating stream info
        setStreamInfo(prev => {
          if (prev?.streamKey && prev?.serverUrl) {
            console.log('[useStream] Preserving credentials in fetchStreamInfo');
            // Keep existing credentials, only update other fields
            return {
              ...response.data!,
              streamKey: prev.streamKey,
              serverUrl: prev.serverUrl,
              ingressId: prev.ingressId,
            };
          }
          return response.data!;
        });
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
      
      console.log('[useStream] fetchStreamStatus response:', response);
      
      if (response.success && response.data) {
        setStreamStatus(response.data);
        
        // Preserve existing credentials when updating from status
        setStreamInfo(prev => {
          if (prev?.streamKey && prev?.serverUrl) {
            console.log('[useStream] Preserving credentials in fetchStreamStatus');
            // Keep existing credentials, only update other fields
            return {
              ...response.data!.stream,
              streamKey: prev.streamKey,
              serverUrl: prev.serverUrl,
              ingressId: prev.ingressId,
            };
          }
          return response.data!.stream;
        });
      }
    } catch (err) {
      console.error('Error fetching stream status:', err);
    }
  }, []);

  // Create ingress (generate stream key)
  const createIngress = useCallback(async (ingressType: 'RTMP' | 'WHIP' = 'RTMP') => {
    try {
      setLoading(true);
      setError(null);
      const response = await streamApi.createIngress(ingressType);
      
      console.log('[useStream] createIngress response:', response);
      
      if (response.success && response.data) {
        setIngress(response.data);
        console.log('[useStream] Set ingress data:', response.data);
        
        // Fetch the latest stream info first
        const infoResponse = await streamApi.getStreamInfo();
        console.log('[useStream] getStreamInfo response:', infoResponse);
        
        // Merge the credentials with the stream info
        if (infoResponse.success && infoResponse.data) {
          const mergedData = {
            ...infoResponse.data,
            streamKey: response.data.streamKey,
            serverUrl: response.data.serverUrl,
            ingressId: response.data.ingressId,
          };
          console.log('[useStream] Setting merged streamInfo:', mergedData);
          setStreamInfo(mergedData);
        } else {
          // If fetching info fails, create minimal stream info with credentials
          console.log('[useStream] getStreamInfo failed, setting minimal data');
          setStreamInfo(prev => ({
            id: prev?.id || '',
            title: prev?.title || 'My Stream',
            thumbnail: null,
            isLive: false,
            isChatEnabled: true,
            isChatDelayed: false,
            isChatFollowersOnly: false,
            userId: '',
            streamKey: response.data!.streamKey,
            serverUrl: response.data!.serverUrl,
            ingressId: response.data!.ingressId,
          }));
        }
        
        toast.success('Stream key generated successfully!');
        return response.data;
      } else {
        const errorMsg = response.error || 'Failed to generate stream key';
        setError(errorMsg);
        toast.error(errorMsg);
        return null;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate stream key';
      console.error('[useStream] createIngress error:', err);
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete ingress (reset stream key)
  const deleteIngress = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await streamApi.deleteIngress();
      
      if (response.success) {
        setIngress(null);
        toast.success('Stream key deleted successfully');
        await fetchStreamInfo();
      } else {
        const errorMsg = response.error || 'Failed to delete stream key';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete stream key';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [fetchStreamInfo]);

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

  // Poll stream status every 5 seconds if stream exists
  useEffect(() => {
    if (!streamInfo?.id) return;

    console.log('[useStream] Starting status polling');
    const interval = setInterval(() => {
      fetchStreamStatus();
    }, 5000);

    return () => {
      console.log('[useStream] Stopping status polling');
      clearInterval(interval);
    };
  }, [streamInfo?.id, fetchStreamStatus]);

  return {
    ingress,
    streamInfo,
    streamStatus,
    loading,
    error,
    createIngress,
    deleteIngress,
    updateStreamInfo,
    updateChatSettings,
    fetchStreamInfo,
    fetchStreamStatus,
  };
}
