/**
 * Structured logging utility for the admin backend
 * Provides log levels: error, warn, info, debug
 * Logs include timestamps, context, and structured data
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LogContext {
  adminId?: string;
  adminEmail?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  ip?: string;
  userAgent?: string;
  requestId?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
}

class Logger {
  private minLevel: LogLevel;

  constructor() {
    // Set minimum log level based on environment
    const envLevel = process.env['LOG_LEVEL']?.toLowerCase();
    this.minLevel = this.parseLogLevel(envLevel) || LogLevel.INFO;
  }

  private parseLogLevel(level?: string): LogLevel | null {
    switch (level) {
      case 'error':
        return LogLevel.ERROR;
      case 'warn':
        return LogLevel.WARN;
      case 'info':
        return LogLevel.INFO;
      case 'debug':
        return LogLevel.DEBUG;
      default:
        return null;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentLevelIndex = levels.indexOf(this.minLevel);
    const requestedLevelIndex = levels.indexOf(level);
    return requestedLevelIndex <= currentLevelIndex;
  }

  private formatLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (context && Object.keys(context).length > 0) {
      entry.context = context;
    }

    if (error) {
      entry.error = {
        message: error.message,
        name: error.name,
        stack: error.stack,
      };
    }

    return entry;
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = this.formatLogEntry(level, message, context, error);

    // Output to console with appropriate method
    switch (level) {
      case LogLevel.ERROR:
        console.error(JSON.stringify(entry));
        break;
      case LogLevel.WARN:
        console.warn(JSON.stringify(entry));
        break;
      case LogLevel.INFO:
        console.info(JSON.stringify(entry));
        break;
      case LogLevel.DEBUG:
        console.debug(JSON.stringify(entry));
        break;
    }
  }

  /**
   * Log an error message with optional context and error object
   * Use for critical errors that require immediate attention
   */
  error(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Log a warning message with optional context
   * Use for potentially problematic situations that don't prevent operation
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log an informational message with optional context
   * Use for significant events like admin actions
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log a debug message with optional context
   * Use for detailed diagnostic information
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log an admin action with full context
   * Automatically includes action, target, and admin details
   */
  adminAction(
    action: string,
    adminId: string,
    adminEmail: string,
    targetType: string,
    targetId: string,
    metadata?: Record<string, any>
  ): void {
    this.info(`Admin action: ${action}`, {
      adminId,
      adminEmail,
      action,
      targetType,
      targetId,
      ...metadata,
    });
  }

  /**
   * Log an authentication failure
   * Includes attempted email and IP address for security monitoring
   */
  authFailure(email: string, ip: string, reason: string): void {
    this.warn('Authentication failure', {
      email,
      ip,
      reason,
      type: 'auth_failure',
    });
  }

  /**
   * Log an authorization failure
   * Includes admin ID, attempted route, and reason
   */
  authzFailure(adminId: string, route: string, reason: string, ip?: string): void {
    this.warn('Authorization failure', {
      adminId,
      route,
      reason,
      ip,
      type: 'authz_failure',
    });
  }

  /**
   * Log an API error with full context
   * Includes error details, stack trace, and request context
   */
  apiError(
    message: string,
    error: Error,
    context?: LogContext
  ): void {
    this.error(message, context, error);
  }
}

// Export singleton instance
export const logger = new Logger();
