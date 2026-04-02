/**
 * Shared application configuration constants.
 */

const DEFAULT_ALLOWED_ORIGINS = [
  // Local frontends
  'http://localhost:5173',
  'http://localhost:5174',

  // Production domains
  'https://voltstream.space',
  'https://www.voltstream.space',
  'https://binate-nonperceptively-celestina.ngrok-free.dev',
];

const normalizeOrigin = (origin: string) => origin.trim().replace(/\/$/, '');

const splitOriginList = (value?: string) =>
  (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const envOriginCandidates = [
  process.env['FRONTEND_URL'],
  process.env['ADMIN_FRONTEND_URL'],
  ...splitOriginList(process.env['ALLOWED_ORIGINS']),
].filter((origin): origin is string => Boolean(origin && origin.trim()));

export const ALLOWED_ORIGINS: string[] = Array.from(
  new Set([...DEFAULT_ALLOWED_ORIGINS, ...envOriginCandidates].map(normalizeOrigin))
);

const isLocalHost = (hostname: string) =>
  hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';

export const isAllowedOrigin = (origin: string): boolean => {
  const normalizedOrigin = normalizeOrigin(origin);

  if (ALLOWED_ORIGINS.includes(normalizedOrigin)) {
    return true;
  }

  let requestUrl: URL;
  try {
    requestUrl = new URL(normalizedOrigin);
  } catch {
    return false;
  }

  return ALLOWED_ORIGINS.some((allowedOrigin) => {
    try {
      const allowedUrl = new URL(allowedOrigin);

      if (allowedUrl.protocol !== requestUrl.protocol) {
        return false;
      }

      if (isLocalHost(allowedUrl.hostname)) {
        return false;
      }

      return (
        requestUrl.hostname === allowedUrl.hostname ||
        requestUrl.hostname.endsWith(`.${allowedUrl.hostname}`)
      );
    } catch {
      return false;
    }
  });
};
