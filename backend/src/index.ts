import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { prisma } from './lib/db';
import { auth } from './lib/auth';
import { toNodeHandler, fromNodeHeaders } from 'better-auth/node';
import { isAllowedOrigin } from './lib/config';
import { swaggerSpec } from './lib/swagger';
import { logger } from './lib/logger';
import authRoutes from './routes/auth.route';
import creatorRoutes from './routes/creator.route';
import contentRoutes from './routes/content.route';
import streamRoutes from './routes/stream.route';
import webhookRoutes from './routes/webhook.route';
import viewerRoutes from './routes/viewer.route';
import socialRoutes from './routes/social.route';
import searchRoutes from './routes/search.route';
import paymentRoutes from './routes/payment.route';
import discountRoutes from './routes/discount.route';
import { WebhookController } from './controllers/webhook.controller';
import { adminRouter } from './admin/routes';
import { adminAuthMiddleware } from './admin/middleware/admin-auth.middleware';
import { adminRateLimiter, authRateLimiter } from './admin/middleware/rate-limit.middleware';

const app = express();
const PORT = process.env['PORT'] ?? 3000;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true, // Allow cookies to be sent
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Cookie',
      'ngrok-skip-browser-warning',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    exposedHeaders: ['Set-Cookie', 'set-auth-token'], // Expose Bearer token header
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Mount webhook routes with raw body parser (before express.json())
// LiveKit webhook requires raw body for signature verification
app.use('/api/webhook', express.raw({ type: 'application/webhook+json' }));
app.use('/api/webhook', webhookRoutes);

// Mount Dodo webhook route (also needs raw body)
app.post(
  '/api/webhook/dodo',
  express.raw({ type: 'application/json' }),
  WebhookController.handleDodoWebhook
);

// Mount express.json() for all other routes
app.use(express.json());

// Debug middleware to log all /api/auth requests
app.use('/api/auth', (req, _res, next) => {
  console.log(`[Auth Route] ${req.method} ${req.path}`);
  next();
});

// IMPORTANT: Mount custom auth routes BEFORE Better Auth catch-all
// These are specific endpoints that need JSON parsing and aren't handled by Better Auth
app.use('/api/auth', authRoutes);

// Mount Better Auth handler as catch-all (after custom routes)
// This handles Better Auth's built-in endpoints like /sign-up, /sign-in, /sign-out, /get-session
// Use middleware wrapper instead of app.all() to avoid route pattern issues
app.use('/api/auth', (req, res, _next) => {
  // Only handle if no previous route matched
  return toNodeHandler(auth)(req, res);
});

// Mount creator routes
app.use('/api/creator', creatorRoutes);

// Mount content routes
app.use('/api/content', contentRoutes);

// Mount stream routes
app.use('/api/stream', streamRoutes);

// Mount viewer routes
app.use('/api/viewer', viewerRoutes);

// Mount social routes
app.use('/api/social', socialRoutes);

// Mount search routes
app.use('/api/search', searchRoutes);

// Mount payment routes
app.use('/api/payment', paymentRoutes);

// Mount discount routes
app.use('/api/discount', discountRoutes);

// Mount admin routes
// Auth routes and health check are public, all other admin routes require authentication
app.use(
  '/api/admin',
  (req, res, next) => {
    // Skip authentication for auth routes and health check
    if (req.path.startsWith('/auth') || req.path.startsWith('/health')) {
      // Apply stricter rate limiting for auth routes
      return authRateLimiter(req, res, () => next());
    }
    // Apply general rate limiting for all other admin routes
    return adminRateLimiter(req, res, () => {
      // Apply authentication middleware after rate limiting
      return adminAuthMiddleware(req, res, next);
    });
  },
  adminRouter
);

// API Documentation (Swagger UI)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health check
app.get('/health', async (_req, res) => {
  try {
    await prisma.$connect();
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Example: Protected route
app.get('/api/user/me', async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    res.json({ user: session.user });
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Example: Public route to test sign up

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Auth API: http://localhost:${PORT}/api/auth/*`);
  console.log(`Test page: http://localhost:${PORT}/test-auth`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Global error handler - must be last middleware registered

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.apiError('Global error handler', err, {
    path: _req.path,
    method: _req.method,
    ip: _req.ip,
  });
  res.status(500).json({
    success: false,
    error: err.message ?? 'Internal server error',
  });
});
