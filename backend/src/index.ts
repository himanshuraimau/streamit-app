import express from 'express';
import { prisma } from './lib/db';
import { auth } from './lib/auth';
import { toNodeHandler } from 'better-auth/node';
import authRoutes from './routes/auth.route';

const app = express();
const PORT = process.env.PORT || 3000;

// IMPORTANT: Mount Better Auth handler BEFORE express.json()
app.all("/api/auth/*", toNodeHandler(auth));

// Now mount express.json() for other routes
app.use(express.json());

// Mount auth routes
app.use('/api/auth', authRoutes);

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