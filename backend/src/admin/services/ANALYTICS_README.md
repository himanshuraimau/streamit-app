# Analytics Service Documentation

## Overview

The Analytics Service provides comprehensive platform metrics and insights for admin users. It implements efficient data aggregation with caching to ensure fast response times for expensive queries.

## Features

### 1. Overview Metrics
- **DAU (Daily Active Users)**: Users who logged in today
- **MAU (Monthly Active Users)**: Users who logged in in the last 30 days
- **Concurrent Viewers**: Current viewers across all live streams
- **Total Revenue**: Sum of gift transactions in the date range
- **Conversion Rate**: Percentage of viewers who sent gifts

### 2. Top Streamers
- Ranked by total revenue from gifts
- Includes gift count, average viewers, and stream hours
- Configurable limit (default: 10)

### 3. Top Content
- **Shorts**: Top short-form videos by views
- **Posts**: Top posts by engagement (likes + comments + shares)
- **Streams**: Top streams by peak viewers

### 4. Conversion Funnel
- Total viewers in the period
- Viewers who sent gifts
- Average gift value
- Conversion percentage

## Caching Strategy

All analytics queries are cached to reduce database load:

- **Overview metrics**: 5 minutes TTL
- **Top streamers**: 10 minutes TTL
- **Top content**: 10 minutes TTL
- **Conversion funnel**: 10 minutes TTL

Cache keys include all query parameters to ensure correct data is returned.

## Database Optimizations

### Indexes Added
- `user_lastLoginAt_idx`: For DAU/MAU calculations
- `user_role_lastLoginAt_idx`: For creator-specific queries
- `gift_transaction_createdAt_idx`: For revenue calculations
- `gift_transaction_receiverId_createdAt_idx`: For streamer revenue
- `stream_stats_startedAt_idx`: For stream analytics
- `stream_stats_peakViewers_idx`: For top streams
- `post_trending_idx`: For content engagement

### Query Optimizations
- Use `select` to fetch only required fields
- Use aggregations (`_sum`, `_avg`, `_count`) where possible
- Limit result sets before sorting
- Use composite indexes for multi-column filters

## API Endpoints

### GET /api/admin/analytics/overview
Query parameters:
- `dateRange`: 'today' | '7days' | '30days' | '90days' (default: '30days')

Response:
```json
{
  "success": true,
  "data": {
    "dau": 1234,
    "mau": 5678,
    "concurrentViewers": 89,
    "totalRevenue": 123456,
    "conversionRate": 12.5
  }
}
```

### GET /api/admin/analytics/streamers
Query parameters:
- `dateRange`: 'today' | '7days' | '30days' | '90days' (default: '30days')
- `limit`: number (1-50, default: 10)

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "user123",
      "name": "John Doe",
      "username": "johndoe",
      "totalRevenue": 50000,
      "giftCount": 250,
      "averageViewers": 150,
      "streamHours": 25.5
    }
  ]
}
```

### GET /api/admin/analytics/content
Query parameters:
- `dateRange`: 'today' | '7days' | '30days' | '90days' (default: '30days')
- `type`: 'shorts' | 'posts' | 'streams' (required)
- `limit`: number (1-50, default: 10)

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "post123",
      "title": "Amazing content...",
      "authorName": "Jane Smith",
      "views": 10000,
      "likes": 500,
      "engagement": 750
    }
  ]
}
```

### GET /api/admin/analytics/conversion
Query parameters:
- `dateRange`: 'today' | '7days' | '30days' | '90days' (default: '30days')

Response:
```json
{
  "success": true,
  "data": {
    "totalViewers": 10000,
    "viewersWhoSentGifts": 1250,
    "averageGiftValue": 100,
    "conversionPercentage": 12.5
  }
}
```

## Performance Considerations

1. **Cache First**: Always check cache before querying database
2. **Limit Results**: Use `take` to limit query results
3. **Select Fields**: Only fetch required fields
4. **Indexes**: Ensure all filter columns are indexed
5. **Aggregations**: Use database aggregations instead of application-level calculations

## Future Improvements

1. Add real-time analytics using WebSocket
2. Implement custom date range support
3. Add export functionality for reports
4. Implement trend analysis (week-over-week, month-over-month)
5. Add geographic analytics
6. Implement cohort analysis
