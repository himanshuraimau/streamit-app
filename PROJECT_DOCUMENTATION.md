# StreamIt Platform - Project Documentation

## Overview
StreamIt is a full-stack live streaming platform enabling creators to broadcast content, engage with viewers, and monetize through virtual gifts. Built with TypeScript, it features real-time streaming, social interactions, content management, and comprehensive admin controls.

## Tech Stack

### Backend
- **Runtime**: Bun with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 16 with Prisma ORM
- **Authentication**: Better Auth (email/password, sessions)
- **Streaming**: LiveKit Server SDK
- **Storage**: AWS S3 (media uploads)
- **Email**: Resend
- **Payment**: Dodo Payments
- **API Docs**: Swagger UI

### Frontend (User App)
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State**: Zustand
- **Data Fetching**: TanStack Query
- **Forms**: React Hook Form + Zod
- **UI Components**: Radix UI
- **Streaming**: LiveKit React Components

### Admin Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS + shadcn/ui
- **UI Components**: Radix UI primitives

## Project Structure

```
streamit/
├── backend/                    # API Server (Port 3000)
│   ├── src/
│   │   ├── controllers/       # Request handlers (10 files)
│   │   │   ├── auth.controller.ts
│   │   │   ├── content.controller.ts
│   │   │   ├── creator.controller.ts
│   │   │   ├── discount.controller.ts
│   │   │   ├── payment.controller.ts
│   │   │   ├── search.controller.ts
│   │   │   ├── social.controller.ts
│   │   │   ├── stream.controller.ts
│   │   │   ├── viewer.controller.ts
│   │   │   └── webhook.controller.ts
│   │   ├── routes/            # API route definitions (10 files)
│   │   ├── services/          # Business logic (8 files)
│   │   ├── middleware/        # Express middleware
│   │   ├── lib/               # Utilities (auth, db, config, swagger)
│   │   ├── types/             # TypeScript definitions
│   │   └── index.ts           # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema (40+ models)
│   │   ├── migrations/        # 23 migration files
│   │   ├── seed-payment.ts    # Payment data seeder
│   │   └── seed-discount.ts   # Discount code seeder
│   ├── scripts/               # Utility scripts
│   ├── .env.example           # Environment template
│   ├── package.json
│   └── Dockerfile
│
├── admin-fe/                   # Admin Dashboard (Port 5174)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/            # shadcn/ui components
│   │   │   └── theme-provider.tsx
│   │   ├── lib/
│   │   │   └── utils.ts
│   │   ├── assets/
│   │   ├── App.tsx            # Main component
│   │   ├── main.tsx           # Entry point
│   │   └── index.css          # Global styles
│   ├── public/
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.ts
│   └── components.json        # shadcn config
│
└── docker-compose.yml          # Container orchestration
```

## Core Features

### 1. Authentication & User Management
- Email/password registration with verification
- Session-based authentication (Better Auth)
- Password reset flow
- User roles: USER, CREATOR, ADMIN, SUPER_ADMIN
- Profile management (avatar, bio, username)
- Account suspension system

