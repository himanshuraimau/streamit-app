# StreamIt Backend API

A comprehensive backend API for a live streaming and social media platform built with Bun, Express, Prisma, and PostgreSQL. This backend powers creator applications, live streaming, social interactions, payments, and content management.

## Tech Stack

- **Runtime**: Bun (fast JavaScript runtime)
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth (email/password, OAuth, OTP)
- **File Storage**: AWS S3
- **Live Streaming**: LiveKit
- **Payments**: Dodo Payments
- **Email**: Resend
- **API Documentation**: Swagger/OpenAPI

## Features

### Core Features
- User authentication and authorization (email/password, OAuth, OTP)
- Role-based access control (User, Creator, Admin, Super Admin)
- Creator application and verification system
- Live streaming with LiveKit integration
- Social media features (posts, comments, likes, follows)
- Virtual gifting and coin-based economy
- Payment processing and withdrawals
- Discount code system (promotional and reward codes)
- Content moderation and reporting
- Real-time stream analytics
- Short-form video support (Shorts)
- Admin dashboard capabilities

### User Roles
- **User**: Regular platform users who can watch streams and interact
- **Creator**: Verified users who can create content and live stream
- **Admin**: Platform moderators with content management capabilities
- **Super Admin**: Full system access and configuration

## Project Structure

```
backend/
├── prisma/
│   ├── migrations/          # Database migration files
│   ├── schema.prisma        # Prisma schema definition
│   ├── seed-comprehensive.ts # Lean test seed
│   └── seed-helpers.ts      # Better Auth-compatible seed helpers
├── scripts/
│   └── verify-seed.ts       # Seed verification summary
├── src/
│   ├── controllers/         # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── content.controller.ts
│   │   ├── creator.controller.ts
│   │   ├── discount.controller.ts
│   │   ├── payment.controller.ts
│   │   ├── search.controller.ts
│   │   ├── social.controller.ts
│   │   ├── stream.controller.ts
│   │   ├── viewer.controller.ts
│   │   └── webhook.controller.ts
│   ├── lib/
│   │   ├── validations/     # Zod validation schemas
│   │   ├── auth.ts          # Better Auth configuration
│   │   ├── config.ts        # Environment configuration
│   │   ├── db.ts            # Prisma client
│   │   ├── email-templates.ts
│   │   ├── errors.ts        # Custom error classes
│   │   ├── otp-verification.ts
│   │   ├── s3.ts            # AWS S3 utilities
│   │   └── swagger.ts       # API documentation
│   ├── middleware/          # Express middleware
│   ├── routes/              # API route definitions
│   │   ├── auth.route.ts
│   │   ├── content.route.ts
│   │   ├── creator.route.ts
│   │   ├── discount.route.ts
│   │   ├── payment.route.ts
│   │   ├── search.route.ts
│   │   ├── social.route.ts
│   │   ├── stream.route.ts
│   │   ├── viewer.route.ts
│   │   └── webhook.route.ts
│   ├── services/            # Business logic
│   ├── types/               # TypeScript type definitions
│   └── index.ts             # Application entry point
├── .env.example             # Environment variables template
├── Dockerfile               # Docker configuration
├── deploy.sh                # Deployment script
├── package.json             # Dependencies and scripts
└── README.md                # This file
```

## Prerequisites

