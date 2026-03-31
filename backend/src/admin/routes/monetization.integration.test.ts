import { describe, it, expect } from 'bun:test';
import monetizationRouter from './monetization.route';

/**
 * Integration tests for monetization router
 * 
 * These tests verify that:
 * 1. Monetization routes are properly registered
 * 2. Routes are accessible through the router
 * 
 * Requirements: 17.4
 */

describe('Monetization Router', () => {
  it('should have monetization router exported', () => {
    expect(monetizationRouter).toBeDefined();
    expect(typeof monetizationRouter).toBe('function'); // Express Router is a function
  });

  it('should have router stack defined with routes', () => {
    expect(monetizationRouter.stack).toBeDefined();
    expect(monetizationRouter.stack.length).toBeGreaterThan(0);
  });

  it('should have ledger route registered', () => {
    const ledgerRoute = monetizationRouter.stack.find(
      (layer: any) => layer.route?.path === '/ledger'
    );
    expect(ledgerRoute).toBeDefined();
    expect(ledgerRoute.route.methods.get).toBe(true);
  });

  it('should have withdrawals route registered', () => {
    const withdrawalsRoute = monetizationRouter.stack.find(
      (layer: any) => layer.route?.path === '/withdrawals'
    );
    expect(withdrawalsRoute).toBeDefined();
    expect(withdrawalsRoute.route.methods.get).toBe(true);
  });

  it('should have withdrawal approve route registered', () => {
    const approveRoute = monetizationRouter.stack.find(
      (layer: any) => layer.route?.path === '/withdrawals/:id/approve'
    );
    expect(approveRoute).toBeDefined();
    expect(approveRoute.route.methods.patch).toBe(true);
  });

  it('should have withdrawal reject route registered', () => {
    const rejectRoute = monetizationRouter.stack.find(
      (layer: any) => layer.route?.path === '/withdrawals/:id/reject'
    );
    expect(rejectRoute).toBeDefined();
    expect(rejectRoute.route.methods.patch).toBe(true);
  });

  it('should have gifts route registered', () => {
    const giftsRoute = monetizationRouter.stack.find(
      (layer: any) => layer.route?.path === '/gifts'
    );
    expect(giftsRoute).toBeDefined();
    expect(giftsRoute.route.methods.get).toBe(true);
  });

  it('should have wallet details route registered', () => {
    const walletRoute = monetizationRouter.stack.find(
      (layer: any) => layer.route?.path === '/wallets/:userId'
    );
    expect(walletRoute).toBeDefined();
    expect(walletRoute.route.methods.get).toBe(true);
  });
});
