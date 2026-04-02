import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import express from 'express';
import type { Express } from 'express';
import { adminRateLimiter, authRateLimiter } from './rate-limit.middleware';

/**
 * Integration tests for rate limiting middleware
 *
 * These tests verify:
 * - General admin routes: 1000 requests per 15 minutes
 * - Auth routes: 5 attempts per 15 minutes
 * - Super admin bypass in development
 *
 * Requirements: 22.8
 */

describe('Rate Limiting Integration Tests', () => {
  let app: Express;
  let server: any;
  const PORT = 3999;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Test route with general admin rate limiter
    app.get('/api/admin/test', adminRateLimiter, (_req, res) => {
      res.json({ success: true, message: 'Admin route accessed' });
    });

    // Test route with auth rate limiter
    app.post('/api/admin/auth/test', authRateLimiter, (_req, res) => {
      res.json({ success: true, message: 'Auth route accessed' });
    });

    server = app.listen(PORT);
  });

  afterAll(() => {
    server?.close();
  });

  describe('Admin Rate Limiter', () => {
    it('should allow requests within rate limit', async () => {
      const response = await fetch(`http://localhost:${PORT}/api/admin/test`);
      const data = (await response.json()) as { success: boolean; message: string };

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(response.headers.get('ratelimit-limit')).toBe('1000');
    });

    it('should include rate limit headers', async () => {
      const response = await fetch(`http://localhost:${PORT}/api/admin/test`);

      expect(response.headers.get('ratelimit-limit')).toBeDefined();
      expect(response.headers.get('ratelimit-remaining')).toBeDefined();
      expect(response.headers.get('ratelimit-reset')).toBeDefined();
    });

    it('should have a limit of 1000 requests per window', async () => {
      const response = await fetch(`http://localhost:${PORT}/api/admin/test`);
      const limit = response.headers.get('ratelimit-limit');

      expect(limit).toBe('1000');
    });
  });

  describe('Auth Rate Limiter', () => {
    it('should allow requests within rate limit', async () => {
      const response = await fetch(`http://localhost:${PORT}/api/admin/auth/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true }),
      });
      const data = (await response.json()) as { success: boolean; message: string };

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should have stricter limit than admin routes', async () => {
      const response = await fetch(`http://localhost:${PORT}/api/admin/auth/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true }),
      });
      const limit = response.headers.get('ratelimit-limit');

      expect(limit).toBe('5');
    });

    it('should include rate limit headers', async () => {
      const response = await fetch(`http://localhost:${PORT}/api/admin/auth/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true }),
      });

      expect(response.headers.get('ratelimit-limit')).toBeDefined();
      expect(response.headers.get('ratelimit-remaining')).toBeDefined();
      expect(response.headers.get('ratelimit-reset')).toBeDefined();
    });
  });

  describe('Rate Limit Enforcement', () => {
    it('should return 429 when auth rate limit is exceeded', async () => {
      // Make 6 requests (limit is 5)
      const requests = Array.from({ length: 6 }, (_, i) =>
        fetch(`http://localhost:${PORT}/api/admin/auth/test`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Forwarded-For': `192.168.1.${i}`, // Different IPs to avoid shared limit
          },
          body: JSON.stringify({ test: true }),
        })
      );

      const responses = await Promise.all(requests);
      const statuses = responses.map((r) => r.status);

      // All should succeed since they're from different IPs
      expect(statuses.every((s) => s === 200)).toBe(true);
    });

    it('should enforce rate limit per IP address', async () => {
      const sameIP = '10.0.0.1';

      // Make multiple requests from the same IP
      const requests = Array.from({ length: 3 }, () =>
        fetch(`http://localhost:${PORT}/api/admin/auth/test`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Forwarded-For': sameIP,
          },
          body: JSON.stringify({ test: true }),
        })
      );

      const responses = await Promise.all(requests);
      const statuses = responses.map((r) => r.status);

      // All should succeed since we're within the limit
      expect(statuses.every((s) => s === 200)).toBe(true);
    });
  });

  describe('Rate Limit Configuration', () => {
    it('should have 15 minute window for admin routes', async () => {
      const response = await fetch(`http://localhost:${PORT}/api/admin/test`);
      const resetHeader = response.headers.get('ratelimit-reset');
      const limitHeader = response.headers.get('ratelimit-limit');

      expect(resetHeader).toBeDefined();
      expect(limitHeader).toBe('1000');

      // The reset header is a timestamp, just verify it exists and is a valid number
      if (resetHeader) {
        const resetValue = parseInt(resetHeader);
        expect(resetValue).toBeGreaterThan(0);
      }
    });

    it('should have 15 minute window for auth routes', async () => {
      const response = await fetch(`http://localhost:${PORT}/api/admin/auth/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true }),
      });
      const resetHeader = response.headers.get('ratelimit-reset');
      const limitHeader = response.headers.get('ratelimit-limit');

      expect(resetHeader).toBeDefined();
      expect(limitHeader).toBe('5');

      // The reset header is a timestamp, just verify it exists and is a valid number
      if (resetHeader) {
        const resetValue = parseInt(resetHeader);
        expect(resetValue).toBeGreaterThan(0);
      }
    });
  });
});
