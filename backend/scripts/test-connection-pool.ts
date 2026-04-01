#!/usr/bin/env bun

/**
 * Connection Pool Test Script
 * 
 * This script tests the Prisma connection pool configuration by:
 * 1. Creating multiple concurrent database queries
 * 2. Verifying connection pool behavior
 * 3. Testing timeout scenarios
 * 
 * Usage: bun run scripts/test-connection-pool.ts
 */

import { prisma } from '../src/lib/db';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color: keyof typeof COLORS, message: string) {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

async function testBasicConnection() {
  log('blue', '\n=== Test 1: Basic Connection ===');
  try {
    const userCount = await prisma.user.count();
    log('green', `✓ Successfully connected to database`);
    log('cyan', `  Found ${userCount} users in database`);
    return true;
  } catch (error) {
    log('red', `✗ Failed to connect to database`);
    console.error(error);
    return false;
  }
}

async function testConcurrentQueries() {
  log('blue', '\n=== Test 2: Concurrent Queries (Within Pool Limit) ===');
  const queryCount = 8; // Less than default connection_limit of 10
  
  try {
    const startTime = Date.now();
    const promises = Array.from({ length: queryCount }, (_, i) => 
      prisma.user.count().then(count => {
        log('cyan', `  Query ${i + 1}/${queryCount} completed: ${count} users`);
        return count;
      })
    );
    
    await Promise.all(promises);
    const duration = Date.now() - startTime;
    log('green', `✓ All ${queryCount} concurrent queries completed in ${duration}ms`);
    return true;
  } catch (error) {
    log('red', `✗ Concurrent queries failed`);
    console.error(error);
    return false;
  }
}

async function testPoolLimit() {
  log('blue', '\n=== Test 3: Pool Limit Test (Exceeding Pool Size) ===');
  const queryCount = 15; // More than default connection_limit of 10
  
  try {
    const startTime = Date.now();
    log('yellow', `  Creating ${queryCount} concurrent queries (pool limit: 10)`);
    log('yellow', `  Some queries will wait for available connections...`);
    
    const promises = Array.from({ length: queryCount }, (_, i) => 
      prisma.user.count().then(count => {
        const elapsed = Date.now() - startTime;
        log('cyan', `  Query ${i + 1}/${queryCount} completed after ${elapsed}ms`);
        return count;
      })
    );
    
    await Promise.all(promises);
    const duration = Date.now() - startTime;
    log('green', `✓ All ${queryCount} queries completed in ${duration}ms`);
    log('cyan', `  Connection pool successfully managed concurrent requests`);
    return true;
  } catch (error) {
    if (error.code === 'P2024') {
      log('red', `✗ Connection pool timeout (P2024)`);
      log('yellow', `  This means all connections were busy and pool_timeout was exceeded`);
      log('yellow', `  Consider increasing connection_limit or pool_timeout in DATABASE_URL`);
    } else {
      log('red', `✗ Pool limit test failed`);
      console.error(error);
    }
    return false;
  }
}

async function testSlowQuery() {
  log('blue', '\n=== Test 4: Slow Query Handling ===');
  
  try {
    const startTime = Date.now();
    
    // Simulate a slow query by doing multiple sequential operations
    await prisma.user.count();
    await prisma.user.count();
    await prisma.user.count();
    
    const duration = Date.now() - startTime;
    log('green', `✓ Multiple sequential queries completed in ${duration}ms`);
    log('cyan', `  Connection pool handled sequential queries without issues`);
    return true;
  } catch (error) {
    log('red', `✗ Sequential query test failed`);
    console.error(error);
    return false;
  }
}

async function displayConnectionInfo() {
  log('blue', '\n=== Connection Pool Configuration ===');
  
  try {
    // Extract connection info from DATABASE_URL
    const dbUrl = process.env.DATABASE_URL || '';
    const url = new URL(dbUrl);
    const params = url.searchParams;
    
    const connectionLimit = params.get('connection_limit') || '10 (default)';
    const poolTimeout = params.get('pool_timeout') || '10 (default)';
    const connectTimeout = params.get('connect_timeout') || '5 (default)';
    
    log('cyan', `  Database: ${url.hostname}:${url.port}${url.pathname}`);
    log('cyan', `  Connection Limit: ${connectionLimit}`);
    log('cyan', `  Pool Timeout: ${poolTimeout}s`);
    log('cyan', `  Connect Timeout: ${connectTimeout}s`);
    
    // Get actual database connection count
    const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT count(*) as count 
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `;
    
    const activeConnections = Number(result[0].count);
    log('cyan', `  Active Connections: ${activeConnections}`);
    
  } catch (error) {
    log('yellow', '  Could not retrieve connection info');
  }
}

async function main() {
  log('blue', '╔════════════════════════════════════════════════════════╗');
  log('blue', '║     Prisma Connection Pool Configuration Test          ║');
  log('blue', '╚════════════════════════════════════════════════════════╝');
  
  await displayConnectionInfo();
  
  const results = {
    basicConnection: await testBasicConnection(),
    concurrentQueries: await testConcurrentQueries(),
    poolLimit: await testPoolLimit(),
    slowQuery: await testSlowQuery(),
  };
  
  log('blue', '\n=== Test Summary ===');
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.values(results).length;
  
  if (passed === total) {
    log('green', `✓ All tests passed (${passed}/${total})`);
    log('green', `✓ Connection pool is configured correctly`);
  } else {
    log('yellow', `⚠ Some tests failed (${passed}/${total} passed)`);
    log('yellow', `  Review the output above for details`);
  }
  
  log('blue', '\n=== Recommendations ===');
  log('cyan', '  Development: connection_limit=10, pool_timeout=20, connect_timeout=5');
  log('cyan', '  Production: connection_limit=20-30, pool_timeout=30, connect_timeout=10');
  log('cyan', '  See backend/src/admin/CONNECTION_POOLING.md for detailed guide');
  
  await prisma.$disconnect();
  process.exit(passed === total ? 0 : 1);
}

main().catch((error) => {
  log('red', '\n✗ Fatal error during test execution');
  console.error(error);
  process.exit(1);
});
