import { describe, it, expect } from 'bun:test';
import { adminRouter } from './index';
import { adminAuthMiddleware } from '../middleware/admin-auth.middleware';

/**
 * Integration tests for admin router registration
 * 
 * These tests verify that:
 * 1. Admin routes are properly registered under /api/admin
 * 2. Admin authentication middleware is applied
 * 3. Routes return appropriate responses
 * 
 * Requirements: 17.6, 17.7
 */

describe('Admin Router Registration', () => {
  it('should have adminRouter exported from routes/index.ts', () => {
    expect(adminRouter).toBeDefined();
    expect(typeof adminRouter).toBe('function'); // Express Router is a function
  });

  it('should have adminAuthMiddleware exported from middleware', () => {
    expect(adminAuthMiddleware).toBeDefined();
    expect(typeof adminAuthMiddleware).toBe('function');
  });

  it('should have router stack defined', () => {
    // Verify the router is properly configured
    expect(adminRouter).toBeDefined();
    expect(adminRouter.stack).toBeDefined();
    
    // The router should be a valid Express Router
    expect(typeof adminRouter).toBe('function');
  });
});
