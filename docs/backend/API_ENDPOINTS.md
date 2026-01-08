# API Endpoints Reference

Complete reference for all StreamIt backend API endpoints.

## Base URL
- Development: `http://localhost:3000/api`
- Production: `https://api.voltstream.space/api`

## Authentication Endpoints

Base path: `/api/auth`

### Better Auth Built-in Endpoints
These are handled automatically by Better Auth:

```
POST   /api/auth/sign-up/email          - Email signup
POST   /api/auth/sign-in/email          - Email signin  
POST   /api/auth/sign-out                - Sign out
GET    /api/auth/get-session             - Get current session
```

### Custom Authentication Endpoints

#### Send Verification OTP
```http
POST /api/auth/send-verification-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Verification OTP sent successfully"
}
```

---

#### Check Verification OTP
```http
POST /api/auth/check-verification-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "isValid": true
}
```

---

#### Sign In with Email OTP
```http
POST /api/auth/signin/email-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "session": { /* session data */ }
}
```

---

#### Verify Email
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

---

#### Forgot Password - Send OTP
```http
POST /api/auth/forget-password/email-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

---

#### Reset Password with OTP
```http
POST /api/auth/reset-password/email-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newSecurePassword123"
}
```

---

## Creator Endpoints

Base path: `/api/creator`
**Authentication**: Required for all endpoints

### Creator Application

#### Get Application
```http
GET /api/creator/application
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "id": "app_id",
  "userId": "user_id",
  "status": "PENDING",
  "submittedAt": "2026-01-08T...",
  "identity": { /* identity verification data */ },
  "financial": { /* financial details */ },
  "profile": { /* creator profile */ }
}
```

---

#### Create Application
```http
POST /api/creator/application
Authorization: Bearer <token>
Content-Type: application/json

{
  "identity": {
    "idType": "AADHAAR",
    "idDocumentUrl": "s3://...",
    "selfiePhotoUrl": "s3://..."
  },
  "financial": {
    "accountHolderName": "John Doe",
    "accountNumber": "1234567890",
    "ifscCode": "ABCD0123456",
    "panNumber": "ABCDE1234F"
  },
  "profile": {
    "profilePictureUrl": "s3://...",
    "bio": "Content creator...",
    "categories": ["GAMING", "TECHNOLOGY"]
  }
}
```

---

#### Update Application
```http
PUT /api/creator/application
Authorization: Bearer <token>
Content-Type: application/json

{
  "profile": {
    "bio": "Updated bio..."
  }
}
```

---

#### Get Application Status
```http
GET /api/creator/application/status
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "status": "APPROVED",
  "submittedAt": "2026-01-08T...",
  "reviewedAt": "2026-01-09T...",
  "hasApplication": true
}
```

---

### File Management

#### Upload File
```http
POST /api/creator/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: [binary data]
purpose: "PROFILE_PICTURE"
```

**Response**: `200 OK`
```json
{
  "url": "https://s3.amazonaws.com/...",
  "key": "uploads/user_id/file.jpg",
  "size": 102400
}
```

---

#### Get Presigned URL
```http
POST /api/creator/presigned-url
Authorization: Bearer <token>
Content-Type: application/json

