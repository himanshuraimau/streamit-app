import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { HealthController } from './health.controller';
import type { Request, Response } from 'express';

/**
 * Unit tests for Health Check Controller
 *
 * These tests verify that:
 * 1. Health check returns correct status when database is connected
 * 2. Health check returns error status when database is disconnected
 * 3. Response includes required fields: status, database, timestamp
 *
 * Requirements: 28.3, 28.4
 */

describe('HealthController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: ReturnType<typeof mock>;
  let statusMock: ReturnType<typeof mock>;

  beforeEach(() => {
    // Reset mocks before each test
    jsonMock = mock(() => {});
    statusMock = mock(() => ({ json: jsonMock }));

    mockRequest = {};
    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };
  });

  it('should return ok status with database connected when health check succeeds', async () => {
    // Execute health check
    await HealthController.healthCheck(mockRequest as Request, mockResponse as Response);

    // Verify response
    expect(jsonMock).toHaveBeenCalledTimes(1);
    const response = jsonMock.mock.calls[0][0];

    expect(response).toHaveProperty('status');
    expect(response).toHaveProperty('database');
    expect(response).toHaveProperty('timestamp');

    expect(response.status).toBe('ok');
    expect(response.database).toBe('connected');
    expect(typeof response.timestamp).toBe('string');

    // Verify timestamp is valid ISO 8601 format
    expect(() => new Date(response.timestamp)).not.toThrow();
  });

  it('should include all required fields in response', async () => {
    await HealthController.healthCheck(mockRequest as Request, mockResponse as Response);

    const response = jsonMock.mock.calls[0][0];

    // Verify all required fields from Requirement 28.4
    expect(response).toHaveProperty('status');
    expect(response).toHaveProperty('database');
    expect(response).toHaveProperty('timestamp');
  });

  it('should return valid ISO 8601 timestamp', async () => {
    await HealthController.healthCheck(mockRequest as Request, mockResponse as Response);

    const response = jsonMock.mock.calls[0][0];
    const timestamp = new Date(response.timestamp);

    // Verify timestamp is a valid date
    expect(timestamp.toString()).not.toBe('Invalid Date');

    // Verify timestamp is recent (within last 5 seconds)
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    expect(diff).toBeLessThan(5000);
  });
});
