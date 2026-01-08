# Routing & Pages

Complete reference for all routes and pages in StreamIt frontend.

## Route Structure

```
/                                # Homepage
├── auth/                        # Authentication flows
│   ├── login-options           # Login method selection
│   ├── signup                  # User registration
│   ├── signin                  # Email/password login
│   ├── signin-otp              # OTP login
│   ├── verify-email            # Email verification
│   ├── forgot-password         # Password reset request
│   └── reset-password          # Password reset form
│
├── creator-application          # Become a creator
│
├── creator-dashboard/           # Creator tools
│   ├── overview                # Analytics dashboard
│   ├── streams                 # Stream management
│   ├── chat                    # Chat moderation
│   ├── community               # Community management
│   ├── content-upload          # Upload videos
│   └── posts                   # Create posts
│
├── content                      # Browse all content
├── search                       # Search streams/creators
├── live                         # Live streams list
├── following                    # Following feed
├── creators                     # Discover creators
│
├── coins/                       # Coin management
│   ├── shop                    # Purchase coins
│   ├── success                 # Purchase success
│   ├── history                 # Purchase history
│   └── my-codes                # Discount codes
│
├── gifts/                       # Gift management
│   ├── sent                    # Gifts sent
│   └── received                # Gifts received
│
└── /:username/                  # Creator profile (YouTube-style)
    ├── live                    # Live stream
    ├── videos                  # Videos tab
    ├── about                   # About tab
    └── community               # Community tab
```

---

## Public Routes

### Homepage `/`

**File**: `src/pages/home/index.tsx`

Landing page showing live streams and featured content.

**Features**:
- Live stream grid
- Featured creators
- Category browsing
- Search bar

**Components Used**:
- `StreamCard`
- `CreatorCard`
- `CategoryFilter`

```tsx
function Home() {
  const { data: liveStreams } = useQuery({
    queryKey: ['streams', 'live'],
    queryFn: fetchLiveStreams,
  });

  return (
    <div>
      <Hero />
      <LiveStreamGrid streams={liveStreams} />
      <FeaturedCreators />
    </div>
  );
}
```

---

## Authentication Routes

All auth routes are prefixed with `/auth/`.

### Login Options `/auth/login-options`

**File**: `src/pages/auth/login-options.tsx`

Choose login method.

**Options**:
- Email/Password
- OTP (One-Time Password)
- Magic Link (future)

---

### Sign Up `/auth/signup`

**File**: `src/pages/auth/signup.tsx`

User registration form.

**Fields**:
- Email
- Password
- Confirm Password
- Terms acceptance

**Validation**:
- Email format
- Password strength (min 8 chars)
- Password match

**Flow**:
1. User fills form
2. Submit registration
3. Send verification email
4. Redirect to verify-email page

```tsx
const handleSubmit = async (data) => {
  const result = await authClient.signUp.email({
    email: data.email,
    password: data.password,
    name: data.name,
  });

  if (result.error) {
    toast.error(result.error.message);
  } else {
    navigate('/auth/verify-email');
  }
};
```

---

### Sign In `/auth/signin`

**File**: `src/pages/auth/signin.tsx`

Email/password login.

**Fields**:
- Email
- Password
- Remember me checkbox

**Links**:
- Forgot password
- Sign up instead

**Flow**:
1. Enter credentials
2. Submit
3. Redirect to homepage on success

```tsx
const handleSignIn = async (data) => {
  const result = await authClient.signIn.email({
    email: data.email,
    password: data.password,
  });

  if (result.error) {
    toast.error('Invalid credentials');
  } else {
    navigate('/');
  }
};
```

---

### OTP Sign In `/auth/signin-otp`

**File**: `src/pages/auth/signin-otp.tsx`

Login with one-time password.

**Flow**:
1. Enter email
2. Request OTP
3. Enter 6-digit code
4. Verify and login

---

### Verify Email `/auth/verify-email`

**File**: `src/pages/auth/verify-email.tsx`

Email verification after signup.

**Features**:
- Instructions to check email
- Resend verification email
- Link to check spam folder

---

### Forgot Password `/auth/forgot-password`

**File**: `src/pages/auth/forgot-password.tsx`

Request password reset.

**Flow**:
1. Enter email
2. Receive reset link
3. Check email
4. Click link → reset password page

---

### Reset Password `/auth/reset-password`

**File**: `src/pages/auth/reset-password.tsx`

