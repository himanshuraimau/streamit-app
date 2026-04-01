import { describe, it, expect } from 'bun:test';
import healthRouter from './health.route';

/**
 * Integration tests for health check router
 * 
 * These tests verify that:
 * 1. Health check route is properly registered
 * 2. Route is accessible through the router
 * 
 * Requirements: 28.3, 28.4
 */

describe('Health Check Router', () => {
  it('should have health router exported', () => {
    expect(healthRouter).toBeDefined();
    expect(typeof healthRouter).toBe('function'); // Express Router is a function
  });

  it('should have router stack defined with routes', () => {
    expect(healthRouter.stack).toBeDefined();
    expect(healthRouter.stack.length).toBeGreaterThan(0);
  });

  it('should have health check route registered at root path', () => {
    const healthRoute = healthRouter.stack.find(
      (layer: any) => layer.route?.path === '/'
    );
    expect(healthRoute).toBeDefined();
    expect(healthRoute.route.methods.get).toBe(true);
  });
});
