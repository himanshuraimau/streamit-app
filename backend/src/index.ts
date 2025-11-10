import express from 'express';
import cors from 'cors';
import { prisma } from './lib/db';
import { auth } from './lib/auth';
import { toNodeHandler } from 'better-auth/node';
import authRoutes from './routes/auth.route';
import creatorRoutes from './routes/creator';
import contentRoutes from './routes/content';
import streamRoutes from './routes/stream.route';
import webhookRoutes from './routes/webhook.route';
import viewerRoutes from './routes/viewer.route';
import socialRoutes from './routes/social.route';
import searchRoutes from './routes/search.route';
import paymentRoutes from './routes/payment.route';
import { WebhookController } from './controllers/webhook.controller';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration - MUST be before Better Auth handler
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'https://binate-nonperceptively-celestina.ngrok-free.dev'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'ngrok-skip-browser-warning'],
  exposedHeaders: ['Set-Cookie', 'set-auth-token'], // Expose Bearer token header
}));

// Mount webhook routes with raw body parser (before express.json())
// LiveKit webhook requires raw body for signature verification
app.use('/api/webhook', express.raw({ type: 'application/webhook+json' }));
app.use('/api/webhook', webhookRoutes);

// Mount Dodo webhook route (also needs raw body)
app.post('/api/webhook/dodo', express.raw({ type: 'application/json' }), WebhookController.handleDodoWebhook);

// Mount express.json() for all other routes
app.use(express.json());

// Debug middleware to log all /api/auth requests
app.use('/api/auth', (req, res, next) => {
  console.log(`[Auth Route] ${req.method} ${req.path}`);
  next();
});

// IMPORTANT: Mount custom auth routes BEFORE Better Auth catch-all
// These are specific endpoints that need JSON parsing and aren't handled by Better Auth
app.use('/api/auth', authRoutes);

// Mount Better Auth handler as catch-all (after custom routes)
// This handles Better Auth's built-in endpoints like /sign-up, /sign-in, /sign-out, /get-session
// Use middleware wrapper instead of app.all() to avoid route pattern issues
app.use("/api/auth", (req, res, next) => {
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

// Health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$connect();
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Example: Protected route
app.get('/api/user/me', async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    res.json({ user: session.user });
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Example: Public route to test sign up
app.get('/test-auth', (req, res) => {
  res.json({
    message: 'Auth endpoints available at:',
    signUp: 'POST /api/auth/sign-up/email',
    signIn: 'POST /api/auth/sign-in/email',
    signOut: 'POST /api/auth/sign-out',
    session: 'GET /api/auth/get-session',
  });
});

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