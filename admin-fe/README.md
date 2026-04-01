# StreamIt Admin Panel - Frontend

A React 19 + Vite admin panel for managing the StreamIt platform.

## Tech Stack

- **React 19** - UI framework
- **Vite 7** - Build tool
- **TypeScript** - Type safety
- **TailwindCSS 4** - Styling
- **shadcn/ui** - Component library
- **React Router v7** - Routing
- **TanStack Query v5** - Data fetching
- **Zustand** - State management
- **React Hook Form + Zod** - Form validation
- **Axios** - HTTP client
- **Sonner** - Toast notifications
- **Lucide React** - Icons

## Getting Started

### Prerequisites

- Bun 1.3.0 or higher
- Backend API running on `http://localhost:3000`

### Installation

```bash
bun install
```

### Development

```bash
bun run dev
```

The application will be available at `http://localhost:5174`

### Build

```bash
bun run build
```

### Type Checking

```bash
bun run typecheck
```

### Linting

```bash
bun run lint
```

### Formatting

```bash
bun run format
```

## Project Structure

```
src/
├── components/
│   ├── layout/          # Layout components (AdminLayout, AppSidebar, TopBar)
│   └── ui/              # shadcn/ui components
├── hooks/               # Custom React hooks
│   └── useAdminAuth.ts  # Authentication hook
├── lib/
│   ├── api/             # API clients
│   │   └── client.ts    # Axios instance
│   ├── navigation.ts    # Navigation configuration
│   ├── permissions.ts   # Permission matrix
│   ├── queryKeys.ts     # TanStack Query keys
│   └── utils.ts         # Utility functions
├── pages/               # Route pages
│   ├── auth/            # Authentication pages
│   ├── dashboard/       # Dashboard page
│   └── UnauthorizedPage.tsx
├── router/              # Routing components
│   ├── ProtectedRoute.tsx
│   └── PermissionRoute.tsx
├── stores/              # Zustand stores
│   └── adminAuthStore.ts
├── types/               # TypeScript types
│   └── admin.types.ts
├── App.tsx              # Main app component
└── main.tsx             # Entry point
```

## Features Implemented

### Phase 1: Foundation - Frontend Infrastructure

- ✅ Zustand store for admin authentication state
- ✅ useAdminAuth hook for authentication operations
- ✅ Axios client with error handling interceptors
- ✅ ProtectedRoute component for authentication guards
- ✅ PermissionRoute component for role-based access control
- ✅ Permission matrix configuration
- ✅ AdminLayout with sidebar and top bar
- ✅ AppSidebar with role-based navigation filtering
- ✅ TopBar with breadcrumbs and theme toggle
- ✅ LoginPage with form validation
- ✅ React Router setup with basic routes
- ✅ TanStack Query configuration
- ✅ Session initialization on app mount

## Environment Variables

### Development

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3000
```

### Production

The `.env.production` file is used for production builds. Update the following variables:

```env
# Backend API URL - Update to your production backend URL
VITE_API_URL=https://api.streamit.com
```

**Important:** Before deploying to production, update `VITE_API_URL` to match your production backend URL. The admin panel must be deployed to a domain that is included in the backend's `ADMIN_FRONTEND_URL` environment variable for CORS to work correctly.

## Admin Roles

The system supports five admin roles:

- **super_admin** - Full system access
- **moderator** - Content moderation and stream control
- **finance_admin** - Financial operations and ad management
- **support_admin** - User management and support
- **compliance_officer** - Legal compliance and audit logs

## Authentication Flow

1. Admin navigates to the application
2. If not authenticated, redirected to `/login`
3. Admin enters credentials
4. Backend validates credentials and role
5. Session stored in HTTP-only cookie
6. User data stored in Zustand
7. Redirect to `/dashboard`
8. On app mount, session is rehydrated from backend

## Authorization

- Routes are protected by `ProtectedRoute` (requires authentication)
- Routes are further protected by `PermissionRoute` (requires specific role)
- Navigation items are filtered based on user role
- Unauthorized access redirects to `/unauthorized`

## Adding shadcn/ui Components

To add components to your app, run:

```bash
bunx shadcn@latest add [component-name]
```

This will place the ui components in the `src/components/ui` directory.

## Deployment

For production deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

Supported deployment platforms:
- **Vercel** (recommended) - Zero-config deployment with automatic SSL
- **Netlify** - Similar to Vercel with automatic SSL and CDN
- **AWS S3 + CloudFront** - Scalable hosting with AWS infrastructure
- **Nginx** - Self-hosted deployment on your own server
- **Docker** - Containerized deployment

The deployment guide includes:
- Step-by-step setup for each platform
- SSL certificate configuration
- Custom domain setup (admin.streamit.com)
- CI/CD pipeline examples
- Security best practices
- Troubleshooting tips

## Next Steps

The following features are planned for future phases:

- User Management Module
- Streamer Management Module
- Content Moderation Module
- Reports Management Module
- Monetization Module
- Advertisement Management Module
- Analytics Module
- Compliance Module
- Settings Module
