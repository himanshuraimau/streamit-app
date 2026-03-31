# Admin Services

This directory contains business logic services for the admin panel.

## AuditLogService

The `AuditLogService` handles creation and querying of administrative action logs for compliance and accountability.

### Usage Examples

#### Creating an Audit Log Entry

```typescript
import { AuditLogService } from './audit-log.service';

// Log a user ban action
await AuditLogService.createLog(
  'admin-user-id',
  'user_ban',
  'user',
  'target-user-id',
  {
    reason: 'Violation of community guidelines',
    duration: 'permanent',
    notes: 'Multiple warnings issued'
  }
);

// Log a withdrawal approval
await AuditLogService.createLog(
  'admin-user-id',
  'withdrawal_approve',
  'withdrawal',
  'withdrawal-request-id',
  {
    amount: 10000,
    currency: 'INR'
  }
);
```

#### Querying Audit Logs

```typescript
// Get all logs with pagination
const allLogs = await AuditLogService.getLogs(
  {},
  { page: 1, pageSize: 20 }
);

// Filter by admin
const adminLogs = await AuditLogService.getLogs(
  { adminId: 'admin-user-id' },
  { page: 1, pageSize: 20 }
);

// Filter by action type
const banLogs = await AuditLogService.getLogs(
  { action: 'user_ban' },
  { page: 1, pageSize: 20 }
);

// Filter by date range
const recentLogs = await AuditLogService.getLogs(
  {
    dateFrom: new Date('2024-01-01'),
    dateTo: new Date('2024-12-31')
  },
  { page: 1, pageSize: 20 }
);

// Combine multiple filters
const specificLogs = await AuditLogService.getLogs(
  {
    adminId: 'admin-user-id',
    action: 'user_ban',
    targetType: 'user',
    dateFrom: new Date('2024-01-01')
  },
  { page: 1, pageSize: 20 }
);
```

#### Response Format

```typescript
{
  data: [
    {
      id: 'log-id',
      adminId: 'admin-user-id',
      adminName: 'Admin Name',
      action: 'user_ban',
      targetType: 'user',
      targetId: 'target-user-id',
      metadata: {
        reason: 'Violation of community guidelines',
        duration: 'permanent'
      },
      createdAt: Date
    }
  ],
  pagination: {
    currentPage: 1,
    pageSize: 20,
    totalCount: 100,
    totalPages: 5,
    hasNextPage: true,
    hasPreviousPage: false
  }
}
```

### Supported Actions

- `user_ban` - Permanent account suspension
- `user_freeze` - Temporary account suspension
- `user_unfreeze` - Remove account suspension
- `stream_kill` - Terminate live stream
- `content_remove` - Hide content
- `withdrawal_approve` - Approve withdrawal request
- `withdrawal_reject` - Reject withdrawal request
- `application_approve` - Approve creator application
- `application_reject` - Reject creator application
- `role_change` - Change admin role
- `settings_update` - Update platform settings
- `geo_block_create` - Create geographic content block

### Supported Target Types

- `user` - User account
- `stream` - Live stream
- `post` - Social media post
- `short` - Short-form video
- `report` - User report
- `withdrawal` - Withdrawal request
- `application` - Creator application
