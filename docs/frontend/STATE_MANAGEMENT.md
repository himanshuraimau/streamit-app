# State Management

Complete guide to state management patterns in StreamIt frontend using Zustand, React Query, and custom hooks.

## State Management Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Components                              │
├────────────────────────────────────────────────────────────┤
│  useState         Custom Hooks         Zustand Stores       │
│  (Local)          (Logic + State)      (Global State)       │
│                          │                    │             │
│                          ▼                    ▼             │
│                   React Query Cache    Application State    │
│                   (Server State)       (Client State)       │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│                     API Layer                              │
│              (Axios + Better Auth)                         │
└────────────────────────────────────────────────────────────┘
```

## State Categories

### 1. Server State (React Query)
- Fetching data from API
- Caching responses
- Revalidation
- Optimistic updates

### 2. Global Client State (Zustand)
- Payment flow
- Creator application
- UI preferences

### 3. Component State (useState)
- Form inputs
- UI toggles
- Local state

### 4. URL State (React Router)
- Route parameters
- Query parameters
- Navigation state

---

## Zustand Stores

### Payment Store

**File**: `src/stores/payment.store.ts`

Manages all payment-related state including coins, gifts, and purchases.

```typescript
import { usePaymentStore } from '@/stores/payment.store';

function CoinShop() {
  const {
    wallet,
    packages,
    fetchWallet,
    fetchPackages,
    createCheckout,
  } = usePaymentStore();

  useEffect(() => {
    fetchWallet();
    fetchPackages();
  }, []);

  const handlePurchase = async (packageId: string) => {
    const checkoutUrl = await createCheckout(packageId);
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  };

  return (
    <div>
      <h2>Balance: {wallet?.balance} coins</h2>
      {packages.map(pkg => (
        <button onClick={() => handlePurchase(pkg.id)}>
          Buy {pkg.amount} coins for ${pkg.price}
        </button>
      ))}
    </div>
  );
}
```

**State**:
- `wallet`: User's coin wallet
- `packages`: Available coin packages
- `purchases`: Purchase history
- `gifts`: Available gifts
- `giftsSent`: Sent gift transactions
- `giftsReceived`: Received gift transactions

**Actions**:
- `fetchWallet()`: Load user's wallet
- `fetchPackages()`: Load coin packages
- `fetchPurchaseHistory()`: Load purchase history
- `createCheckout(packageId, discountCode?)`: Create checkout session
- `verifyPurchase(orderId)`: Verify payment completion
- `fetchGifts()`: Load available gifts
- `sendGift(request)`: Send gift to creator
- `fetchGiftsSent()`: Load sent gifts
- `fetchGiftsReceived()`: Load received gifts
- `reset()`: Clear all state

**Usage Patterns**:

```typescript
// Purchase coins with discount
const handlePurchaseWithDiscount = async () => {
  const { createCheckout } = usePaymentStore();
  const url = await createCheckout('package-id', 'DISCOUNT20');
  if (url) window.location.href = url;
};

// Send gift during stream
const handleSendGift = async (giftId: string, creatorId: string) => {
  const { sendGift } = usePaymentStore();
  const transaction = await sendGift({
    giftId,
    toUserId: creatorId,
    message: 'Great stream!',
  });
  
  if (transaction) {
    toast.success('Gift sent!');
  }
};

// Check purchase history
const { purchases, fetchPurchaseHistory } = usePaymentStore();
useEffect(() => {
  fetchPurchaseHistory({ page: 1, limit: 10 });
}, []);
```

---

### Creator Application Store

**File**: `src/stores/creator-application.ts`

Manages creator application process.

```typescript
import { useCreatorApplicationStore } from '@/stores/creator-application';

