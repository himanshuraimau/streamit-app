import express from 'express';
import cors from 'cors';
import { prisma } from './lib/db';
import { auth } from './lib/auth';
import { toNodeHandler } from 'better-auth/node';
import authRoutes from './routes/auth.route';
import creatorRoutes from './routes/creator';
import contentRoutes from './routes/content';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration - MUST be before Better Auth handler
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Mount express.json() BEFORE custom routes
app.use(express.json());

// Mount custom auth routes FIRST (more specific routes)
app.use('/api/auth', authRoutes);

// Mount creator routes
app.use('/api/creator', creatorRoutes);

// Mount content routes
app.use('/api/content', contentRoutes);

// IMPORTANT: Mount Better Auth handler LAST (catch-all for remaining auth routes)
// Express v5 uses new wildcard syntax: /{*any} instead of /*
app.all("/api/auth/{*all}", toNodeHandler(auth));

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