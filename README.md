# StreamIt - Live Streaming Platform

A full-stack live streaming platform that enables creators to broadcast content and engage with viewers, featuring social interactions, content management, and real-time streaming capabilities.

## 🎯 Overview

StreamIt is a modern streaming platform built with TypeScript, offering a comprehensive ecosystem for content creators and viewers. The platform supports live streaming, social features, content management, and creator monetization workflows.

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 19 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- React Router for navigation
- TanStack Query for data fetching
- Zustand for state management
- LiveKit for streaming infrastructure
- Radix UI components

**Backend:**
- Bun runtime with Express.js
- TypeScript
- Prisma ORM with PostgreSQL
- Better Auth for authentication
- LiveKit Server SDK for streaming
- AWS S3 for file storage
- Resend for email services

**Infrastructure:**
- Docker & Docker Compose
- PostgreSQL 16 database
- Nginx for frontend serving
- LiveKit for real-time streaming

### Project Structure

```
streamit/
├── frontend/              # User-facing React application (Port 5173)
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── stores/       # Zustand state stores
│   │   ├── lib/          # Utility libraries
│   │   └── types/        # TypeScript definitions
│   ├── .env.example      # Frontend environment template
│   └── Dockerfile
│
├── admin-frontend/        # Admin dashboard React app (Port 5174)
│   ├── src/
│   │   ├── pages/        # Admin page components
│   │   ├── components/   # Admin UI components
│   │   ├── lib/          # Admin utilities
│   │   └── hooks/        # Admin hooks
│   ├── .env.example      # Admin environment template
│   └── ADMIN_DASHBOARD_GUIDE.md
│
├── backend/               # Express API server (Port 3000)
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── routes/       # API route definitions
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Express middleware
│   │   ├── lib/          # Shared libraries
│   │   └── types/        # TypeScript definitions
│   ├── prisma/           # Database schema & migrations
│   ├── scripts/          # Utility scripts (admin promotion, etc.)
│   ├── .env.example      # Backend environment template
│   └── Dockerfile
│
└── docker-compose.yml     # Container orchestration
```

## ✨ Features

### 🎭 User System

**Authentication:**
- Email/password registration and login
- Email verification with OTP
- Password reset functionality
- Session management with Better Auth
- Secure credential storage

**User Profiles:**
- Customizable profile with avatar
- Bio and username
- Password management
- Profile picture uploads

### 👥 Social Features

**Following System:**
- Follow/unfollow creators
- View followers and following lists
- Following feed for personalized content
- Discover creators

**Blocking System:**
- Block/unblock users
- Privacy controls
- Safe community environment

**Content Engagement:**
- Like posts and comments
- Comment on posts with nested replies
- Public content feed
- User-specific post timelines

### 🎬 Creator Features