Set new password using reset token.

**Fields**:
- New password
- Confirm password

**Token**: Comes from email link query parameter

---

## Creator Routes

### Creator Application `/creator-application`

**File**: `src/pages/creator-application/index.tsx`

Apply to become a creator.

**Requirements Check**:
- Must be logged in
- Must not have existing application
- Email must be verified

**Form Fields**:
- Display name
- Bio
- Category/niche
- Why you want to create
- Sample content links
- Identity verification (optional)

**States**:
- Not applied: Show application form
- Pending: Show "Under Review" message
- Approved: Redirect to creator dashboard
- Rejected: Show rejection reason + reapply option

```tsx
function CreatorApplication() {
  const { status, canApply, submitApplication } = useCreatorApplication();

  if (!canApply) {
    return <ApplicationStatus status={status} />;
  }

  return (
    <ApplicationForm onSubmit={submitApplication} />
  );
}
```

---

## Creator Dashboard

Nested routes under `/creator-dashboard/`.

**Layout**: `src/pages/creator-dashboard/index.tsx`

Sidebar navigation with:
- Overview
- Streams
- Chat
- Community
- Content Upload
- Posts

**Protection**: Only accessible to approved creators.

### Overview `/creator-dashboard/overview`

**File**: `src/pages/creator-dashboard/overview.tsx`

Analytics and metrics dashboard.

**Metrics**:
- Total views
- Follower count
- Revenue (coins earned)
- Average watch time
- Subscriber count

**Charts**:
- View trends (7 days, 30 days, 90 days)
- Revenue over time
- Top performing content

---

### Streams `/creator-dashboard/streams`

**File**: `src/pages/creator-dashboard/streams.tsx`

Manage live streams.

**Features**:
- Go live button
- Stream settings modal
- Stream history
- Past streams with stats
- Delete streams

**Go Live Flow**:
1. Click "Go Live"
2. Configure stream:
   - Title
   - Description
   - Thumbnail (optional)
   - Chat settings
3. Get LiveKit token
4. Start broadcast

```tsx
function Streams() {
  const { setupStream, goLive } = useStream();

  const handleGoLive = async (settings) => {
    const setup = await setupStream(settings);
    if (setup) {
      const liveData = await goLive();
      // Use liveData.token with LiveKit
    }
  };

  return (
    <div>
      <Button onClick={() => setShowSettings(true)}>
        Go Live
      </Button>
      <StreamHistory />
    </div>
  );
}
```

---

### Chat `/creator-dashboard/chat`

**File**: `src/pages/creator-dashboard/chat.tsx`

Chat moderation tools.

**Features**:
- View chat history
- Ban/unban users
- Timeout users
- Clear chat
- Chat rules configuration

---

### Community `/creator-dashboard/community`

**File**: `src/pages/creator-dashboard/community.tsx`

Manage followers and subscribers.

**Features**:
- Follower list
- Subscriber list
- Engagement metrics
- Community guidelines

---

### Content Upload `/creator-dashboard/content-upload`

**File**: `src/pages/creator-dashboard/content-upload.tsx`

Upload videos and manage content.

**Upload Flow**:
1. Select video file (max 500MB)
2. Add metadata:
   - Title
   - Description
   - Thumbnail
   - Category
3. Upload to S3
4. Process and publish

```tsx
function ContentUpload() {
  const { uploadToS3, createContent } = useContent();

  const handleUpload = async (file: File, metadata) => {
    // Upload video
    const videoUrl = await uploadToS3(file, 'video');
    
    // Upload thumbnail
    const thumbnailUrl = await uploadToS3(metadata.thumbnail, 'thumbnail');
    
    // Create content record
    await createContent({
      title: metadata.title,
      description: metadata.description,
      videoUrl,
      thumbnailUrl,
      type: 'VIDEO',
    });
  };

  return <UploadForm onSubmit={handleUpload} />;
}
```

**My Content**:
- List uploaded content
- Edit metadata
- Delete content
- View analytics per video

---

### Posts `/creator-dashboard/posts`

**File**: `src/pages/creator-dashboard/posts.tsx`

Create community posts.

**Features**:
- Create text posts
- Add images
- Edit/delete posts
- View post engagement

---

## Content & Discovery

### Content Page `/content`

**File**: `src/pages/content/index.tsx`

Browse all uploaded content (VOD).

**Features**:
- Video grid
- Filter by category
- Sort by date/views
- Search content