### 2. Creator Application System
- Multi-step application workflow
- Identity verification (Aadhaar/Passport/Driver's License)
- Financial details (bank account, IFSC, PAN)
- Profile setup (bio, categories, profile picture)
- Admin review and approval process
- File upload management

### 3. Live Streaming
- Stream creation with metadata (title, description, thumbnail)
- LiveKit integration for real-time streaming
- Stream settings: chat controls, audience type, gifts
- Camera modes, filters, music presets
- Stream statistics (viewers, likes, gifts, coins)
- Stream key management
- Webhook handling for stream events

### 4. Social Features
- Follow/unfollow system
- User blocking
- Following feed
- Creator discovery
- Follower/following lists

### 5. Content Management
- Post creation (TEXT, IMAGE, VIDEO, MIXED)
- Multiple media attachments per post
- Short-form video support (< 60s)
- Post visibility controls
- Like system
- Nested comments with likes
- Post view tracking
- Content moderation (hide/flag)

### 6. Monetization
- Virtual coin system
- Coin packages with bonus coins
- Discount codes (promotional & reward)
- Virtual gifts (send to creators during streams)
- Gift transactions tracking
- Creator withdrawal requests
- Wallet management

### 7. Admin Dashboard
- User management (suspend, role changes)
- Creator application review
- Content moderation (reports, hide/delete)
- Financial operations (withdrawals, transactions)
- System settings management
- Activity logs and audit trails

### 8. Search & Discovery
- Global search (streams, creators)
- Filter by live status
- Category-based filtering
- Username and title search

## Database Schema (40+ Models)

### Core Models
- **User**: Authentication, profile, roles, suspension
- **Session**: User sessions with device info
- **Account**: OAuth and credential storage
- **Verification**: Email verification tokens

### Creator Models
- **CreatorApplication**: Application workflow
- **IdentityVerification**: ID document verification
- **FinancialDetails**: Bank account info
- **CreatorProfile**: Bio and categories
- **FileUpload**: File tracking

### Streaming Models
- **Stream**: Stream metadata and settings
- **StreamStats**: Viewer metrics
- **StreamReport**: Stream-specific reports

### Social Models
- **Follow**: Following relationships
- **Block**: User blocking

### Content Models
- **Post**: Text/media content
- **PostMedia**: Image/video attachments
- **PostView**: View tracking
- **Like**: Post likes
- **Comment**: Nested comments
- **CommentLike**: Comment likes

### Payment Models
- **CoinWallet**: User coin balance
- **CoinPackage**: Purchasable coin packages
- **CoinPurchase**: Purchase history
- **Gift**: Virtual gift catalog
- **GiftTransaction**: Gift sending records
- **CreatorWithdrawalRequest**: Payout requests
- **DiscountCode**: Promo and reward codes
- **DiscountRedemption**: Code usage tracking

### Moderation Models
- **Report**: User-generated reports
- **SystemSetting**: Platform configuration

## API Routes

### `/api/auth` - Authentication
- Sign up, sign in, sign out
- Email verification
- Password reset
- Session management (Better Auth)

### `/api/creator` - Creator Operations
- Application CRUD
- File uploads (ID, selfie, profile pic)
- Profile management

### `/api/stream` - Streaming
- Stream CRUD operations
- Chat settings
- Stream credentials
- Status tracking

### `/api/viewer` - Viewer Features
- Profile management
- Stream discovery
- Viewing tokens
- Following feed

### `/api/social` - Social Interactions
- Follow/unfollow
- Block/unblock
- Creator listings
- Follower/following lists

### `/api/content` - Content Management
- Post CRUD
- Media uploads
- Likes and comments
- Public and personal feeds

### `/api/payment` - Monetization
- Coin packages
- Purchase coins
- Gift catalog
- Send gifts
- Withdrawal requests

### `/api/discount` - Discount System
- Validate codes
- Redeem codes
- Code management

### `/api/search` - Search & Discovery
- Global search
- Creator search
- Stream filtering

### `/api/webhook` - External Events
- LiveKit webhooks
- Dodo payment webhooks

## Environment Configuration

### Backend (.env)
```bash
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/streamit
BETTER_AUTH_SECRET=<32+ char secret>
BETTER_AUTH_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
ADMIN_FRONTEND_URL=http://localhost:5174
RESEND_API_KEY=<resend key>
AWS_REGION=<region>
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
S3_BUCKET_NAME=<bucket>
LIVEKIT_URL=<livekit url>
LIVEKIT_API_KEY=<key>
LIVEKIT_API_SECRET=<secret>
DODO_API_KEY=<key>
DODO_WEBHOOK_SECRET=<secret>
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:3000
VITE_LIVEKIT_WS_URL=<optional>
```

### Admin Frontend (.env)
```bash
VITE_API_URL=http://localhost:3000
```

## Development Setup

### Prerequisites
- Bun v1.3.0+
- PostgreSQL 16
- Node.js 18+ (optional)

### Quick Start

1. **Backend Setup**
```bash
cd backend
bun install
cp .env.example .env
# Edit .env with credentials
bun run db:generate
bun run db:migrate
bun run db:seed
bun run db:seed-discount
bun run dev  # http://localhost:3000
```

2. **Frontend Setup**
```bash
cd admin-fe
bun install
cp .env.example .env
bun run dev  # http://localhost:5174
```

3. **Create Admin User**
```bash
cd backend
bun run admin:promote user@example.com SUPER_ADMIN
```

## Key Scripts

### Backend
- `dev` - Development server with hot reload
- `build` - Production build
- `start` - Production server
- `db:generate` - Generate Prisma client
- `db:migrate` - Run migrations
- `db:push` - Push schema changes
- `db:studio` - Open Prisma Studio GUI
- `db:seed` - Seed payment data
- `db:seed-discount` - Seed discount codes
- `typecheck` - TypeScript validation
- `lint` / `lint:fix` - ESLint
- `format` / `format:check` - Prettier

### Frontend
- `dev` - Development server
- `build` - Production build
- `preview` - Preview production build
- `lint` - ESLint
- `typecheck` - TypeScript validation
- `format` - Prettier formatting

## Deployment

### Docker Compose
```bash
docker-compose up -d
```

Services:
- Backend: http://localhost:3000
- Admin Frontend: http://localhost:5174
- PostgreSQL: localhost:5432

## Security Features
- Password hashing (Better Auth)
- Email verification
- Session management
- CORS configuration
- Input validation (Zod)
- File upload restrictions
- SQL injection prevention (Prisma)
- Protected API routes
- Admin role-based access

## Key Dependencies

### Backend
- express (5.1.0) - Web framework
- @prisma/client (6.17.1) - ORM
- better-auth (1.3.28) - Authentication
- livekit-server-sdk (2.14.0) - Streaming
- @aws-sdk/client-s3 (3.918.0) - Storage
- resend (6.2.1) - Email
- dodopayments (2.4.4) - Payments
- swagger-ui-express (5.0.1) - API docs
- zod (4.1.12) - Validation

### Frontend
- react (19.2.4) - UI library
- vite (7.3.1) - Build tool
- tailwindcss (4.2.1) - Styling
- @remixicon/react (4.9.0) - Icons
- shadcn - UI components
- class-variance-authority (0.7.1) - Component variants

## API Documentation
- Swagger UI: http://localhost:3000/api/docs
- JSON spec: http://localhost:3000/api/docs.json

## Health Check
- Endpoint: http://localhost:3000/health
- Returns: Database status, timestamp

---

**Last Updated**: March 31, 2026
**Version**: 1.0.0
**License**: Proprietary
