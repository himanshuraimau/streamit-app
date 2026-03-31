# Environment Setup Guide

This guide explains how to configure environment variables for all StreamIt applications.

## Quick Reference

| Application | Port | Environment File | Purpose |
|------------|------|------------------|---------|
| Backend | 3000 | `backend/.env` | API server and business logic |
| Frontend | 5173 | `frontend/.env` | User-facing web application |
| Admin Dashboard | 5174 | `admin-frontend/.env` | Admin control panel |

## Setup Steps

### 1. Backend Configuration

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your credentials:

**Required Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Random secret (min 32 chars)
- `BETTER_AUTH_URL` - Backend URL (http://localhost:3000)
- `FRONTEND_URL` - Frontend URL (http://localhost:5173)
- `ADMIN_FRONTEND_URL` - Admin dashboard URL (http://localhost:5174)
- `RESEND_API_KEY` - Email service API key
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME` - S3 storage
- `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` - Streaming service
- `DODO_API_KEY`, `DODO_WEBHOOK_SECRET` - Payment gateway

**Optional Variables:**
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (default: development)
- `ADMIN_EXPORT_SIGNING_SECRET` - Admin export security

**Generate Secrets:**
```bash
# Generate BETTER_AUTH_SECRET
openssl rand -base64 32

# Generate ADMIN_EXPORT_SIGNING_SECRET
openssl rand -base64 32
```

### 2. Frontend Configuration

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_URL="http://localhost:3000"
VITE_LIVEKIT_WS_URL="wss://your-project.livekit.cloud"
```

**Note:** `VITE_LIVEKIT_WS_URL` is optional - the frontend gets this from backend API responses.

### 3. Admin Dashboard Configuration

```bash
cd admin-frontend
cp .env.example .env
```

Edit `admin-frontend/.env`:

```env
VITE_API_URL="http://localhost:3000"
```

## Service Setup

### PostgreSQL Database

**Local Setup:**
```bash
# Install PostgreSQL 16
# macOS
brew install postgresql@16

# Ubuntu/Debian
sudo apt install postgresql-16

# Start PostgreSQL
brew services start postgresql@16  # macOS
sudo systemctl start postgresql    # Linux

# Create database
createdb streamit
```

**Connection String Format:**
```
postgresql://username:password@host:port/database
```

Example:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/streamit"
```

### AWS S3 Storage

1. Create an AWS account at https://aws.amazon.com
2. Create an S3 bucket for file storage
3. Create an IAM user with S3 access
4. Generate access keys
5. Add credentials to `backend/.env`:
   ```env
   AWS_REGION="us-east-1"
   AWS_ACCESS_KEY_ID="your-access-key"
   AWS_SECRET_ACCESS_KEY="your-secret-key"
   S3_BUCKET_NAME="streamit-files"
   ```

### LiveKit Streaming

**Option 1: LiveKit Cloud (Recommended)**
1. Sign up at https://livekit.io
2. Create a project
3. Get API credentials from dashboard
4. Add to `backend/.env`:
   ```env
   LIVEKIT_URL="wss://your-project.livekit.cloud"
   LIVEKIT_API_KEY="your-api-key"
   LIVEKIT_API_SECRET="your-api-secret"
   ```

**Option 2: Self-Hosted**
1. Follow LiveKit self-hosting guide
2. Configure your LiveKit server
3. Use your server URL and credentials

### Resend Email Service

1. Sign up at https://resend.com
2. Verify your domain (or use test mode)
3. Generate API key
4. Add to `backend/.env`:
   ```env
   RESEND_API_KEY="re_your_api_key"
   ```

### Dodo Payments

1. Sign up at https://dodopayments.com
2. Get API key from dashboard
3. Configure webhook endpoint
4. Add to `backend/.env`:
   ```env
   DODO_API_KEY="your-api-key"
   DODO_WEBHOOK_SECRET="your-webhook-secret"
   ```

## Database Setup

After configuring environment variables:

```bash
cd backend

# Install dependencies
bun install

# Generate Prisma client
bun run db:generate

# Run migrations
bun run db:migrate

# Seed initial data
bun run db:seed
bun run db:seed-discount
```

## Admin User Setup

Promote a user to admin role or create a new test admin:

**Promote Existing User:**
```bash
cd backend

# Promote to ADMIN
bun run admin:promote user@example.com

# Promote to SUPER_ADMIN
bun run admin:promote user@example.com SUPER_ADMIN
```

**Create New Test Admin:**
```bash
cd backend

# Create test admin with ADMIN role
bun run admin:promote --create admin@test.com password123

# Create test admin with SUPER_ADMIN role
bun run admin:promote --create admin@test.com password123 SUPER_ADMIN
```

## Starting the Applications

**Backend:**
```bash
cd backend
bun run dev  # http://localhost:3000
```

**Frontend:**
```bash
cd frontend
bun run dev  # http://localhost:5173
```

**Admin Dashboard:**
```bash
cd admin-frontend
bun run dev  # http://localhost:5174
```

## Production Configuration

### Backend

```env
NODE_ENV="production"
PORT=3000
DATABASE_URL="postgresql://user:pass@prod-host:5432/streamit"
BETTER_AUTH_SECRET="<strong-random-secret-min-32-chars>"
BETTER_AUTH_URL="https://api.yourdomain.com"
FRONTEND_URL="https://yourdomain.com"
ADMIN_FRONTEND_URL="https://admin.yourdomain.com"
# ... other production credentials
```

**Security Checklist:**
- ✅ Use strong secrets (min 32 characters)
- ✅ Enable HTTPS for all URLs
- ✅ Use production database with backups
- ✅ Rotate secrets regularly
- ✅ Enable S3 bucket encryption
- ✅ Configure proper CORS origins (FRONTEND_URL and ADMIN_FRONTEND_URL)
- ✅ Use environment-specific credentials
- ✅ Never commit .env files to git
- ✅ Restrict admin dashboard access (IP whitelist, VPN, etc.)

### Frontend

```env
VITE_API_URL="https://api.yourdomain.com"
VITE_LIVEKIT_WS_URL="wss://your-project.livekit.cloud"
```

**Build for Production:**
```bash
cd frontend
bun run build
# Deploy dist/ folder to CDN or static hosting
```

### Admin Dashboard

```env
VITE_API_URL="https://api.yourdomain.com"
```

**Build for Production:**
```bash
cd admin-frontend
bun run build
# Deploy dist/ folder to secure subdomain (e.g., admin.yourdomain.com)
```

## Troubleshooting

### Database Connection Issues

**Error:** `Can't reach database server`
- Check PostgreSQL is running
- Verify DATABASE_URL format
- Check firewall settings
- Ensure database exists

### Authentication Issues

**Error:** `Invalid session`
- Check BETTER_AUTH_SECRET is set
- Verify BETTER_AUTH_URL matches backend URL
- Clear browser cookies
- Check session expiration

### File Upload Issues

**Error:** `S3 upload failed`
- Verify AWS credentials
- Check S3 bucket exists
- Verify IAM permissions
- Check bucket CORS configuration

### Streaming Issues

**Error:** `LiveKit connection failed`
- Verify LIVEKIT_URL is correct
- Check API credentials
- Ensure WebSocket connections allowed
- Check firewall/proxy settings

### Email Issues

**Error:** `Email send failed`
- Verify RESEND_API_KEY
- Check domain verification
- Review Resend dashboard logs
- Check email rate limits

## Environment Variables Reference

See individual `.env.example` files for complete documentation:
- `backend/.env.example` - Backend configuration (122 lines)
- `frontend/.env.example` - Frontend configuration (51 lines)
- `admin-frontend/.env.example` - Admin dashboard configuration (40 lines)

## Security Best Practices

1. **Never commit .env files** - They're in .gitignore
2. **Use strong secrets** - Minimum 32 characters, random
3. **Rotate credentials** - Change secrets periodically
4. **Separate environments** - Different credentials for dev/staging/prod
5. **Limit access** - Only give credentials to those who need them
6. **Use secret management** - Consider AWS Secrets Manager, HashiCorp Vault
7. **Monitor usage** - Track API usage and set alerts
8. **Enable 2FA** - On all service accounts (AWS, LiveKit, etc.)

## Getting Help

- Check `.env.example` files for detailed comments
- Review service documentation (AWS, LiveKit, Resend, Dodo)
- Check application logs for specific errors
- Verify all services are running and accessible
