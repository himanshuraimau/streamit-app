# StreamIt Backend Documentation

## Overview

StreamIt backend is a comprehensive live streaming platform API built with **Express.js** and **TypeScript** on the **Bun runtime**. It provides a complete suite of features for live streaming, social interactions, content creation, payments, and user management.

## Tech Stack

### Core Technologies
- **Runtime**: Bun (modern JavaScript runtime)
- **Framework**: Express.js 5.x
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth with Bearer tokens
- **File Storage**: AWS S3 with presigned URLs
- **Live Streaming**: LiveKit (WebRTC)
- **Payment Gateway**: Dodo Payments
- **Email Service**: Resend

### Key Libraries
- `@prisma/client` - Database ORM
- `better-auth` - Authentication framework
- `livekit-server-sdk` - WebRTC streaming
- `dodopayments` - Payment processing
- `@aws-sdk/client-s3` - File storage
- `resend` - Email service
- `sharp` - Image processing
- `multer` - File uploads
- `zod` - Validation schemas
- `cors` - Cross-origin resource sharing

## Architecture

### Directory Structure
```
backend/
├── prisma/              # Database schema and migrations
│   ├── schema.prisma    # Data models
│   ├── migrations/      # Database migrations
│   └── seed-*.ts        # Database seeders
├── src/
│   ├── index.ts         # Application entry point
│   ├── controllers/     # Request handlers
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic layer
│   ├── middleware/      # Express middleware
│   ├── lib/             # Shared utilities
│   │   ├── auth.ts      # Better Auth configuration
│   │   ├── db.ts        # Prisma client
│   │   ├── s3.ts        # AWS S3 utilities
│   │   └── validations/ # Zod validation schemas
│   └── types/           # TypeScript type definitions
└── docs/                # Documentation
```

### API Architecture Pattern
The backend follows a **layered architecture**:

1. **Routes Layer** (`routes/`) - Define endpoints and route parameters
2. **Middleware Layer** (`middleware/`) - Authentication, validation, file uploads
3. **Controller Layer** (`controllers/`) - Handle HTTP requests/responses
4. **Service Layer** (`services/`) - Core business logic
5. **Data Layer** (Prisma) - Database interactions

## Core Features

### 1. Authentication & Authorization
- Email/password authentication with OTP verification
- Bearer token support (Better Auth)
- Session management with cookies
- Email OTP for sign-in and password reset
- Cross-domain authentication support
- Role-based access (viewer, creator, admin)

### 2. User Management
- User profiles with bio, avatar, username
- Creator application system with approval workflow
- Identity verification (ID documents, selfie)
- Financial details for payouts
- Multi-step creator onboarding

### 3. Live Streaming (WebRTC)
- LiveKit integration for WebRTC streaming
- Creator-only stream setup and go-live
- Real-time viewer tokens
- Chat settings (enabled, delayed, followers-only)
- Stream metadata (title, description, thumbnail)
- Live/offline status tracking

### 4. Social Features
- Follow/unfollow creators
- Block/unblock users
- Post creation (text, images, videos, mixed)
- Like posts and comments
- Comment system with nested replies
- Public feed and personalized feed
- User profiles and creator discovery

### 5. Content Management
- Media uploads (images, videos)
- AWS S3 storage with presigned URLs
- Image optimization with Sharp
- Content moderation capabilities
- Post visibility controls
- Rich media support

### 6. Payment & Monetization
- Coin-based virtual economy
- Coin packages with bonus coins
- Virtual gifts for creators
- Gift animations and transactions
- Coin wallet management
- Transaction history
- Discount code system (promotional & reward)
- Dodo Payments integration
- Webhook-based payment confirmation

### 7. Search & Discovery
- Stream search
- Creator search
- Content search
- Live stream discovery
- Recommended streams
- Followed streams feed

## Environment Configuration

See [Configuration Guide](./CONFIGURATION.md) for detailed environment setup.

