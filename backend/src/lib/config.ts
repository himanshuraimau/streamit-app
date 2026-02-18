/**
 * Shared application configuration constants.
 */

export const ALLOWED_ORIGINS: string[] = [
  process.env['FRONTEND_URL'] ?? 'http://localhost:5173',
  'http://localhost:5173',
  'https://voltstream.space',
  'https://www.voltstream.space',
  'https://binate-nonperceptively-celestina.ngrok-free.dev',
];