{
  "fileName": "avatar.jpg",
  "fileType": "image/jpeg",
  "purpose": "PROFILE_PICTURE"
}
```

**Response**: `200 OK`
```json
{
  "uploadUrl": "https://s3.amazonaws.com/...",
  "key": "uploads/user_id/avatar.jpg",
  "publicUrl": "https://s3.amazonaws.com/..."
}
```

---

#### Delete File
```http
DELETE /api/creator/file?key=uploads/user_id/file.jpg
Authorization: Bearer <token>
```

---

#### Get File Stats
```http
GET /api/creator/files/stats
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "totalFiles": 15,
  "totalSize": 52428800,
  "byPurpose": {
    "PROFILE_PICTURE": 2,
    "STREAM_THUMBNAIL": 5
  }
}
```

---

## Stream Endpoints

Base path: `/api/stream`
**Authentication**: Required (Creator only)

### Stream Setup & Management

#### Setup Stream
```http
POST /api/stream/setup
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "My Gaming Stream",
  "description": "Playing awesome games!",
  "thumbnail": "https://...",
  "isChatEnabled": true,
  "isChatDelayed": false,
  "isChatFollowersOnly": false
}
```

**Response**: `200 OK`
```json
{
  "stream": {
    "id": "stream_id",
    "title": "My Gaming Stream",
    "isLive": false,
    /* ...stream data */
  }
}
```

---

#### Go Live
```http
POST /api/stream/go-live
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "success": true,
  "stream": {
    "id": "stream_id",
    "isLive": true,
    "title": "My Gaming Stream"
  },
  "streamUrl": "rtmps://...",
  "streamKey": "sk_..."
}
```

---

#### End Stream
```http
POST /api/stream/end-stream
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Stream ended successfully"
}
```

---

#### Get Stream Info
```http
GET /api/stream/info
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "id": "stream_id",
  "title": "My Gaming Stream",
  "description": "...",
  "thumbnail": "https://...",
  "isLive": true,
  "isChatEnabled": true,
  "isChatDelayed": false,
  "isChatFollowersOnly": false
}
```

---

#### Update Stream Info
```http
PUT /api/stream/info
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated title",
  "description": "Updated description",
  "thumbnail": "https://..."
}
```

---

#### Update Chat Settings
```http
PUT /api/stream/chat-settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "isChatEnabled": true,
  "isChatDelayed": true,
  "isChatFollowersOnly": false
}
```

---

#### Get Stream Status
```http
GET /api/stream/status
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "isLive": true,
  "viewerCount": 42,
  "duration": 3600,
  "startedAt": "2026-01-08T10:00:00Z"
}
```

---

#### Get Past Streams
```http
GET /api/stream/past?page=1&limit=10
Authorization: Bearer <token>
```

---

## Viewer Endpoints

Base path: `/api/viewer`

### Profile Management

#### Get Current User
```http
GET /api/viewer/me
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "id": "user_id",
  "name": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "bio": "Love streaming!",
  "image": "https://...",
  "createdAt": "2026-01-01T..."
}
```

---

#### Get Profile
```http
GET /api/viewer/profile
Authorization: Bearer <token>
```

---

#### Update Profile
```http
PATCH /api/viewer/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "bio": "Updated bio",
  "username": "newusername"
}
```

---

#### Upload Avatar
```http
POST /api/viewer/avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data

avatar: [binary data]
```

---

#### Change Password
```http
PATCH /api/viewer/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

---

### Stream Viewing

#### Get Stream by Username
```http
GET /api/viewer/stream/johndoe
```

**Response**: `200 OK`
```json
{
  "id": "stream_id",
  "title": "Gaming Stream",
  "description": "...",
  "isLive": true,
  "thumbnail": "https://...",
  "user": {
    "id": "user_id",
    "username": "johndoe",
    "name": "John Doe",
    "image": "https://..."
  }
}
```

---

#### Get Viewer Token
```http
POST /api/viewer/token
Content-Type: application/json

{
  "streamId": "stream_id",
  "username": "viewer123"
}
```

**Response**: `200 OK`
```json
{
  "token": "eyJ...",
  "streamUrl": "wss://...",
  "roomName": "room_..."
}
```

---

#### Get Live Streams
```http
GET /api/viewer/live?page=1&limit=20
```

