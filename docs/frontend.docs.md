# Frontend Documentation

## Overview

The frontend is a React SPA for a live streaming platform with social features, creator dashboards, and payment integration.

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Routing**: React Router DOM 7
- **State Management**: Zustand, TanStack Query
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives
- **Forms**: React Hook Form + Zod
- **Live Streaming**: LiveKit React Components
- **Animations**: Framer Motion

## Project Structure

```
frontend/src/
├── components/
│   ├── auth/          # Auth-related components
│   ├── common/        # Shared components
│   ├── payment/       # Coin/gift components
│   ├── stream/        # Stream player components
│   └── ui/            # Base UI components (shadcn)
├── hooks/             # Custom React hooks
├── lib/
│   ├── api/           # API client modules
│   ├── api-client.ts  # Base fetch wrapper
│   ├── auth-client.ts # Better Auth client
│   └── utils.ts       # Utility functions
├── pages/             # Route pages
├── stores/            # Zustand stores
├── types/             # TypeScript types
└── utils/             # Additional utilities
```

## Environment Variables

```env
VITE_API_URL=http://localhost:3000
```

## Routing

### Public Routes
| Path | Component | Description |
|------|-----------|-------------|
| `/` | Home | Landing/feed page |
| `/live` | LivePage | All live streams |
| `/creators` | CreatorsPage | Browse creators |
| `/search` | SearchPage | Search users/streams |
| `/:username` | CreatorPage | Creator profile |
| `/:username/live` | WatchStream | Watch live stream |

### Auth Routes
| Path | Component | Description |
|------|-----------|-------------|
| `/auth/login-options` | LoginOptions | Auth method selection |
| `/auth/signup` | SignUp | Registration |
| `/auth/signin` | SignIn | Email/password login |
| `/auth/signin-otp` | SignInOTP | OTP login |
| `/auth/verify-email` | VerifyEmail | Email verification |
| `/auth/forgot-password` | ForgotPassword | Password reset request |
| `/auth/reset-password` | ResetPassword | Password reset |

### Creator Dashboard (`/creator-dashboard`)
| Path | Component | Description |
|------|-----------|-------------|
| `/overview` | Overview | Dashboard home |
| `/streams` | Streams | Stream management |
| `/keys` | Keys | Stream key management |
| `/content-upload` | ContentUpload | Post creation |
| `/posts` | Posts | Post management |
| `/chat` | Chat | Chat settings |
| `/community` | Community | Follower management |

### Payment Routes
| Path | Component | Description |
|------|-----------|-------------|
| `/coins/shop` | CoinShop | Buy coins |
| `/coins/success` | CoinSuccess | Purchase confirmation |
| `/coins/history` | PurchaseHistory | Transaction history |
| `/coins/my-codes` | MyCodes | View discount codes |
| `/gifts/sent` | GiftsSent | Sent gifts |
| `/gifts/received` | GiftsReceived | Received gifts |

## API Client

### Base Client (`lib/api-client.ts`)

Wrapper around fetch with automatic Bearer token handling:

```typescript
import { apiFetch, apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client';

// Automatic auth header injection
const data = await apiGet<ResponseType>('/api/endpoint');
const result = await apiPost<ResponseType>('/api/endpoint', { body });
```

Features:
- Auto-injects `Authorization: Bearer <token>` header
- Stores token from `set-auth-token` response header
- Clears token on 401 responses
- Includes credentials for cookie fallback

### Auth Client (`lib/auth-client.ts`)

Better Auth React client with email OTP plugin:

```typescript
import { authClient, useSession, signIn, signOut } from '@/lib/auth-client';

// In components
const { data: session, isPending } = useSession();
```

### API Modules

#### Stream API (`lib/api/stream.ts`)
```typescript
import { streamApi, viewerApi } from '@/lib/api/stream';

// Creator operations
await streamApi.createStreamWithMetadata({ title, streamMethod: 'obs' });
await streamApi.getStreamCredentials();
await streamApi.updateChatSettings({ isChatEnabled: true });

// Viewer operations
await viewerApi.getLiveStreams();
await viewerApi.getStreamByUsername('creator');
await streamApi.getViewerToken(hostId);
```

