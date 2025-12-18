# Backend Documentation

## Overview

The backend is a Node.js/Express API server built with Bun runtime, providing REST APIs for a live streaming platform with social features, content management, and payment integration.

## Tech Stack

- **Runtime**: Bun
- **Framework**: Express 5.x
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth with email OTP support
- **File Storage**: AWS S3
- **Live Streaming**: LiveKit
- **Payments**: Dodo Payments
- **Email**: Resend
- **Validation**: Zod

## Project Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── routes/          # API route definitions
│   ├── middleware/      # Auth, validation, upload middleware
│   ├── lib/             # Core utilities (auth, db, s3, validations)
│   └── types/           # TypeScript type definitions
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Database migrations
└── scripts/             # Utility scripts
```

## Environment Variables

```env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
FRONTEND_URL=http://localhost:5173
RESEND_API_KEY=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
AWS_S3_BUCKET=...
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
LIVEKIT_URL=wss://...
DODO_API_KEY=...
DODO_WEBHOOK_SECRET=...
```

## Database Models

### Core Models
- **User** - User accounts with profile info
- **Session** - Auth sessions
- **Account** - OAuth/credential accounts

### Creator System
- **CreatorApplication** - Creator application workflow
- **IdentityVerification** - ID verification for creators
- **FinancialDetails** - Bank details for payouts
- **CreatorProfile** - Creator bio and categories

### Streaming
- **Stream** - Stream configuration and status
- **FileUpload** - Uploaded file tracking

### Social Features
- **Follow** - User following relationships
- **Block** - User blocking
- **Post** - Social media posts
- **PostMedia** - Media attachments
- **Like** - Post likes
- **Comment** - Post comments
- **CommentLike** - Comment likes

### Payments
- **CoinWallet** - User coin balance
- **CoinPackage** - Purchasable coin packages
- **CoinPurchase** - Purchase records
- **Gift** - Virtual gifts
- **GiftTransaction** - Gift sending records

### Discount System
- **DiscountCode** - Promotional and reward discount codes
- **DiscountRedemption** - Tracks code usage per user/purchase

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup/email` | Register with email/password |
| POST | `/signin/email` | Login with email/password |
| POST | `/signin/email-otp` | Login with OTP |
| POST | `/send-verification-otp` | Send OTP for verification |
| POST | `/check-verification-otp` | Verify OTP |
| POST | `/verify-email` | Verify email address |
| POST | `/forget-password/email-otp` | Request password reset |
| POST | `/reset-password/email-otp` | Reset password with OTP |
| GET | `/get-session` | Get current session (Better Auth) |
| POST | `/sign-out` | Sign out (Better Auth) |

### Content (`/api/content`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/feed/public` | No | Get public post feed |
| GET | `/posts/:postId` | No | Get single post |
| GET | `/posts/:postId/comments` | No | Get post comments |
| GET | `/users/:userId/posts` | No | Get user's posts |
| POST | `/posts` | Yes | Create post (multipart) |
| GET | `/posts` | Yes | Get my posts |
| PUT | `/posts/:postId` | Yes | Update post |
| DELETE | `/posts/:postId` | Yes | Delete post |
| POST | `/posts/:postId/like` | Yes | Toggle like |
| POST | `/comments` | Yes | Add comment |
| GET | `/feed` | Yes | Get personalized feed |

### Streaming (`/api/stream`) - Creator Only

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/create` | Create stream with metadata |
| GET | `/past` | Get past streams |
| POST | `/ingress` | Create stream key (RTMP/WHIP) |
| DELETE | `/ingress` | Delete stream key |
| GET | `/info` | Get stream info |
| GET | `/credentials` | Get stream credentials |
| PUT | `/info` | Update stream info |
| PUT | `/chat-settings` | Update chat settings |
| GET | `/status` | Get live status |
| POST | `/creator-token` | Get token for viewing own stream |

### Viewer (`/api/viewer`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/me` | Yes | Get current user |
| GET | `/profile` | Yes | Get profile |
| PATCH | `/profile` | Yes | Update profile |
| POST | `/avatar` | Yes | Upload avatar |
| PATCH | `/password` | Yes | Change password |
| GET | `/stream/:username` | No | Get stream by username |
| POST | `/token` | Optional | Get viewer token |
| GET | `/live` | No | Get all live streams |
| GET | `/recommended` | No | Get recommended streams |
| GET | `/following` | Yes | Get followed streams |
| GET | `/search` | No | Search streams |

### Social (`/api/social`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/follow/:userId` | Yes | Follow creator |
| DELETE | `/follow/:userId` | Yes | Unfollow creator |
| GET | `/follow/:userId` | Optional | Check follow status |
| GET | `/followers/:userId` | No | Get user's followers |
| GET | `/following/:userId` | No | Get user's following |
| POST | `/block/:userId` | Yes | Block user |
| DELETE | `/block/:userId` | Yes | Unblock user |
| GET | `/creators` | No | Get all creators |
| GET | `/creator/:username` | No | Get creator profile |

### Payment (`/api/payment`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/wallet` | Yes | Get coin wallet |
| GET | `/packages` | No | Get coin packages |
| POST | `/purchase` | Yes | Create checkout session |
| GET | `/gifts` | No | Get available gifts |
| POST | `/gift` | Yes | Send gift to creator |
| GET | `/purchases` | Yes | Get purchase history |
| GET | `/gifts-sent` | Yes | Get gifts sent |
| GET | `/gifts-received` | Yes | Get gifts received |

### Discount (`/api/discount`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/validate` | Yes | Validate discount code for package |
| GET | `/my-codes` | Yes | Get user's reward codes |
| GET | `/latest-reward` | Yes | Get latest reward code |

### Search (`/api/search`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Search users and streams |

### Webhooks (`/api/webhook`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/livekit` | LiveKit stream events |
| POST | `/dodo` | Dodo payment events |

## Authentication

The API uses Better Auth with Bearer token authentication:

1. Client authenticates via `/api/auth/signin/email` or OTP flow
2. Server returns token in `set-auth-token` header
3. Client stores token in localStorage
4. Client sends `Authorization: Bearer <token>` header

### Middleware

- `requireAuth` - Requires valid authentication
- `optionalAuth` - Attaches user if authenticated
- `requireCreator` - Requires approved creator status

## Services

### StreamService
Manages LiveKit ingress creation, stream status, and metadata.

### ContentService
Handles post CRUD, media uploads to S3, likes, and comments.

### PaymentService
Manages coin wallets, Dodo checkout sessions, and gift transactions.

### TokenService
Generates LiveKit tokens for viewers and creators.

### MediaService
Handles image processing with Sharp and S3 uploads.

### DiscountService
Manages discount code validation, bonus coin calculation, redemption tracking, and reward code generation after purchases.

## Running the Server

```bash
# Install dependencies
bun install

# Generate Prisma client
bun run db:generate

# Run migrations
bun run db:migrate

# Seed payment data
bun run db:seed

# Seed discount codes
bun run db:seed-discount

# Start development server
bun run dev

# Start production server
bun run start
```

## API Response Format

All endpoints return consistent JSON:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": [ ... ]  // Validation errors
}
```