function CreatorApplicationForm() {
  const {
    application,
    status,
    loading,
    createApplication,
    updateApplication,
    uploadFile,
  } = useCreatorApplicationStore();

  const handleSubmit = async (data) => {
    if (status?.hasApplication) {
      await updateApplication(data);
    } else {
      await createApplication(data);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

**State**:
- `application`: Full application data
- `status`: Application status (pending, approved, rejected)
- `loading`: Loading state
- `error`: Error message
- `initialized`: Store initialized

**Actions**:
- `fetchStatus()`: Get application status
- `fetchApplication()`: Get full application
- `createApplication(data)`: Submit new application
- `updateApplication(data)`: Update existing application
- `uploadFile(file, purpose?)`: Upload file to S3
- `deleteFile(fileUrl)`: Delete uploaded file
- `getPresignedUrl(fileUrl)`: Get presigned URL for private file
- `reset()`: Clear state

**Usage Patterns**:

```typescript
// Check if user can apply
const { status, fetchStatus } = useCreatorApplicationStore();
useEffect(() => {
  fetchStatus();
}, []);

const canApply = status && !status.hasApplication;

// Upload identity document
const handleUploadId = async (file: File) => {
  const { uploadFile } = useCreatorApplicationStore();
  const { url, key } = await uploadFile(file, 'identity');
  return url;
};

// Update application after rejection
const handleReapply = async (newData) => {
  const { updateApplication } = useCreatorApplicationStore();
  await updateApplication(newData);
  toast.success('Application resubmitted!');
};
```

---

## Custom Hooks

### useAuthSession

**File**: `src/hooks/useAuthSession.ts`

Better Auth session management.

```typescript
import { useAuthSession } from '@/hooks/useAuthSession';

function ProfilePage() {
  const { data: session, isPending, error } = useAuthSession();

  if (isPending) return <div>Loading...</div>;
  if (!session?.user) return <div>Not logged in</div>;

  return (
    <div>
      <h1>Welcome {session.user.email}</h1>
      <p>Role: {session.user.role}</p>
    </div>
  );
}
```

**Returns**:
- `data`: Session object with user
- `isPending`: Loading state
- `error`: Error object
- `refetch()`: Manually refetch session

**Session Object**:
```typescript
{
  user: {
    id: string;
    email: string;
    name: string;
    image: string | null;
    role: 'VIEWER' | 'CREATOR' | 'ADMIN';
    emailVerified: boolean;
  },
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
  }
}
```

---

### useCurrentUser

**File**: `src/hooks/useCurrentUser.ts`

Extended user information.

```typescript
import { useCurrentUser } from '@/hooks/useCurrentUser';

function UserProfile() {
  const { user, isLoading, isCreator, isAdmin } = useCurrentUser();

  return (
    <div>
      {isCreator && <CreatorBadge />}
      {isAdmin && <AdminBadge />}
      <p>Username: {user?.username}</p>
      <p>Bio: {user?.bio}</p>
    </div>
  );
}
```

**Returns**:
- `user`: Full user object
- `isLoading`: Loading state
- `isCreator`: Boolean - is user a creator
- `isAdmin`: Boolean - is user an admin
- `refetch()`: Refresh user data

---

### useStream

**File**: `src/hooks/useStream.ts`

Stream management for creators.

```typescript
import { useStream } from '@/hooks/useStream';

function CreatorDashboard() {
  const {
    streamInfo,
    streamStatus,
    loading,
    setupStream,
    goLive,
    endStream,
    updateStream,
  } = useStream();

  const handleGoLive = async () => {
    // Setup stream first
    const setup = await setupStream({
      title: 'My Stream',
      description: 'Live coding session',
      isChatEnabled: true,
    });

    if (setup) {
      // Get LiveKit token and go live
      const liveData = await goLive();
      if (liveData) {
        // Use liveData.token for LiveKit
        console.log('Live!', liveData.token);
      }
    }
  };

  return (
    <div>
      <button onClick={handleGoLive} disabled={streamStatus?.isLive}>
        Go Live
      </button>
      {streamStatus?.isLive && (
        <button onClick={endStream}>End Stream</button>
      )}
    </div>
  );
}
```

**Returns**:
- `streamInfo`: Stream metadata
- `streamStatus`: Current stream status
- `liveData`: LiveKit connection data
- `loading`: Loading state
- `error`: Error message

**Methods**:
- `fetchStreamInfo()`: Get stream metadata
- `fetchStreamStatus()`: Get live status
- `setupStream(data)`: Configure stream before going live
- `goLive()`: Start streaming (get LiveKit token)
- `endStream()`: End current stream
- `updateStream(data)`: Update stream metadata
- `updateChatSettings(settings)`: Update chat settings

---

### useContent

**File**: `src/hooks/useContent.ts`

Content management (videos, uploads).

```typescript
import { useContent } from '@/hooks/useContent';

function UploadVideo() {
  const {
    uploadToS3,
    createContent,
    myContent,
    fetchMyContent,
  } = useContent();

  const handleUpload = async (file: File) => {
    // Upload to S3
    const s3Url = await uploadToS3(file, 'video');
    
    // Create content record
    const content = await createContent({
      title: 'My Video',
      description: 'Description here',
      type: 'VIDEO',
      videoUrl: s3Url,
    });

    if (content) {
      toast.success('Video uploaded!');
      fetchMyContent(); // Refresh list
    }
  };

  return (
    <div>
      <input type="file" onChange={(e) => {
        if (e.target.files?.[0]) {
          handleUpload(e.target.files[0]);
        }
      }} />
      
      <h2>My Content</h2>
      {myContent.map(item => (
        <div key={item.id}>{item.title}</div>
      ))}
    </div>
  );
}
```

**Returns**:
- `myContent`: Creator's content list
- `loading`: Loading state
- `error`: Error message

**Methods**:
- `fetchMyContent()`: Load creator's content
- `createContent(data)`: Create new content
- `updateContent(id, data)`: Update content
- `deleteContent(id)`: Delete content
- `uploadToS3(file, type)`: Upload file to S3
- `uploadThumbnail(file)`: Upload thumbnail

---

### useSocial

**File**: `src/hooks/useSocial.ts`

Social features (follow, feed).

```typescript
import { useSocial } from '@/hooks/useSocial';

function CreatorProfile({ creatorId }) {
  const {
    isFollowing,
    followersCount,
    followingCount,
    toggleFollow,
    loading,
  } = useSocial(creatorId);

  return (
    <div>
      <button onClick={toggleFollow} disabled={loading}>
        {isFollowing ? 'Unfollow' : 'Follow'}
      </button>
      <p>{followersCount} followers</p>
      <p>{followingCount} following</p>
    </div>
  );
}
```

**Returns**:
- `isFollowing`: Boolean - following status
- `followersCount`: Number of followers
- `followingCount`: Number following
- `loading`: Loading state

**Methods**:
- `toggleFollow()`: Follow/unfollow
- `fetchFollowStatus()`: Check if following
- `fetchFollowCounts()`: Get follower counts

---

### useCreatorApplication

**File**: `src/hooks/useCreatorApplication.ts`

Wrapper around creator application store.

```typescript
import { useCreatorApplication } from '@/hooks/useCreatorApplication';

function ApplyPage() {
  const {
    canApply,
    hasApplication,
    isApproved,
    isPending,
    isRejected,
    application,
    submitApplication,
  } = useCreatorApplication();

  if (!canApply) {
    return <div>You already have an application</div>;
  }

  return (
    <ApplicationForm onSubmit={submitApplication} />
  );
}
```

**Returns**:
- `canApply`: Can submit new application
- `hasApplication`: Has existing application
- `isApproved`: Application approved
- `isPending`: Application pending review
- `isRejected`: Application rejected
- `application`: Application data
- `submitApplication(data)`: Submit application

---

## React Query Usage

### Query Pattern

```typescript
import { useQuery } from '@tanstack/react-query';
import { streamApi } from '@/lib/api/stream';

function StreamList() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['streams', 'live'],
    queryFn: () => streamApi.getLiveStreams(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.streams.map(stream => (
        <StreamCard key={stream.id} stream={stream} />
      ))}
    </div>
  );
}
```

### Mutation Pattern

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '@/lib/api/content';

function DeleteContentButton({ contentId }) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => contentApi.deleteContent(contentId),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['content', 'my'] });
      toast.success('Content deleted!');
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`);
    },
  });

  return (
    <button 
      onClick={() => deleteMutation.mutate()}
      disabled={deleteMutation.isPending}
    >
      {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
    </button>
  );
}
```

### Optimistic Updates

```typescript
const followMutation = useMutation({
  mutationFn: (creatorId: string) => socialApi.follow(creatorId),
  onMutate: async (creatorId) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries({ queryKey: ['follow-status', creatorId] });

    // Snapshot previous value
    const previousStatus = queryClient.getQueryData(['follow-status', creatorId]);

    // Optimistically update
    queryClient.setQueryData(['follow-status', creatorId], {
      isFollowing: true,
    });

    return { previousStatus };
  },
  onError: (err, creatorId, context) => {
    // Rollback on error
    queryClient.setQueryData(['follow-status', creatorId], context?.previousStatus);
  },
  onSettled: (creatorId) => {
    // Refetch after mutation
    queryClient.invalidateQueries({ queryKey: ['follow-status', creatorId] });
  },
});
```

---

## State Synchronization

### Query Keys Structure

```typescript
// Organized by domain
['streams']                     // All streams
['streams', 'live']            // Live streams only
['streams', streamId]          // Single stream
['streams', streamId, 'chat']  // Stream chat

['content']                    // All content
['content', 'my']             // My content
['content', contentId]        // Single content

['user', userId]              // User profile
['user', userId, 'followers'] // User followers

['payments']                  // Payment data
['payments', 'wallet']        // Wallet info
['payments', 'history']       // Purchase history
```

### Invalidation Strategy

```typescript
// After creating content
queryClient.invalidateQueries({ queryKey: ['content', 'my'] });

// After ending stream
queryClient.invalidateQueries({ queryKey: ['streams'] });

// After purchasing coins
queryClient.invalidateQueries({ queryKey: ['payments', 'wallet'] });

// After following user
queryClient.invalidateQueries({ 
  queryKey: ['user', userId, 'followers'],
});
```

---

## Best Practices

### 1. Use Appropriate State Layer

```typescript
// ❌ Don't use Zustand for server data
const useAppStore = create((set) => ({
  streams: [],
  fetchStreams: async () => {
    const data = await api.getStreams();
    set({ streams: data });
  },
}));

// ✅ Use React Query for server data
const { data: streams } = useQuery({
  queryKey: ['streams'],
  queryFn: () => api.getStreams(),
});
```

### 2. Minimize Global State

```typescript
// ❌ Don't store everything globally
const useAppStore = create((set) => ({
  searchQuery: '',
  selectedTab: 'home',
  modalOpen: false,
  // ...
}));

// ✅ Use component state when possible
function SearchPage() {
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
}
```

### 3. Colocate State with Usage

```typescript
// ✅ State lives close to where it's used
function VideoPlayer({ videoUrl }) {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  
  return (
    <video
      src={videoUrl}
      playing={playing}
      volume={volume}
    />
  );
}
```

### 4. Handle Loading & Error States

```typescript
function StreamList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['streams'],
    queryFn: fetchStreams,
  });

  // ✅ Always handle all states
  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState error={error} />;
  if (!data?.length) return <EmptyState />;

  return <StreamGrid streams={data} />;
}
```

### 5. Debounce Expensive Operations

```typescript
import { useDebouncedCallback } from 'use-debounce';

function SearchBar() {
  const [query, setQuery] = useState('');

  const { data } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchApi.search(query),
    enabled: query.length > 2,
  });

  // ✅ Debounce user input
  const debouncedSetQuery = useDebouncedCallback(
    (value) => setQuery(value),
    500
  );

  return (
    <input
      onChange={(e) => debouncedSetQuery(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

---

## Performance Optimization

### Memoization

```typescript
import { useMemo, useCallback } from 'react';

function StreamList({ streams }) {
  // ✅ Memoize expensive computations
  const sortedStreams = useMemo(() => {
    return streams.sort((a, b) => b.viewerCount - a.viewerCount);
  }, [streams]);

  // ✅ Memoize callbacks
  const handleStreamClick = useCallback((streamId) => {
    navigate(`/watch/${streamId}`);
  }, [navigate]);

  return sortedStreams.map(stream => (
    <StreamCard
      key={stream.id}
      stream={stream}
      onClick={() => handleStreamClick(stream.id)}
    />
  ));
}
```

### Selective Re-renders

```typescript
// ✅ Only subscribe to needed state
const balance = usePaymentStore((state) => state.wallet?.balance);

// ❌ Don't subscribe to entire store
const store = usePaymentStore();
const balance = store.wallet?.balance; // Re-renders on ANY change
```

### Query Stale Time

```typescript
// ✅ Configure appropriate stale times
useQuery({
  queryKey: ['streams', 'live'],
  queryFn: fetchLiveStreams,
  staleTime: 30 * 1000, // Refetch if older than 30s
});

useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  staleTime: 5 * 60 * 1000, // User data changes less frequently
});
```

---

## Debugging Tools

### Zustand DevTools

```typescript
import { devtools } from 'zustand/middleware';

export const usePaymentStore = create(
  devtools(
    (set) => ({
      // ... state
    }),
    { name: 'PaymentStore' } // Shows in Redux DevTools
  )
);
```

### React Query DevTools

```typescript
// main.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

---

## Next Steps

- [ROUTING_PAGES.md](./ROUTING_PAGES.md) - Explore all routes
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) - UI components

---

**State management complete!** Well-organized and performant state handling. 🎯