#### Content API (`lib/api/content.ts`)
```typescript
import { contentApi } from '@/lib/api/content';

await contentApi.getPublicFeed({ limit: 20 });
await contentApi.createPost({ content, type: 'TEXT', media: files });
await contentApi.togglePostLike(postId);
await contentApi.addComment({ postId, content });
```

#### Social API (`lib/api/social.ts`)
```typescript
import { socialApi } from '@/lib/api/social';

await socialApi.getCreatorProfile(username);
await socialApi.followUser(userId);
await socialApi.unfollowUser(userId);
await socialApi.getCreators();
```

#### Payment API (`lib/api/payment.ts`)
```typescript
import { paymentApi } from '@/lib/api/payment';

await paymentApi.getWallet();
await paymentApi.getPackages();
await paymentApi.createCheckout(packageId, discountCode);
await paymentApi.sendGift({ receiverId, giftId, streamId });
```

#### Discount API (`lib/api/discount.ts`)
```typescript
import { discountApi } from '@/lib/api/discount';

await discountApi.validateCode(code, packageId);
await discountApi.getMyCodes();
await discountApi.getLatestRewardCode();
```

## Custom Hooks

### `useAuthSession`
Typed wrapper around Better Auth's useSession:
```typescript
const { data, isPending, error } = useAuthSession();
// data.user includes username field
```

### `useStream`
Stream management for creators:
```typescript
const { streamInfo, credentials, isLive, createStream, updateInfo } = useStream();
```

### `useContent`
Content/post operations:
```typescript
const { posts, createPost, deletePost, toggleLike } = useContent();
```

### `useSocial`
Social features:
```typescript
const { follow, unfollow, isFollowing } = useSocial(userId);
```

## State Management

### Zustand Stores

#### `creator-application.ts`
Multi-step creator application form state.

#### `payment.store.ts`
Coin wallet and gift state management.

## Key Components

### Stream Components
- `StreamPlayer` - LiveKit video player wrapper
- `VideoPlayer` - Core video element
- `Chat` - Real-time chat component
- `StreamSetupModal` - Stream configuration modal
- `StreamerInfoCard` - Creator info display

### Payment Components
- `CoinBalance` - Wallet balance display
- `CoinPackageCard` - Package purchase card
- `GiftPicker` - Gift selection modal
- `GiftButton` - Send gift trigger
- `GiftAnimation` - Gift animation overlay
- `DiscountCodeInput` - Discount code entry and validation
- `AppliedDiscount` - Shows applied discount details

### Content Components
- `PostCard` - Post display card
- `PostFeed` - Infinite scroll feed
- `CreatePostForm` - Post creation form
- `CommentSection` - Post comments
- `MediaGrid` - Media gallery

## Authentication Flow

1. User signs up/in via auth pages
2. Better Auth returns session with token
3. Token stored in localStorage (`better_auth_token`)
4. API client auto-attaches Bearer header
5. Session checked via `useAuthSession` hook

## Running the App

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

## Type Definitions

Key types in `src/types/`:

```typescript
// auth.ts
interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  image?: string;
  emailVerified: boolean;
}

// content.ts
interface Post {
  id: string;
  content?: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'MIXED';
  media: PostMedia[];
  author: User;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}

// payment.types.ts
interface CoinWallet {
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

interface Gift {
  id: string;
  name: string;
  coinPrice: number;
  imageUrl: string;
  animationUrl?: string;
}

// discount.types.ts
interface DiscountCode {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  codeType: 'PROMOTIONAL' | 'REWARD';
  expiresAt: string | null;
  isActive: boolean;
}

interface DiscountValidationData {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  baseCoins: number;
  bonusCoins: number;
  totalCoins: number;
}
```