**Response**: `200 OK`
```json
{
  "streams": [
    {
      "id": "stream_id",
      "title": "Gaming Stream",
      "isLive": true,
      "thumbnail": "https://...",
      "user": {
        "username": "johndoe",
        "name": "John Doe",
        "image": "https://..."
      },
      "viewerCount": 42
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

#### Get Recommended Streams
```http
GET /api/viewer/recommended?limit=10
```

---

#### Get Followed Streams
```http
GET /api/viewer/following
Authorization: Bearer <token>
```

**Response**: Array of streams from followed creators

---

#### Search Streams
```http
GET /api/viewer/search?q=gaming&page=1&limit=20
```

---

## Social Endpoints

Base path: `/api/social`

### Follow System

#### Follow User
```http
POST /api/social/follow/:userId
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Successfully followed user"
}
```

---

#### Unfollow User
```http
DELETE /api/social/follow/:userId
Authorization: Bearer <token>
```

---

#### Check Following Status
```http
GET /api/social/follow/:userId
Authorization: Bearer <token> (optional)
```

**Response**: `200 OK`
```json
{
  "isFollowing": true
}
```

---

#### Get Followers
```http
GET /api/social/followers/:userId?page=1&limit=20
```

**Response**: `200 OK`
```json
{
  "followers": [
    {
      "id": "user_id",
      "username": "follower1",
      "name": "Follower One",
      "image": "https://...",
      "followedAt": "2026-01-08T..."
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

---

#### Get Following
```http
GET /api/social/following/:userId?page=1&limit=20
```

---

### Block System

#### Block User
```http
POST /api/social/block/:userId
Authorization: Bearer <token>
```

---

#### Unblock User
```http
DELETE /api/social/block/:userId
Authorization: Bearer <token>
```

---

### Creator Discovery

#### Get All Creators
```http
GET /api/social/creators?page=1&limit=20&category=GAMING
```

**Response**: `200 OK`
```json
{
  "creators": [
    {
      "id": "user_id",
      "username": "creator1",
      "name": "Creator One",
      "bio": "Gaming content creator",
      "image": "https://...",
      "stream": {
        "isLive": true,
        "title": "Current Stream"
      },
      "followersCount": 1500
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

---

#### Get Creator Profile
```http
GET /api/social/creator/:username
```

**Response**: `200 OK`
```json
{
  "id": "user_id",
  "username": "creator1",
  "name": "Creator One",
  "bio": "Gaming content creator",
  "image": "https://...",
  "createdAt": "2026-01-01T...",
  "stream": {
    "id": "stream_id",
    "title": "Current Stream",
    "isLive": true,
    "thumbnail": "https://..."
  },
  "stats": {
    "followersCount": 1500,
    "followingCount": 200,
    "postsCount": 50
  }
}
```

---

## Content Endpoints

Base path: `/api/content`

### Post Management

#### Create Post
```http
POST /api/content/posts
Authorization: Bearer <token>
Content-Type: multipart/form-data

content: "Check out my stream!"
type: "MIXED"
media: [file1, file2]
isPublic: true
allowComments: true
```

**Response**: `201 Created`
```json
{
  "id": "post_id",
  "content": "Check out my stream!",
  "type": "MIXED",
  "media": [
    {
      "id": "media_id",
      "url": "https://...",
      "type": "IMAGE"
    }
  ],
  "likesCount": 0,
  "commentsCount": 0,
  "createdAt": "2026-01-08T..."
}
```

---

#### Get My Posts
```http
GET /api/content/posts?page=1&limit=20
Authorization: Bearer <token>
```

---

#### Get Post by ID
```http
GET /api/content/posts/:postId
```

**Response**: `200 OK`
```json
{
  "id": "post_id",
  "content": "Post content",
  "type": "TEXT",
  "media": [],
  "likesCount": 42,
  "commentsCount": 15,
  "author": {
    "id": "user_id",
    "username": "author",
    "name": "Author Name",
    "image": "https://..."
  },
  "createdAt": "2026-01-08T...",
  "isLikedByMe": false
}
```

---

#### Update Post
```http
PUT /api/content/posts/:postId
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Updated content",
  "isPublic": true,
  "allowComments": false
}
```

---

#### Delete Post
```http
DELETE /api/content/posts/:postId
Authorization: Bearer <token>
```

---

#### Get User Posts
```http
GET /api/content/users/:userId/posts?page=1&limit=20
```

---

### Engagement

#### Toggle Post Like
```http
POST /api/content/posts/:postId/like
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "liked": true,
  "likesCount": 43
}
```

---

#### Add Comment
```http
POST /api/content/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "postId": "post_id",
  "content": "Great post!",
  "parentId": null
}
```

**Response**: `201 Created`
```json
{
  "id": "comment_id",
  "content": "Great post!",
  "user": {
    "id": "user_id",
    "username": "commenter",
    "name": "Commenter Name",
    "image": "https://..."
  },
  "likesCount": 0,
  "createdAt": "2026-01-08T..."
}
```

---

#### Get Post Comments
```http
GET /api/content/posts/:postId/comments?page=1&limit=50
```

**Response**: `200 OK`
```json
{
  "comments": [
    {
      "id": "comment_id",
      "content": "Great post!",
      "user": {
        "id": "user_id",
        "username": "commenter",
        "name": "Commenter Name",
        "image": "https://..."
      },
      "likesCount": 5,
      "replies": [
        {
          "id": "reply_id",
          "content": "Thanks!",
          "user": { /* author */ },
          "createdAt": "2026-01-08T..."
        }
      ],
      "createdAt": "2026-01-08T..."
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 50
}
```

---

### Feeds

#### Get Public Feed
```http
GET /api/content/feed/public?page=1&limit=20
```

**Response**: Array of public posts

---

#### Get Personalized Feed
```http
GET /api/content/feed?page=1&limit=20
Authorization: Bearer <token>
```

**Response**: Array of posts from followed users

---

## Payment Endpoints

Base path: `/api/payment`

### Wallet

#### Get Wallet
```http
GET /api/payment/wallet
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "id": "wallet_id",
  "balance": 1000,
  "totalEarned": 5000,
  "totalSpent": 4000
}
```

---

### Coin Packages

#### Get Available Packages
```http
GET /api/payment/packages
```

**Response**: `200 OK`
```json
{
  "packages": [
    {
      "id": "package_id",
      "name": "Starter Pack",
      "coins": 100,
      "bonusCoins": 10,
      "price": 9900,
      "currency": "INR",
      "description": "Great for beginners"
    }
  ]
}
```

---

### Purchase

#### Create Purchase
```http
POST /api/payment/purchase
Authorization: Bearer <token>
Content-Type: application/json

{
  "packageId": "package_id",
  "discountCode": "WELCOME10"
}
```

**Response**: `200 OK`
```json
{
  "checkoutUrl": "https://checkout.dodopayments.com/...",
  "orderId": "order_...",
  "sessionId": "session_...",
  "discountBonusCoins": 20
}
```

---

#### Get Purchase History
```http
GET /api/payment/purchases?page=1&limit=20
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "purchases": [
    {
      "id": "purchase_id",
      "package": {
        "name": "Starter Pack",
        "coins": 100
      },
      "totalCoins": 130,
      "amount": 9900,
      "currency": "INR",
      "status": "COMPLETED",
      "createdAt": "2026-01-08T..."
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20
}
```

---

### Gifts

#### Get Available Gifts
```http
GET /api/payment/gifts
```

**Response**: `200 OK`
```json
{
  "gifts": [
    {
      "id": "gift_id",
      "name": "Heart",
      "description": "Show some love",
      "coinPrice": 50,
      "imageUrl": "https://...",
      "animationUrl": "https://..."
    }
  ]
}
```

---

#### Send Gift
```http
POST /api/payment/gift
Authorization: Bearer <token>
Content-Type: application/json

{
  "receiverId": "creator_id",
  "giftId": "gift_id",
  "quantity": 1,
  "streamId": "stream_id",
  "message": "Great stream!"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "transaction": {
    "id": "transaction_id",
    "coinAmount": 50,
    "quantity": 1,
    "remainingBalance": 950
  }
}
```

---

#### Get Gifts Sent
```http
GET /api/payment/gifts-sent?page=1&limit=20
Authorization: Bearer <token>
```

---

#### Get Gifts Received
```http
GET /api/payment/gifts-received?page=1&limit=20
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "gifts": [
    {
      "id": "transaction_id",
      "gift": {
        "name": "Heart",
        "imageUrl": "https://..."
      },
      "sender": {
        "username": "viewer123",
        "name": "Viewer Name"
      },
      "quantity": 1,
      "coinAmount": 50,
      "message": "Great stream!",
      "createdAt": "2026-01-08T..."
    }
  ],
  "total": 50,
  "totalCoins": 2500
}
```

---

## Discount Code Endpoints

Base path: `/api/discount`

#### Validate Code
```http
POST /api/discount/validate
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "WELCOME10",
  "packageId": "package_id"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "code": "WELCOME10",
    "discountType": "PERCENTAGE",
    "discountValue": 10,
    "bonusCoins": 20,
    "description": "Welcome bonus"
  }
}
```

---

#### Get My Codes (Reward Codes)
```http
GET /api/discount/my-codes
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "codes": [
    {
      "id": "code_id",
      "code": "USER_REWARD_ABC123",
      "codeType": "REWARD",
      "discountType": "PERCENTAGE",
      "discountValue": 5,
      "isOneTimeUse": true,
      "isActive": true,
      "expiresAt": "2026-02-08T...",
      "isUsed": false
    }
  ]
}
```

---

## Search Endpoints

Base path: `/api/search`

#### Global Search
```http
GET /api/search?q=gaming&type=all&page=1&limit=20
```

**Query Parameters**:
- `q` - Search query
- `type` - `all`, `streams`, `creators`, `posts`
- `page` - Page number
- `limit` - Results per page

**Response**: `200 OK`
```json
{
  "streams": [/* stream results */],
  "creators": [/* creator results */],
  "posts": [/* post results */],
  "total": {
    "streams": 10,
    "creators": 5,
    "posts": 15
  }
}
```

---

## Webhook Endpoints

Base path: `/api/webhook`

### LiveKit Webhook
```http
POST /api/webhook/livekit
Content-Type: application/webhook+json

{
  "event": "ingress_started",
  "ingressInfo": { /* ingress data */ }
}
```

---

### Dodo Payment Webhook
```http
POST /api/webhook/dodo
Content-Type: application/json

{
  "event_type": "payment.completed",
  "data": {
    "payment_id": "pay_...",
    "status": "completed",
    "amount": 9900
  }
}
```

---

## Health Check

#### Check API Health
```http
GET /health
```

**Response**: `200 OK`
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-01-08T12:00:00.000Z"
}
```

---

## Rate Limiting

(TODO: Implement rate limiting)

Planned limits:
- General: 100 requests/minute
- Authentication: 10 requests/minute
- File uploads: 20 requests/hour
- Payments: 30 requests/hour

---

## Pagination

Most list endpoints support pagination:

**Query Parameters**:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

**Response Format**:
```json
{
  "items": [/* array of items */],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

---

**Last Updated**: January 8, 2026
