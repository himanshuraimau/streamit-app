# Frontend Architecture

Deep dive into StreamIt frontend architecture, patterns, and technical decisions.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Design Patterns](#design-patterns)
4. [Data Flow](#data-flow)
5. [Authentication Architecture](#authentication-architecture)
6. [State Management Architecture](#state-management-architecture)
7. [Component Architecture](#component-architecture)
8. [API Integration](#api-integration)
9. [Routing Architecture](#routing-architecture)
10. [Performance Patterns](#performance-patterns)
11. [Security Architecture](#security-architecture)
12. [Testing Strategy](#testing-strategy)

---

## Architecture Overview

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         Browser                               │
├──────────────────────────────────────────────────────────────┤
│                    React Application                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │   Pages    │  │ Components │  │   Hooks    │             │
│  │            │  │            │  │            │             │
│  │  - Home    │  │  - UI      │  │  - Auth    │             │
│  │  - Watch   │  │  - Stream  │  │  - Stream  │             │
│  │  - Dashboard│  │  - Payment │  │  - Content │             │
│  └────────────┘  └────────────┘  └────────────┘             │
│         │              │                  │                   │
│         └──────────────┴──────────────────┘                   │
│                        │                                      │
│  ┌─────────────────────┴───────────────────────┐             │
│  │         State Management Layer              │             │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │             │
│  │  │ Zustand  │  │  React   │  │ Component│  │             │
│  │  │  Stores  │  │  Query   │  │  State   │  │             │
│  │  │ (Global) │  │ (Server) │  │ (Local)  │  │             │
│  │  └──────────┘  └──────────┘  └──────────┘  │             │
│  └──────────────────────────────────────────────┘             │
│                        │                                      │
│  ┌─────────────────────┴───────────────────────┐             │
│  │           API Client Layer                  │             │
│  │  ┌──────────────┐  ┌─────────────────────┐  │             │
│  │  │ Better Auth  │  │  Axios Client       │  │             │
│  │  │   Client     │  │  (API Requests)     │  │             │
│  │  └──────────────┘  └─────────────────────┘  │             │
│  └──────────────────────────────────────────────┘             │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                   Backend API (Express)                       │
│         REST API + WebSocket (LiveKit)                        │
│         http://localhost:3000                                 │
└──────────────────────────────────────────────────────────────┘
```

### Layered Architecture

```
┌───────────────────────────────────────┐
│      Presentation Layer               │  Pages + Components
├───────────────────────────────────────┤
│      Business Logic Layer             │  Custom Hooks
├───────────────────────────────────────┤
│      State Management Layer           │  Zustand + React Query
├───────────────────────────────────────┤
│      API Integration Layer            │  Axios + Auth Client
├───────────────────────────────────────┤
│      Utility Layer                    │  Helpers + Validators
└───────────────────────────────────────┘
```

---

## Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI library |
| TypeScript | 5.6.x | Type safety |
| Vite | 6.0.x | Build tool & dev server |
| React Router | 7.x | Client-side routing |
| TanStack Query | 5.x | Server state management |
| Zustand | 5.0.x | Global state management |
| TailwindCSS | 4.0.x | Utility-first CSS |
| Radix UI | Latest | Accessible UI primitives |
| Better Auth | Latest | Authentication |
| LiveKit | Latest | WebRTC streaming |
| Axios | Latest | HTTP client |
| Zod | Latest | Schema validation |
| React Hook Form | Latest | Form management |

### Why These Technologies?

**React 19**:
- Latest features (automatic batching, transitions)
- Excellent ecosystem
- Strong community support
- Performance optimizations

**Vite**:
- Instant dev server start
- Fast HMR (Hot Module Replacement)
- Optimized production builds
- Native ESM support

**TanStack Query**:
- Automatic caching
- Background refetching
- Optimistic updates
- Simplified server state

**Zustand**:
- Minimal boilerplate
- No providers needed
- DevTools integration
- Excellent TypeScript support

**TailwindCSS v4**:
- Rapid development
- Consistent design system
- Small production bundle
- Excellent DX

**Radix UI**:
- Fully accessible
- Unstyled primitives
- Composable components
- WAI-ARIA compliant

---

## Design Patterns

### 1. Container/Presentational Pattern

**Container (Smart Components)**:
```typescript
// Smart component - handles logic and state
function StreamListContainer() {
  const { data: streams, isLoading } = useQuery({
    queryKey: ['streams', 'live'],
    queryFn: fetchLiveStreams,
  });

  const handleStreamClick = (streamId: string) => {
    navigate(`/watch/${streamId}`);
  };

  if (isLoading) return <StreamListSkeleton />;

  return (
    <StreamListPresentation
      streams={streams}
      onStreamClick={handleStreamClick}
    />
  );
}
```

**Presentational (Dumb Components)**:
```typescript
// Presentational component - only renders UI
interface StreamListPresentationProps {
  streams: Stream[];
  onStreamClick: (id: string) => void;
}

function StreamListPresentation({ streams, onStreamClick }: StreamListPresentationProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {streams.map(stream => (
        <StreamCard
          key={stream.id}
          stream={stream}
          onClick={() => onStreamClick(stream.id)}
        />
      ))}
    </div>
  );
}
```

### 2. Custom Hooks Pattern

Encapsulate logic in reusable hooks:

```typescript
// useStream.ts - Stream management logic
export function useStream() {
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const setupStream = useCallback(async (data: SetupStreamRequest) => {
    setLoading(true);
    try {
      const response = await streamApi.setupStream(data);
      setStreamInfo(response.data);
      return response.data;
    } catch (error) {
      toast.error('Failed to setup stream');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const goLive = useCallback(async () => {
    const response = await streamApi.goLive();
    return response.data;
  }, []);

  return {
    streamInfo,
    loading,
    setupStream,
    goLive,
    endStream,
  };
}

// Usage in component
function GoLiveButton() {
  const { setupStream, goLive } = useStream();

  const handleGoLive = async () => {
    await setupStream({ title: 'My Stream' });
    await goLive();
  };

  return <Button onClick={handleGoLive}>Go Live</Button>;
}
```

### 3. Compound Component Pattern

Radix UI style composition:

```typescript
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 4. Render Props Pattern

```typescript
function DataFetcher({ render, queryKey, queryFn }) {
  const { data, isLoading, error } = useQuery({ queryKey, queryFn });

  return render({ data, isLoading, error });
}

// Usage
<DataFetcher
  queryKey={['streams']}
  queryFn={fetchStreams}
  render={({ data, isLoading }) => (
    isLoading ? <Skeleton /> : <StreamList streams={data} />
  )}
/>
```

### 5. Provider Pattern

```typescript
// AuthProvider
import { createContext, useContext } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { data: session } = useAuthSession();

  return (
    <AuthContext.Provider value={session}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

---

## Data Flow

### Request Flow

```
┌─────────────┐
│  Component  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Custom Hook │ (useStream, useContent, etc.)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│React Query  │ (Caching, deduplication)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ API Client  │ (Axios + Auth interceptors)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Backend API  │
└─────────────┘
```

### State Update Flow

```
User Action
    │
    ▼
Event Handler
    │
    ▼
Mutation (React Query)
    │
    ├──► Optimistic Update (immediate UI update)
    │
    ▼
API Call
    │
    ├──► Success: Invalidate queries, refetch
    │
    └──► Error: Rollback optimistic update
```

### Example: Follow Creator Flow

```typescript
function FollowButton({ creatorId }) {
  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: () => socialApi.follow(creatorId),
    
    // 1. Optimistic update
    onMutate: async () => {
      await queryClient.cancelQueries(['follow-status', creatorId]);
      
      const previousStatus = queryClient.getQueryData(['follow-status', creatorId]);
      
      queryClient.setQueryData(['follow-status', creatorId], {
        isFollowing: true,
      });
      
      return { previousStatus };
    },
    
    // 2. On error: rollback
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        ['follow-status', creatorId],
        context?.previousStatus
      );
      toast.error('Failed to follow');
    },
    
    // 3. On success: refetch
    onSuccess: () => {
      queryClient.invalidateQueries(['follow-status', creatorId]);
      queryClient.invalidateQueries(['followers', creatorId]);
      toast.success('Followed!');
    },
  });

  return (
    <Button onClick={() => followMutation.mutate()}>
      Follow
    </Button>
  );
}
```

---

## Authentication Architecture

### Better Auth Integration

```
┌─────────────────────────────────────────────┐
│            Better Auth Client                │
│  ┌─────────────────────────────────────┐    │
│  │  Sign In/Up Methods                 │    │
│  │  - Email/Password                   │    │
│  │  - OTP                              │    │
│  │  - Magic Link (future)              │    │
│  └─────────────────────────────────────┘    │
│                    │                         │
│                    ▼                         │
│  ┌─────────────────────────────────────┐    │
│  │  Session Management                 │    │
│  │  - Token storage                    │    │
│  │  - Auto-refresh                     │    │
│  │  - Session validation               │    │
│  └─────────────────────────────────────┘    │
│                    │                         │
│                    ▼                         │
│  ┌─────────────────────────────────────┐    │
│  │  HTTP Interceptor                   │    │
│  │  - Add Bearer token to requests     │    │
│  │  - Handle 401 errors                │    │
│  │  - Redirect to login                │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### Auth Client Setup

**File**: `src/lib/auth-client.ts`

```typescript
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL,
  // Additional config
});

// Axios interceptor
axios.interceptors.request.use(async (config) => {
  const session = await authClient.getSession();
  if (session?.data?.session?.token) {
    config.headers.Authorization = `Bearer ${session.data.session.token}`;
  }
  return config;
});
```

### Protected Routes

```typescript
function ProtectedRoute({ children, requireCreator = false }) {
  const { data: session, isPending } = useAuthSession();

  if (isPending) {
    return <LoadingSpinner />;
  }

  if (!session?.user) {
    return <Navigate to="/auth/signin" />;
  }

  if (requireCreator && session.user.role !== 'CREATOR') {
    return <Navigate to="/creator-application" />;
  }

  return children;
}
```

---

## State Management Architecture

### Three-Tier State System

**1. Server State (React Query)**:
- API data
- Caching
- Background updates

**2. Global Client State (Zustand)**:
- Payment flow
- Creator application
- Multi-step forms

**3. Local Component State (useState)**:
- Form inputs
- UI toggles
- Temporary data

### When to Use Each

| State Type | Use Case | Tool |
|------------|----------|------|
| Server data | API responses, cached data | React Query |
| Global app state | Multi-component shared state | Zustand |
| Component state | Local UI state | useState |
| Form state | Form inputs & validation | React Hook Form |
| URL state | Route params, query params | React Router |

### State Synchronization

```typescript
// React Query + Zustand integration
const usePaymentStore = create((set) => ({
  selectedPackage: null,
  setSelectedPackage: (pkg) => set({ selectedPackage: pkg }),
}));

function CoinShop() {
  // Server state
  const { data: packages } = useQuery({
    queryKey: ['packages'],
    queryFn: fetchPackages,
  });

  // Global state
  const { selectedPackage, setSelectedPackage } = usePaymentStore();

  // Sync: when user selects package
  const handleSelect = (pkg) => {
    setSelectedPackage(pkg); // Update global state
    navigate('/checkout'); // Navigate to checkout
  };

  return <PackageGrid packages={packages} onSelect={handleSelect} />;
}
```

---

## Component Architecture

### Component Hierarchy

```
App
├── Layout
│   ├── Navbar
│   │   ├── Logo
│   │   ├── SearchBar
│   │   └── UserMenu
│   └── Sidebar
│       ├── NavItem
│       └── FollowingList
└── Routes
    ├── Home
    │   ├── Hero
    │   ├── LiveStreamGrid
    │   │   └── StreamCard
    │   └── FeaturedCreators
    │       └── CreatorCard
    ├── Watch
    │   ├── StreamPlayer
    │   │   ├── VideoPlayer
    │   │   └── Controls
    │   ├── Chat
    │   │   ├── MessageList
    │   │   │   └── Message
    │   │   └── MessageInput
    │   └── StreamerInfo
    │       ├── Avatar
    │       ├── FollowButton
    │       └── SubscribeButton
    └── CreatorDashboard
        ├── DashboardNav
        ├── Overview
        │   ├── MetricCard
        │   └── Chart
        └── Streams
            ├── GoLiveButton
            └── StreamHistory
                └── StreamHistoryItem
```

### Component Composition

```typescript
// Atomic Design Pattern

// Atoms (basic building blocks)
<Button>Click</Button>
<Input placeholder="Search" />

// Molecules (simple groups)
<SearchBar>
  <Input />
  <Button>Search</Button>
</SearchBar>

// Organisms (complex components)
<Navbar>
  <Logo />
  <SearchBar />
  <UserMenu />
</Navbar>

// Templates (page layouts)
<DashboardLayout>
  <Navbar />
  <Sidebar />
  <Content />
</DashboardLayout>

// Pages (specific instances)
<CreatorDashboard>
  <DashboardLayout>
    {/* Specific content */}
  </DashboardLayout>
</CreatorDashboard>
```

---

## API Integration

### API Client Architecture

```
┌────────────────────────────────────────┐
│         API Client Layer               │
├────────────────────────────────────────┤
│  ┌──────────────┐  ┌────────────────┐  │
│  │   Axios      │  │  Better Auth   │  │
│  │  Instance    │  │    Client      │  │
│  └──────┬───────┘  └────────┬───────┘  │
│         │                   │           │
│         └───────┬───────────┘           │
│                 │                       │
│  ┌──────────────┴────────────────────┐  │
│  │       API Modules                 │  │
│  │  - streamApi                      │  │
│  │  - contentApi                     │  │
│  │  - paymentApi                     │  │
│  │  - socialApi                      │  │
│  └───────────────────────────────────┘  │
└────────────────────────────────────────┘
```

### API Module Pattern

```typescript
// src/lib/api/stream.ts
import { apiClient } from './client';

export const streamApi = {
  // Get live streams
  getLiveStreams: () =>
    apiClient.get<Stream[]>('/streams/live'),

  // Get stream by ID
  getStreamById: (id: string) =>
    apiClient.get<Stream>(`/streams/${id}`),

  // Setup stream
  setupStream: (data: SetupStreamRequest) =>
    apiClient.post<SetupStreamResponse>('/streams/setup', data),

  // Go live
  goLive: () =>
    apiClient.post<GoLiveResponse>('/streams/go-live'),

  // End stream
  endStream: () =>
    apiClient.post('/streams/end'),
};
```

### Error Handling

```typescript
// Global error handler
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      authClient.signOut();
      window.location.href = '/auth/signin';
    } else if (error.response?.status === 403) {
      // Forbidden
      toast.error('Access denied');
    } else if (error.response?.status >= 500) {
      // Server error
      toast.error('Server error. Please try again.');
    }
    return Promise.reject(error);
  }
);
```

---

## Routing Architecture

### Route Configuration

```typescript
// Centralized route config
export const routes = {
  home: '/',
  auth: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    verifyEmail: '/auth/verify-email',
  },
  creator: {
    dashboard: '/creator-dashboard',
    application: '/creator-application',
  },
  watch: (username: string) => `/${username}/live`,
  profile: (username: string) => `/${username}`,
} as const;

// Usage
navigate(routes.creator.dashboard);
navigate(routes.watch('johndoe'));
```

### Lazy Loading

```typescript
// Code-split routes
const CreatorDashboard = lazy(() => import('@/pages/creator-dashboard'));
const WatchStream = lazy(() => import('@/pages/watch'));

// Wrap in Suspense
<Suspense fallback={<RouteLoadingSpinner />}>
  <Routes>
    <Route path="/creator-dashboard/*" element={<CreatorDashboard />} />
    <Route path="/:username/live" element={<WatchStream />} />
  </Routes>
</Suspense>
```

---

## Performance Patterns

### 1. Memoization

```typescript
// Memoize expensive computations
const sortedStreams = useMemo(() => {
  return streams?.sort((a, b) => b.viewerCount - a.viewerCount);
}, [streams]);

// Memoize callbacks
const handleStreamClick = useCallback((id: string) => {
  navigate(`/watch/${id}`);
}, [navigate]);

// Memoize components
const StreamCard = memo(({ stream, onClick }) => {
  return <div onClick={onClick}>{stream.title}</div>;
});
```

### 2. Virtual Scrolling

```typescript
// For long lists
import { useVirtualizer } from '@tanstack/react-virtual';

function MessageList({ messages }) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <Message message={messages[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3. Debouncing

```typescript
import { useDebouncedCallback } from 'use-debounce';

function SearchBar() {
  const [query, setQuery] = useState('');

  const debouncedSearch = useDebouncedCallback((value) => {
    setQuery(value);
  }, 500);

  return (
    <input
      onChange={(e) => debouncedSearch(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

---

## Security Architecture

### XSS Prevention

```typescript
// ✅ Safe: React escapes by default
<div>{userInput}</div>

// ❌ Unsafe: dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ Safe: Sanitize first
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

### CSRF Protection

```typescript
// Token included in requests
axios.interceptors.request.use((config) => {
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});
```

### Content Security Policy

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' https:; 
               connect-src 'self' https://api.streamit.com">
```

---

## Testing Strategy

### Unit Tests

```typescript
// Component testing
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

test('renders button with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

### Integration Tests

```typescript
// Testing hooks with React Query
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStream } from '@/hooks/useStream';

test('fetches stream info', async () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  const { result } = renderHook(() => useStream(), { wrapper });

  await waitFor(() => {
    expect(result.current.streamInfo).toBeDefined();
  });
});
```

---

## Next Steps

- [README.md](./README.md) - Project overview
- [CONFIGURATION.md](./CONFIGURATION.md) - Setup & deployment
- [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) - Component reference

---

**Architecture documented!** Deep technical insights into StreamIt frontend. 🏗️
