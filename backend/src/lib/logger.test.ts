import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { logger, LogLevel } from './logger';

describe('Logger', () => {
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;
  let consoleInfoSpy: any;
  let consoleDebugSpy: any;

  beforeEach(() => {
    // Spy on console methods
    consoleErrorSpy = mock(() => {});
    consoleWarnSpy = mock(() => {});
    consoleInfoSpy = mock(() => {});
    consoleDebugSpy = mock(() => {});

    console.error = consoleErrorSpy;
    console.warn = consoleWarnSpy;
    console.info = consoleInfoSpy;
    console.debug = consoleDebugSpy;
  });

  afterEach(() => {
    // Restore console methods
    consoleErrorSpy.mockRestore?.();
    consoleWarnSpy.mockRestore?.();
    consoleInfoSpy.mockRestore?.();
    consoleDebugSpy.mockRestore?.();
  });

  describe('error', () => {
    it('should log error messages with context', () => {
      const message = 'Test error message';
      const context = { adminId: 'admin123', action: 'test_action' };
      const error = new Error('Test error');

      logger.error(message, context, error);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);

      expect(loggedData.level).toBe(LogLevel.ERROR);
      expect(loggedData.message).toBe(message);
      expect(loggedData.context).toEqual(context);
      expect(loggedData.error.message).toBe('Test error');
      expect(loggedData.timestamp).toBeDefined();
    });
  });

  describe('warn', () => {
    it('should log warning messages with context', () => {
      const message = 'Test warning';
      const context = { ip: '127.0.0.1', email: 'test@example.com' };

      logger.warn(message, context);

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse(consoleWarnSpy.mock.calls[0][0]);

      expect(loggedData.level).toBe(LogLevel.WARN);
      expect(loggedData.message).toBe(message);
      expect(loggedData.context).toEqual(context);
    });
  });

  describe('info', () => {
    it('should log info messages with context', () => {
      const message = 'Test info';
      const context = { action: 'user_ban', targetId: 'user123' };

      logger.info(message, context);

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse(consoleInfoSpy.mock.calls[0][0]);

      expect(loggedData.level).toBe(LogLevel.INFO);
      expect(loggedData.message).toBe(message);
      expect(loggedData.context).toEqual(context);
    });
  });

  describe('adminAction', () => {
    it('should log admin actions with full context', () => {
      logger.adminAction('user_ban', 'admin123', 'admin@example.com', 'user', 'user456', {
        reason: 'Violation',
      });

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse(consoleInfoSpy.mock.calls[0][0]);

      expect(loggedData.level).toBe(LogLevel.INFO);
      expect(loggedData.message).toBe('Admin action: user_ban');
      expect(loggedData.context.adminId).toBe('admin123');
      expect(loggedData.context.adminEmail).toBe('admin@example.com');
      expect(loggedData.context.action).toBe('user_ban');
      expect(loggedData.context.targetType).toBe('user');
      expect(loggedData.context.targetId).toBe('user456');
      expect(loggedData.context.reason).toBe('Violation');
    });
  });

  describe('authFailure', () => {
    it('should log authentication failures', () => {
      logger.authFailure('test@example.com', '127.0.0.1', 'Invalid password');

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse(consoleWarnSpy.mock.calls[0][0]);

      expect(loggedData.level).toBe(LogLevel.WARN);
      expect(loggedData.message).toBe('Authentication failure');
      expect(loggedData.context.email).toBe('test@example.com');
      expect(loggedData.context.ip).toBe('127.0.0.1');
      expect(loggedData.context.reason).toBe('Invalid password');
      expect(loggedData.context.type).toBe('auth_failure');
    });
  });

  describe('authzFailure', () => {
    it('should log authorization failures', () => {
      logger.authzFailure(
        'admin123',
        '/api/admin/settings',
        'Insufficient permissions',
        '127.0.0.1'
      );

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse(consoleWarnSpy.mock.calls[0][0]);

      expect(loggedData.level).toBe(LogLevel.WARN);
      expect(loggedData.message).toBe('Authorization failure');
      expect(loggedData.context.adminId).toBe('admin123');
      expect(loggedData.context.route).toBe('/api/admin/settings');
      expect(loggedData.context.reason).toBe('Insufficient permissions');
      expect(loggedData.context.ip).toBe('127.0.0.1');
      expect(loggedData.context.type).toBe('authz_failure');
    });
  });

  describe('apiError', () => {
    it('should log API errors with full context and stack trace', () => {
      const error = new Error('Database connection failed');
      const context = {
        path: '/api/admin/users',
        method: 'GET',
        adminId: 'admin123',
      };

      logger.apiError('API error occurred', error, context);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);

      expect(loggedData.level).toBe(LogLevel.ERROR);
      expect(loggedData.message).toBe('API error occurred');
      expect(loggedData.context).toEqual(context);
      expect(loggedData.error.message).toBe('Database connection failed');
      expect(loggedData.error.stack).toBeDefined();
    });
  });
});
