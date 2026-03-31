/**
 * Shared application configuration constants.
 */

export const ALLOWED_ORIGINS: string[] = [
  // User-facing frontend
  process.env['FRONTEND_URL'] ?? 'http://localhost:5173',
  'http://localhost:5173',
  
  // Admin dashboard
  process.env['ADMIN_FRONTEND_URL'] ?? 'http://localhost:5174',
  'http://localhost:5174',
  
  // Production domains
  'https://voltstream.space',
  'https://www.voltstream.space',
  'https://binate-nonperceptively-celestina.ngrok-free.dev',
];