- [Bun](https://bun.sh) v1.0 or higher
- PostgreSQL 14 or higher
- AWS account (for S3 storage)
- LiveKit account (for streaming)
- Dodo Payments account (for payments)
- Resend account (for emails)

## Installation

### 1. Clone and Install Dependencies

```bash
cd backend
bun install
```

### 2. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and configure the following:

#### Server Configuration
```env
PORT=3000
NODE_ENV=development
```

#### Database
```env
DATABASE_URL="postgresql://username:password@localhost:5432/streamit"
```

#### Authentication
```env
BETTER_AUTH_SECRET="your-secure-random-secret-min-32-chars"
BETTER_AUTH_URL="http://localhost:3000"
```

#### Frontend URLs
```env
FRONTEND_URL="http://localhost:5173"
ADMIN_FRONTEND_URL="http://localhost:5174"
ALLOWED_ORIGINS="https://frontend-preview.vercel.app,https://admin-preview.vercel.app"
```

**Production Configuration:**
- `ADMIN_FRONTEND_URL` is required for admin panel CORS configuration
- In production, set to your admin panel domain (e.g., `https://admin.streamit.com`)
- `ALLOWED_ORIGINS` can be used for additional origins (comma-separated), such as preview URLs
- The backend automatically includes these URLs in both CORS and Better Auth trusted origins
- Secure cookies are automatically enabled in production (`NODE_ENV=production`)
- Rate limiting is stricter in production:
  - Admin routes: 500 requests per 15 minutes (vs 1000 in development)
  - Auth routes: 5 attempts per 15 minutes (vs 10 in development)

#### Email (Resend)
```env
RESEND_API_KEY="re_your_api_key"
```

#### AWS S3
```env
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your_access_key"
AWS_SECRET_ACCESS_KEY="your_secret_key"
S3_BUCKET_NAME="streamit-files"
```

#### LiveKit
```env
LIVEKIT_URL="wss://your-project.livekit.cloud"
LIVEKIT_API_KEY="your_api_key"
LIVEKIT_API_SECRET="your_api_secret"
```

#### Dodo Payments
```env
DODO_API_KEY="your_api_key"
DODO_WEBHOOK_SECRET="your_webhook_secret"
```

### 3. Database Setup

Generate Prisma client and run migrations:

```bash
# Generate Prisma client
bun run db:generate

# Run database migrations
bun run db:migrate

# Seed lean backend test data
bun run db:seed
```

### 4. Start Development Server

```bash
bun run dev
```

The server will start on `http://localhost:3000`

## Available Scripts

### Development
```bash
bun run dev              # Start development server with hot reload
bun run start            # Start production server
bun run build            # Build for production
```

### Code Quality
```bash
bun run typecheck        # Run TypeScript type checking
bun run lint             # Lint code with ESLint
bun run lint:fix         # Fix linting issues
bun run format           # Format code with Prettier
bun run format:check     # Check code formatting
```

### Database
```bash
bun run db:generate      # Generate Prisma client
bun run db:migrate       # Run migrations (development)
bun run db:migrate:deploy # Run migrations (production)
bun run db:push          # Push schema changes without migration
bun run db:studio        # Open Prisma Studio (database GUI)
bun run db:seed          # Seed lean backend test data
bun run db:reset-seed    # Clear all data and reseed
bun run db:clear-seed    # Clear all data only
bun run db:verify-seed   # Print seed summary
```

### Authentication
```bash
bun run auth:generate    # Generate Better Auth types
```

### Setup
```bash
bun run setup            # Complete setup (install + generate + migrate)
```

## API Documentation

### Swagger UI
Once the server is running, access the interactive API documentation at:
- **Swagger UI**: http://localhost:3000/api/docs
- **OpenAPI JSON**: http://localhost:3000/api/docs.json

### API Endpoints

#### Authentication (`/api/auth`)
- `POST /api/auth/sign-up` - Register new user
- `POST /api/auth/sign-in` - Login user
- `POST /api/auth/sign-out` - Logout user
- `GET /api/auth/get-session` - Get current session
- `POST /api/auth/send-otp` - Send OTP for verification
- `POST /api/auth/verify-otp` - Verify OTP code

#### Creator (`/api/creator`)
- `POST /api/creator/application` - Submit creator application
- `GET /api/creator/application` - Get application status
- `PUT /api/creator/application` - Update application
- `POST /api/creator/upload` - Upload files (ID, selfie, profile picture)
- `GET /api/creator/profile` - Get creator profile
- `PUT /api/creator/profile` - Update creator profile

#### Content (`/api/content`)
- `POST /api/content/posts` - Create post
- `GET /api/content/posts` - Get posts feed
- `GET /api/content/posts/:id` - Get single post
- `PUT /api/content/posts/:id` - Update post
- `DELETE /api/content/posts/:id` - Delete post
- `POST /api/content/posts/:id/like` - Like post
- `DELETE /api/content/posts/:id/like` - Unlike post
- `POST /api/content/posts/:id/comments` - Add comment
- `GET /api/content/posts/:id/comments` - Get comments
- `POST /api/content/shorts` - Create short video
- `GET /api/content/shorts` - Get shorts feed

#### Stream (`/api/stream`)
- `POST /api/stream/create` - Create/update stream
- `POST /api/stream/start` - Start live stream
- `POST /api/stream/stop` - Stop live stream
- `GET /api/stream/token` - Get LiveKit access token
- `GET /api/stream/live` - Get live streams
- `GET /api/stream/:id` - Get stream details
- `POST /api/stream/:id/report` - Report stream
- `GET /api/stream/:id/stats` - Get stream statistics

#### Social (`/api/social`)
- `POST /api/social/follow/:userId` - Follow user
- `DELETE /api/social/follow/:userId` - Unfollow user
- `GET /api/social/followers/:userId` - Get followers
- `GET /api/social/following/:userId` - Get following
- `POST /api/social/block/:userId` - Block user
- `DELETE /api/social/block/:userId` - Unblock user

#### Payment (`/api/payment`)
- `GET /api/payment/packages` - Get coin packages
- `POST /api/payment/purchase` - Purchase coins
- `GET /api/payment/wallet` - Get wallet balance
- `GET /api/payment/gifts` - Get available gifts
- `POST /api/payment/send-gift` - Send gift to creator
- `POST /api/payment/withdraw` - Request withdrawal (creators)
- `GET /api/payment/transactions` - Get transaction history

#### Discount (`/api/discount`)
- `POST /api/discount/validate` - Validate discount code
- `POST /api/discount/apply` - Apply discount to purchase
- `GET /api/discount/my-codes` - Get user's reward codes

#### Search (`/api/search`)
- `GET /api/search/users` - Search users
- `GET /api/search/creators` - Search creators
- `GET /api/search/posts` - Search posts
- `GET /api/search/streams` - Search streams

#### Viewer (`/api/viewer`)
- `GET /api/viewer/feed` - Get personalized feed
- `GET /api/viewer/discover` - Discover new content
- `GET /api/viewer/trending` - Get trending content

#### Webhooks (`/api/webhook`)
- `POST /api/webhook/livekit` - LiveKit webhook handler
- `POST /api/webhook/dodo` - Dodo Payments webhook handler

### Health Check
- `GET /health` - Server health status

## Database Schema

### Key Models

#### User
Core user model with authentication, profile, and role management.

#### CreatorApplication
Multi-step creator verification process including identity, financial, and profile verification.

#### Stream
Live streaming configuration and management with LiveKit integration.

#### Post & PostMedia
Social media posts with support for text, images, videos, and shorts.

#### CoinWallet & CoinPurchase
Virtual currency system for platform economy.

#### Gift & GiftTransaction
Virtual gifting system for creator monetization.

#### Follow & Block
Social relationship management.

#### Report
Content moderation and user reporting system.

#### DiscountCode & DiscountRedemption
Promotional and reward discount system.

See `prisma/schema.prisma` for complete schema definition.

## Authentication

The platform uses [Better Auth](https://better-auth.com) for authentication with the following features:

- Email/password authentication
- OAuth providers (configurable)
- OTP verification via email
- Session management with JWT
- Role-based access control
- Secure password hashing

### Session Management
Sessions are stored in the database and validated on each request. The session token is sent via:
- Cookie (for web browsers)
- Authorization header (for mobile/API clients)

## File Upload

Files are uploaded to AWS S3 with the following structure:

```
s3://bucket-name/
├── profiles/           # User profile pictures
├── ids/                # Identity documents
├── selfies/            # Verification selfies
├── streams/            # Stream thumbnails
└── posts/              # Post media (images/videos)
```

### Upload Process
1. Client requests presigned URL from backend
2. Backend generates presigned URL with S3
3. Client uploads directly to S3
4. Client confirms upload to backend
5. Backend stores file metadata in database

## Live Streaming

Live streaming is powered by LiveKit with the following flow:

### Starting a Stream
1. Creator configures stream (title, description, settings)
2. Backend creates LiveKit room
3. Creator receives access token
4. Creator connects to LiveKit room
5. Stream goes live

### Viewing a Stream
1. Viewer requests stream access
2. Backend validates permissions
3. Viewer receives access token
4. Viewer connects to LiveKit room
5. Real-time video/audio streaming

### Stream Features
- Real-time chat
- Virtual gifting during stream
- Viewer count tracking
- Stream analytics
- Multiple quality options
- Mobile and web support

## Payment System

### Coin Economy
Users purchase coins which can be used to:
- Send virtual gifts to creators
- Access premium content
- Unlock special features

### Coin Packages
Predefined packages with bonus coins:
- Starter Pack: 100 coins
- Popular Pack: 500 coins + bonus
- Premium Pack: 1000 coins + bonus
- Ultimate Pack: 5000 coins + bonus

### Creator Earnings
Creators earn coins from:
- Virtual gifts during streams
- Premium content sales
- Subscriptions (future feature)

### Withdrawal Process
1. Creator requests withdrawal
2. Admin reviews request
3. Admin approves/rejects
4. Payment processed manually
5. Creator receives payout

## Discount System

### Promotional Codes
- Created by admins
- Can be used multiple times (configurable)
- Percentage or fixed amount discount
- Minimum purchase requirements
- Expiration dates

### Reward Codes
- Generated for specific users
- One-time use only
- Given as rewards or incentives
- Can be transferred (optional)

## Moderation

### Content Moderation
- User reporting system
- Admin review dashboard
- Content hiding/removal
- User suspension
- Automated flagging (future)

### Report Types
- Spam
- Harassment
- Hate speech
- Nudity/NSFW
- Violence
- Copyright infringement
- Misinformation
- Self-harm
- Other

## Deployment

### Docker Deployment

Build and run with Docker:

```bash
# Build image
docker build -t streamit-backend .

# Run container
docker run -p 3000:3000 --env-file .env streamit-backend
```

### Production Deployment

1. Set environment to production:
```env
NODE_ENV=production
```

2. Run migrations:
```bash
bun run db:migrate:deploy
```

3. Start server:
```bash
bun run start
```

### Deployment Script

Use the provided deployment script:

```bash
chmod +x deploy.sh
./deploy.sh
```

## Security Best Practices

### Environment Variables
- Never commit `.env` files
- Use strong secrets (min 32 characters)
- Rotate secrets regularly
- Use different secrets for each environment

### Database
- Use connection pooling (configured via DATABASE_URL parameters)
  - `connection_limit`: Max connections in pool (default: 10, production: 20-30)
  - `pool_timeout`: Max wait time for connection in seconds (default: 10, production: 20-30)
  - `connect_timeout`: Max wait time for initial connection (default: 5, production: 5-10)
  - Example: `postgresql://user:pass@host:5432/db?connection_limit=25&pool_timeout=30&connect_timeout=10`
  - See `backend/src/admin/CONNECTION_POOLING.md` for detailed configuration guide
- Enable SSL for production
- Regular backups
- Restrict database access

### API Security
- Rate limiting (implement as needed)
- Input validation with Zod
- SQL injection prevention (Prisma)
- XSS protection
- CSRF protection for web clients

### File Upload
- Validate file types
- Limit file sizes
- Scan for malware (recommended)
- Use presigned URLs
- Enable S3 bucket encryption

## Monitoring

### Health Checks
The `/health` endpoint provides:
- Server status
- Database connectivity
- Timestamp

### Logging
- Request logging
- Error logging
- Audit logging for admin actions

### Metrics (Recommended)
- API response times
- Database query performance
- Error rates
- Active users
- Stream statistics

## Troubleshooting

### Database Connection Issues
```bash
# Test database connection
bun run db:studio

# Reset database (development only)
bunx prisma migrate reset
```

### Prisma Client Issues
```bash
# Regenerate Prisma client
bun run db:generate
```

### Port Already in Use
```bash
# Change PORT in .env or kill process
lsof -ti:3000 | xargs kill -9
```

### Migration Issues
```bash
# Create new migration
bunx prisma migrate dev --name migration_name

# Apply migrations
bun run db:migrate:deploy
```

## Development Tips

### Database GUI
Use Prisma Studio for database management:
```bash
bun run db:studio
```

### API Testing
- Use Swagger UI at `/api/docs`
- Use Postman/Insomnia
- Use curl or httpie

### Hot Reload
The dev server automatically reloads on file changes.

### Debugging
Add breakpoints and use Bun's built-in debugger:
```bash
bun --inspect run dev
```

## Contributing

### Code Style
- Follow ESLint rules
- Use Prettier for formatting
- Write TypeScript types
- Add JSDoc comments for public APIs

### Commit Messages
Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Maintenance

## License

Private/Proprietary

## Support

For issues and questions:
- Check API documentation at `/api/docs`
- Review error logs
- Check database with Prisma Studio
- Contact development team

---

Built with ❤️ using Bun, Express, Prisma, and PostgreSQL
