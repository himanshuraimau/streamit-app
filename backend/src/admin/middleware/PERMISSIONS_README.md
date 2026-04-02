# Permission Middleware

## Overview

The `requirePermission` middleware provides role-based access control (RBAC) for admin routes. It's a factory function that creates middleware to enforce that only admins with specific roles can access protected routes.

## Requirements

- **Requirement 2.4**: Role-Based Authorization - When a request is authenticated, the Admin_Backend SHALL verify the admin role against the Permission_Matrix for the requested route
- **Requirement 17.8**: The Admin_Backend SHALL apply requirePermission middleware to each route group with appropriate role arrays

## How It Works

1. The middleware is created by calling `requirePermission()` with an array of allowed `UserRole` values
2. When a request arrives, it checks if `req.adminUser` exists (set by `adminAuthMiddleware`)
3. It verifies that `req.adminUser.role` is in the allowed roles array
4. If the role is allowed, it calls `next()` to proceed to the route handler
5. If the role is not allowed, it returns HTTP 403 Forbidden
6. If `req.adminUser` doesn't exist, it returns HTTP 401 Unauthorized

## Usage

### Basic Usage

```typescript
import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { requirePermission } from '../middleware/permissions.middleware';

const router = Router();

// Single role
router.get('/super-only', requirePermission([UserRole.SUPER_ADMIN]), handler);

// Multiple roles
router.get('/finance', requirePermission([UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]), handler);
```

### Route Group Protection

```typescript
import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { adminAuthMiddleware } from '../middleware/admin-auth.middleware';
import { requirePermission } from '../middleware/permissions.middleware';
import userRoutes from './users.route';

const router = Router();

// Apply auth middleware first
router.use(adminAuthMiddleware);

// Then apply permission middleware to route groups
router.use(
  '/users',
  requirePermission([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER]),
  userRoutes
);
```

### Chaining Multiple Middlewares

```typescript
router.get(
  '/sensitive-data',
  adminAuthMiddleware,
  requirePermission([UserRole.SUPER_ADMIN]),
  rateLimitMiddleware,
  handler
);
```

## Admin Roles

The system supports five admin roles:

- `UserRole.SUPER_ADMIN` - Full system access, can manage settings and other admins
- `UserRole.MODERATOR` - Content moderation, stream control, reports
- `UserRole.FINANCE_ADMIN` - Wallet operations, withdrawals, ads, billing
- `UserRole.ADMIN` - User management, support operations (maps to support_admin)
- `UserRole.COMPLIANCE_OFFICER` - Legal requests, geo-blocking, audit logs, data exports

## Permission Matrix

Based on the admin panel design, here's the recommended permission configuration for each module:

### User Management

**Allowed Roles**: `SUPER_ADMIN`, `ADMIN` (support_admin), `COMPLIANCE_OFFICER`

```typescript
router.use(
  '/users',
  requirePermission([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER]),
  userRoutes
);
```

### Streamer Management

**Allowed Roles**: `SUPER_ADMIN`, `MODERATOR`, `ADMIN` (support_admin)

```typescript
router.use(
  '/streamers',
  requirePermission([UserRole.SUPER_ADMIN, UserRole.MODERATOR, UserRole.ADMIN]),
  streamerRoutes
);
```

### Content Moderation

**Allowed Roles**: `SUPER_ADMIN`, `MODERATOR`

```typescript
router.use(
  '/moderation',
  requirePermission([UserRole.SUPER_ADMIN, UserRole.MODERATOR]),
  moderationRoutes
);
```

### Reports

**Allowed Roles**: `SUPER_ADMIN`, `MODERATOR`, `ADMIN` (support_admin), `COMPLIANCE_OFFICER`

```typescript
router.use(
  '/reports',
  requirePermission([
    UserRole.SUPER_ADMIN,
    UserRole.MODERATOR,
    UserRole.ADMIN,
    UserRole.COMPLIANCE_OFFICER,
  ]),
  reportsRoutes
);
```

### Monetization

**Allowed Roles**: `SUPER_ADMIN`, `FINANCE_ADMIN`, `COMPLIANCE_OFFICER`

```typescript
router.use(
  '/monetization',
  requirePermission([UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.COMPLIANCE_OFFICER]),
  monetizationRoutes
);
```

### Ads

**Allowed Roles**: `SUPER_ADMIN`, `FINANCE_ADMIN`

```typescript
router.use('/ads', requirePermission([UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]), adsRoutes);
```

### Analytics

**Allowed Roles**: `SUPER_ADMIN`, `MODERATOR`, `FINANCE_ADMIN`, `COMPLIANCE_OFFICER`

```typescript
router.use(
  '/analytics',
  requirePermission([
    UserRole.SUPER_ADMIN,
    UserRole.MODERATOR,
    UserRole.FINANCE_ADMIN,
    UserRole.COMPLIANCE_OFFICER,
  ]),
  analyticsRoutes
);
```

