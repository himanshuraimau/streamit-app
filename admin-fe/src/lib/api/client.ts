import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const adminClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
adminClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error: string; details?: object }>) => {
    const status = error.response?.status;
    const message = error.response?.data?.error || 'An error occurred';

    // Handle authentication errors
    if (status === 401) {
      toast.error('Session expired. Please login again.');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Handle authorization errors
    if (status === 403) {
      toast.error('You do not have permission to perform this action.');
      window.location.href = '/unauthorized';
      return Promise.reject(error);
    }

    // Handle not found errors
    if (status === 404) {
      toast.error('Resource not found');
      return Promise.reject(error);
    }

    // Handle validation errors
    if (status === 400) {
      toast.error(message);
      return Promise.reject(error);
    }

    // Handle server errors
    if (status === 500) {
      toast.error('Server error occurred. Please try again.');
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);
