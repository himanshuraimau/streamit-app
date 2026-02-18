import {
  type ErrorResponse,
  ErrorCode,
  ErrorMessages,
  createErrorResponse,
} from '../types/errors.types';

/**
 * Helper function to safely parse a status code from an unknown error value.
 */
function getStatusCode(error: unknown): number {
  if (typeof error !== 'object' || error === null) return 500;

  const err = error as Record<string, unknown>;
  const status = err['status'] ?? err['statusCode'];

  if (typeof status === 'number') return status;

  if (typeof status === 'string') {
    const numStatus = parseInt(status, 10);
    if (!isNaN(numStatus)) return numStatus;

    const statusMap: Record<string, number> = {
      BAD_REQUEST: 400,
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      INTERNAL_SERVER_ERROR: 500,
    };
    return statusMap[status] ?? 500;
  }

  return 500;
}

/**
 * Get the HTTP status code from an unknown error value.
 */
export function getHttpStatusCode(error: unknown, defaultStatus: number = 500): number {
  return getStatusCode(error) || defaultStatus;
}

/**
 * Parse Better Auth errors into a standardized ErrorResponse.
 */
export function parseBetterAuthError(error: unknown): ErrorResponse {
  if (typeof error !== 'object' || error === null) {
    return createErrorResponse('An error occurred', ErrorCode.SERVER_ERROR);
  }

  const err = error as Record<string, unknown>;
  const nested = err['error'] as Record<string, unknown> | undefined;
  const message =
    (typeof err['message'] === 'string' ? err['message'] : undefined) ??
    (typeof nested?.['message'] === 'string' ? nested['message'] : undefined) ??
    'An error occurred';

  const statusCode = getStatusCode(error);
  const lc = message.toLowerCase();

  let code: ErrorCode | undefined;

  if (lc.includes('user not found') || lc.includes('invalid credentials')) {
    code = ErrorCode.INVALID_CREDENTIALS;
  } else if (lc.includes('email not verified')) {
    code = ErrorCode.EMAIL_NOT_VERIFIED;
  } else if (lc.includes('invalid otp') || lc.includes('incorrect otp')) {
    code = ErrorCode.INVALID_OTP;
  } else if (lc.includes('expired')) {
    code = ErrorCode.OTP_EXPIRED;
  } else if (lc.includes('too many') || err['code'] === 'TOO_MANY_ATTEMPTS') {
    code = ErrorCode.TOO_MANY_ATTEMPTS;
  } else if (lc.includes('already exists') || lc.includes('duplicate')) {
    code = lc.includes('username') ? ErrorCode.DUPLICATE_USERNAME : ErrorCode.DUPLICATE_EMAIL;
  } else if (statusCode === 401) {
    code = ErrorCode.UNAUTHORIZED;
  } else if (statusCode === 403) {
    code = ErrorCode.FORBIDDEN;
  } else if (statusCode === 404) {
    code = ErrorCode.NOT_FOUND;
  } else if (statusCode >= 500) {
    code = ErrorCode.SERVER_ERROR;
  }

  return createErrorResponse(code ? ErrorMessages[code] : message, code);
}