**Application System:**
- Multi-step creator application process
- Identity verification (Aadhaar, Passport, Driver's License)
- Financial details (Bank account, IFSC, PAN)
- Profile setup with bio and content categories
- Admin review and approval workflow

**Live Streaming:**
- Stream creation with title and description
- Custom stream thumbnails
- LiveKit integration for reliable streaming
- Stream key management
- Real-time stream status tracking
- Creator dashboard for stream control

**Stream Settings:**
- Chat enable/disable
- Chat delay options
- Followers-only chat mode
- Stream metadata editing

**Content Management:**
- Upload posts (text, images, videos, mixed)
- Multiple media attachments per post
- Post visibility controls
- Delete and update posts
- Content categorization

### 📺 Viewer Features

**Stream Discovery:**
- Browse all live streams
- Search streams by title/creator
- Recommended streams algorithm
- Following feed for subscribed creators
- Creator profile pages

**Stream Viewing:**
- Real-time video playback with LiveKit
- Interactive chat (when enabled)
- Stream metadata display
- Responsive video player
- Mobile-friendly interface

**Content Consumption:**
- Public feed of creator posts
- View creator profiles
- Like and comment on posts
- Discover new content

### 🛡️ Admin Dashboard

**User Management:**
- View all users with filtering and search
- Suspend/unsuspend users with reasons
- Change user roles (USER, CREATOR, ADMIN, SUPER_ADMIN)
- View user activity and login history
- Bulk user operations

**Creator Applications:**
- Review pending creator applications
- Approve or reject with reasons
- View identity verification documents
- Verify financial details
- Track application status

**Content Moderation:**
- Review user reports (posts, comments, streams)
- Hide/unhide content
- Delete inappropriate content
- View report history and resolution
- Bulk moderation actions

**Financial Operations:**
- View wallet balances and transactions
- Process creator withdrawal requests
- Approve/reject/hold withdrawals
- Financial reconciliation tools
- Transaction history and exports
- Commission configuration

**Advertising:**
- Create and manage ad campaigns
- Set budgets and targeting
- View campaign analytics
- Track impressions, clicks, conversions
- Campaign performance metrics

**Legal & Compliance:**
- Manage legal cases
- Process takedown requests
- Configure geo-blocking rules
- Track compliance actions
- Audit trail for all actions

**System Settings:**
- Configure platform settings
- Create announcements
- Manage discount codes
- System setting version history
- Rollback capability

**Security & Monitoring:**
- View admin activity logs
- Permission management
- Security hardening controls
- Audit history tracking

### 🔍 Search & Discovery

- Global search for streams and creators
- Filter by live status
- Category-based filtering
- Username and title search

## 🗄️ Database Schema

### Core Models

**User:**
- Basic info (name, email, username, bio)
- Authentication data
- Profile settings
- Relationships (followers, content, streams)

**Stream:**
- Streaming metadata (title, description, thumbnail)
- LiveKit integration (ingress ID, stream key)
- Chat settings
- Live status tracking

**Social Models:**
- Follow (follower-following relationships)
- Block (user blocking)

**Content Models:**
- Post (text/media content)
- PostMedia (images/videos)
- Like (post engagement)
- Comment (with nested replies)
- CommentLike

**Creator Application:**
- Application status tracking
- Identity verification
- Financial details
- Creator profile

## 🛣️ API Routes

### Authentication (`/api/auth`)
- Sign up, sign in, sign out
- Email verification
- Password reset
- Session management

### Creator (`/api/creator`)
- Application CRUD operations
- File uploads
- Profile management

### Stream (`/api/stream`)
- Stream creation and management
- Chat settings
- Stream credentials
- Status tracking

### Viewer (`/api/viewer`)
- Profile management
- Stream discovery
- Viewing tokens
- Following feed

### Social (`/api/social`)
- Follow/unfollow
- Block/unblock
- Creator listings
- Follower/following lists

### Content (`/api/content`)
- Post CRUD operations
- Media uploads
- Likes and comments
- Public and personal feeds

### Search (`/api/search`)
- Global search
- Creator search
- Stream filtering

### Webhook (`/api/webhook`)
- LiveKit event handling
- Stream status updates

## 🚀 Deployment

### Using Docker Compose

1. **Set up environment variables:**
   Create a `.env` file with required variables (see `.env.example`)

2. **Start services:**
   ```bash
   docker-compose up -d
   ```

3. **Access the application:**
   - Frontend: http://localhost
   - Backend API: http://localhost:3000
   - Database: localhost:5432

### Environment Variables

See `.env.example` files in each directory for complete documentation.

**Backend (`backend/.env`):**
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Authentication secret (min 32 chars)
- `BETTER_AUTH_URL` - Backend URL for OAuth callbacks
- `FRONTEND_URL` - User-facing frontend URL
- `ADMIN_FRONTEND_URL` - Admin dashboard URL (required for CORS)
- `RESEND_API_KEY` - Email service API key
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME` - S3 storage
- `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` - Streaming service
- `DODO_API_KEY`, `DODO_WEBHOOK_SECRET` - Payment gateway
- `ADMIN_EXPORT_SIGNING_SECRET` - Admin export security (optional)

**Frontend (`frontend/.env`):**
- `VITE_API_URL` - Backend API URL (http://localhost:3000)
- `VITE_LIVEKIT_WS_URL` - LiveKit WebSocket URL (optional, from backend)

**Admin Frontend (`admin-frontend/.env`):**
- `VITE_API_URL` - Backend API URL (http://localhost:3000)

## 🛠️ Development Setup

### Prerequisites

- [Bun](https://bun.sh) v1.3.0 or higher
- PostgreSQL 16
- Node.js 18+ (for some tooling)

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd streamit
   ```

2. **Set up environment variables:**
   ```bash
   # Backend
   cd backend
   cp .env.example .env
   # Edit .env with your credentials
   
   # Frontend
   cd ../frontend
   cp .env.example .env
   # Edit .env with backend URL
   
   # Admin Frontend
   cd ../admin-frontend
   cp .env.example .env
   # Edit .env with backend URL
   ```

3. **Start the backend:**
   ```bash
   cd backend
   bun install
   bun run db:generate      # Generate Prisma client
   bun run db:migrate       # Run database migrations
   bun run db:seed          # Seed payment data
   bun run db:seed-discount # Seed discount codes
   bun run dev              # Start on http://localhost:3000
   ```

4. **Start the frontend:**
   ```bash
   cd frontend
   bun install
   bun run dev              # Start on http://localhost:5173
   ```

5. **Start the admin dashboard (optional):**
   ```bash
   cd admin-frontend
   bun install
   bun run dev              # Start on http://localhost:5174
   ```

### Admin Access

To access the admin dashboard, promote a user to admin role:

```bash
cd backend
bun run admin:promote user@example.com          # Promote to ADMIN
bun run admin:promote user@example.com SUPER_ADMIN  # Promote to SUPER_ADMIN
```

Then login at http://localhost:5174

### Database Management

```bash
cd backend
bun run db:studio     # Open Prisma Studio (GUI)
bun run db:migrate    # Create new migration
bun run db:push       # Push schema changes without migration
bun run db:generate   # Regenerate Prisma client
```

### Development Scripts

**Backend:**
- `bun run dev` - Start with hot reload
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run typecheck` - Run TypeScript checks
- `bun run lint` - Run ESLint
- `bun run format` - Format with Prettier

**Frontend:**
- `bun run dev` - Start dev server (port 5173)
- `bun run build` - Build for production
- `bun run preview` - Preview production build
- `bun run lint` - Run ESLint

**Admin Frontend:**
- `bun run dev` - Start dev server (port 5174)
- `bun run build` - Build for production
- `bun run preview` - Preview production build

## 🎨 UI/UX Features

- Dark mode support
- Responsive design for all devices
- Real-time updates
- Optimistic UI updates
- Toast notifications
- Loading states and skeletons
- Form validation with Zod
- Accessible components with Radix UI

## 🔐 Security

- Secure authentication with Better Auth
- Password hashing
- Email verification
- Protected API routes
- CORS configuration
- Input validation with Zod
- File upload restrictions
- SQL injection prevention (Prisma)

## 📦 Key Dependencies

**Backend:**
- `express` - Web framework
- `prisma` - ORM
- `better-auth` - Authentication
- `livekit-server-sdk` - Streaming
- `@aws-sdk/client-s3` - File storage
- `resend` - Email service

**Frontend:**
- `react` - UI library
- `@tanstack/react-query` - Data fetching
- `@livekit/components-react` - Stream player
- `react-hook-form` - Form handling
- `zustand` - State management
- `tailwindcss` - Styling

## 📝 License

This project is private and proprietary.

---

Built with ❤️ for creators and viewers