---

### Search `/search`

**File**: `src/pages/search/index.tsx`

Search streams, creators, and content.

**Tabs**:
- Live Streams
- Creators
- Videos

**Features**:
- Real-time search
- Filter results
- Recent searches
- Suggested searches

```tsx
function SearchPage() {
  const [query, setQuery] = useState('');
  const { data: results } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchApi.search(query),
    enabled: query.length > 2,
  });

  return (
    <div>
      <SearchBar value={query} onChange={setQuery} />
      <SearchResults results={results} />
    </div>
  );
}
```

---

### Live Streams `/live`

**File**: `src/pages/live/index.tsx`

Browse all live streams.

**Features**:
- Live stream grid
- Sort by viewers
- Filter by category
- Auto-refresh

---

### Following `/following`

**File**: `src/pages/following/index.tsx`

Streams from followed creators.

**Protection**: Requires login

**Features**:
- Live followed streams
- Offline followed creators
- Recent videos from follows

---

### Creators Directory `/creators`

**File**: `src/pages/creators/index.tsx`

Discover new creators.

**Features**:
- Creator grid
- Sort by followers
- Filter by category
- Follow button

---

## Payments & Coins

### Coin Shop `/coins/shop`

**File**: `src/pages/CoinShop.tsx`

Purchase coins.

**Features**:
- Coin packages display
- Apply discount code
- Select payment method
- Checkout with Dodo Payments

**Packages**:
- 100 coins - $9.99
- 500 coins - $44.99 (+50 bonus)
- 1000 coins - $84.99 (+150 bonus)
- 2500 coins - $199.99 (+500 bonus)

```tsx
function CoinShop() {
  const { packages, createCheckout } = usePaymentStore();

  const handlePurchase = async (packageId: string, discountCode?: string) => {
    const checkoutUrl = await createCheckout(packageId, discountCode);
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  };

  return (
    <div>
      <DiscountCodeInput />
      <PackageGrid packages={packages} onSelect={handlePurchase} />
    </div>
  );
}
```

---

### Purchase Success `/coins/success`

**File**: `src/pages/CoinSuccess.tsx`

Successful purchase confirmation.

**Query Parameters**:
- `orderId`: Dodo Payments order ID

**Flow**:
1. Verify purchase with backend
2. Update wallet balance
3. Show success message
4. Redirect after 3 seconds

---

### Purchase History `/coins/history`

**File**: `src/pages/PurchaseHistory.tsx`

View past purchases.

**Columns**:
- Date
- Type (Coins/Subscription)
- Amount
- Price
- Status
- Order ID

**Features**:
- Pagination
- Filter by status
- Export to CSV

---

### My Codes `/coins/my-codes`

**File**: `src/pages/MyCodes.tsx`

User's discount codes.

**Features**:
- Available codes
- Code details (discount %, expiry)
- Apply to purchase
- Code history

---

## Gifts

### Gifts Sent `/gifts/sent`

**File**: `src/pages/GiftsSent.tsx`

History of gifts sent to creators.

**Columns**:
- Date
- Gift name/icon
- Recipient creator
- Cost (coins)
- Message (if any)

---

### Gifts Received `/gifts/received`

**File**: `src/pages/GiftsReceived.tsx`

Gifts received (for creators).

**Protection**: Creators only

**Columns**:
- Date
- Gift name/icon
- Sender
- Value (coins)
- Message

---

## Creator Profile & Streaming

### Watch Stream `/:username/live`

**File**: `src/pages/watch/index.tsx`

Watch live stream.

**URL**: `/:username/live` (e.g., `/johndoe/live`)

**Features**:
- LiveKit video player
- Live chat
- Viewer count
- Follow button
- Subscribe button
- Gift button
- Share button

**Components**:
- `<StreamPlayer>` - Video player
- `<Chat>` - Live chat
- `<StreamerInfoCard>` - Creator info
- `<GiftPicker>` - Send gifts

```tsx
function WatchStream() {
  const { username } = useParams();
  const { data: stream } = useQuery({
    queryKey: ['stream', username],
    queryFn: () => streamApi.getStreamByUsername(username),
  });

  if (!stream?.isLive) {
    return <div>Stream is offline</div>;
  }

  return (
    <div className="grid grid-cols-[1fr_350px]">
      <div>
        <StreamPlayer
          streamId={stream.id}
          token={viewerToken}
        />
        <StreamerInfoCard creator={stream.user} />
      </div>
      <Chat streamId={stream.id} />
    </div>
  );
}
```

