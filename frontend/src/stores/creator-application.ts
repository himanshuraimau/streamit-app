import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { creatorApi, type CreateApplicationRequest, type FullApplicationResponse, type ApplicationStatusResponse } from '@/lib/api/creator';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';

interface CreatorApplicationState {
  // State
  application: FullApplicationResponse | null;
  status: ApplicationStatusResponse | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  
  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setStatus: (status: ApplicationStatusResponse | null) => void;
  setApplication: (application: FullApplicationResponse | null) => void;
  setInitialized: (initialized: boolean) => void;
  
  // Async actions
  fetchStatus: () => Promise<void>;
  fetchApplication: () => Promise<void>;
  createApplication: (data: CreateApplicationRequest) => Promise<FullApplicationResponse>;
  updateApplication: (data: Partial<CreateApplicationRequest>) => Promise<FullApplicationResponse>;
  uploadFile: (file: File, purpose?: string) => Promise<{ url: string; key: string }>;
  deleteFile: (fileUrl: string) => Promise<boolean>;
  getPresignedUrl: (fileUrl: string) => Promise<string>;
  
  // Reset
  reset: () => void;
}

let abortController: AbortController | null = null;

export const useCreatorApplicationStore = create<CreatorApplicationState>()(
  devtools(
    (set, get) => ({
      // Initial state
      application: null,
      status: null,
      loading: false,
      error: null,
      initialized: false,

      // Sync actions
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setStatus: (status) => set({ status }),
      setApplication: (application) => set({ application }),
      setInitialized: (initialized) => set({ initialized }),

      // Fetch application status
      fetchStatus: async () => {
        const { loading } = get();
        
        // Prevent multiple simultaneous calls
        if (loading) return;
        
        try {
          // Check if user is authenticated first
          const session = await authClient.getSession();
          if (!session?.data?.user) {
            // User not logged in - silently skip
            set({ status: null, error: null, initialized: true, loading: false });
            return;
          }
          
          // Cancel any ongoing request
          if (abortController) {
            abortController.abort();
          }
          
          abortController = new AbortController();
          set({ loading: true, error: null });
          
          const response = await creatorApi.getApplicationStatus();
          
          if (response.success && response.data) {
            set({ status: response.data });
          } else {
            set({ error: response.error || 'Failed to fetch application status' });
          }
        } catch (err) {
          // Don't set error if request was aborted
          if (err instanceof Error && err.name !== 'AbortError') {
            set({ error: 'Network error occurred' });
            console.error('Error fetching status:', err);
          }
        } finally {
          set({ loading: false, initialized: true });
        }
      },

      // Fetch full application
      fetchApplication: async () => {
        try {
          set({ loading: true, error: null });
          const response = await creatorApi.getApplication();
          
          if (response.success && response.data) {
            set({ application: response.data });
          } else {
            set({ error: response.error || 'Failed to fetch application' });
          }
        } catch (err) {
          set({ error: 'Network error occurred' });
          console.error('Error fetching application:', err);
        } finally {
          set({ loading: false });
        }
      },

      // Create new application
      createApplication: async (data: CreateApplicationRequest) => {
        try {
          set({ loading: true, error: null });
          const response = await creatorApi.createApplication(data);
          
          if (response.success && response.data) {
            set({ 
              application: response.data,
              status: {
                hasApplication: true,
                id: response.data.id,
                status: response.data.status,
                submittedAt: response.data.submittedAt || undefined,
                reviewedAt: response.data.reviewedAt || undefined,
                rejectionReason: response.data.rejectionReason || undefined,
                createdAt: response.data.createdAt,
                updatedAt: response.data.updatedAt,
              }
            });
            toast.success(response.message || 'Application submitted successfully!');
            return response.data;
          } else {
            const errorMsg = response.error || 'Failed to create application';
            set({ error: errorMsg });
            toast.error(errorMsg);
            throw new Error(errorMsg);
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Network error occurred';
          set({ error: errorMsg });
          toast.error(errorMsg);
          throw err;
        } finally {
          set({ loading: false });
        }
      },

      // Update existing application
      updateApplication: async (data: Partial<CreateApplicationRequest>) => {
        try {
          set({ loading: true, error: null });
          const response = await creatorApi.updateApplication(data);
          
          if (response.success && response.data) {
            set({ application: response.data });
            toast.success(response.message || 'Application updated successfully!');
            return response.data;
          } else {
            const errorMsg = response.error || 'Failed to update application';
            set({ error: errorMsg });
            toast.error(errorMsg);
            throw new Error(errorMsg);
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Network error occurred';
          set({ error: errorMsg });
          toast.error(errorMsg);
          throw err;
        } finally {
          set({ loading: false });
        }
      },

      // Upload file
      uploadFile: async (file: File, purpose?: string) => {
        try {
          set({ loading: true, error: null });
          const response = await creatorApi.uploadFile(file, purpose);
          
          if (response.success && response.data) {
            toast.success('File uploaded successfully!');
            return response.data;
          } else {
            const errorMsg = response.error || 'Failed to upload file';
            set({ error: errorMsg });
            toast.error(errorMsg);
            throw new Error(errorMsg);
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Network error occurred';
          set({ error: errorMsg });
          toast.error(errorMsg);
          throw err;
        } finally {
          set({ loading: false });
        }
      },

      // Delete file
      deleteFile: async (fileUrl: string) => {
        try {
          set({ loading: true, error: null });
          const response = await creatorApi.deleteFile(fileUrl);
          
          if (response.success) {
            toast.success('File deleted successfully!');
            return true;
          } else {
            const errorMsg = response.error || 'Failed to delete file';
            set({ error: errorMsg });
            toast.error(errorMsg);
            return false;
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Network error occurred';
          set({ error: errorMsg });
          toast.error(errorMsg);
          return false;
        } finally {
          set({ loading: false });
        }
      },

      // Get presigned URL for file access
      getPresignedUrl: async (fileUrl: string) => {
        try {
          const response = await creatorApi.getPresignedUrl(fileUrl);
          
          if (response.success && response.data) {
            return response.data.presignedUrl;
          } else {
            throw new Error(response.error || 'Failed to get file access URL');
          }
        } catch (err) {
          console.error('Error getting presigned URL:', err);
          toast.error('Failed to access file');
          throw err;
        }
      },

      // Reset store
      reset: () => set({
        application: null,
        status: null,
        loading: false,
        error: null,
        initialized: false,
      }),
    }),
    {
      name: 'creator-application-store',
    }
  )
);

// Custom hook that initializes the store
export const useCreatorApplication = () => {
  const store = useCreatorApplicationStore();
  
  // Initialize on first use - only if we haven't tried yet
  // The fetchStatus will handle auth check internally
  if (!store.initialized && !store.loading) {
    store.fetchStatus();
  }
  
  return store;
};