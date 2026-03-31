# StreamIt Platform - Complete Documentation

## Overview
StreamIt is a comprehensive live streaming and social media platform built with modern web technologies. The platform enables creators to broadcast live streams, share content, monetize through virtual gifts, and engage with their audience through social features.

---

## Technology Stack

### Backend
- **Runtime**: Bun (JavaScript runtime)
- **Framework**: Express.js 5.x
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth (JWT-based)
- **File Storage**: AWS S3
- **Live Streaming**: LiveKit
- **Payment Gateway**: Dodo Payments
- **Email**: Resend
- **API Documentation**: Swagger/OpenAPI

### Key Dependencies
- `@prisma/client` - Database ORM
- `better-auth` - Authentication system
- `livekit-server-sdk` - Live streaming infrastructure
- `dodopayments` - Payment processing
- `sharp` - Image processing
- `multer` - File upload handling
- `zod` - Schema validation
- `cors` - Cross-origin resource sharing

---

## Architecture Overview

### Project Structure
```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic
│   ├── middleware/      # Express middleware
│   ├── lib/             # Utilities and configurations
│   └── types/           # TypeScript type definitions
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Database migrations
└── dist/                # Compiled output
```

---

## Core Features

### 1. Authentication & User Management

#### User Roles
- **USER**: Regular platform users
- **CREATOR**: Approved content creators with streaming privileges
- **ADMIN**: Platform administrators
- **SUPER_ADMIN**: Full system access

#### Authentication Features
- Email/password authentication
- OTP verification for email
- Session management with JWT tokens
- OAuth support (via Better Auth)
- Password reset functionality

#### User Profile
- Username, email, phone
- Profile picture and bio
- Age verification
- Account suspension system
- Last login tracking

### 2. Creator Application System

#### Application Workflow
1. **DRAFT**: Initial application state
2. **PENDING**: Submitted for review
3. **UNDER_REVIEW**: Being reviewed by admin
4. **APPROVED**: Creator access granted
5. **REJECTED**: Application denied

