# StreamIt Frontend

A modern, responsive web application for live streaming and social media platform built with React, TypeScript, Vite, and TailwindCSS. This frontend provides a seamless user experience for viewers, creators, and content consumers.

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: TailwindCSS 4 with shadcn/ui components
- **Routing**: React Router v7
- **State Management**: Zustand + TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Authentication**: Better Auth client
- **Live Streaming**: LiveKit React Components
- **UI Components**: Radix UI primitives
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: Sonner (toast notifications)
- **Theme**: next-themes (dark/light mode)

## Features

### User Features
- User authentication (email/password, OTP, OAuth)
- Email verification and password reset
- Profile management with bio and avatar
- Dark/light theme support
- Responsive mobile-first design

### Content Features
- Home feed with personalized content
- Short-form videos (Shorts) with swipe navigation
- Full-length video posts
- Image posts with multiple media support
- Like, comment, and share functionality
- Infinite scroll for feeds
- Content search and discovery
- Trending content algorithm

### Live Streaming
- Watch live streams in real-time
- Interactive chat during streams
- Virtual gift sending to creators
- Viewer count and engagement metrics
- Stream quality selection
- Mobile and desktop streaming support
- Picture-in-picture mode

### Social Features
- Follow/unfollow creators
- Following feed with live creators
- User profiles with content history
- Social interactions (likes, comments, shares)
- Block/unblock users
- Creator discovery page

### Creator Features
- Creator application system
- Creator dashboard with analytics
- Stream management and configuration
- Content upload (posts, videos, shorts)
- Earnings tracking
- Community management
- Stream setup and go-live controls

### Monetization
- Coin shop for purchasing virtual currency
- Multiple coin packages with bonuses
- Discount code system
- Virtual gift catalog
- Gift sending during streams
- Purchase history tracking
- Earnings dashboard for creators
- Withdrawal request system

### Search & Discovery
- Global search (users, creators, content)
- Trending content section
- Creator recommendations
- Category-based browsing
- Live stream discovery

## Project Structure

```
frontend/
├── public/                  # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── auth/          # Authentication components
│   │   ├── common/        # Shared components
│   │   ├── home/          # Home page components
│   │   ├── payment/       # Payment components
│   │   ├── shorts/        # Short-form video components
│   │   ├── stream/        # Live streaming components
│   │   └── ui/            # shadcn/ui components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   ├── layouts/           # Layout components
│   ├── lib/               # Utilities and configurations
│   │   └── api/          # API service modules
│   ├── pages/             # Page components
│   ├── stores/            # Zustand stores
│   ├── types/             # TypeScript definitions
│   ├── utils/             # Utility functions
│   ├── App.tsx            # Main app with routing
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── .env.example           # Environment template
├── Dockerfile             # Docker configuration
├── nginx.conf             # Nginx config
└── package.json           # Dependencies
```

## Prerequisites

- Node.js 20+ or Bun 1.0+
- Backend API running
- Modern web browser with WebRTC support

## Installation

### 1. Install Dependencies

```bash
cd frontend
bun install
```

### 2. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL="http://localhost:3000"
VITE_LIVEKIT_WS_URL="wss://your-project.livekit.cloud"
```

### 3. Start Development Server

```bash
bun run dev
```

App runs on `http://localhost:5173`

## Available Scripts

```bash
bun run dev              # Start dev server
bun run build            # Build for production
bun run preview          # Preview production build
bun run lint             # Lint code
```

## Application Routes

### Public Routes
- `/` - Home page
- `/auth/*` - Authentication pages
- `/content` - Content feed
- `/shorts` - Short videos
- `/search` - Search
- `/live` - Live streams
- `/following` - Following feed
- `/creators` - Creator discovery

### Creator Routes
- `/creator-application` - Apply to become creator
- `/creator-dashboard/*` - Creator dashboard

### Payment Routes
- `/coins/shop` - Coin shop
- `/coins/history` - Purchase history
- `/gifts/*` - Gift history

### Dynamic Routes
- `/:username` - Creator profile
- `/:username/live` - Watch live stream

## Key Features Implementation

### Authentication

```typescript
import { useAuthSession } from '@/hooks/useAuthSession';

function ProtectedComponent() {
  const { session, isLoading } = useAuthSession();
  
  if (isLoading) return <Loading />;
  if (!session) return <Navigate to="/auth/signin" />;
  
  return <div>Protected content</div>;
}
```

### Live Streaming

