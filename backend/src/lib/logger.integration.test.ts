import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { logger } from './logger';

describe('Logger Integration', () => {
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;
  let consoleInfoSpy: any;

  beforeEach(() => {
    consoleErrorSpy = mock(() => {});
    consoleWarnSpy = mock(() => {});
    consoleInfoSpy = mock(() => {});

    console.error = consoleErrorSpy;
    console.warn = consoleWarnSpy;
    console.info = consoleInfoSpy;
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore?.();
    consoleWarnSpy.mockRestore?.();
    consoleInfoSpy.mockRestore?.();
  });

  it('should log admin actions with all required context', () => {
    // Simulate an admin action
    logger.adminAction(
      'user_ban',
      'admin-123',
      'admin@example.com',
      'user',
      'user-456',
      {
        reason: 'Terms violation',
        duration: 'permanent',
      }
    );

    expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
    const logEntry = JSON.parse(consoleInfoSpy.mock.calls[0][0]);

    // Verify all required fields are present
    expect(logEntry.timestamp).toBeDefined();
    expect(logEntry.level).toBe('info');
    expect(logEntry.message).toBe('Admin action: user_ban');
    expect(logEntry.context.adminId).toBe('admin-123');
    expect(logEntry.context.adminEmail).toBe('admin@example.com');
    expect(logEntry.context.action).toBe('user_ban');
    expect(logEntry.context.targetType).toBe('user');
    expect(logEntry.context.targetId).toBe('user-456');
    expect(logEntry.context.reason).toBe('Terms violation');
    expect(logEntry.context.duration).toBe('permanent');
  });

  it('should log authentication failures with security context', () => {
    logger.authFailure('hacker@example.com', '192.168.1.100', 'Invalid credentials');

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    const logEntry = JSON.parse(consoleWarnSpy.mock.calls[0][0]);

    expect(logEntry.level).toBe('warn');
    expect(logEntry.message).toBe('Authentication failure');
    expect(logEntry.context.email).toBe('hacker@example.com');
    expect(logEntry.context.ip).toBe('192.168.1.100');
    expect(logEntry.context.reason).toBe('Invalid credentials');
    expect(logEntry.context.type).toBe('auth_failure');
  });

  it('should log authorization failures with route context', () => {
    logger.authzFailure(
      'admin-123',
      '/api/admin/settings',
      'Insufficient permissions',
      '192.168.1.50'
    );

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    const logEntry = JSON.parse(consoleWarnSpy.mock.calls[0][0]);

    expect(logEntry.level).toBe('warn');
    expect(logEntry.message).toBe('Authorization failure');
    expect(logEntry.context.adminId).toBe('admin-123');
    expect(logEntry.context.route).toBe('/api/admin/settings');
    expect(logEntry.context.reason).toBe('Insufficient permissions');
    expect(logEntry.context.ip).toBe('192.168.1.50');
    expect(logEntry.context.type).toBe('authz_failure');
  });

  it('should log API errors with full stack traces', () => {
    const error = new Error('Database connection failed');
    error.stack = 'Error: Database connection failed\n    at test.ts:10:15';

    logger.apiError('API request failed', error, {
      path: '/api/admin/users',
      method: 'GET',
      adminId: 'admin-123',
      ip: '192.168.1.1',
    });

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const logEntry = JSON.parse(consoleErrorSpy.mock.calls[0][0]);

    expect(logEntry.level).toBe('error');
    expect(logEntry.message).toBe('API request failed');
    expect(logEntry.context.path).toBe('/api/admin/users');
    expect(logEntry.context.method).toBe('GET');
    expect(logEntry.context.adminId).toBe('admin-123');
    expect(logEntry.context.ip).toBe('192.168.1.1');
    expect(logEntry.error.message).toBe('Database connection failed');
    expect(logEntry.error.stack).toContain('Database connection failed');
  });

  it('should handle multiple log entries in sequence', () => {
    // Simulate a sequence of events
    logger.info('Admin logged in', { adminId: 'admin-123' });
    logger.adminAction('user_freeze', 'admin-123', 'admin@example.com', 'user', 'user-456', {
      reason: 'Suspicious activity',
    });
    logger.warn('Rate limit warning', { ip: '192.168.1.1', count: 95 });

    expect(consoleInfoSpy).toHaveBeenCalledTimes(2);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);

    // Verify first log
    const firstLog = JSON.parse(consoleInfoSpy.mock.calls[0][0]);
    expect(firstLog.message).toBe('Admin logged in');

    // Verify second log
    const secondLog = JSON.parse(consoleInfoSpy.mock.calls[1][0]);
    expect(secondLog.message).toBe('Admin action: user_freeze');

    // Verify third log
    const thirdLog = JSON.parse(consoleWarnSpy.mock.calls[0][0]);
    expect(thirdLog.message).toBe('Rate limit warning');
  });
});