#### Required Information
- **Identity Verification**
  - ID type (Aadhaar, Passport, Driver's License)
  - ID document upload
  - Selfie photo verification
  
- **Financial Details**
  - Bank account information
  - IFSC code
  - PAN number (encrypted)
  - Account holder name

- **Creator Profile**
  - Profile picture
  - Bio
  - Content categories (Education, Entertainment, Gaming, Music, etc.)

### 3. Live Streaming

#### Stream Configuration
- Title and description
- Thumbnail image
- Category and tags
- Audience settings (Public, Followers Only, Invite Only)
- Camera facing mode (Front/Back)
- Audio-only mode
- Filter presets (Warm, Cool, Noir, Pop)
- Music presets (Ambient, Hype, Lofi, Acoustic)

#### Stream Features
- Real-time chat
- Chat moderation (delay, followers-only)
- Virtual gift receiving
- Viewer statistics
- Stream reports and moderation

#### Stream Statistics
- Peak viewers
- Total viewers
- Total likes
- Total gifts received
- Total coins earned
- Stream duration

### 4. Social Media Features

#### Content Types
- **TEXT**: Text-only posts
- **IMAGE**: Image posts with captions
- **VIDEO**: Video posts
- **MIXED**: Text with media
- **SHORTS**: Short-form videos (<60 seconds)

#### Post Features
- Multiple media attachments
- Like and comment system
- Nested comments (replies)
- View tracking
- Share tracking
- Visibility controls
- Comment moderation

#### Social Interactions
- Follow/unfollow users
- Block/unblock users
- Like posts and comments
- Comment on posts
- View user profiles
- Follower/following lists

### 5. Monetization System

#### Virtual Currency (Coins)
- Users purchase coin packages
- Coins used to send virtual gifts
- Creators earn coins from gifts
- Withdrawal system for creators

#### Coin Packages
- Multiple package tiers
- Bonus coins on purchase
- Promotional pricing
- Currency support (INR)

#### Virtual Gifts
- Predefined gift catalog
- Coin-based pricing
- Animated gift effects
- Gift messages
- Real-time gift notifications

#### Creator Earnings
- Coin-to-currency conversion
- Withdrawal requests
- Platform fee deduction
- Manual payout approval
- Withdrawal status tracking
  - PENDING
  - UNDER_REVIEW
  - ON_HOLD
  - APPROVED
  - REJECTED
  - PAID

### 6. Discount Code System

#### Code Types
- **PROMOTIONAL**: Platform-wide codes
- **REWARD**: User-specific reward codes

#### Discount Types
- **PERCENTAGE**: Percentage off (1-100%)
- **FIXED**: Fixed amount discount

#### Features
- Usage limits
- Expiration dates
- Minimum purchase requirements
- One-time use codes
- Bonus coin rewards
- Redemption tracking

### 7. Payment Integration

#### Dodo Payments
- Secure payment processing
- Webhook verification
- Transaction tracking
- Refund support
- Multiple currency support

#### Payment Flow
1. User selects coin package
2. Optional discount code application
3. Payment gateway redirect
4. Webhook confirmation
5. Coin credit to wallet
6. Transaction record

### 8. Content Moderation

#### Report System
- Report reasons:
  - Spam
  - Harassment
  - Hate speech
  - Nudity
  - Violence
  - Copyright
  - Misinformation
  - Self-harm
  - Other

#### Moderation Actions
- Hide/unhide posts
- Hide/unhide comments
- Delete content
- Review reports

#### Stream Moderation
- Stream-specific reports
- Real-time moderation
- Chat controls
- Viewer blocking

---

## API Structure

### Authentication Routes (`/api/auth`)
- POST `/send-verification-otp` - Send email OTP
- POST `/verify-otp` - Verify OTP code
- POST `/sign-up` - User registration
- POST `/sign-in` - User login
- POST `/sign-out` - User logout
- GET `/get-session` - Get current session
- POST `/forgot-password` - Password reset request
- POST `/reset-password` - Reset password

### Creator Routes (`/api/creator`)
- GET `/application` - Get creator application
- POST `/application` - Submit creator application
- PUT `/application` - Update application
- POST `/application/identity` - Upload identity docs
- POST `/application/financial` - Submit financial details
- POST `/application/profile` - Submit creator profile
- GET `/earnings` - View earnings
- POST `/withdraw` - Request withdrawal

### Stream Routes (`/api/stream`)
- POST `/go-live` - Start streaming
- POST `/end-stream` - End stream
- PUT `/update` - Update stream settings
- GET `/token` - Get viewer token
- GET `/live` - Get live streams
- GET `/:streamId` - Get stream details
- GET `/:streamId/stats` - Get stream statistics
- POST `/:streamId/report` - Report stream

### Content Routes (`/api/content`)
- POST `/posts` - Create post
- GET `/posts` - Get feed
- GET `/posts/:postId` - Get post details
- PUT `/posts/:postId` - Update post
- DELETE `/posts/:postId` - Delete post
- POST `/posts/:postId/like` - Like post
- DELETE `/posts/:postId/like` - Unlike post
- POST `/posts/:postId/comments` - Add comment
- GET `/posts/:postId/comments` - Get comments
- PUT `/comments/:commentId` - Update comment
- DELETE `/comments/:commentId` - Delete comment
- POST `/comments/:commentId/like` - Like comment
- GET `/shorts` - Get short-form videos

### Social Routes (`/api/social`)
- POST `/follow/:userId` - Follow user
- DELETE `/follow/:userId` - Unfollow user
- POST `/block/:userId` - Block user
- DELETE `/block/:userId` - Unblock user
- GET `/followers` - Get followers
- GET `/following` - Get following
- GET `/profile/:userId` - Get user profile

### Payment Routes (`/api/payment`)
- GET `/wallet` - Get coin wallet
- GET `/packages` - Get coin packages
- POST `/purchase` - Initiate purchase
- GET `/gifts` - Get available gifts
- POST `/send-gift` - Send gift to creator
- GET `/transactions` - Get transaction history

### Discount Routes (`/api/discount`)
- POST `/validate` - Validate discount code
- POST `/redeem` - Redeem discount code
- GET `/my-codes` - Get user's reward codes

### Search Routes (`/api/search`)
- GET `/` - Search streams, users, categories
- GET `/trending` - Get trending content
- GET `/categories` - Get content categories

### Viewer Routes (`/api/viewer`)
- GET `/me` - Get current user info
- PUT `/profile` - Update profile
- GET `/feed` - Get personalized feed
- GET `/notifications` - Get notifications

### Webhook Routes (`/api/webhook`)
- POST `/livekit` - LiveKit webhook events
- POST `/dodo` - Dodo payment webhook

---

## Planned Features (Not Yet Implemented)

### Admin Dashboard
- User management interface
- Creator application review
- Content moderation tools
- Financial management
- Analytics dashboard
- System settings

### Compliance & Legal Tools
- Legal case management
- Takedown request system
- Geo-blocking capabilities
- Audit trail interface

### Advertisement System
- Campaign management
- Budget tracking
- Targeting configuration
- Performance analytics

---

## Database Schema

### Core Models

#### User
- Authentication data
- Profile information
- Role and permissions
- Suspension status (schema defined, admin UI not implemented)

#### Session
- JWT token management
- Expiration tracking
- IP and user agent

#### CreatorApplication
- Application status
- Identity verification
- Financial details
- Creator profile

#### Stream
- Stream configuration
- Live status
- Chat settings
- Statistics

#### Post
- Content and media
- Engagement metrics
- Visibility settings
- Moderation flags

#### CoinWallet
- Balance tracking
- Earnings history
- Spending history

#### CoinPurchase
- Transaction details
- Payment gateway data
- Discount application
- Status tracking

#### Gift & GiftTransaction
- Gift catalog
- Gift sending records
- Coin transactions

#### DiscountCode & DiscountRedemption
- Code management
- Usage tracking
- Bonus rewards

#### Report
- Content reports
- User reports
- Review status (schema defined, admin UI not implemented)

#### SystemSetting
- Platform configuration
- Used for coin-to-paise conversion rate
- Extensible for future settings

---

## Security Features

### Authentication
- JWT-based sessions
- Secure password hashing
- OTP verification
- Session expiration
- IP tracking

### Authorization
- Role-based access control (RBAC)
- Creator-only endpoints
- Admin-only endpoints
- Resource ownership validation

### Data Protection
- Encrypted sensitive data (PAN, account numbers)
- Secure file uploads
- S3 presigned URLs
- CORS configuration
- Rate limiting

### Payment Security
- Webhook signature verification
- Transaction validation
- Idempotency keys
- Secure payment gateway integration

---

## File Upload System

### Supported File Types
- Images (JPEG, PNG, GIF)
- Videos (MP4, WebM)
- Documents (PDF for verification)

### Upload Purposes
- ID documents
- Selfie photos
- Profile pictures
- Stream thumbnails
- Post media

### Storage
- AWS S3 bucket storage
- Presigned URL generation
- Image optimization with Sharp
- File size limits
- MIME type validation

---

## Email System

### Email Templates
- OTP verification
- Welcome emails
- Password reset
- Creator application status
- Withdrawal notifications
- Admin alerts

### Email Provider
- Resend API integration
- Template management
- Delivery tracking

---

## Environment Configuration

### Required Variables
```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://...

# Authentication
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000

# Frontend URLs
FRONTEND_URL=http://localhost:5173
ADMIN_FRONTEND_URL=http://localhost:5174

# Email
RESEND_API_KEY=...

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=...

# LiveKit
LIVEKIT_URL=wss://...
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...

# Payments
DODO_API_KEY=...
DODO_WEBHOOK_SECRET=...
```

---

## Development Workflow

### Setup
```bash
# Install dependencies
bun install

# Generate Prisma client
bun run db:generate

# Run migrations
bun run db:migrate

# Seed database
bun run db:seed
bun run db:seed-discount

# Start development server
bun run dev
```

### Database Commands
```bash
# Create migration
bun run db:migrate

# Deploy migrations (production)
bun run db:migrate:deploy

# Push schema changes
bun run db:push

# Open Prisma Studio
bun run db:studio
```

### Code Quality
```bash
# Type checking
bun run typecheck

# Linting
bun run lint
bun run lint:fix

# Formatting
bun run format
bun run format:check
```

---

## API Documentation

### Swagger UI
- Available at `/api/docs`
- Interactive API testing
- Schema documentation
- Example requests/responses

### OpenAPI Spec
- Available at `/api/docs.json`
- Complete API specification
- Can be imported into Postman/Insomnia

---

## Performance Considerations

### Database
- Indexed fields for fast queries
- Composite indexes for complex queries
- Connection pooling
- Query optimization

### Caching
- Session caching
- Static asset caching
- API response caching (where applicable)

### File Handling
- Image optimization
- Lazy loading
- CDN delivery (S3)
- Presigned URL expiration

### Streaming
- LiveKit infrastructure
- WebRTC optimization
- Adaptive bitrate
- Low-latency delivery

---

## Monitoring & Logging

### Health Check
- Endpoint: `/health`
- Database connectivity
- Service status
- Timestamp

### Logging
- Request/response logging
- Error tracking
- Admin action logging
- Payment transaction logging

---

## Deployment

### Production Build
```bash
# Build application
bun run build

# Start production server
bun run start
```

### Docker Support
- Dockerfile included
- Multi-stage build
- Environment variable injection
- Health check configuration

### Database Migration
```bash
# Deploy migrations
bun run db:migrate:deploy
```

---

## Error Handling

### HTTP Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "details": {}
}
```

---

## Rate Limiting

### Implemented Limits
- Authentication endpoints
- File upload endpoints
- Payment endpoints
- API request throttling

---

## Webhooks

### LiveKit Webhooks
- Stream started
- Stream ended
- Participant joined
- Participant left
- Recording events

### Dodo Payment Webhooks
- Payment successful
- Payment failed
- Refund processed
- Subscription events


## Contact & Resources

### Documentation
- API docs: `/api/docs`
- Database schema: `prisma/schema.prisma`
- Environment setup: `.env.example`

### Development
- Runtime: Bun v1.3.0+
- Node compatibility: Node.js 18+
- Database: PostgreSQL 14+

---

*Last Updated: March 2026*
*Version: 1.0.0*
