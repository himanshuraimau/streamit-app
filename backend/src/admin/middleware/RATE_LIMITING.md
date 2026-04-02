# Rate Limiting Implementation

## Overview

This document describes the rate limiting implementation for the admin panel, which protects admin endpoints from abuse and brute force attacks.

**Requirements:** 22.8

## Implementation

### Middleware Files

- `rate-limit.middleware.ts` - Rate limiting middleware configuration
- `rate-limit.integration.test.ts` - Integration tests for rate limiting

### Rate Limits

#### General Admin Routes

- **Limit:** 1000 requests per 15 minutes
- **Applies to:** All `/api/admin/*` routes except auth routes
- **Purpose:** Prevent abuse of admin endpoints

#### Auth Routes

- **Limit:** 5 attempts per 15 minutes
- **Applies to:** `/api/admin/auth/*` routes
- **Purpose:** Prevent brute force attacks on authentication
- **Special behavior:** Successful requests don't count toward the limit

### Special Cases

#### Super Admin in Development

- Super admins are exempt from rate limiting in development mode
- This allows for easier testing and development
- Production environments enforce rate limits for all users

## Configuration

### Rate Limiter Settings

```typescript
// General admin rate limiter
windowMs: 15 * 60 * 1000; // 15 minutes
max: 1000; // 1000 requests per window
standardHeaders: true; // Include RateLimit-* headers
legacyHeaders: false; // Disable X-RateLimit-* headers

// Auth rate limiter
windowMs: 15 * 60 * 1000; // 15 minutes
max: 5; // 5 attempts per window
skipSuccessfulRequests: true; // Don't count successful auth
```

### Response Headers

Rate limit information is included in response headers:

- `RateLimit-Limit` - Maximum requests allowed in window
- `RateLimit-Remaining` - Requests remaining in current window
- `RateLimit-Reset` - Unix timestamp when the window resets

### Error Response

When rate limit is exceeded, the API returns:

```json
{
  "error": "Too many requests",
  "message": "Too many requests from this IP, please try again later"
}
```

**Status Code:** 429 Too Many Requests

## Integration

### Application Setup

Rate limiting is applied in `backend/src/index.ts`:

```typescript
app.use(
  '/api/admin',
  (req, res, next) => {
    if (req.path.startsWith('/auth')) {
      // Apply stricter rate limiting for auth routes
      return authRateLimiter(req, res, () => next());
    }
    // Apply general rate limiting for all other admin routes
    return adminRateLimiter(req, res, () => {
      return adminAuthMiddleware(req, res, next);
    });
  },
  adminRouter
);
```

### Middleware Order

1. **Rate Limiting** - Applied first to prevent abuse
2. **Authentication** - Applied after rate limiting (for non-auth routes)
3. **Authorization** - Applied by individual routes as needed

## Testing

### Integration Tests

The implementation includes comprehensive integration tests that verify:

1. **Rate Limit Enforcement**
   - Requests within limit are allowed
   - Rate limit headers are included in responses
   - Correct limits are applied (1000 for admin, 5 for auth)

2. **Per-IP Tracking**
   - Rate limits are enforced per IP address
   - Different IPs have independent limits

3. **Configuration**
   - 15-minute window is correctly configured
   - Headers contain valid reset timestamps

### Running Tests

```bash
cd backend/src/admin/middleware
bun test rate-limit.integration.test.ts
```

## Security Considerations

1. **IP-Based Tracking**
   - Rate limits are tracked per IP address
   - Consider proxy configurations in production

2. **Bypass in Development**
   - Super admins can bypass limits in development
   - This is disabled in production for security

3. **Auth Route Protection**
   - Stricter limits on auth routes prevent brute force
   - Successful requests don't count toward limit

4. **Header Information**
   - Rate limit info is exposed in headers
   - Clients can implement backoff strategies

## Future Enhancements

Potential improvements for future iterations:

1. **User-Based Rate Limiting**
   - Track limits per authenticated user instead of IP
   - More accurate for shared IPs (corporate networks)

2. **Dynamic Rate Limits**
   - Adjust limits based on user role
   - Higher limits for trusted admins

3. **Redis Store**
   - Use Redis for distributed rate limiting
   - Required for horizontal scaling

4. **Custom Error Messages**
   - Role-specific error messages
   - Include retry-after information

## Troubleshooting

### Rate Limit Exceeded

If you encounter rate limit errors:

1. **Check Headers**
   - Review `RateLimit-Reset` to see when limit resets
   - Check `RateLimit-Remaining` to see available requests

2. **Development Mode**
   - Ensure `NODE_ENV=development` for testing
   - Super admins are exempt in development

3. **Production Issues**
   - Review IP address tracking
   - Check for proxy configuration issues
   - Consider increasing limits if legitimate traffic is blocked

### Testing Rate Limits

To test rate limiting behavior:

```bash
# Make multiple requests to trigger limit
for i in {1..10}; do
  curl http://localhost:3000/api/admin/auth/sign-in \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done
```

## References

- **express-rate-limit:** https://github.com/express-rate-limit/express-rate-limit
- **Requirements:** Section 22.8 (Security and Access Control)
- **Design Document:** Section on Performance Optimization