### Compliance

**Allowed Roles**: `SUPER_ADMIN`, `COMPLIANCE_OFFICER`

```typescript
router.use(
  '/compliance',
  requirePermission([UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_OFFICER]),
  complianceRoutes
);
```

### Settings

**Allowed Roles**: `SUPER_ADMIN` only

```typescript
router.use('/settings', requirePermission([UserRole.SUPER_ADMIN]), settingsRoutes);
```

## Error Responses

### 401 Unauthorized

Returned when `req.adminUser` is not set (auth middleware not applied or session invalid):

```json
{
  "error": "Unauthorized",
  "message": "Admin authentication required"
}
```

### 403 Forbidden

Returned when the admin's role is not in the allowed roles list:

```json
{
  "error": "Forbidden",
  "message": "You do not have permission to access this resource"
}
```

## Testing

### Unit Testing

```typescript
import { describe, it, expect, mock } from 'bun:test';
import type { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { requirePermission } from './permissions.middleware';

describe('requirePermission', () => {
  it('should allow access for authorized role', () => {
    const req = {
      adminUser: {
        id: 'test-id',
        name: 'Test Admin',
        email: 'admin@test.com',
        username: 'testadmin',
        role: UserRole.SUPER_ADMIN,
      },
    } as Request;

    const res = {} as Response;
    const next = mock(() => {});

    const middleware = requirePermission([UserRole.SUPER_ADMIN]);
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should deny access for unauthorized role', () => {
    const req = {
      adminUser: {
        id: 'test-id',
        name: 'Test Admin',
        email: 'admin@test.com',
        username: 'testadmin',
        role: UserRole.MODERATOR,
      },
    } as Request;

    const res = {
      status: mock((code: number) => res),
      json: mock((data: any) => res),
    } as unknown as Response;

    const next = mock(() => {});

    const middleware = requirePermission([UserRole.SUPER_ADMIN]);
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
```

### Integration Testing

```typescript
import { describe, it, expect } from 'bun:test';
import request from 'supertest';
import app from './app';

describe('Permission middleware integration', () => {
  it('should allow super admin to access settings', async () => {
    const session = await createAdminSession(UserRole.SUPER_ADMIN);

    const response = await request(app)
      .get('/api/admin/settings')
      .set('Cookie', session.cookie)
      .expect(200);

    expect(response.body).toBeDefined();
  });

  it('should deny moderator access to settings', async () => {
    const session = await createAdminSession(UserRole.MODERATOR);

    const response = await request(app)
      .get('/api/admin/settings')
      .set('Cookie', session.cookie)
      .expect(403);

    expect(response.body.error).toBe('Forbidden');
  });
});
```

## Best Practices

1. **Always apply adminAuthMiddleware first**: The permission middleware depends on `req.adminUser` being set
2. **Use specific role arrays**: Only include roles that genuinely need access to the route
3. **Follow the permission matrix**: Use the documented permission matrix for consistency
4. **Test permission boundaries**: Write tests for both allowed and denied scenarios
5. **Document role requirements**: Add comments explaining why specific roles are allowed
6. **Audit permission changes**: Log when permission configurations are modified

## Security Considerations

1. **Defense in depth**: Even though auth middleware should set `req.adminUser`, the permission middleware checks for its existence
2. **Fail closed**: If there's any doubt about permissions, the middleware denies access
3. **Clear error messages**: Error messages are informative but don't leak sensitive information
4. **Idempotent checks**: Checking permissions multiple times produces the same result (Requirement 2.10)
5. **No role escalation**: Middleware only checks roles, never modifies them

## Troubleshooting

### Issue: Getting 401 instead of 403

**Cause**: `adminAuthMiddleware` is not applied before `requirePermission`
**Solution**: Ensure auth middleware runs first in the middleware chain

### Issue: All roles are denied

**Cause**: Empty allowed roles array or incorrect role values
**Solution**: Verify the allowed roles array contains valid `UserRole` enum values

### Issue: Permission checks not working

**Cause**: Middleware order is incorrect
**Solution**: Apply middlewares in this order: auth → permission → route handler

## Related Files

- `admin-auth.middleware.ts` - Sets `req.adminUser` for authenticated admins
- `admin-auth.middleware.test.ts` - Unit tests for auth middleware
- `permissions.middleware.test.ts` - Unit tests for permission middleware
- `permissions.middleware.integration.test.ts` - Integration tests
- `USAGE_EXAMPLE.md` - Usage examples for both middlewares

## References

- Design Document: `.kiro/specs/admin-panel/design.md`
- Requirements: `.kiro/specs/admin-panel/requirements.md`
- Task: `.kiro/specs/admin-panel/tasks.md` - Task 1.5
