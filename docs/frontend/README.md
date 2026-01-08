# StreamIt Frontend Documentation

> **Modern React 19 Frontend for Live Streaming Platform**

## Overview

StreamIt frontend is a cutting-edge web application built with React 19, TypeScript, and Vite. It provides a seamless user experience for creators to stream content and viewers to watch, interact, and support their favorite creators.

## Features at a Glance

### 🎥 **Live Streaming**
- Real-time video streaming with LiveKit
- Interactive chat and reactions
- Stream viewer with quality controls
- Creator dashboard for stream management

### 🔐 **Authentication**
- Email/Password authentication
- OTP verification
- Magic link login
- Password reset flow
- Session management

### 💰 **Monetization**
- Creator subscriptions
- Virtual currency (coins)
- Gift system
- Discount codes
- Payment history
- Dodo Payments integration

### 👤 **User Profiles**
- Creator profiles
- Viewer profiles
- Bio and avatar customization
- Username system

### 📱 **Social Features**
- Follow/unfollow system
- Social feed
- Notifications
- Creator discovery

### 🎨 **Content Management**
- Upload videos
- Thumbnail management
- Content library
- AWS S3 integration

### 🏆 **Creator Features**
- Creator application system
- Dashboard analytics
- Subscriber management
- Revenue tracking
- Stream settings

## Tech Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Framework** | React 19 | UI library with latest features |
| **Build Tool** | Vite 6.0 | Lightning-fast bundler |
| **Language** | TypeScript 5.6 | Type safety |
| **Styling** | TailwindCSS 4.0 | Utility-first CSS |
| **UI Components** | Radix UI | Accessible primitives |
| **Routing** | React Router v7 | Client-side routing |
| **State Management** | Zustand 5.0 | Lightweight state |
| **Data Fetching** | TanStack Query | Server state management |
| **Forms** | React Hook Form + Zod | Form validation |
| **Authentication** | Better Auth React | Auth client |
| **Streaming** | LiveKit React | WebRTC streaming |
| **Animation** | Framer Motion | Smooth animations |
| **HTTP Client** | Axios | API requests |
| **Code Quality** | ESLint | Linting |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (React App)                  │
├─────────────────────────────────────────────────────────┤
│  Pages           Components        Hooks         Stores  │
│  ┌────┐          ┌────────┐      ┌──────┐      ┌─────┐ │
│  │Auth│          │  Auth  │      │useAuth      │Zustand│
│  ├────┤          ├────────┤      ├──────┤      └─────┘ │
│  │Home│◄────────►│ Stream │◄────►│useStream            │
│  ├────┤          ├────────┤      ├──────┤              │
│  │Watch         │Payment │      │useContent           │
│  ├────┤          ├────────┤      ├──────┤              │
│  │Creator       │ Common │      │useSocial            │
│  └────┘          └────────┘      └──────┘              │
├─────────────────────────────────────────────────────────┤
│                  React Query (Cache)                     │
├─────────────────────────────────────────────────────────┤
│              API Client (Axios + Better Auth)            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Backend API (Express)                  │
│         http://localhost:3000/api/*                      │
└─────────────────────────────────────────────────────────┘
```

## Directory Structure

```
frontend/
├── src/
│   ├── main.tsx                    # App entry point
│   ├── App.tsx                     # Router & layout
│   ├── index.css                   # Global styles (Tailwind)
│   │
│   ├── pages/                      # Route pages (40+)
│   │   ├── home/                   # Homepage
│   │   ├── auth/                   # Auth flows
│   │   │   ├── SignIn.tsx
│   │   │   ├── SignUp.tsx
│   │   │   ├── VerifyOtp.tsx
│   │   │   └── ForgotPassword.tsx
│   │   ├── watch/                  # Stream viewer
│   │   ├── live/                   # Live streams list
│   │   ├── creator-dashboard/      # Creator tools
│   │   ├── creator-application/    # Become creator
│   │   ├── content/                # Content management
│   │   ├── creators/               # Creator profiles
│   │   ├── following/              # Following list
│   │   └── search/                 # Search page
│   │
│   ├── components/                 # React components
│   │   ├── ui/                     # Radix UI primitives
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   └── ... (20+ components)
│   │   ├── auth/                   # Auth components
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── AuthRedirect.tsx
│   │   ├── stream/                 # Streaming components
│   │   │   ├── StreamPlayer.tsx
│   │   │   ├── ChatPanel.tsx
│   │   │   └── StreamSettings.tsx
│   │   ├── payment/                # Payment components
│   │   │   ├── CoinPurchase.tsx
│   │   │   ├── PaymentModal.tsx
│   │   │   └── PricingCard.tsx
│   │   └── common/                 # Shared components
│   │       ├── Navbar.tsx
│   │       ├── Sidebar.tsx
│   │       └── LoadingSpinner.tsx
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useAuthSession.ts       # Auth session management
│   │   ├── useStream.ts            # Streaming logic
│   │   ├── useContent.ts           # Content operations
│   │   ├── useSocial.ts            # Social features
│   │   ├── useCreatorApplication.ts # Creator application
│   │   ├── useCurrentUser.ts       # Current user data
│   │   └── use-mobile.ts           # Mobile detection
│   │
│   ├── stores/                     # Zustand stores
│   │   ├── creator-application.ts  # Creator app state
│   │   └── payment.store.ts        # Payment flow state
│   │
│   ├── lib/                        # Utilities & config
│   │   ├── auth-client.ts          # Better Auth client
│   │   ├── api/                    # API client
│   │   │   └── client.ts
│   │   ├── utils.ts                # Helper functions
│   │   └── validations/            # Zod schemas
│   │
│   ├── types/                      # TypeScript types
│   │   ├── auth.ts
│   │   ├── stream.ts
│   │   ├── payment.ts
│   │   └── user.ts
│   │
│   └── assets/                     # Images, icons
│
├── public/                         # Static files
├── vite.config.ts                  # Vite configuration
├── tsconfig.json                   # TypeScript config
├── tailwind.config.js              # Tailwind config
├── components.json                 # Shadcn config
├── eslint.config.js                # ESLint config
├── package.json                    # Dependencies
├── Dockerfile                      # Docker image
├── nginx.conf                      # Nginx config
└── deploy.sh                       # Deployment script
```

## Key Concepts

### 1. Authentication Flow

```typescript
// Better Auth integration
import { authClient } from '@/lib/auth-client';