```typescript
import { LiveKitRoom, VideoConference } from '@livekit/components-react';

function WatchStream() {
  const token = await fetchStreamToken();
  
  return (
    <LiveKitRoom token={token} serverUrl={LIVEKIT_URL}>
      <VideoConference />
    </LiveKitRoom>
  );
}
```

### State Management

- **TanStack Query**: Server state and caching
- **Zustand**: Client state
- **React Context**: Shared state

```typescript
import { useQuery } from '@tanstack/react-query';

function Feed() {
  const { data, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  });
  
  return <PostList posts={data} />;
}
```

### Responsive Design

Mobile-first with breakpoints:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

```typescript
import { useMobile } from '@/hooks/use-mobile';

function Component() {
  const isMobile = useMobile();
  return isMobile ? <MobileView /> : <DesktopView />;
}
```

### Theme Support

```typescript
import { useTheme } from 'next-themes';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle Theme
    </button>
  );
}
```

## UI Components

Uses shadcn/ui components built on Radix UI:
- Button, Input, Label
- Dialog, Dropdown Menu, Tooltip
- Tabs, Separator, Switch
- Form components with validation

### Adding Components

```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
```

## API Integration

API calls centralized in `lib/api/`:

```typescript
export const contentApi = {
  getPosts: async () => {
    const response = await apiClient.get('/api/content/posts');
    return response.data;
  },
  
  createPost: async (data: CreatePostData) => {
    const response = await apiClient.post('/api/content/posts', data);
    return response.data;
  },
};
```

## Form Handling

React Hook Form with Zod validation:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function LoginForm() {
  const form = useForm({
    resolver: zodResolver(schema),
  });
  
  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

## Error Handling

Multi-level error handling:
1. API Level: Axios interceptors
2. Query Level: TanStack Query
3. Component Level: Try-catch
4. Global Level: Error boundaries

```typescript
const { data, error, isError } = useQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts,
  onError: (error) => toast.error(error.message),
});
```

## Performance Optimization

### Code Splitting

```typescript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('@/pages/creator-dashboard'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Dashboard />
    </Suspense>
  );
}
```

### Infinite Scroll

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';

function Feed() {
  const { ref, inView } = useInView();
  const { data, fetchNextPage } = useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam }) => fetchPosts(pageParam),
  });
  
  useEffect(() => {
    if (inView) fetchNextPage();
  }, [inView]);
  
  return (
    <>
      {data.pages.map(page => <Posts posts={page.posts} />)}
      <div ref={ref} />
    </>
  );
}
```

## Deployment

### Docker

```bash
docker build \
  --build-arg VITE_API_URL=https://api.yourdomain.com \
  -t streamit-frontend .

docker run -p 80:80 streamit-frontend
```

### Production Build

```bash
bun run build
```

Output in `dist/` folder.

### Static Hosting

Deploy to:
- Vercel: `vercel deploy`
- Netlify: `netlify deploy --prod`
- AWS S3 + CloudFront
- Nginx: Copy `dist/` to web root

### Production Environment

```env
VITE_API_URL="https://api.yourdomain.com"
VITE_LIVEKIT_WS_URL="wss://your-project.livekit.cloud"
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with WebRTC

## Accessibility

- Semantic HTML
- ARIA labels and roles
- Keyboard navigation
- Focus management
- Screen reader support
- Color contrast compliance

## Security

### Client-Side
- XSS prevention (React escaping)
- CSRF protection via backend
- Secure cookie handling
- Input validation with Zod
- CSP headers

### Authentication
- Secure session management
- HTTP-only cookies
- Token refresh
- Auto logout on expiry

## Development Tips

### TypeScript

```typescript
interface Post {
  id: string;
  content: string;
  author: User;
  createdAt: string;
}

function PostCard({ post }: { post: Post }) {
  return <div>{post.content}</div>;
}
```

### Debugging

Use React DevTools and browser DevTools.

## Troubleshooting

### Port in Use

```bash
bun run dev -- --port 5174
```

### API Connection

Check:
1. Backend is running
2. VITE_API_URL is correct
3. CORS configured
4. Network connectivity

### Build Errors

```bash
rm -rf node_modules dist
bun install
bun run build
```

### LiveKit Issues

Check:
1. Credentials correct
2. WebRTC supported
3. Firewall allows WebRTC
4. TURN servers configured

## Contributing

### Code Style
- Follow ESLint rules
- Use TypeScript types
- Functional components with hooks
- Keep components small

### Commit Messages
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Maintenance

## License

Private/Proprietary

---

Built with ❤️ using React, TypeScript, Vite, and TailwindCSS