---

### Creator Profile `/:username`

**File**: `src/pages/creator/index.tsx`

Creator profile page (YouTube-style).

**URL Patterns**:
- `/:username` - Default (overview)
- `/:username/videos` - Videos tab
- `/:username/about` - About tab
- `/:username/community` - Community tab

**Features**:
- Banner image
- Avatar
- Bio
- Follower count
- Follow/Subscribe buttons
- Tab navigation

**Tabs**:

#### Videos Tab
- Uploaded videos grid
- Sort by date/views
- Play video inline

#### About Tab
- Full bio
- Links (social media)
- Stats (total views, join date)

#### Community Tab
- Creator posts
- Comments
- Announcements

```tsx
function CreatorPage() {
  const { username } = useParams();
  const { pathname } = useLocation();
  
  const activeTab = pathname.includes('/videos') ? 'videos'
    : pathname.includes('/about') ? 'about'
    : pathname.includes('/community') ? 'community'
    : 'videos';

  return (
    <div>
      <CreatorBanner creator={creator} />
      <Tabs value={activeTab}>
        <TabsList>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
        </TabsList>
        <TabsContent value="videos">
          <VideoGrid videos={creator.content} />
        </TabsContent>
        <TabsContent value="about">
          <AboutSection creator={creator} />
        </TabsContent>
        <TabsContent value="community">
          <CommunityPosts creatorId={creator.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## Route Protection

### Public Routes
- `/`
- `/auth/*`
- `/live`
- `/search`
- `/creators`
- `/:username/*`

### Authenticated Routes
- `/creator-application`
- `/following`
- `/coins/*`
- `/gifts/*`

### Creator Routes
- `/creator-dashboard/*`

### Admin Routes
(Future implementation)
- `/admin/*`

### Route Guard Example

```tsx
import { useAuthSession } from '@/hooks/useAuthSession';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, requireCreator = false }) {
  const { data: session, isPending } = useAuthSession();

  if (isPending) return <LoadingSpinner />;
  
  if (!session?.user) {
    return <Navigate to="/auth/signin" />;
  }

  if (requireCreator && session.user.role !== 'CREATOR') {
    return <Navigate to="/creator-application" />;
  }

  return children;
}

// Usage
<Route 
  path="/creator-dashboard/*" 
  element={
    <ProtectedRoute requireCreator>
      <CreatorDashboard />
    </ProtectedRoute>
  } 
/>
```

---

## Navigation Components

### Navbar

**File**: `src/components/common/Navbar.tsx`

Main navigation bar.

**Links**:
- Home
- Live
- Following (auth required)
- Browse

**Right Side**:
- Search icon
- Coin balance (auth)
- Notifications (auth)
- User menu (auth)
- Sign In (guest)

---

### Sidebar

**File**: `src/components/ui/sidebar.tsx`

Collapsible sidebar navigation.

**Sections**:
- Home
- Following
- Browse
- Live
- Categories

**Bottom**:
- Become Creator
- Settings
- Help

---

## URL Parameters

### Query Parameters

```typescript
// Search page
/search?q=gaming&type=streams

// Pagination
/content?page=2&limit=20

// Filters
/live?category=gaming&sort=viewers
```

### Route Parameters

```typescript
// Creator profile
/:username → { username: 'johndoe' }

// Stream watch
/:username/live → { username: 'johndoe' }
```

### Hash Navigation

```typescript
// Tab switching
/:username/videos#popular
/:username/about#links
```

---

## Error Pages

### 404 Not Found

Redirects to homepage via:
```tsx
<Route path="*" element={<Navigate to="/" replace />} />
```

### 403 Forbidden

Access denied for protected routes.

### 500 Server Error

API error boundary.

---

## SEO & Metadata

Each page should have:

```tsx
import { Helmet } from 'react-helmet-async';

function WatchStream({ stream }) {
  return (
    <>
      <Helmet>
        <title>{stream.title} - StreamIt</title>
        <meta name="description" content={stream.description} />
        <meta property="og:title" content={stream.title} />
        <meta property="og:image" content={stream.thumbnail} />
      </Helmet>
      {/* Page content */}
    </>
  );
}
```

---

## Next Steps

- [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) - State patterns
- [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) - UI components
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design

---

**All routes documented!** Complete navigation reference. 🗺️
