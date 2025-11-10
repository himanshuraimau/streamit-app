/**
 * API Client with automatic Bearer token handling
 * This wrapper adds Authorization headers to all fetch requests automatically
 * Works on Safari and all browsers by using localStorage instead of cookies
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean; // Skip adding auth token for public endpoints
}

/**
 * Enhanced fetch wrapper that automatically adds Bearer token
 * @param url - Full URL or path (will be prefixed with API_BASE_URL if relative)
 * @param options - Fetch options with optional skipAuth flag
 */
export async function apiFetch(url: string, options: FetchOptions = {}): Promise<Response> {
  const { skipAuth = false, ...fetchOptions } = options;
  
  // Build full URL if relative path provided
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  // Get token from localStorage
  const token = localStorage.getItem('better_auth_token');
  
  // Prepare headers
  const headers = new Headers(fetchOptions.headers);
  
  // Add Bearer token if available and not skipped
  if (token && !skipAuth) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Add ngrok header to bypass browser warning
  if (fullUrl.includes('ngrok')) {
    headers.set('ngrok-skip-browser-warning', 'true');
  }
  
  // Always include credentials for cookie fallback
  const finalOptions: RequestInit = {
    ...fetchOptions,
    headers,
    credentials: fetchOptions.credentials || 'include',
  };
  
  try {
    const response = await fetch(fullUrl, finalOptions);
    
    // Store token from response header if present
    const authToken = response.headers.get('set-auth-token');
    if (authToken) {
      localStorage.setItem('better_auth_token', authToken);
      console.log('✅ Bearer token updated from response');
    }
    
    // Clear token on 401 Unauthorized
    if (response.status === 401) {
      localStorage.removeItem('better_auth_token');
      console.log('🔒 Token cleared due to 401 error');
      
      // Optionally redirect to login (uncomment if needed)
      // if (window.location.pathname !== '/login') {
      //   window.location.href = '/login';
      // }
    }
    
    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * Helper function to make GET requests
 */
export async function apiGet<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const response = await apiFetch(url, { ...options, method: 'GET' });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Helper function to make POST requests
 */
export async function apiPost<T>(url: string, data?: unknown, options: FetchOptions = {}): Promise<T> {
  const response = await apiFetch(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Helper function to make PUT requests
 */
export async function apiPut<T>(url: string, data?: unknown, options: FetchOptions = {}): Promise<T> {
  const response = await apiFetch(url, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Helper function to make DELETE requests
 */
export async function apiDelete<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const response = await apiFetch(url, { ...options, method: 'DELETE' });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Helper function to check if user has valid token
 */
export function hasAuthToken(): boolean {
  return !!localStorage.getItem('better_auth_token');
}

/**
 * Helper function to manually clear auth token
 */
export function clearAuthToken(): void {
  localStorage.removeItem('better_auth_token');
  console.log('🔒 Auth token cleared manually');
}

/**
 * Helper function to manually set auth token
 */
export function setAuthToken(token: string): void {
  localStorage.setItem('better_auth_token', token);
  console.log('✅ Auth token set manually');
}

export default apiFetch;