### Required Environment Variables
```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/streamit"

# Authentication
BETTER_AUTH_SECRET="your-secret"
BETTER_AUTH_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:5173"

# AWS S3
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
S3_BUCKET_NAME="your-bucket"

# LiveKit
LIVEKIT_URL="wss://your-server.com"
LIVEKIT_API_KEY="your-key"
LIVEKIT_API_SECRET="your-secret"

# Dodo Payments
DODO_API_KEY="your-key"
DODO_WEBHOOK_SECRET="your-secret"

# Email
RESEND_API_KEY="your-key"

# Server
PORT=3000
NODE_ENV="development"
```

## Getting Started

### Installation
```bash
# Install dependencies
bun install

# Generate Prisma client
bun run db:generate

# Run migrations
bun run db:migrate

# Seed database (optional)
bun run db:seed
bun run db:seed-discount
```

### Development
```bash
# Start development server with hot reload
bun run dev

# Build for production
bun run build

# Start production server
bun start
```

### Database Management
```bash
# Open Prisma Studio (GUI)
bun run db:studio

# Create new migration
bun run db:migrate

# Deploy migrations (production)
bun run db:migrate:deploy

# Push schema changes (development)
bun run db:push
```

## API Documentation

### Base URL
- Development: `http://localhost:3000`
- Production: `https://api.voltstream.space`

### Authentication
Most endpoints require authentication via Bearer token or cookie session.

**Header Format**:
```
Authorization: Bearer <token>
```

or use cookie-based session (set automatically by Better Auth).

### Detailed API References
- [API Endpoints](./API_ENDPOINTS.md) - Complete endpoint reference
- [Database Schema](./DATABASE_SCHEMA.md) - Data models and relationships

## CORS Configuration

The backend supports cross-origin requests from:
- `http://localhost:5173` (local development)
- `https://voltstream.space` (production)
- `https://www.voltstream.space` (production with www)

Credentials (cookies) are enabled for authenticated requests.

## Webhook Configuration

### LiveKit Webhooks
Configure in LiveKit dashboard:
- **URL**: `https://your-domain.com/api/webhook/livekit`
- **Events**: `ingress_started`, `ingress_ended`, `room_finished`

### Dodo Payment Webhooks
Configure in Dodo dashboard:
- **URL**: `https://your-domain.com/api/webhook/dodo`
- **Events**: `payment.completed`, `payment.failed`

## Error Handling

All API errors follow a consistent format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

Common error codes:
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `VALIDATION_ERROR` (400)
- `INTERNAL_ERROR` (500)

## Security Features

- **Input Validation**: Zod schemas for all inputs
- **Authentication**: Bearer tokens and secure cookies
- **CORS**: Restricted to allowed origins
- **File Upload Limits**: Max 10 files, size limits enforced
- **SQL Injection Protection**: Prisma parameterized queries
- **XSS Protection**: Input sanitization
- **Rate Limiting**: (TODO: Implement rate limiting)

## Performance Considerations

- **Connection Pooling**: Prisma connection pooling
- **Efficient Queries**: Selective field queries, proper indexing
- **File Storage**: S3 with CDN support
- **Lazy Loading**: Paginated feeds and lists
- **Caching**: (TODO: Implement Redis caching)

## Deployment

### Docker Support
Dockerfile included for containerized deployment.

```bash
# Build image
docker build -t streamit-backend .

# Run container
docker run -p 3000:3000 --env-file .env streamit-backend
```

### Deployment Script
```bash
# Deploy to server
bash deploy.sh
```

## Testing

(TODO: Add testing documentation)

## Monitoring & Logging

- **Health Check**: `GET /health` - Check API and database status
- **Console Logging**: Detailed logs for debugging
- **Error Tracking**: (TODO: Integrate Sentry or similar)

## Contributing

1. Follow TypeScript best practices
2. Use Prisma for all database operations
3. Validate all inputs with Zod schemas
4. Add JSDoc comments for public APIs
5. Follow RESTful conventions
6. Test thoroughly before PR

## License

[Add your license information]

## Support

For issues and questions:
- GitHub Issues: [Your repo]
- Email: [Your email]
- Documentation: See other docs in this folder

---

**Last Updated**: January 8, 2026
