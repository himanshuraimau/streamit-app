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
├── frontend/           # React application
│   ├── src/
│   │   ├── pages/     # Page components
│   │   ├── components/# Reusable UI components
│   │   ├── hooks/     # Custom React hooks
│   │   ├── stores/    # Zustand state stores
│   │   ├── lib/       # Utility libraries
│   │   └── types/     # TypeScript definitions
│   └── Dockerfile
│
├── backend/           # Express API server
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── routes/       # API route definitions
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Express middleware
│   │   ├── lib/          # Shared libraries
│   │   └── types/        # TypeScript definitions
│   ├── prisma/          # Database schema & migrations
│   └── Dockerfile
│
└── docker-compose.yml  # Container orchestration
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

**Backend:**
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Authentication secret
- `RESEND_API_KEY` - Email service API key
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET` - S3 storage
- `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` - Streaming service

**Frontend:**
- `VITE_API_URL` - Backend API URL
- `VITE_LIVEKIT_WS_URL` - LiveKit WebSocket URL

## 🛠️ Development

### Backend

```bash
cd backend
bun install
bun run db:migrate    # Run database migrations
bun run dev           # Start development server
```

### Frontend

```bash
cd frontend
bun install
bun run dev           # Start development server
```

### Database Management

```bash
bun run db:studio     # Open Prisma Studio
bun run db:migrate    # Create new migration
bun run db:push       # Push schema changes
```

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
