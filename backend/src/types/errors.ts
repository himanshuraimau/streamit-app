/**
 * Standardized error response interface for all API endpoints
 */
export interface ErrorResponse {
  error: string;
  code?: string;
  details?: Array<{ field: string; message: string }>;
  timestamp?: string;
}

/**
 * Common error codes used across the application
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
 * User-friendly error messages
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password. Please try again.',
  [ErrorCode.EMAIL_NOT_VERIFIED]: 'Please verify your email address before signing in.',
  [ErrorCode.INVALID_OTP]: 'Invalid verification code. Please check and try again.',
  [ErrorCode.OTP_EXPIRED]: 'Verification code has expired. Please request a new one.',
  [ErrorCode.TOO_MANY_ATTEMPTS]: 'Too many attempts. Please try again later.',
  
  [ErrorCode.USER_NOT_FOUND]: 'User not found. Please check your email or sign up.',
  [ErrorCode.USER_ALREADY_EXISTS]: 'An account with this email already exists.',
  [ErrorCode.DUPLICATE_EMAIL]: 'This email is already registered.',
  [ErrorCode.DUPLICATE_USERNAME]: 'This username is already taken.',
  
  [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ErrorCode.INVALID_EMAIL]: 'Please enter a valid email address.',
  [ErrorCode.WEAK_PASSWORD]: 'Password must be at least 8 characters long.',
  
  [ErrorCode.UNAUTHORIZED]: 'You must be signed in to access this resource.',
  [ErrorCode.FORBIDDEN]: 'You do not have permission to access this resource.',
  [ErrorCode.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCode.SERVER_ERROR]: 'An unexpected error occurred. Please try again later.',
  [ErrorCode.EMAIL_SEND_FAILED]: 'Failed to send email. Please try again.',
};

/**
 * Helper function to create standardized error responses
 */
export function createErrorResponse(
  message: string,
  code?: ErrorCode,
  details?: Array<{ field: string; message: string }>
): ErrorResponse {
  return {
    error: message,
    code,
    details,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Helper function to safely parse status code to number
 */
function getStatusCode(error: any): number {
  const status = error?.status || error?.statusCode;
  
  // If status is already a number, return it
  if (typeof status === 'number') {
    return status;
  }
  
  // If status is a string, try to convert or map it
  if (typeof status === 'string') {
    const numStatus = parseInt(status, 10);
    if (!isNaN(numStatus)) {
      return numStatus;
    }
    
    // Map common string status codes to numbers
    const statusMap: Record<string, number> = {
      'BAD_REQUEST': 400,
      'UNAUTHORIZED': 401,
      'FORBIDDEN': 403,
      'NOT_FOUND': 404,
      'INTERNAL_SERVER_ERROR': 500,
    };
    
    return statusMap[status] || 500;
  }
  
  return 500;
}

/**
 * Helper function to get HTTP status code from error (exported for use in controllers)
 */
export function getHttpStatusCode(error: any, defaultStatus: number = 500): number {
  return getStatusCode(error) || defaultStatus;
}

/**
 * Parse Better Auth errors into standardized format
 */
export function parseBetterAuthError(error: any): ErrorResponse {
  // Better Auth error structure
  const message = error?.message || error?.error?.message || 'An error occurred';
  const statusCode = getStatusCode(error);
  
  // Map common Better Auth errors to our error codes
  let code: ErrorCode | undefined;
  
  if (message.toLowerCase().includes('user not found') || 
      message.toLowerCase().includes('invalid credentials')) {
    code = ErrorCode.INVALID_CREDENTIALS;
  } else if (message.toLowerCase().includes('email not verified')) {
    code = ErrorCode.EMAIL_NOT_VERIFIED;
  } else if (message.toLowerCase().includes('invalid otp') || 
             message.toLowerCase().includes('incorrect otp')) {
    code = ErrorCode.INVALID_OTP;
  } else if (message.toLowerCase().includes('expired')) {
    code = ErrorCode.OTP_EXPIRED;
  } else if (message.toLowerCase().includes('too many') || 
             error?.code === 'TOO_MANY_ATTEMPTS') {
    code = ErrorCode.TOO_MANY_ATTEMPTS;
  } else if (message.toLowerCase().includes('already exists') || 
             message.toLowerCase().includes('duplicate')) {
    if (message.toLowerCase().includes('username')) {
      code = ErrorCode.DUPLICATE_USERNAME;
    } else {
      code = ErrorCode.DUPLICATE_EMAIL;
    }
  } else if (statusCode === 401) {
    code = ErrorCode.UNAUTHORIZED;
  } else if (statusCode === 403) {
    code = ErrorCode.FORBIDDEN;
  } else if (statusCode === 404) {
    code = ErrorCode.NOT_FOUND;
  } else if (statusCode >= 500) {
    code = ErrorCode.SERVER_ERROR;
  }
  
  return createErrorResponse(
    code ? ErrorMessages[code] : message,
    code
  );
}
