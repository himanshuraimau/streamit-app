# OTP Endpoint 404 Fix

## Problem

Getting `404 Not Found` error when calling:
```
POST https://voltstreambackend.space/api/auth/send-verification-otp
```

## Root Cause

The route order in `src/index.ts` was incorrect. Better Auth's catch-all handler was mounted **before** custom auth routes:

```typescript
// ❌ WRONG ORDER - Better Auth intercepts all /api/auth/* requests
app.all("/api/auth/*", toNodeHandler(auth));  // Catches everything first
app.use('/api/auth', authRoutes);              // Never reached
```

Since Better Auth doesn't have a `/send-verification-otp` endpoint, it returned 404.

## Solution

Reordered routes so custom endpoints are checked **before** Better Auth's catch-all:

```typescript
// ✅ CORRECT ORDER
app.use('/api/auth', authRoutes);              // Custom routes checked first
app.all("/api/auth/*", toNodeHandler(auth));   // Better Auth handles remaining
```

## Express Route Matching

Express matches routes in the order they're defined:

1. First, checks custom routes registered with `app.use('/api/auth', authRoutes)`
2. If no match, falls through to Better Auth's `app.all("/api/auth/*", ...)`

## Custom Auth Endpoints

These endpoints are now properly handled by `authRoutes`:

- `POST /api/auth/send-verification-otp` - Send OTP for verification
- `POST /api/auth/check-verification-otp` - Verify OTP code
- `POST /api/auth/signin/email-otp` - Sign in with OTP
- `POST /api/auth/verify-email` - Verify email with OTP
- `POST /api/auth/forget-password/email-otp` - Request password reset OTP
- `POST /api/auth/reset-password/email-otp` - Reset password with OTP
- `POST /api/auth/signup/email` - Sign up with email/password
- `POST /api/auth/signin/email` - Sign in with email/password

## Better Auth Endpoints

These are handled by Better Auth's `toNodeHandler`:

- `POST /api/auth/sign-up` - Better Auth signup
- `POST /api/auth/sign-in` - Better Auth signin
- `POST /api/auth/sign-out` - Better Auth signout
- `GET /api/auth/get-session` - Get current session
- Other Better Auth plugin endpoints

## Debugging

Added logging middleware to track which routes are hit:

```typescript
app.use('/api/auth', (req, res, next) => {
  console.log(`[Auth Route] ${req.method} ${req.path}`);
  next();
});
```

Check backend logs to verify the request is reaching the correct handler.

## Testing

After deploying, test with:

```bash
curl -X POST https://voltstreambackend.space/api/auth/send-verification-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "type": "email-verification"}'
```

Expected response:
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

## Related Files

- `/backend/src/index.ts` - Main server file with route configuration
- `/backend/src/routes/auth.route.ts` - Custom auth route definitions
- `/backend/src/controllers/auth.controller.ts` - Auth controller with OTP logic
- `/backend/src/lib/auth.ts` - Better Auth configuration
