# Admin Auth Middleware Usage Examples

## Basic Usage

### Protecting All Admin Routes

```typescript
// backend/src/index.ts
import { adminAuthMiddleware } from './admin/middleware/admin-auth.middleware';
import { adminRouter } from './admin/routes';

// Apply middleware to all admin routes
app.use('/api/admin', adminAuthMiddleware, adminRouter);
```

### Protecting Specific Routes

```typescript
// backend/src/admin/routes/users.route.ts
import { Router } from 'express';
import { adminAuthMiddleware } from '../middleware/admin-auth.middleware';
import { UserController } from '../controllers/user.controller';

const router = Router();

// Apply to specific routes
router.get('/users', adminAuthMiddleware, UserController.list);
router.get('/users/:id', adminAuthMiddleware, UserController.getById);

export default router;
```

## Accessing Admin User in Controllers

After the middleware runs, you can access the authenticated admin user:

```typescript
// backend/src/admin/controllers/user.controller.ts
import type { Request, Response } from 'express';

export class UserController {
  static async list(req: Request, res: Response) {
    // Access the authenticated admin user
    const adminUser = req.adminUser;

    if (!adminUser) {
      // This should never happen if middleware is applied correctly
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log(`Admin ${adminUser.name} (${adminUser.role}) is listing users`);

    // Your controller logic here
    res.json({ users: [] });
  }
}
```

## Combining with Permission Middleware

You can combine the auth middleware with role-based permission checks:

```typescript
// backend/src/admin/routes/index.ts
import { Router } from 'express';
import { adminAuthMiddleware } from '../middleware/admin-auth.middleware';
import { requirePermission } from '../middleware/permissions.middleware';
import { UserRole } from '@prisma/client';
import userRoutes from './users.route';
import financeRoutes from './finance.route';

const router = Router();

// Apply auth middleware to all routes
router.use(adminAuthMiddleware);

// Apply permission middleware to specific route groups
router.use('/users', requirePermission([UserRole.SUPER_ADMIN, UserRole.ADMIN]), userRoutes);
router.use(
  '/finance',
  requirePermission([UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]),
  financeRoutes
);

export default router;
```

### Permission Matrix Examples

Based on the admin panel design, here are the recommended permission configurations:

```typescript
// User Management - Requirements 2.4, 17.8
router.use(
  '/users',
  requirePermission([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER]),
  userRoutes
);

// Streamer Management
router.use(
  '/streamers',
  requirePermission([UserRole.SUPER_ADMIN, UserRole.MODERATOR, UserRole.ADMIN]),
  streamerRoutes
);

// Content Moderation
router.use(
  '/moderation',
  requirePermission([UserRole.SUPER_ADMIN, UserRole.MODERATOR]),
  moderationRoutes
);

// Reports
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

// Monetization
router.use(
  '/monetization',
  requirePermission([UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.COMPLIANCE_OFFICER]),
  monetizationRoutes
);

// Ads
router.use('/ads', requirePermission([UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]), adsRoutes);

// Analytics
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

// Compliance
router.use(
  '/compliance',
  requirePermission([UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_OFFICER]),
  complianceRoutes
);

// Settings (Super Admin only)
router.use('/settings', requirePermission([UserRole.SUPER_ADMIN]), settingsRoutes);
```

## Excluding Routes from Auth

If you need some admin routes to be public (like login), exclude them:

```typescript
// backend/src/index.ts
import { adminAuthMiddleware } from './admin/middleware/admin-auth.middleware';
import { adminAuthRouter } from './admin/routes/auth.route';
import { adminRouter } from './admin/routes';

// Public admin auth routes (no middleware)
app.use('/api/admin/auth', adminAuthRouter);

// Protected admin routes (with middleware)
app.use('/api/admin', adminAuthMiddleware, adminRouter);
```

## Testing with Admin Auth

### Unit Testing Controllers

```typescript
import { describe, it, expect } from 'bun:test';
import type { Request, Response } from 'express';
import { UserController } from './user.controller';
import { UserRole } from '@prisma/client';

describe('UserController', () => {
  it('should list users', async () => {
    const req = {
      adminUser: {
        id: 'admin-123',
        name: 'Test Admin',
        email: 'admin@example.com',
        username: 'testadmin',
        role: UserRole.SUPER_ADMIN,
      },
    } as Request;

    const res = {
      json: (data: any) => data,
    } as Response;

    await UserController.list(req, res);
    // Your assertions here
  });
});
```

### Integration Testing

```typescript
import { describe, it, expect } from 'bun:test';
import request from 'supertest';
import app from './app';

describe('Admin API Integration', () => {
  it('should reject unauthenticated requests', async () => {
    const response = await request(app).get('/api/admin/users').expect(401);

    expect(response.body.error).toBe('Unauthorized');
  });

  it('should reject non-admin users', async () => {
    // Create session for regular user
    const session = await createUserSession('regular-user-id');

    const response = await request(app)
      .get('/api/admin/users')
      .set('Cookie', session.cookie)
      .expect(403);

    expect(response.body.error).toBe('Forbidden');
  });

  it('should allow admin users', async () => {
    // Create session for admin user
    const session = await createAdminSession('admin-user-id');

    const response = await request(app)
      .get('/api/admin/users')
      .set('Cookie', session.cookie)
      .expect(200);

    expect(response.body.users).toBeDefined();
  });
});
```

## Error Handling

The middleware handles various error scenarios:

```typescript
// 401 - No session
{
  "error": "Unauthorized",
  "message": "You must be signed in to access admin resources"
}

// 401 - User not found
{
  "error": "Unauthorized",
  "message": "User not found"
}

// 403 - Not an admin
{
  "error": "Forbidden",
  "message": "You do not have permission to access admin resources"
}

// 500 - Server error
{
  "error": "Internal server error",
  "message": "Failed to authenticate admin user"
}
```

## TypeScript Types

The middleware extends the Express Request type:

```typescript
declare global {
  namespace Express {
    interface Request {
      adminUser?: {
        id: string;
        name: string;
        email: string;
        username: string;
        role: UserRole;
      };
    }
  }
}
```

This allows TypeScript to recognize `req.adminUser` in your controllers.

## Best Practices

1. **Always apply the middleware**: Never expose admin endpoints without authentication
2. **Check adminUser exists**: Even though the middleware should ensure it, defensive programming is good
3. **Log admin actions**: Use the adminUser information for audit logging
4. **Combine with permissions**: Use role-based permission checks for fine-grained access control
5. **Handle errors gracefully**: Provide clear error messages without leaking sensitive information
