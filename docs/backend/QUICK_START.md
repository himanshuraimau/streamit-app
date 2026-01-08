# Quick Start Guide

Get your StreamIt backend up and running in minutes.

## Prerequisites

- [Bun](https://bun.sh/) v1.0+
- PostgreSQL 15+
- Node.js 18+ (for some tools)
- Git

## 5-Minute Setup

### 1. Clone & Install (1 min)

```bash
cd backend
bun install
```

### 2. Database Setup (2 min)

```bash
# Create database
createdb streamit

# Configure connection
echo 'DATABASE_URL="postgresql://localhost:5432/streamit"' > .env

# Run migrations
bun run db:migrate
```

### 3. Minimal Environment (1 min)

Add to `.env`:

```bash
# Required
DATABASE_URL="postgresql://localhost:5432/streamit"
BETTER_AUTH_SECRET="your-32-char-secret-generate-with-openssl-rand-base64-32"
BETTER_AUTH_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:5173"

# Optional for basic testing (use dummy values)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="dummy"
AWS_SECRET_ACCESS_KEY="dummy"
S3_BUCKET_NAME="dummy"

LIVEKIT_URL="wss://dummy.livekit.cloud"
LIVEKIT_API_KEY="dummy"
LIVEKIT_API_SECRET="dummy"

DODO_API_KEY="dummy"
RESEND_API_KEY="dummy"
```

### 4. Start Server (1 min)

```bash
bun run dev
```

Server running at `http://localhost:3000`! 🎉

### 5. Test It

```bash
# Health check
curl http://localhost:3000/health

# Expected: {"status":"ok","database":"connected","timestamp":"..."}
```

## What Works Without External Services

With the minimal setup above, you can:

✅ **Authentication**
- Sign up with email/password
- Sign in
- Session management
- User profiles

✅ **Database Operations**
- All CRUD operations
- User management
- Creator applications (without file uploads)

✅ **Basic API Testing**
- All endpoints except file uploads, streaming, payments

❌ **Not Working Yet**
- File uploads (needs S3)
- Live streaming (needs LiveKit)
- Payments (needs Dodo Payments)
- Email OTP (needs Resend)

## Full Setup

For complete functionality, set up external services:

### 1. AWS S3 (File Uploads)
See [CONFIGURATION.md](./CONFIGURATION.md#aws-s3-setup)

### 2. LiveKit (Streaming)
See [CONFIGURATION.md](./CONFIGURATION.md#livekit-setup)

### 3. Dodo Payments (Monetization)
See [CONFIGURATION.md](./CONFIGURATION.md#dodo-payments-setup)

### 4. Resend (Emails)
See [CONFIGURATION.md](./CONFIGURATION.md#email-service-setup)

## Development Workflow

### Make Changes

```bash
# Edit code (hot reload enabled)
vim src/controllers/user.controller.ts

# Changes apply automatically
```

### Database Changes

```bash
# Edit schema
vim prisma/schema.prisma

# Create migration
bun run db:migrate

# View database
bun run db:studio
```

### Test Endpoints

```bash
# Using curl
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User","username":"testuser"}'

# Using HTTPie (install: brew install httpie)
http POST localhost:3000/api/auth/sign-up/email \
  email=test@example.com \
  password=password123 \
  name="Test User" \
  username=testuser
```

## Common Issues

### Database Connection Error

```bash
# Check PostgreSQL is running
pg_isready

# Verify connection string
psql $DATABASE_URL

# Reset database if needed
bunx prisma migrate reset
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use different port
PORT=3001 bun run dev
```

### Prisma Client Not Generated

```bash
# Generate client
bun run db:generate
```

## Next Steps

1. **Read API Docs**: [API_ENDPOINTS.md](./API_ENDPOINTS.md)
2. **Understand Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
3. **Setup Production**: [CONFIGURATION.md](./CONFIGURATION.md)
4. **Learn Database**: [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

## Useful Commands

```bash
# Development
bun run dev              # Start dev server with hot reload
bun run build            # Build for production
bun start                # Start production server

# Database
bun run db:generate      # Generate Prisma client
bun run db:migrate       # Create & run migration
bun run db:push          # Push schema changes (dev)
bun run db:studio        # Open Prisma Studio GUI
bun run db:seed          # Seed payment data
bun run db:seed-discount # Seed discount codes

# Better Auth
bun run auth:generate    # Generate Better Auth types
```

## Project Structure Quick Reference

```
backend/
├── src/
│   ├── index.ts              # Entry point
│   ├── controllers/          # Request handlers
│   ├── routes/               # Route definitions
│   ├── services/             # Business logic
│   ├── middleware/           # Express middleware
│   └── lib/                  # Utilities
│       ├── auth.ts           # Better Auth config
│       ├── db.ts             # Prisma client
│       └── s3.ts             # AWS S3 utils
└── prisma/
    ├── schema.prisma         # Database schema
    └── migrations/           # Migration history
```

## Getting Help

- **Docs**: Start with [INDEX.md](./INDEX.md)
- **API Reference**: [API_ENDPOINTS.md](./API_ENDPOINTS.md)
- **Setup Issues**: [CONFIGURATION.md](./CONFIGURATION.md)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)

---

**Ready to build something awesome!** 🚀

Start developing and refer to the detailed docs as needed.