// Sign in
await authClient.signIn.email({
  email: 'user@example.com',
  password: 'password',
});

// Get session
const { data: session } = useAuthSession();

// Protected routes
<ProtectedRoute>
  <CreatorDashboard />
</ProtectedRoute>
```

### 2. API Integration

```typescript
// Using React Query
import { useQuery, useMutation } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['streams'],
  queryFn: () => api.get('/streams'),
});

const mutation = useMutation({
  mutationFn: (data) => api.post('/streams', data),
  onSuccess: () => queryClient.invalidateQueries(['streams']),
});
```

### 3. State Management

```typescript
// Zustand store
import { create } from 'zustand';

const usePaymentStore = create((set) => ({
  selectedPlan: null,
  setSelectedPlan: (plan) => set({ selectedPlan: plan }),
}));

// Usage
const { selectedPlan, setSelectedPlan } = usePaymentStore();
```

### 4. Routing

```typescript
// React Router v7
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'watch/:streamId', element: <Watch /> },
      { path: 'creator-dashboard', element: <CreatorDashboard /> },
    ],
  },
]);
```

### 5. Forms & Validation

```typescript
// React Hook Form + Zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const form = useForm({
  resolver: zodResolver(schema),
});
```

## Core Features Explained

### Live Streaming

Powered by LiveKit for real-time WebRTC streaming:

```typescript
import { LiveKitRoom, VideoTrack, AudioTrack } from '@livekit/components-react';

<LiveKitRoom
  serverUrl="wss://livekit.streamit.com"
  token={streamToken}
  connect={true}
>
  <VideoTrack />
  <AudioTrack />
  <ChatPanel />
</LiveKitRoom>
```

### Payment System

Integrated with Dodo Payments:

```typescript
// Purchase coins
const purchaseCoins = useMutation({
  mutationFn: (amount) => api.post('/payments/coins', { amount }),
  onSuccess: (data) => {
    // Redirect to payment page
    window.location.href = data.paymentUrl;
  },
});

// Apply discount code
const applyDiscount = (code: string) => {
  return api.post('/payments/apply-discount', { code });
};
```

### Content Upload

S3 integration for media:

```typescript
// Upload video
const uploadVideo = async (file: File) => {
  const { presignedUrl } = await api.get('/content/upload-url');
  
  await axios.put(presignedUrl, file, {
    headers: { 'Content-Type': file.type },
  });
  
  return api.post('/content', {
    title: 'My Video',
    s3Key: presignedUrl.split('?')[0],
  });
};
```

## User Roles

### Viewer
- Watch live streams
- Follow creators
- Purchase coins
- Send gifts
- Browse content
- Search creators

### Creator
- Start live streams
- Upload content
- Manage subscribers
- View analytics
- Customize profile
- Set stream settings
- Receive donations

### Admin
- Full platform access
- User management
- Content moderation
- Analytics dashboard
- System configuration

## Performance Optimizations

### Code Splitting
```typescript
// Lazy load pages
const CreatorDashboard = lazy(() => import('./pages/creator-dashboard'));

<Suspense fallback={<LoadingSpinner />}>
  <CreatorDashboard />
