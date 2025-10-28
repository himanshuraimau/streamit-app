import { useState, useEffect } from 'react';
import { creatorApi, type CreateApplicationRequest, type FullApplicationResponse, type ApplicationStatusResponse } from '@/lib/api/creator';
import { toast } from 'sonner';

export const useCreatorApplication = () => {
  const [application, setApplication] = useState<FullApplicationResponse | null>(null);
  const [status, setStatus] = useState<ApplicationStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch application status
  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await creatorApi.getApplicationStatus();
      
      if (response.success && response.data) {
        setStatus(response.data);
      } else {
        setError(response.error || 'Failed to fetch application status');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error fetching status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch full application
  const fetchApplication = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await creatorApi.getApplication();
      
      if (response.success && response.data) {
        setApplication(response.data);
      } else {
        setError(response.error || 'Failed to fetch application');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error fetching application:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create new application
  const createApplication = async (data: CreateApplicationRequest) => {
    try {
      setLoading(true);
      setError(null);
      const response = await creatorApi.createApplication(data);
      
      if (response.success && response.data) {
        setApplication(response.data);
        toast.success(response.message || 'Application submitted successfully!');
        return response.data;
      } else {
        const errorMsg = response.error || 'Failed to create application';
        setError(errorMsg);
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Network error occurred';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update existing application
  const updateApplication = async (data: Partial<CreateApplicationRequest>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await creatorApi.updateApplication(data);
      
      if (response.success && response.data) {
        setApplication(response.data);
        toast.success(response.message || 'Application updated successfully!');
        return response.data;
      } else {
        const errorMsg = response.error || 'Failed to update application';
        setError(errorMsg);
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Network error occurred';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Upload file
  const uploadFile = async (file: File, purpose?: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await creatorApi.uploadFile(file, purpose);
      
      if (response.success && response.data) {
        toast.success('File uploaded successfully!');
        return response.data;
      } else {
        const errorMsg = response.error || 'Failed to upload file';
        setError(errorMsg);
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Network error occurred';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete file
  const deleteFile = async (fileUrl: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await creatorApi.deleteFile(fileUrl);
      
      if (response.success) {
        toast.success('File deleted successfully!');
        return true;
      } else {
        const errorMsg = response.error || 'Failed to delete file';
        setError(errorMsg);
        toast.error(errorMsg);
        return false;
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Network error occurred';
      setError(errorMsg);
      toast.error(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get presigned URL for file access
  const getPresignedUrl = async (fileUrl: string) => {
    try {
      const response = await creatorApi.getPresignedUrl(fileUrl);
      
      if (response.success && response.data) {
        return response.data.presignedUrl;
      } else {
        throw new Error(response.error || 'Failed to get file access URL');
      }
    } catch (err: any) {
      console.error('Error getting presigned URL:', err);
      toast.error('Failed to access file');
      throw err;
    }
  };

  // Initialize by fetching status
  useEffect(() => {
    fetchStatus();
  }, []);

  return {
    application,
    status,
    loading,
    error,
    fetchStatus,
    fetchApplication,
    createApplication,
    updateApplication,
    uploadFile,
    deleteFile,
    getPresignedUrl,
  };
};