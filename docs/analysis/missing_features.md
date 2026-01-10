# Missing Features - StreamIt Implementation

**Based on Client Plan**: [plan.md](file:///home/himanshu/code/streamit/plan.md)  
**Date**: January 10, 2026

---

## 🔴 Critical Missing Features

### 1. User Registration Fields
- [ ] **Age field** - Required during signup
- [ ] **Phone number field** - Required during signup
- [ ] **Phone/SMS OTP verification** - Currently only email OTP

### 2. Homepage Features
- [x] **Trending Creators Section** ✅ IMPLEMENTED
  - Display photos and shorts from creators across platform
  - Rank by: likes, comments, views, shares, recency
  - Like, comment, share on each post
  - Follow creator button
  - View profile option
  
- [x] **Live Creator Indicator** ✅ IMPLEMENTED
  - Horizontal scrollbar at top showing live followed creators
  - Profile pictures of creators currently live
  - Placeholder: "No Creators live right now" when none live
  
- [x] **Shorts Section** ✅ IMPLEMENTED
  - Dedicated content type for short videos (vertical format)
  - Separate feed for shorts from followed creators
  - Separate feed for trending shorts
  - Full-screen vertical player with swipe navigation
  - Auto-play and engagement features

### 3. Subscription System
- [ ] **Creator Subscriptions**
  - Users can subscribe to creators for exclusive content
  - Subscription tiers/pricing
  - Exclusive content for subscribers
  - Subscription management page
  
- [ ] **Subscribed Content Section**
  - "If User has paid for any creators subscription they can be seen in this section"
  - Filter photos/shorts by subscribed creators

### 4. Live Streaming - Creator Features

#### Stream Setup
- [ ] **Audience Type Selection**
  - Public
  - Followers only
  - Invite-only
  
- [ ] **Streaming Mode**
  - Front/Back camera toggle
  - Audio only option
  - Background music
  - Filters

#### During Live Stream
- [ ] **Earnings Counter** - Live display of coins/gifts value with 💰 icon
- [ ] **Current Top Gifter** overlay
- [ ] **New Follower Pop-up** notification
- [ ] **Camera Toggle** (front/back)
- [ ] **Audio-Only Mode** toggle
- [ ] **Beauty Filter / AR Effects**
- [ ] **Pin Comment/Message** feature
- [ ] **Viewers List** (Eye icon)
  - Mute viewer
  - Report viewer
  - Block viewer

#### Post-Stream Summary
- [ ] **Stream Summary Screen** showing:
  - Total viewers
  - Total gifts/earnings
  - Top gifter
  - Total likes and comments

#### 10-Second Highlight Capture
> **Unique Feature - High Priority**

- [ ] **Capture Highlight Button** on live screen
- [ ] Capture last 10 seconds of video/audio only
- [ ] Exclude: viewer count, chat, earnings, overlays
- [ ] **Preview Modal** with options:
  - Save to Gallery
  - Share on Social Media
  - Discard
- [ ] **Limit**: Max 5 highlights per stream
- [ ] **Auto-watermark** with app logo
- [ ] **Auto-caption**: "Watch me live on [App Name] 🎥🔥"

### 5. Live Streaming - Viewer Features

#### UI Elements
- [ ] **Live Duration** timer display
- [ ] **Report Icon** for stream
- [ ] **Like/Gold Coin Button** (1 coin written on it)
  - Heart burst animation
  - **Penny tip to creator on each like**
  
#### Engagement Pop-ups
- [ ] "X sent a gift 🎁"
- [ ] "Y joined the stream"
- [ ] "Top Fan of the Week: Z"

#### Swipe Gesture Navigation (Mobile)
- [ ] **Swipe Left** - Enter immersive mode
  - Fullscreen video only
  - Hide all UI elements
  - Only gestures: Swipe Right to exit, Double tap to like
- [ ] **Swipe Right** - Return to normal view

#### Privacy Features
- [ ] **Hide Chat Option** (viewer preference)
- [ ] **Block/Mute Viewer Messages** (locally)
- [ ] **Screen Recording/Screenshot Blocking**
  - Android: `FLAG_SECURE`
  - iOS: `isScreenCaptureProtected = true`
  - Disable AirPlay/screen mirroring
  - Block HDMI/casting during stream

#### Post-Stream (Viewer)
- [ ] Summary showing: Total viewers, Top gifter
- [ ] Follow creator button
- [ ] Recommended other live streams

### 6. Monetization Features

#### Coins & Payments
- [ ] **Gift Cards** purchase option
- [ ] **Penny Tips on Likes** - Creator earns when viewer taps like
- [ ] **Commission System** - Auto-deduct platform fee (20-30%)

#### Premium Streams
- [ ] **Pay-Per-View Streams**
  - Creators schedule paid access streams
  - Users pay coins/tokens to enter
  - Limited seats option
  - Invite-only option
  
#### Ads
- [ ] **Ad Banners** in feed/shorts section
- [ ] **Video Ads** in content
- [ ] **Rewarded Ads** - Watch ad to get free coins
- [ ] Revenue via CPM and CPC

#### Sponsored Content
- [ ] **Brand Collaboration System**
  - Sponsored live sessions
  - Featured shorts/highlights
  - Product placement during streams
  - Commission or flat fee from brands

### 7. Creator Tools

- [ ] **Withdrawal System**
  - Cash out earnings after minimum threshold (₹1000)
  - Bank transfer integration
  - Withdrawal history
  
- [ ] **Dual Dashboard Toggle**
  - Easy switch between User Dashboard and Creator Dashboard
  - Prominent toggle at top-right or profile menu

### 8. Content Management

- [x] **View Count Tracking** for posts ✅ IMPLEMENTED
- [x] **Share Count Tracking** for posts ✅ IMPLEMENTED
- [ ] **Share Functionality**
  - Share button on posts
  - Share to social media
  - Share to other users
  
- [x] **Trending Algorithm** ✅ IMPLEMENTED
  - Rank content by engagement metrics
  - Consider: likes, comments, views, shares, recency
  - Apply to photos and shorts

---

## 🟡 Medium Priority Missing Features

### 9. Creator Application
- [ ] **30-Day Re-application Restriction**
  - Track rejection date
  - Prevent re-application before 30 days
  - Show countdown to user

### 10. Security & Privacy
- [ ] **Data Encryption**
  - Encrypt `accountNumber` before storage
  - Encrypt `panNumber` before storage
  
### 11. Social Features
- [ ] **Top Fan/VIP System**
  - Track top gifters
  - Display "Top Fan of the Week"
  - Special badges for top fans

---

## 📊 Database Schema Changes Needed

### New Tables Required
```sql
-- Subscriptions
CREATE TABLE Subscription (
  id, userId, creatorId, tier, price, 
  status, startDate, endDate, autoRenew
)

-- Premium Streams
CREATE TABLE PremiumStream (
  id, streamId, price, maxSeats, 
  currentSeats, isInviteOnly
)

-- Highlights
CREATE TABLE Highlight (
  id, streamId, creatorId, videoUrl, 
  duration, watermarkUrl, createdAt
)

-- View Tracking ✅ DONE
ALTER TABLE Post ADD viewsCount INT DEFAULT 0
ALTER TABLE Post ADD sharesCount INT DEFAULT 0

-- User Fields
ALTER TABLE User ADD age INT
ALTER TABLE User ADD phone STRING
```

### New Fields Required
- `User`: `age`, `phone`
- `Post`: `viewsCount`, `sharesCount` ✅ DONE
- `Stream`: `audienceType` (PUBLIC, FOLLOWERS_ONLY, INVITE_ONLY)
- `Stream`: `isAudioOnly`, `hasFilters`

---

## 🔧 API Endpoints to Create

### Highlights
- `POST /api/stream/capture-highlight` - Capture 10-second clip
- `GET /api/stream/highlights/:streamId` - Get stream highlights
- `DELETE /api/stream/highlight/:id` - Delete highlight

### Subscriptions
- `POST /api/payment/subscribe` - Subscribe to creator
- `DELETE /api/payment/subscribe/:creatorId` - Unsubscribe
- `GET /api/payment/subscriptions` - Get user's subscriptions
- `GET /api/creator/subscribers` - Get creator's subscribers

### Premium Streams
- `POST /api/stream/premium` - Create premium stream
- `POST /api/stream/premium/:id/join` - Join premium stream
- `GET /api/stream/premium/:id/seats` - Check available seats

### Shorts & Trending
- `GET /api/content/shorts` - Get shorts feed
- `GET /api/content/trending` - Get trending content ✅ DONE
- `POST /api/content/posts/:postId/view` - Track post view ✅ DONE
- `POST /api/content/posts/:postId/share` - Track post share ✅ DONE
- `GET /api/social/following/live` - Get live followed creators ✅ DONE

### Withdrawals
- `POST /api/payment/withdraw` - Request withdrawal
- `GET /api/payment/withdrawals` - Get withdrawal history
- `GET /api/payment/balance` - Get withdrawable balance

### Ads
- `GET /api/ads/banner` - Get banner ad
- `POST /api/ads/view` - Track ad view
- `POST /api/ads/reward` - Claim rewarded ad coins

---

## 🎨 Frontend Components to Build

### New Pages
- `/shorts` - Shorts feed (vertical video player)
- `/trending` - Trending creators and content
- `/subscriptions` - Manage subscriptions
- `/creator-dashboard/withdrawals` - Withdrawal management
- `/creator-dashboard/highlights` - Manage highlights

### New Components
- `<ShortsPlayer>` - Vertical video player with swipe navigation
- `<HighlightCapture>` - Capture and preview UI
- `<TrendingCreators>` - Trending content grid ✅ DONE
- `<LiveCreatorIndicator>` - Horizontal scroll of live creators ✅ DONE
- `<SubscriptionCard>` - Subscription tier display
- `<WithdrawalForm>` - Withdrawal request form
- `<ImmersiveViewer>` - Fullscreen stream viewer
- `<GestureHandler>` - Swipe gesture detection
- `<AdBanner>` - Ad display component
- `<RewardedAd>` - Rewarded ad modal

---

## 📱 Mobile-Specific Features

### Camera & Media
- [ ] Front/back camera toggle
- [ ] Beauty filters
- [ ] AR effects overlay
- [ ] Gallery integration for highlights

### Gestures
- [ ] Swipe left/right navigation
- [ ] Double tap to like
- [ ] Pinch to zoom (optional)

### Privacy
- [ ] Screen recording detection and blocking
- [ ] Screenshot prevention
- [ ] AirPlay/casting detection

### Notifications
- [ ] Push notifications for:
  - New follower
  - Creator went live
  - Gift received
  - Comment on post
  - Subscription expiring

---

## 🎯 Implementation Priority Order

### Phase 1: Core UX (Weeks 1-2)
1. Add age and phone to registration
2. ✅ Trending creators section - COMPLETE
3. ✅ Live creator indicator - COMPLETE
4. Shorts content type and feed

### Phase 2: Monetization (Weeks 3-4)
5. Subscription system
6. Premium streams
7. Penny tips on likes
8. Withdrawal system

### Phase 3: Creator Tools (Weeks 5-6)
9. 10-second highlight capture
10. Stream summary screen
11. Dual dashboard toggle
12. Enhanced moderation tools

### Phase 4: Privacy & Mobile (Weeks 7-8)
13. Screen recording protection
14. Swipe gestures
15. Camera controls
16. Push notifications

### Phase 5: Advanced (Weeks 9-10)
17. Ads integration
18. Sponsored content
19. Gift cards
20. Top fan system

---

**Total Missing Features**: 60+  
**Estimated Development Time**: 10-12 weeks  
**Team Size Recommended**: 3-4 developers (1 backend, 2 frontend, 1 mobile)
