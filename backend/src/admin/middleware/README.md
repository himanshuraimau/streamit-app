# Admin Middleware

This directory contains middleware functions for the admin panel authentication and authorization.

## adminAuthMiddleware

The `adminAuthMiddleware` is responsible for verifying that requests to admin endpoints come from authenticated users with admin roles.

### Features

- **Session Verification**: Uses Better Auth to verify the session from cookies
- **Role Checking**: Ensures the user has one of the allowed admin roles
- **Request Augmentation**: Attaches the admin user information to the request object
- **Error Handling**: Returns appropriate HTTP status codes for different error scenarios

### Allowed Admin Roles

The following roles are allowed to access admin endpoints:

- `SUPER_ADMIN` - Full system access
- `MODERATOR` - Content moderation and stream management
- `FINANCE_ADMIN` - Financial operations and monetization
- `ADMIN` - Support admin (user management)
- `COMPLIANCE_OFFICER` - Legal compliance and audit logs

### Usage

Apply this middleware to all admin routes:

```typescript
import { adminAuthMiddleware } from './admin/middleware/admin-auth.middleware';

// Apply to all admin routes
app.use('/api/admin', adminAuthMiddleware, adminRouter);

// Or apply to specific routes
router.get('/api/admin/users', adminAuthMiddleware, UserController.list);
```

### Request Object Extension

After successful authentication, the middleware attaches an `adminUser` object to the request:

```typescript
req.adminUser = {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
};
```

### Response Codes

- **200**: Success (middleware passes to next handler)
- **401 Unauthorized**: No valid session or user not found
- **403 Forbidden**: User is authenticated but does not have an admin role
- **500 Internal Server Error**: Unexpected error during authentication

### Error Response Format

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

### Requirements Satisfied

This middleware satisfies the following requirements from the admin panel specification:

- **1.1**: Verify credentials using Better Auth
- **1.2**: Verify user role is an admin role
- **2.1**: Apply authentication middleware to all admin routes
- **17.7**: Apply adminAuthMiddleware to all `/api/admin/*` routes
- **17.10**: Use Better Auth for session validation
- **22.1**: Validate all admin sessions
- **22.2**: Verify admin role on every request

### Testing

The middleware includes comprehensive unit tests covering:

- No session scenarios
- User not found scenarios
- Non-admin role rejection
- All admin role acceptance
- Error handling

Run tests with:

```bash
bun test src/admin/middleware/admin-auth.middleware.test.ts
```

### Security Considerations

1. **Session Validation**: Every request validates the session with Better Auth
2. **Database Lookup**: User role is fetched from the database on each request to ensure current permissions
3. **Role Verification**: Only users with admin roles can access admin endpoints
4. **Error Messages**: Error messages are generic to avoid leaking information
5. **Logging**: Errors are logged for monitoring and debugging

### Performance Notes

- The middleware makes two async calls per request:
  1. Better Auth session verification
  2. Database lookup for user role
- Consider implementing caching for high-traffic scenarios
- The database query is optimized with a `select` to fetch only required fields
