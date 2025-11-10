/**
 * Standardized error response interface matching backend
 */
export interface ErrorResponse {
  error: string;
  code?: string;
  details?: Array<{ field: string; message: string }>;
  timestamp?: string;
}

/**
 * Error codes from backend
 */
export enum ErrorCode {
  // Authentication errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  INVALID_OTP = 'INVALID_OTP',
  OTP_EXPIRED = 'OTP_EXPIRED',
  TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS',
  
  // User errors
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  DUPLICATE_EMAIL = 'DUPLICATE_EMAIL',
  DUPLICATE_USERNAME = 'DUPLICATE_USERNAME',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_EMAIL = 'INVALID_EMAIL',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  
  // General errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  EMAIL_SEND_FAILED = 'EMAIL_SEND_FAILED',
}

/**
 * Parse error response from API
 * Handles various error formats and ensures consistent structure
 */
export function parseErrorResponse(error: unknown): ErrorResponse {
  // Handle null/undefined
  if (!error) {
    return {
      error: 'An unexpected error occurred. Please try again.',
      code: ErrorCode.SERVER_ERROR,
    };
  }
  
  // If error is already in our format
  if (error && typeof error === 'object' && 'error' in error && typeof error.error === 'string') {
    return {
      error: error.error,
      code: 'code' in error && typeof error.code === 'string' ? error.code : undefined,
      details: 'details' in error && Array.isArray(error.details) ? error.details : undefined,
      timestamp: 'timestamp' in error && typeof error.timestamp === 'string' ? error.timestamp : undefined,
    };
  }
  
  // Handle Better Auth error format (can be nested in different ways)
  if (error && typeof error === 'object') {
    // Check for error.error.message pattern (nested error)
    if ('error' in error && error.error && typeof error.error === 'object' && 'message' in error.error) {
      const nestedError = error.error as { message?: string; code?: string };
      return {
        error: typeof nestedError.message === 'string' ? nestedError.message : 'An error occurred',
        code: typeof nestedError.code === 'string' ? nestedError.code : undefined,
      };
    }
    
    // Check for direct message property
    if ('message' in error && typeof error.message === 'string') {
      return {
        error: error.message,
        code: 'code' in error && typeof error.code === 'string' ? error.code : undefined,
      };
    }
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return { error };
  }
  
  // Fallback for unknown error formats
  console.error('❌ Unhandled error format:', error);
  return {
    error: 'An unexpected error occurred. Please try again.',
    code: ErrorCode.SERVER_ERROR,
  };
}

/**
 * Extract error message from any error format
 * Ensures we always have a user-friendly message to display
 */
export function getErrorMessage(error: unknown): string {
  // Handle null/undefined
  if (!error) {
    return 'An unexpected error occurred. Please try again.';
  }
  
  // Direct string
  if (typeof error === 'string') {
    return error;
  }
  
  if (typeof error !== 'object') {
    return 'An unexpected error occurred. Please try again.';
  }
  
  // Check various error properties with multiple levels of nesting
  let message: unknown;
  
  // Try error.error.message (nested error object)
  if ('error' in error && error.error && typeof error.error === 'object') {
    if ('message' in error.error) {
      message = error.error.message;
    } else if (typeof error.error === 'string') {
      message = error.error;
    }
  }
  
  // Try error.message
  if (!message && 'message' in error) {
    message = error.message;
  }
  
  // Try error.error (if it's a string)
  if (!message && 'error' in error && typeof error.error === 'string') {
    message = error.error;
  }
  
  // Try other common properties
  if (!message && 'msg' in error) {
    message = error.msg;
  }
  
  if (!message && 'description' in error) {
    message = error.description;
  }
  
  if (typeof message === 'string' && message.length > 0) {
    return message;
  }
  
  // Handle validation errors with details
  if ('details' in error && Array.isArray(error.details) && error.details.length > 0) {
    return error.details
      .map((d: { message?: string; msg?: string }) => d.message || d.msg || '')
      .filter(Boolean)
      .join(', ');
  }
  
  // Log unhandled format for debugging
  console.error('❌ Could not extract error message from:', error);
  
  // Fallback
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Parse API response and handle errors
 * Use this in fetch calls to standardize error handling
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  // Handle non-OK responses
  if (!response.ok) {
    let errorData: unknown;
    
    try {
      errorData = await response.json();
    } catch {
      // If JSON parsing fails, create generic error
      throw {
        error: `Request failed with status ${response.status}`,
        code: response.status >= 500 ? ErrorCode.SERVER_ERROR : ErrorCode.VALIDATION_ERROR,
      };
    }
    
    // Parse and throw structured error
    throw parseErrorResponse(errorData);
  }
  
  // Parse successful response
  try {
    return await response.json();
  } catch {
    throw {
      error: 'Failed to parse server response',
      code: ErrorCode.SERVER_ERROR,
    };
  }
}

/**
 * Format error message for toast notifications
 * Returns an object with title and description
 */
export function formatErrorForToast(error: unknown): { title: string; description: string } {
  console.log('🔍 Formatting error for toast:', error);
  
  const errorMessage = getErrorMessage(error);
  const errorCode = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
  
  console.log('📝 Extracted message:', errorMessage, 'Code:', errorCode);
  
  // Provide more context based on error code
  let title = 'Error';
  
  switch (errorCode) {
    case ErrorCode.INVALID_CREDENTIALS:
      title = 'Sign in failed';
      break;
    case ErrorCode.EMAIL_NOT_VERIFIED:
      title = 'Email not verified';
      break;
    case ErrorCode.INVALID_OTP:
    case ErrorCode.OTP_EXPIRED:
      title = 'Invalid code';
      break;
    case ErrorCode.TOO_MANY_ATTEMPTS:
      title = 'Too many attempts';
      break;
    case ErrorCode.DUPLICATE_EMAIL:
    case ErrorCode.DUPLICATE_USERNAME:
      title = 'Already exists';
      break;
    case ErrorCode.VALIDATION_ERROR:
      title = 'Validation error';
      break;
    case ErrorCode.SERVER_ERROR:
      title = 'Server error';
      break;
    default:
      // Extract meaningful title from error message
      if (errorMessage.toLowerCase().includes('sign in')) {
        title = 'Sign in failed';
      } else if (errorMessage.toLowerCase().includes('sign up')) {
        title = 'Sign up failed';
      } else if (errorMessage.toLowerCase().includes('verify')) {
        title = 'Verification failed';
      } else if (errorMessage.toLowerCase().includes('reset')) {
        title = 'Reset failed';
      }
  }
  
  const result = {
    title,
    description: errorMessage,
  };
  
  console.log('✅ Formatted toast:', result);
  
  return result;
}
