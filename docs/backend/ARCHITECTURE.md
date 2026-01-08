# Architecture & Technical Deep Dive

Comprehensive guide to StreamIt backend architecture, design patterns, and implementation details.

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Service Layer](#service-layer)
3. [Middleware Architecture](#middleware-architecture)
4. [Authentication Flow](#authentication-flow)
5. [Payment Processing](#payment-processing)
6. [Streaming Architecture](#streaming-architecture)
7. [File Upload System](#file-upload-system)
8. [Error Handling](#error-handling)
9. [Security Patterns](#security-patterns)
10. [Best Practices](#best-practices)

---

## System Architecture

### High-Level Overview

```
┌─────────────┐
│   Frontend  │
│  (React)    │
└──────┬──────┘
       │ HTTP/WebSocket
       ▼
┌─────────────────────────────────────┐
│        Express.js Backend           │
│  ┌───────────────────────────────┐  │
│  │   Routes Layer               │  │
│  └───────────┬──────────────────┘  │
│              ▼                      │
│  ┌───────────────────────────────┐  │
│  │   Middleware Layer           │  │
│  │  • Auth                      │  │
│  │  • Validation               │  │
│  │  • File Upload              │  │
│  └───────────┬──────────────────┘  │
│              ▼                      │
│  ┌───────────────────────────────┐  │
│  │   Controller Layer           │  │
│  │  • Request Handling         │  │
│  │  • Response Formatting      │  │
│  └───────────┬──────────────────┘  │
│              ▼                      │
│  ┌───────────────────────────────┐  │
│  │   Service Layer              │  │
│  │  • Business Logic           │  │
│  │  • External APIs            │  │
│  └───────────┬──────────────────┘  │
│              ▼                      │
│  ┌───────────────────────────────┐  │
│  │   Data Layer (Prisma)        │  │
│  └───────────────────────────────┘  │
└─────────────┬───────────────────────┘
              ▼
     ┌────────────────┐
     │   PostgreSQL   │
     └────────────────┘
```

### External Services Integration

```
┌──────────────────┐
│   StreamIt API   │
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌──────┐  ┌──────────┐
│  S3  │  │ LiveKit  │
└──────┘  └──────────┘
    ▼         ▼
┌──────┐  ┌──────────┐
│ Dodo │  │ Resend   │
└──────┘  └──────────┘
```

### Request Flow

```
Client Request
    ↓
CORS Middleware
    ↓
Route Matching
    ↓
Auth Middleware (if protected)
    ↓
Validation Middleware
    ↓
Controller
    ↓
Service Layer
    ↓
Database (Prisma)
    ↓
Response to Client
```

---

## Service Layer

### Design Pattern

The service layer encapsulates business logic and external API interactions, keeping controllers thin and focused on HTTP concerns.

### StreamService

**Purpose**: Manages live streaming lifecycle and WebRTC integration.

**Key Methods**:

```typescript
class StreamService {
  // Validate creator approval status
  static async validateCreatorApproved(userId: string): Promise<void>
  
  // Get creator's stream configuration
  static async getCreatorStream(userId: string): Promise<Stream | null>
  
  // Create or update stream metadata
  static async createOrUpdateStream(userId: string, data: StreamData): Promise<Stream>
  
  // Mark stream as live
  static async setStreamLive(userId: string): Promise<Stream>
  
  // End live stream
  static async setStreamOffline(userId: string): Promise<Stream>
  
  // Update chat settings
  static async updateChatSettings(userId: string, settings: ChatSettings): Promise<Stream>
}
```

**Usage Example**:
```typescript
// In controller
const stream = await StreamService.createOrUpdateStream(userId, {
  title: 'My Gaming Stream',
  description: 'Playing Valorant',
  thumbnail: 'https://...',
});
```

---

### PaymentService

**Purpose**: Handles coin purchases, gift transactions, and payment gateway integration.

**Key Methods**:

```typescript
class PaymentService {
  // Create Dodo checkout session
  static async createCheckout(
    userId: string, 
    packageId: string, 
    discountCode?: string
  ): Promise<CheckoutSession>
  
  // Process payment webhook from Dodo
  static async processWebhook(payload: any): Promise<void>
  
  // Send gift to creator
  static async sendGift(
    senderId: string,
    receiverId: string,
    giftId: string,
    quantity: number,
    streamId?: string,
    message?: string
  ): Promise<GiftTransaction>
  
  // Get user wallet
  static async getWallet(userId: string): Promise<CoinWallet>
  
  // Credit coins to wallet
  static async creditCoins(userId: string, amount: number): Promise<void>
  
  // Deduct coins from wallet
  static async deductCoins(userId: string, amount: number): Promise<void>
}
```

**Payment Flow**:
```
1. User requests checkout → createCheckout()
2. Redirect to Dodo payment page
3. User completes payment
4. Dodo sends webhook → processWebhook()
5. Coins credited to wallet
6. Reward code generated for user
```

---

### DiscountService

**Purpose**: Manages promotional and reward discount codes.

**Key Methods**:

```typescript
class DiscountService {
  // Validate discount code for package
  static async validateCode(
    code: string, 
    packageId: string, 
    userId: string
  ): Promise<ValidationResult>
  
  // Calculate bonus coins from discount
  static async calculateBonus(
    discountCode: DiscountCode,
    packageCoins: number
  ): Promise<number>
  
  // Generate reward code for user
  static async generateRewardCode(userId: string): Promise<DiscountCode>
  
  // Redeem discount code (create redemption record)
  static async redeemCode(
    codeId: string,
    userId: string,
    purchaseId: string,
    bonusCoins: number
  ): Promise<DiscountRedemption>
  
  // Get user's reward codes
  static async getUserCodes(userId: string): Promise<DiscountCode[]>
}
```

**Discount Calculation**:
```typescript
if (discountType === 'PERCENTAGE') {
  bonusCoins = Math.floor((packageCoins * discountValue) / 100);
} else if (discountType === 'FIXED') {
  bonusCoins = discountValue;
}
```

---

### ApplicationService

**Purpose**: Manages creator application workflow.

**Key Methods**:

```typescript
class ApplicationService {
  // Create new application
  static async createApplication(userId: string, data: ApplicationData): Promise<CreatorApplication>
  
  // Update existing application
  static async updateApplication(applicationId: string, data: Partial<ApplicationData>): Promise<CreatorApplication>
  
  // Submit application for review
  static async submitApplication(applicationId: string): Promise<CreatorApplication>
  
  // Approve application (admin)
  static async approveApplication(applicationId: string, adminId: string): Promise<CreatorApplication>
  
  // Reject application (admin)
  static async rejectApplication(
    applicationId: string, 
    adminId: string, 
    reason: string
  ): Promise<CreatorApplication>
  
  // Check if user is approved creator
  static async isApprovedCreator(userId: string): Promise<boolean>
}
```

**Application Lifecycle**:
```
DRAFT → submit() → PENDING
PENDING → review() → UNDER_REVIEW
UNDER_REVIEW → approve() → APPROVED
UNDER_REVIEW → reject() → REJECTED
```

---

### ContentService

**Purpose**: Handles post creation, engagement, and feed generation.

**Key Methods**:

```typescript
class ContentService {
  // Create post with media
  static async createPost(authorId: string, data: PostData): Promise<Post>
  
  // Get personalized feed for user
  static async getPersonalizedFeed(userId: string, page: number, limit: number): Promise<Post[]>
  
  // Get public feed
  static async getPublicFeed(page: number, limit: number): Promise<Post[]>
  
  // Toggle like on post
  static async toggleLike(userId: string, postId: string): Promise<{ liked: boolean, count: number }>
  
  // Add comment to post
  static async addComment(userId: string, postId: string, content: string, parentId?: string): Promise<Comment>
  
  // Update engagement counts
  static async updateEngagementCounts(postId: string): Promise<void>
}
```

**Feed Algorithm** (personalized):
```typescript
// Get posts from followed users
const followedPosts = await prisma.post.findMany({
  where: {
    author: {
      followedBy: {
        some: { followerId: userId }
      }
    }
  },
  orderBy: { createdAt: 'desc' }
});
```

---

### MediaService

**Purpose**: File upload, processing, and optimization.

**Key Methods**:

```typescript
class MediaService {
  // Upload file to S3
  static async uploadToS3(file: File, userId: string, purpose: FilePurpose): Promise<UploadResult>
  
  // Generate presigned URL for direct upload
  static async getPresignedUrl(fileName: string, fileType: string): Promise<PresignedUrlResult>
  
  // Delete file from S3
  static async deleteFromS3(key: string): Promise<void>
  
  // Optimize image
  static async optimizeImage(buffer: Buffer): Promise<Buffer>
  
  // Generate thumbnail for video
  static async generateVideoThumbnail(videoUrl: string): Promise<string>
  
  // Get file stats for user
  static async getFileStats(userId: string): Promise<FileStats>
}
```

**Image Optimization**:
```typescript
const optimized = await sharp(buffer)
  .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
  .jpeg({ quality: 85, progressive: true })
  .toBuffer();
```

---

### TokenService

**Purpose**: Generate LiveKit access tokens for stream participants.

**Key Methods**:

```typescript
class TokenService {
  // Generate token for creator (publisher)
  static async generateCreatorToken(
    username: string,
    roomName: string
  ): Promise<string>
  
  // Generate token for viewer (subscriber)
  static async generateViewerToken(
    username: string,
    roomName: string
  ): Promise<string>
  
  // Verify token validity
  static async verifyToken(token: string): Promise<TokenClaims>
}
```

**Token Claims**:
```typescript
{
  identity: username,
  roomName: roomName,
  grants: {
    canPublish: boolean,      // Creator only
    canSubscribe: boolean,    // All users
    room: roomName,
    roomJoin: true
  }
}
```

---

### WebhookService

**Purpose**: Process webhooks from external services.

**Key Methods**:

```typescript
class WebhookService {
  // Process LiveKit webhook
  static async processLiveKitWebhook(event: string, data: any): Promise<void>
  
  // Process Dodo payment webhook
  static async processDodoWebhook(event: string, data: any): Promise<void>
  
  // Verify webhook signature
  static async verifyWebhookSignature(
    payload: string, 
    signature: string, 
    secret: string
  ): Promise<boolean>
}
```

**LiveKit Events**:
- `ingress_started` - Stream started
- `ingress_ended` - Stream ended
- `room_finished` - All participants left

**Dodo Events**:
- `payment.completed` - Payment successful
- `payment.failed` - Payment failed

---

## Middleware Architecture

### Authentication Middleware

**requireAuth**: Enforces authentication

```typescript
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.user = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      username: session.user.username,
    };
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};
```

**optionalAuth**: Attaches user if authenticated, allows anonymous

```typescript
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await auth.api.getSession({ headers: req.headers as any });
    if (session) {
      req.user = {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        username: session.user.username,
      };
    }
    next();
  } catch (error) {
    next(); // Continue even if auth fails
  }
};
```

---

### Validation Middleware

Uses Zod for type-safe validation:

```typescript
export const validate = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      next(error);
    }
  };
};
```

**Usage**:
```typescript
router.post(
  '/signup',
  validate(SignUpSchema),
  (req, res) => authController.signUp(req, res)
);
```

**Example Schema**:
```typescript
export const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  username: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/),
});
```

---

### Creator Middleware

Ensures user is an approved creator:

```typescript
export const requireCreator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const application = await prisma.creatorApplication.findUnique({
      where: { userId },
      select: { status: true },
    });

    if (!application || application.status !== 'APPROVED') {
      return res.status(403).json({
        error: 'Creator access required',
        message: 'Only approved creators can access this resource',
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify creator status' });
  }
};
```

**Usage**:
```typescript
router.post(
  '/stream/go-live',
  requireAuth,
  requireCreator,
  StreamController.goLive
);
```

---

### Upload Middleware

Handles multipart form data with Multer:

```typescript
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'video/webm',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});
```

**Error Handling**:
```typescript
export const handleUploadError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large (max 50MB)' });
    }
    return res.status(400).json({ error: err.message });
  }
  next(err);
};
```

---

### Webhook Middleware

Verifies webhook signatures:

```typescript
export const verifyDodoWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['dodo-signature'] as string;
    const secret = process.env.DODO_WEBHOOK_SECRET;
    
    if (!signature || !secret) {
      return res.status(401).json({ error: 'Unauthorized webhook' });
    }
    
    const isValid = await verifySignature(req.body, signature, secret);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Webhook verification failed' });
  }
};
```

---

## Authentication Flow

### Sign Up with Email

```
1. Client sends POST /api/auth/sign-up/email
   {
     email: "user@example.com",
     password: "password123",
     name: "John Doe",
     username: "johndoe"
   }

2. Better Auth creates user and account

3. Better Auth sends verification email with OTP

4. User verifies email with OTP

5. Session created, cookies set

6. Client receives user object and session
```

### Sign In with OTP

```
1. Client sends POST /api/auth/signin/email-otp
   { email: "user@example.com" }

2. Backend generates OTP, stores in Verification table

3. Email sent with OTP

4. Client sends POST /api/auth/signin/email-otp
   { email: "user@example.com", otp: "123456" }

5. Backend verifies OTP

6. Session created, cookies set

7. Client receives user object and session
```

### Session Validation

```
1. Client sends request with cookie or Bearer token

2. Middleware calls auth.api.getSession()

3. Better Auth validates session
   - Check token/cookie validity
   - Check expiration
   - Load user data

4. User attached to req.user

5. Request continues to controller
```

### Cross-Domain Authentication

**Frontend Setup**:
```typescript
// API client configuration
const api = axios.create({
  baseURL: 'https://api.yourdomain.com',
  withCredentials: true, // Important!
});
```

**Backend Setup**:
```typescript
// CORS configuration
app.use(cors({
  origin: 'https://yourdomain.com',
  credentials: true,
}));

// Cookie configuration (production)
defaultCookieAttributes: {
  sameSite: 'none',
  secure: true,
  httpOnly: true,
  partitioned: true,
}
```

---

## Payment Processing

### Checkout Flow

```
1. User selects coin package

2. Client sends POST /api/payment/purchase
   {
     packageId: "pkg_123",
     discountCode: "WELCOME10"  // Optional
   }

3. Backend validates discount code

4. Backend creates Dodo checkout session
   - Includes metadata (packageId, coins, discountCode)

5. Backend creates CoinPurchase record (status: PENDING)

6. Client redirects to Dodo checkout URL

7. User completes payment on Dodo

8. Dodo sends webhook to /api/webhook/dodo

9. Backend processes webhook:
   - Find purchase by transactionId
   - Update status to COMPLETED
   - Credit coins to user wallet
   - Create discount redemption record
   - Generate reward code for user

10. Dodo redirects user to return_url

11. Client shows success page
```

### Webhook Processing

```typescript
// Dodo webhook payload
{
  event_type: "payment.completed",
  data: {
    payment_id: "pay_123",
    checkout_session_id: "sess_123",
    status: "completed",
    amount: 9900,
    currency: "INR",
    metadata: {
      packageId: "pkg_123",
      coins: "100",
      bonusCoins: "10",
      discountBonusCoins: "20",
      discountCodeId: "code_123",
      orderId: "order_123"
    }
  }
}
```

**Processing Logic**:
```typescript
1. Verify webhook signature
2. Find CoinPurchase by transactionId or orderId
3. If not found, return error
4. If already processed, return success (idempotency)
5. Update purchase status to COMPLETED
6. Calculate total coins (base + bonus + discount)
7. Get or create user's CoinWallet
8. Credit coins to wallet
9. Update wallet.totalSpent
10. If discountCode used:
    - Create DiscountRedemption record
    - Increment code.currentRedemptions
11. Generate reward code for user:
    - Create new DiscountCode (codeType: REWARD)
    - Link to user as ownerId
12. Send confirmation email (optional)
```

---

## Streaming Architecture

### WebRTC Flow with LiveKit

```
Creator Setup:
1. Creator creates stream metadata
   POST /api/stream/setup
   - Store title, description, thumbnail

2. Creator goes live
   POST /api/stream/go-live
   - Generate LiveKit token with publish permissions
   - Return token and room name
   - Set stream.isLive = true

3. Creator connects to LiveKit room
   - Use token to establish WebRTC connection
   - Start publishing video/audio

Viewer Join:
1. Viewer requests stream
   GET /api/viewer/stream/:username
   - Get stream metadata

2. Viewer requests viewer token
   POST /api/viewer/token
   { streamId: "stream_123" }
   - Generate token with subscribe permissions
   - Return token and room name

3. Viewer connects to LiveKit room
   - Use token to establish WebRTC connection
   - Subscribe to creator's tracks

Stream End:
1. Creator ends stream
   POST /api/stream/end-stream
   - Set stream.isLive = false
   - Disconnect from LiveKit

2. LiveKit sends webhook
   POST /api/webhook/livekit
   event: "room_finished"
   - Update any final stats
```

### LiveKit Token Generation

**Creator Token** (publish):
```typescript
const at = new AccessToken(apiKey, apiSecret, {
  identity: username,
  ttl: '24h',
});

at.addGrant({
  roomJoin: true,
  room: roomName,
  canPublish: true,
  canSubscribe: true,
});

const token = at.toJwt();
```

**Viewer Token** (subscribe):
```typescript
const at = new AccessToken(apiKey, apiSecret, {
  identity: username,
  ttl: '2h',
});

at.addGrant({
  roomJoin: true,
  room: roomName,
  canPublish: false,
  canSubscribe: true,
});

const token = at.toJwt();
```

---

## File Upload System

### Direct Upload to S3

```
1. Client requests presigned URL
   POST /api/creator/presigned-url
   {
     fileName: "avatar.jpg",
     fileType: "image/jpeg",
     purpose: "PROFILE_PICTURE"
   }

2. Backend generates presigned URL
   - Signed URL valid for 5 minutes
   - Includes proper ACL and content-type

3. Client uploads directly to S3
   PUT https://bucket.s3.amazonaws.com/uploads/user_id/avatar.jpg
   - No backend involved in transfer
   - Fast and efficient

4. Client confirms upload to backend
   POST /api/creator/upload-complete
   { key: "uploads/user_id/avatar.jpg" }

5. Backend creates FileUpload record
```

### Server Upload with Processing

```
1. Client uploads file to backend
   POST /api/content/posts
   Content-Type: multipart/form-data
   - File buffered in memory

2. Middleware validates file
   - Check size, type, count

3. Controller processes file
   - Optimize images with Sharp
   - Generate thumbnails for videos

4. Service uploads to S3
   - Store in organized folder structure
   - Set proper content-type and ACL

5. Database record created
   - PostMedia with URL, size, dimensions
```

### File Organization

```
S3 Bucket Structure:
/uploads/
  /{userId}/
    /profile/
      avatar.jpg
    /documents/
      id_proof.pdf
      selfie.jpg
    /streams/
      thumbnail_1.jpg
      thumbnail_2.jpg
    /posts/
      post_123_image_1.jpg
      post_123_image_2.jpg
```

---

## Error Handling

### Consistent Error Format

```typescript
interface ErrorResponse {
  error: string;        // Human-readable message
  code?: string;        // Error code (e.g., "UNAUTHORIZED")
  details?: any;        // Additional context
}
```

### Error Codes

```typescript
export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}
```

### Error Handler Middleware

```typescript
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  if (err instanceof z.ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.errors,
    });
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      return res.status(409).json({
        error: 'Resource already exists',
        code: 'CONFLICT',
        details: err.meta,
      });
    }
  }

  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
});
```

---

## Security Patterns

### Input Validation

Always validate with Zod schemas:
```typescript
const SafeString = z.string().max(1000).trim();
const Username = z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/);
const Email = z.string().email().toLowerCase();
```

### SQL Injection Prevention

Use Prisma's parameterized queries:
```typescript
// Safe
await prisma.user.findUnique({ where: { email } });

// Never use raw SQL with user input
// await prisma.$queryRaw`SELECT * FROM user WHERE email = '${email}'` ❌
```

### XSS Prevention

Sanitize user input before storing:
```typescript
import DOMPurify from 'isomorphic-dompurify';

const sanitized = DOMPurify.sanitize(userInput);
```

### CSRF Protection

Better Auth handles CSRF for session-based auth.
For custom endpoints, use CSRF tokens.

### Rate Limiting

(TODO: Implement with express-rate-limit)

---

## Best Practices

### Controller Pattern

```typescript
class ExampleController {
  static async getResource(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Delegate to service
      const resource = await ExampleService.getResource(id, userId);

      // Return formatted response
      res.json(resource);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Failed to fetch resource' });
    }
  }
}
```

### Service Pattern

```typescript
class ExampleService {
  static async getResource(id: string, userId: string) {
    // Business logic
    const resource = await prisma.resource.findUnique({
      where: { id },
      include: { /* relations */ },
    });

    if (!resource) {
      throw new Error('Resource not found');
    }

    // Authorization check
    if (resource.ownerId !== userId) {
      throw new Error('Unauthorized');
    }

    return resource;
  }
}
```

### Database Queries

**Use selective field queries**:
```typescript
// Good
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    username: true,
    name: true,
    image: true,
  },
});

// Avoid
const user = await prisma.user.findUnique({ where: { id } });
```

**Use proper indexes**:
```prisma
model User {
  email String @unique
  @@index([username])
}
```

**Avoid N+1 queries**:
```typescript
// Bad
const posts = await prisma.post.findMany();
for (const post of posts) {
  post.author = await prisma.user.findUnique({ where: { id: post.authorId } });
}

// Good
const posts = await prisma.post.findMany({
  include: { author: true },
});
```

### Async/Await

Always use try/catch:
```typescript
try {
  const result = await asyncOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  throw error;
}
```

### Environment Variables

Never hardcode secrets:
```typescript
// Bad
const apiKey = 'sk_test_123';

// Good
const apiKey = process.env.DODO_API_KEY;
if (!apiKey) throw new Error('DODO_API_KEY is required');
```

### Logging

Use structured logging:
```typescript
console.log(`[${service}] ${message}`, { context });
console.error(`[${service}] Error:`, error);
```

---

**Last Updated**: January 8, 2026