</Suspense>
```

### React Query Caching
```typescript
// Cache for 5 minutes
useQuery({
  queryKey: ['streams'],
  queryFn: fetchStreams,
  staleTime: 5 * 60 * 1000,
});
```

### Image Optimization
```typescript
// Lazy load images
<img
  src={thumbnailUrl}
  loading="lazy"
  alt="Stream thumbnail"
/>
```

## Development Guidelines

### Component Patterns

**1. Composition over Configuration**
```tsx
<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <DialogTitle>Title</DialogTitle>
    <DialogDescription>Description</DialogDescription>
  </DialogContent>
</Dialog>
```

**2. Custom Hooks for Logic**
```tsx
function useStreamChat(streamId: string) {
  const [messages, setMessages] = useState([]);
  
  useEffect(() => {
    // WebSocket logic
  }, [streamId]);
  
  return { messages, sendMessage };
}
```

**3. Type Safety**
```tsx
interface StreamPlayerProps {
  streamId: string;
  autoplay?: boolean;
  onEnd?: () => void;
}

export function StreamPlayer({ streamId, autoplay, onEnd }: StreamPlayerProps) {
  // Component logic
}
```

### Styling Conventions

```tsx
// Use Tailwind classes
<div className="flex items-center gap-4 p-6 bg-gray-900 rounded-lg">
  
// Responsive
<div className="text-sm md:text-base lg:text-lg">

// Conditional classes
<div className={cn(
  "base-classes",
  isActive && "active-classes"
)}>
```

## API Endpoints Used

Frontend consumes 60+ backend endpoints:

| Category | Endpoints | Examples |
|----------|-----------|----------|
| Auth | 10+ | `/api/auth/sign-in`, `/api/auth/verify-otp` |
| Streams | 15+ | `/api/streams`, `/api/streams/:id` |
| Content | 12+ | `/api/content`, `/api/content/upload` |
| Payments | 10+ | `/api/payments/coins`, `/api/payments/subscribe` |
| Social | 8+ | `/api/social/follow`, `/api/social/feed` |
| Creator | 6+ | `/api/creator/application`, `/api/creator/stats` |
| Search | 3+ | `/api/search/creators`, `/api/search/streams` |

Full API documentation: [Backend API Docs](../backend/API_ENDPOINTS.md)

## Environment Setup

See [CONFIGURATION.md](./CONFIGURATION.md) for detailed setup.

```bash
# Required
VITE_API_URL=http://localhost:3000

# Optional
VITE_WS_URL=ws://localhost:3000
```

## Build & Deployment

```bash
# Development
bun run dev

# Production build
bun run build

# Preview production
bun run preview

# Docker
docker build -t streamit-frontend .
docker run -p 80:80 streamit-frontend
```

See [CONFIGURATION.md](./CONFIGURATION.md) for deployment guides.

## Testing

```bash
# Type check
tsc --noEmit

# Lint
bun run lint

# Format
prettier --write src/
```

## Documentation

| Document | Description |
|----------|-------------|
| [START HERE](./00_START_HERE.md) | Navigation & overview |
| [QUICK_START.md](./QUICK_START.md) | Get up and running |
| [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) | All components |
| [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) | State patterns |
| [ROUTING_PAGES.md](./ROUTING_PAGES.md) | All routes & pages |
| [CONFIGURATION.md](./CONFIGURATION.md) | Setup & deployment |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical deep dive |
| [INDEX.md](./INDEX.md) | Quick reference |

## Common Tasks

### Add New Page
1. Create component in `src/pages/my-page/index.tsx`
2. Add route in `App.tsx`
3. Add navigation link in `Navbar.tsx`

### Add New Component
1. Create in `src/components/category/`
2. Export from `index.ts`
3. Import with `@/components/category/ComponentName`

### Add API Endpoint
1. Add to `src/lib/api/`
2. Create React Query hook
3. Use in components

### Add Form
1. Create Zod schema
2. Setup React Hook Form
3. Add UI components
4. Handle submission

## Troubleshooting

| Issue | Solution |
|-------|----------|
| API errors | Check `VITE_API_URL` in `.env` |
| Build fails | Clear cache: `rm -rf node_modules dist` |
| Types error | Run `tsc --noEmit` |
| Hot reload not working | Restart dev server |
| Port in use | Change port: `PORT=3001 bun run dev` |

## Resources

- **React**: https://react.dev/
- **Vite**: https://vitejs.dev/
- **TailwindCSS**: https://tailwindcss.com/
- **Radix UI**: https://www.radix-ui.com/
- **React Router**: https://reactrouter.com/
- **TanStack Query**: https://tanstack.com/query/
- **LiveKit**: https://livekit.io/
- **Better Auth**: https://better-auth.com/

## Support

For issues or questions:
- Check documentation
- Review backend API docs
- Inspect browser console
- Check network tab for API errors

---

**Happy Coding!** 🚀
