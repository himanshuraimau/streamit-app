import { authClient } from '@/lib/auth-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const session = await authClient.getSession();
  if (!session?.data?.session?.token) {
    // Don't use console.error here as it's expected for non-authenticated users
    throw new Error('No authentication token found');
  }
  
  return {
    'Authorization': `Bearer ${session.data.session.token}`,
    'Content-Type': 'application/json',
  };
};

// Helper function to get auth headers for file upload
const getAuthHeadersForUpload = async () => {
  const session = await authClient.getSession();
  if (!session?.data?.session?.token) {
    throw new Error('No authentication token found');
  }
  
  return {
    'Authorization': `Bearer ${session.data.session.token}`,
  };
};

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: unknown[];
}

export interface FileUploadResponse {
  id: string;
  url: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface ApplicationStatusResponse {
  hasApplication: boolean;
  id?: string;
  status?: string;
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FullApplicationResponse {
  id: string;
  userId: string;
  status: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  identity?: {
    id: string;
    idType: string;
    idDocumentUrl: string;
    selfiePhotoUrl: string;
    isVerified: boolean;
    verifiedAt: string | null;
  };
  financial?: {
    id: string;
    accountHolderName: string;
    accountNumber: string; // Masked
    ifscCode: string;
    panNumber: string; // Masked
    isVerified: boolean;
    verifiedAt: string | null;
  };
  profile?: {
    id: string;
    profilePictureUrl: string;
    bio: string;
    categories: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicationRequest {
  identity: {
    idType: 'AADHAAR' | 'PASSPORT' | 'DRIVERS_LICENSE';
    idDocumentUrl: string;
    selfiePhotoUrl: string;
  };
  financial: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    panNumber: string;
  };
  profile: {
    profilePictureUrl: string;
    categories: string[];
    bio: string;
  };
}

export interface FileStatsResponse {
  totalFiles: number;
  totalSize: number;
  totalSizeMB: number;
}

export const creatorApi = {
  // Get application status
  async getApplicationStatus(): Promise<ApiResponse<ApplicationStatusResponse>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/creator/application/status`, {
        method: 'GET',
        headers,
      });

      return await response.json();
    } catch (error) {
      // Don't log errors for missing auth tokens - this is handled by the caller
      if (error instanceof Error && !error.message.includes('No authentication token')) {
        console.error('Error fetching application status:', error);
      }
      throw error;
    }
  },

  // Get full application
  async getApplication(): Promise<ApiResponse<FullApplicationResponse>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/creator/application`, {
        method: 'GET',
        headers,
      });

      return await response.json();
    } catch (error) {
      console.error('Error fetching application:', error);
      throw error;
    }
  },

  // Create new application
  async createApplication(data: CreateApplicationRequest): Promise<ApiResponse<FullApplicationResponse>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/creator/application`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      return await response.json();
    } catch (error) {
      console.error('Error creating application:', error);
      throw error;
    }
  },

  // Update existing application
  async updateApplication(data: Partial<CreateApplicationRequest>): Promise<ApiResponse<FullApplicationResponse>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/creator/application`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });

      return await response.json();
    } catch (error) {
      console.error('Error updating application:', error);
      throw error;
    }
  },

  // Upload file
  async uploadFile(file: File, purpose?: string): Promise<ApiResponse<FileUploadResponse>> {
    try {
      const headers = await getAuthHeadersForUpload();
      const formData = new FormData();
      formData.append('file', file);
      if (purpose) {
        formData.append('purpose', purpose);
      }

      const response = await fetch(`${API_BASE_URL}/api/creator/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      return await response.json();
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  // Get presigned URL for secure file access
  async getPresignedUrl(fileUrl: string): Promise<ApiResponse<{ presignedUrl: string; expiresIn: number }>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/creator/presigned-url`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ fileUrl }),
      });

      return await response.json();
    } catch (error) {
      console.error('Error getting presigned URL:', error);
      throw error;
    }
  },

  // Delete file
  async deleteFile(fileUrl: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/creator/file`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ fileUrl }),
      });

      return await response.json();
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },

  // Get file statistics
  async getFileStats(): Promise<ApiResponse<FileStatsResponse>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/creator/files/stats`, {
        method: 'GET',
        headers,
      });

      return await response.json();
    } catch (error) {
      console.error('Error fetching file stats:', error);
      throw error;
    }
  },
};