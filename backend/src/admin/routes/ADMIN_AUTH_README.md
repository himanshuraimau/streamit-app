# Admin Authentication Routes

## Overview

The admin authentication routes provide endpoints for admin users to sign in, sign out, and check their session status. These routes use Better Auth for session management and are integrated with the existing authentication system.

## Endpoints

### POST /api/admin/auth/sign-in

Sign in an admin user with email and password.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "SUPER_ADMIN"
  },
  "session": {
    "token": "session_token",
    "expiresAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- 400: Missing email or password
- 401: Invalid credentials
- 403: User is not an admin (checked by adminAuthMiddleware on subsequent requests)
- 500: Internal server error

### POST /api/admin/auth/sign-out

Sign out the current admin user.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Signed out successfully"
}
```

**Error Response:**
- 500: Internal server error

### GET /api/admin/auth/session

Get the current admin session information.

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "SUPER_ADMIN"
  },
  "session": {
    "token": "session_token",
    "expiresAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- 401: No active session
- 500: Internal server error

## Implementation Details

- **Authentication**: Uses Better Auth's built-in email/password authentication
- **Session Management**: Sessions are managed by Better Auth with HTTP-only cookies
- **Middleware**: Auth routes are excluded from adminAuthMiddleware to allow sign-in
- **Role Verification**: Admin role verification happens via adminAuthMiddleware on protected routes

## Requirements Satisfied

- 1.1: Admin authentication using Better Auth
- 1.4: Session creation on successful authentication
- 1.5: Session retrieval endpoint
- 1.6: Sign-out endpoint

## Testing

To test these endpoints manually:

1. Start the backend server: `bun run dev`
2. Use curl or Postman to test the endpoints:

```bash
# Sign in
curl -X POST http://localhost:3000/api/admin/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}' \
  -c cookies.txt

# Get session (uses cookies from sign-in)
curl -X GET http://localhost:3000/api/admin/auth/session \
  -b cookies.txt

# Sign out
curl -X POST http://localhost:3000/api/admin/auth/sign-out \
  -b cookies.txt
```
