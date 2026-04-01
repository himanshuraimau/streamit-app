import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' 
      ? ['error', 'warn'] 
      : ['query', 'error', 'warn'],
    // Connection pool is configured via DATABASE_URL query parameters:
    // - connection_limit: Max connections in pool (default: 10)
    // - pool_timeout: Max wait time for connection in seconds (default: 10)
    // - connect_timeout: Max wait time for initial connection in seconds (default: 5)
    // Example: postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20&connect_timeout=5
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
