# StreamIt Backend - API Documentation

## Recent Updates

### ✅ Homepage Features (Implemented)
- **Trending Content**: Weighted algorithm for trending posts
- **Live Creators**: Real-time live followed creators feed
- **Engagement Tracking**: View and share count tracking with analytics

### ✅ Shorts Feature (Implemented)
- **Short-Form Videos**: Dedicated content type for vertical videos
- **Shorts Feeds**: Following, trending, and discover feeds
- **Analytics**: Individual view tracking with deduplication

---

## API Endpoints

### Content API

#### Trending Content
```
GET /api/content/trending?timeRange=7d&page=1&limit=20
```
Returns trending posts ranked by engagement (likes, comments, views, shares, recency).

**Query Parameters**:
- `timeRange`: `24h`, `7d`, `30d` (default: `7d`)
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)

#### View Tracking
```
POST /api/content/posts/:postId/view
```
Tracks post views with deduplication (1 hour window for authenticated users).

#### Share Tracking
```
POST /api/content/posts/:postId/share
```
Increments share count for a post.

---

### Shorts API

#### Following Shorts
```
GET /api/content/shorts/following?cursor=<cursor>&limit=10
```
Returns shorts from creators the user follows.

**Authentication**: Required

#### Trending Shorts
```
GET /api/content/shorts/trending?timeRange=7d&page=1&limit=20
```
Returns trending shorts using the same algorithm as trending content.

#### All Shorts (Discover)
```
GET /api/content/shorts?cursor=<cursor>&limit=10
```
Returns all public shorts for discovery.

---

### Social API

#### Live Followed Creators
```
GET /api/social/following/live
```
Returns list of followed creators who are currently live.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "creators": [
      {
        "id": "...",
        "username": "...",
        "name": "...",
        "image": "...",
        "stream": {
          "id": "...",
          "title": "...",
          "thumbnail": "...",
          "isLive": true,
          "updatedAt": "..."
        }
      }
    ],
    "count": 5
  }
}
```

---

## Database Schema

### New Fields

#### Post Model
```prisma
model Post {
  // Engagement metrics
  viewsCount    Int     @default(0)
  sharesCount   Int     @default(0)
  
  // Shorts support
  isShort       Boolean @default(false)
  
  // Relations
  views         PostView[]
}
```

#### PostView Model (Analytics)
```prisma
model PostView {
  id       String   @id @default(cuid())
  postId   String
  post     Post     @relation(...)
  userId   String?  // Null for anonymous
  user     User?    @relation(...)
  viewedAt DateTime @default(now())
}
```

---

## Services

### ContentService

**New Methods**:
- `getTrendingContent()` - Trending algorithm with weighted scoring
- `trackPostView()` - View tracking with deduplication
- `trackPostShare()` - Share count increment
- `getFollowingShorts()` - Shorts from followed creators
- `getTrendingShorts()` - Trending shorts
- `getAllShorts()` - All public shorts

### SocialService

**New Methods**:
- `getLiveFollowedCreators()` - Live creators user follows

---

## Trending Algorithm

**Weighted Score Formula**:
```
score = (likes × 1.0) + 
        (comments × 2.0) + 
        (views × 0.1) + 
        (shares × 3.0) + 
        (age_penalty)

age_penalty = -0.1 × (hours_since_creation)
```

Posts are ranked by this score in descending order.

---

## Performance Optimizations

### Database Indexes
- Composite index on `[isShort, createdAt]` for shorts queries
- Composite index on `[isShort, type, isPublic]` for filtering
- Composite index on `[createdAt, likesCount, commentsCount, viewsCount, sharesCount]` for trending

### View Deduplication
- Authenticated users: 1 view per hour per post
- Anonymous users: All views tracked

---

## Environment Variables

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379  # Optional for caching
```

---

**Last Updated**: January 10, 2026
