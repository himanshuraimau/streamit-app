# VoltStream Admin Dashboard - Complete Implementation Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Database Schema Changes](#database-schema-changes)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Security & Authentication](#security--authentication)
7. [Features Implementation](#features-implementation)
8. [Deployment](#deployment)

---

## 🎯 Overview

The admin dashboard is a separate application for managing VoltStream platform operations, including:
- User management
- Creator application reviews
- Content moderation
- Analytics & reporting
- System configuration

**IMPORTANT**: There will be **ONLY ONE SUPER ADMIN** for the platform. No additional admins can be created through the dashboard.

### Tech Stack
- **Backend**: Node.js/Bun + Express + Prisma + PostgreSQL
- **Frontend**: React + Vite + TypeScript + TailwindCSS
- **Authentication**: JWT or Better Auth with single admin user
- **UI Components**: shadcn/ui (same as main app)

---

## 📁 Project Structure

```
streamit/
├── admin-backend/              # New admin backend
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── admin-auth.controller.ts
│   │   │   ├── user-management.controller.ts
│   │   │   ├── creator-review.controller.ts
│   │   │   ├── content-moderation.controller.ts
│   │   │   ├── analytics.controller.ts
│   │   │   └── system.controller.ts
│   │   ├── middleware/
│   │   │   ├── admin-auth.ts
│   │   │   └── rate-limit.ts
│   │   ├── routes/
│   │   │   ├── admin-auth.route.ts
│   │   │   ├── users.route.ts
│   │   │   ├── creators.route.ts
│   │   │   ├── content.route.ts
│   │   │   └── analytics.route.ts
│   │   ├── services/
│   │   │   ├── admin.service.ts
│   │   │   ├── user-management.service.ts
│   │   │   ├── creator-review.service.ts
│   │   │   └── analytics.service.ts
│   │   ├── lib/
│   │   │   ├── db.ts
│   │   │   └── validations/
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma (shared with main backend)
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
└── admin-frontend/             # New admin frontend
    ├── src/
    │   ├── pages/
    │   │   ├── auth/
    │   │   │   └── login.tsx
    │   │   ├── dashboard/
    │   │   │   └── index.tsx
    │   │   ├── users/
    │   │   │   ├── list.tsx
    │   │   │   └── detail.tsx
    │   │   ├── creators/
    │   │   │   ├── applications.tsx
    │   │   │   ├── review.tsx
    │   │   │   └── approved.tsx
    │   │   ├── content/
    │   │   │   ├── posts.tsx
    │   │   │   ├── reported.tsx
    │   │   │   └── moderation.tsx
    │   │   ├── analytics/
    │   │   │   ├── overview.tsx
    │   │   │   ├── users.tsx
    │   │   │   └── revenue.tsx
    │   │   └── settings/
    │   │       └── index.tsx
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── admin-sidebar.tsx
    │   │   │   ├── admin-header.tsx
    │   │   │   └── admin-layout.tsx
    │   │   ├── tables/
    │   │   │   ├── users-table.tsx
    │   │   │   ├── applications-table.tsx
    │   │   │   └── content-table.tsx
    │   │   ├── charts/
    │   │   │   ├── line-chart.tsx
    │   │   │   ├── bar-chart.tsx
    │   │   │   └── pie-chart.tsx
    │   │   └── ui/ (shared from main app)
    │   ├── hooks/
    │   │   ├── useAdminAuth.ts
    │   │   ├── useUsers.ts
    │   │   ├── useCreatorApplications.ts
    │   │   └── useAnalytics.ts
    │   ├── lib/
    │   │   ├── api.ts
    │   │   └── utils.ts
    │   ├── App.tsx
    │   └── main.tsx
    ├── package.json
    ├── vite.config.ts
    └── .env
```

---

## 🗄️ Database Schema Changes

### Add Admin-Related Models to `schema.prisma`

```prisma
// Admin user model - SINGLE SUPER ADMIN ONLY
model Admin {
  id            String        @id @default(cuid())
  userId        String        @unique
  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // No role field - there's only ONE super admin
  
  // Activity tracking
  lastLoginAt   DateTime?
  loginCount    Int           @default(0)
  
  // Audit trail
  actions       AdminAction[]
  
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  
  @@map("admin")
}

// Admin action audit log
model AdminAction {
  id            String      @id @default(cuid())
  adminId       String
  admin         Admin       @relation(fields: [adminId], references: [id], onDelete: Cascade)
  
  action        ActionType
  resource      String      // e.g., "user", "creator_application", "post"
  resourceId    String      // ID of affected resource
  details       Json?       // Additional details about the action
  ipAddress     String?
  userAgent     String?
  
  createdAt     DateTime    @default(now())
  
  @@index([adminId])
  @@index([resource, resourceId])
  @@index([createdAt])
  @@map("admin_action")
}

// Content reports (for moderation)
model ContentReport {
  id            String        @id @default(cuid())
  reporterId    String
  reporter      User          @relation(fields: [reporterId], references: [id], onDelete: Cascade)
  
  // What's being reported
  contentType   ContentType   // POST, COMMENT, STREAM, USER
  contentId     String
  
  reason        ReportReason
  description   String?       @db.Text
  
  // Review status
  status        ReportStatus  @default(PENDING)
  reviewedAt    DateTime?
  reviewedBy    String?       // Admin ID
  reviewNotes   String?       @db.Text
  
  // Action taken
  actionTaken   ModerationAction?
  
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  
  @@index([reporterId])
  @@index([contentType, contentId])
  @@index([status])
  @@index([createdAt])
  @@map("content_report")
}

// User bans/suspensions
model UserBan {
  id            String      @id @default(cuid())
  userId        String
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  reason        String      @db.Text
  bannedBy      String      // Admin ID
  
  // Ban details
  banType       BanType     // TEMPORARY, PERMANENT
  expiresAt     DateTime?   // For temporary bans
  
  // Status
  isActive      Boolean     @default(true)
  liftedAt      DateTime?
  liftedBy      String?     // Admin ID who lifted the ban
  
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  @@index([userId])
  @@index([isActive])
  @@map("user_ban")
}

// Platform settings (configurable via admin)
model PlatformSetting {
  id            String      @id @default(cuid())
  key           String      @unique
  value         Json
  description   String?
  
  updatedBy     String?     // Admin ID
  updatedAt     DateTime    @updatedAt
  createdAt     DateTime    @default(now())
  
  @@map("platform_setting")
}

// Enums for admin models
enum ActionType {
  // User actions
  USER_BANNED
  USER_UNBANNED
  USER_DELETED
  USER_UPDATED
  
  // Creator actions
  APPLICATION_REVIEWED
  APPLICATION_APPROVED
  APPLICATION_REJECTED
  
  // Content actions
  POST_DELETED
  POST_HIDDEN
  COMMENT_DELETED
  STREAM_SUSPENDED
  
  // System actions
  SETTING_CHANGED
}

enum ContentType {
  POST
  COMMENT
  STREAM
  USER_PROFILE
}

enum ReportReason {
  SPAM
  HARASSMENT
  HATE_SPEECH
  VIOLENCE
  NUDITY
  MISINFORMATION
  COPYRIGHT
  IMPERSONATION
  OTHER
}

enum ReportStatus {
  PENDING
  UNDER_REVIEW
  RESOLVED
  DISMISSED
}

enum ModerationAction {
  NO_ACTION
  WARNING_SENT
  CONTENT_REMOVED
  USER_SUSPENDED
  USER_BANNED
}

enum BanType {
  TEMPORARY
  PERMANENT
}
```

### Update Existing Models

Add these fields to existing models:

```prisma
// Add to User model
model User {
  // ... existing fields ...
  
  // Admin relationship
  admin         Admin?
  
  // Moderation
  reports       ContentReport[]
  bans          UserBan[]
  
  // Status
  isBanned      Boolean   @default(false)
  bannedUntil   DateTime?
}

// Add to CreatorApplication model
model CreatorApplication {
  // ... existing fields ...
  
  // Admin review notes
  reviewNotes   String?   @db.Text
  
  // Review history (JSON array of review events)
  reviewHistory Json?
}

// Add to Post model
model Post {
  // ... existing fields ...
  
  // Moderation
  isHidden      Boolean   @default(false)
  hiddenReason  String?
  hiddenBy      String?   // Admin ID
  hiddenAt      DateTime?
}
```

---

## 🔧 Backend Implementation

### 1. Admin Authentication Middleware

**`admin-backend/src/middleware/admin-auth.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/db';
import { auth } from '../lib/auth'; // Your Better Auth instance

export interface AdminRequest extends Request {
  admin?: {
    id: string;
    userId: string;
  };
}

export const requireAdmin = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Validate session using Better Auth
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (!session?.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - No valid session',
      });
    }

    // 2. Check if user is THE admin (only one admin exists)
    const admin = await prisma.admin.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true,
      },
    });

    if (!admin) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden - Admin access required',
      });
    }

    // 3. Attach admin info to request
    req.admin = {
      id: admin.id,
      userId: admin.userId,
    };

    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
```

### 2. User Management Controller

**`admin-backend/src/controllers/user-management.controller.ts`**

```typescript
import { Request, Response } from 'express';
import { prisma } from '../lib/db';
import { AdminRequest } from '../middleware/admin-auth';

export class UserManagementController {
  // Get all users with pagination and filters
  static async getAllUsers(req: AdminRequest, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        isBanned,
        hasCreatorApp,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      // Build where clause
      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { username: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      if (isBanned !== undefined) {
        where.isBanned = isBanned === 'true';
      }

      if (hasCreatorApp === 'true') {
        where.creatorApplication = { isNot: null };
      }

      // Get users
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { [sortBy as string]: sortOrder },
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            image: true,
            emailVerified: true,
            isBanned: true,
            bannedUntil: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                posts: true,
                following: true,
                followedBy: true,
              },
            },
            creatorApplication: {
              select: {
                status: true,
              },
            },
          },
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch users',
      });
    }
  }

  // Get user details
  static async getUserDetail(req: AdminRequest, res: Response) {
    try {
      const { userId } = req.params;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          creatorApplication: {
            include: {
              identity: true,
              financial: true,
              profile: true,
            },
          },
          stream: true,
          bans: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              posts: true,
              following: true,
              followedBy: true,
              sessions: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error('Error fetching user detail:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user detail',
      });
    }
  }

  // Ban user
  static async banUser(req: AdminRequest, res: Response) {
    try {
      const { userId } = req.params;
      const { reason, banType, expiresAt } = req.body;

      // Create ban record
      const ban = await prisma.userBan.create({
        data: {
          userId,
          reason,
          banType,
          expiresAt: banType === 'TEMPORARY' ? new Date(expiresAt) : null,
          bannedBy: req.admin!.id,
        },
      });

      // Update user status
      await prisma.user.update({
        where: { id: userId },
        data: {
          isBanned: true,
          bannedUntil: ban.expiresAt,
        },
      });

      // Log admin action
      await prisma.adminAction.create({
        data: {
          adminId: req.admin!.id,
          action: 'USER_BANNED',
          resource: 'user',
          resourceId: userId,
          details: { reason, banType, expiresAt },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      res.json({
        success: true,
        message: 'User banned successfully',
        data: ban,
      });
    } catch (error) {
      console.error('Error banning user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to ban user',
      });
    }
  }

  // Unban user
  static async unbanUser(req: AdminRequest, res: Response) {
    try {
      const { userId } = req.params;

      // Deactivate all active bans
      await prisma.userBan.updateMany({
        where: {
          userId,
          isActive: true,
        },
        data: {
          isActive: false,
          liftedAt: new Date(),
          liftedBy: req.admin!.id,
        },
      });

      // Update user status
      await prisma.user.update({
        where: { id: userId },
        data: {
          isBanned: false,
          bannedUntil: null,
        },
      });

      // Log admin action
      await prisma.adminAction.create({
        data: {
          adminId: req.admin!.id,
          action: 'USER_UNBANNED',
          resource: 'user',
          resourceId: userId,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      res.json({
        success: true,
        message: 'User unbanned successfully',
      });
    } catch (error) {
      console.error('Error unbanning user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to unban user',
      });
    }
  }
}
```

### 3. Creator Review Controller

**`admin-backend/src/controllers/creator-review.controller.ts`**

```typescript
import { Request, Response } from 'express';
import { prisma } from '../lib/db';
import { AdminRequest } from '../middleware/admin-auth';

export class CreatorReviewController {
  // Get pending applications
  static async getPendingApplications(req: AdminRequest, res: Response) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const [applications, total] = await Promise.all([
        prisma.creatorApplication.findMany({
          where: {
            status: { in: ['PENDING', 'UNDER_REVIEW'] },
          },
          skip,
          take: Number(limit),
          orderBy: { submittedAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
                image: true,
              },
            },
            identity: true,
            financial: true,
            profile: true,
          },
        }),
        prisma.creatorApplication.count({
          where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } },
        }),
      ]);

      res.json({
        success: true,
        data: {
          applications,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      console.error('Error fetching applications:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch applications',
      });
    }
  }

  // Review application
  static async reviewApplication(req: AdminRequest, res: Response) {
    try {
      const { applicationId } = req.params;
      const { action, notes } = req.body; // action: 'approve' | 'reject'

      const application = await prisma.creatorApplication.findUnique({
        where: { id: applicationId },
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          error: 'Application not found',
        });
      }

      // Update application
      const updatedApp = await prisma.creatorApplication.update({
        where: { id: applicationId },
        data: {
          status: action === 'approve' ? 'APPROVED' : 'REJECTED',
          reviewedAt: new Date(),
          reviewedBy: req.admin!.userId,
          reviewNotes: notes,
          rejectionReason: action === 'reject' ? notes : null,
        },
      });

      // Log admin action
      await prisma.adminAction.create({
        data: {
          adminId: req.admin!.id,
          action:
            action === 'approve'
              ? 'APPLICATION_APPROVED'
              : 'APPLICATION_REJECTED',
          resource: 'creator_application',
          resourceId: applicationId,
          details: { notes },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      res.json({
        success: true,
        message: `Application ${action}d successfully`,
        data: updatedApp,
      });
    } catch (error) {
      console.error('Error reviewing application:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to review application',
      });
    }
  }
}
```

### 4. Analytics Controller

**`admin-backend/src/controllers/analytics.controller.ts`**

```typescript
import { Request, Response } from 'express';
import { prisma } from '../lib/db';
import { AdminRequest } from '../middleware/admin-auth';

export class AnalyticsController {
  // Dashboard overview stats
  static async getDashboardStats(req: AdminRequest, res: Response) {
    try {
      const now = new Date();
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        totalUsers,
        newUsersLast30Days,
        totalCreators,
        pendingApplications,
        totalPosts,
        totalReports,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: { createdAt: { gte: last30Days } },
        }),
        prisma.creatorApplication.count({
          where: { status: 'APPROVED' },
        }),
        prisma.creatorApplication.count({
          where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } },
        }),
        prisma.post.count(),
        prisma.contentReport.count({
          where: { status: 'PENDING' },
        }),
      ]);

      res.json({
        success: true,
        data: {
          users: {
            total: totalUsers,
            new: newUsersLast30Days,
          },
          creators: {
            total: totalCreators,
            pending: pendingApplications,
          },
          content: {
            totalPosts,
          },
          moderation: {
            pendingReports: totalReports,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard stats',
      });
    }
  }

  // User growth over time
  static async getUserGrowth(req: AdminRequest, res: Response) {
    try {
      const { days = 30 } = req.query;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(days));

      const users = await prisma.user.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: startDate },
        },
        _count: true,
      });

      // Format data for charts
      const growth = users.map((item) => ({
        date: item.createdAt.toISOString().split('T')[0],
        count: item._count,
      }));

      res.json({
        success: true,
        data: growth,
      });
    } catch (error) {
      console.error('Error fetching user growth:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user growth',
      });
    }
  }
}
```

---

## 🎨 Frontend Implementation

### 1. Admin Layout Component

**`admin-frontend/src/components/layout/admin-layout.tsx`**

```tsx
import { Outlet, Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminSidebar } from './admin-sidebar';
import { AdminHeader } from './admin-header';

export function AdminLayout() {
  const { admin, isLoading } = useAdminAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!admin) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex h-screen bg-zinc-950">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

### 2. Admin Sidebar

**`admin-frontend/src/components/layout/admin-sidebar.tsx`**

```tsx
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  Flag,
  BarChart3,
  Settings,
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Users, label: 'Users', path: '/users' },
  { icon: UserCheck, label: 'Creator Applications', path: '/creators' },
  { icon: FileText, label: 'Content', path: '/content' },
  { icon: Flag, label: 'Reports', path: '/reports' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function AdminSidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white">VoltStream</h1>
        <p className="text-sm text-zinc-400">Admin Panel</p>
      </div>
      <nav className="space-y-1 px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-purple-600 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

### 3. Users Management Page

**`admin-frontend/src/pages/users/list.tsx`**

```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UsersTable } from '@/components/tables/users-table';
import { Search } from 'lucide-react';

export function UsersListPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: async () => {
      const response = await fetch(
        `/api/admin/users?page=${page}&search=${search}`,
        { credentials: 'include' }
      );
      return response.json();
    },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
        <p className="text-zinc-400">Manage all platform users</p>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <Input
            placeholder="Search by name, email, or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <UsersTable users={data?.data?.users || []} />
      )}
    </div>
  );
}
```

### 4. Creator Applications Review Page

**`admin-frontend/src/pages/creators/applications.tsx`**

```tsx
import { useQuery } from '@tanstack/react-query';
import { ApplicationsTable } from '@/components/tables/applications-table';

export function CreatorApplicationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['pending-applications'],
    queryFn: async () => {
      const response = await fetch('/api/admin/creators/pending', {
        credentials: 'include',
      });
      return response.json();
    },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">
          Creator Applications
        </h1>
        <p className="text-zinc-400">
          Review and approve creator applications
        </p>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <ApplicationsTable applications={data?.data?.applications || []} />
      )}
    </div>
  );
}
```

---

## 🔐 Security & Authentication

### Key Security Measures

1. **Single Super Admin**
   - Only ONE admin account for the entire platform
   - Must be manually created in the database
   - No ability to create additional admins through the dashboard
   - Admin user is created during initial setup only

2. **Separate Admin Domain**
   - Host admin panel on subdomain: `admin.voltstream.space`
   - Separate from main app for security isolation

3. **Audit Logging**
   - Log all admin actions with timestamps
   - Track IP addresses and user agents
   - Store in `AdminAction` table

4. **Rate Limiting**
   - Implement rate limits on admin API endpoints
   - Prevent brute force attacks

5. **2FA (Future Enhancement)**
   - Add two-factor authentication for the admin account
   - Use authenticator apps or SMS

### Creating the Single Admin User

**Manual Database Setup** (Run once during initial setup):

```sql
-- Step 1: First create or identify the admin user in the User table
-- If you don't have an admin user yet, create one through regular signup
-- Then get the user ID

-- Step 2: Create the admin record
INSERT INTO "admin" ("id", "userId", "lastLoginAt", "loginCount", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,  -- or use your preferred UUID generation
  'YOUR_USER_ID_HERE',       -- Replace with actual user ID
  NULL,
  0,
  NOW(),
  NOW()
);
```

**Or using Prisma:**

```typescript
// scripts/create-admin.ts
import { prisma } from '../src/lib/db';

async function createAdmin() {
  const adminEmail = 'admin@voltstream.space'; // Your admin email
  
  // Find or create the user
  let user = await prisma.user.findUnique({
    where: { email: adminEmail },
  });
  
  if (!user) {
    console.error('User not found. Please create the user account first.');
    return;
  }
  
  // Check if admin already exists
  const existingAdmin = await prisma.admin.findUnique({
    where: { userId: user.id },
  });
  
  if (existingAdmin) {
    console.log('Admin already exists!');
    return;
  }
  
  // Create admin
  const admin = await prisma.admin.create({
    data: {
      userId: user.id,
    },
  });
  
  console.log('✅ Admin created successfully!', admin);
}

createAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run with: `bun run scripts/create-admin.ts`

---

---

## 📊 Key Features to Implement

### Phase 1: Core Features
- ✅ Admin authentication & authorization
- ✅ User management (view, ban, unban)
- ✅ Creator application review
- ✅ Basic analytics dashboard

### Phase 2: Content Moderation
- Content reports system
- Post/comment moderation
- Automated content filtering
- Bulk actions

### Phase 3: Advanced Analytics
- Revenue tracking
- User engagement metrics
- Creator performance analytics
- Export functionality

### Phase 4: System Management
- Platform settings
- Email template management
- Feature flags
- Backup & restore

---

## 🚀 Deployment

### Backend Deployment

```bash
# 1. Set up separate deployment
cd admin-backend
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with admin-specific settings

# 3. Run migrations
npx prisma migrate deploy

# 4. Build and deploy
npm run build
pm2 start dist/index.js --name voltstream-admin-api
```

### Frontend Deployment

```bash
# 1. Build admin frontend
cd admin-frontend
npm install
npm run build

# 2. Deploy to admin subdomain
# Configure nginx to serve from dist/
# Point admin.voltstream.space to this build
```

### Nginx Configuration

```nginx
# Admin API
server {
    listen 443 ssl;
    server_name admin-api.voltstream.space;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Admin Frontend
server {
    listen 443 ssl;
    server_name admin.voltstream.space;

    root /var/www/admin-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## � Package Configuration Files

### Admin Backend `package.json`

```json
{
  "name": "voltstream-admin-backend",
  "version": "1.0.0",
  "description": "VoltStream Admin Backend API",
  "main": "dist/index.js",
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "build": "bun build src/index.ts --outdir ./dist --target bun",
    "start": "bun dist/index.js",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "bun run src/seed.ts"
  },
  "dependencies": {
    "express": "^5.0.1",
    "@prisma/client": "^5.22.0",
    "better-auth": "^1.0.0",
    "cors": "^2.8.5",
    "zod": "^3.23.8",
    "express-rate-limit": "^7.4.1",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.17.6",
    "prisma": "^5.22.0",
    "typescript": "^5.6.3"
  }
}
```

### Admin Frontend `package.json`

```json
{
  "name": "voltstream-admin-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint ."
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0",
    "@tanstack/react-query": "^5.59.16",
    "better-auth": "^1.0.0",
    "lucide-react": "^0.454.0",
    "recharts": "^2.13.3",
    "date-fns": "^4.1.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.4"
  },
  "devDependencies": {
    "@eslint/js": "^9.13.0",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.13.0",
    "eslint-plugin-react-hooks": "^5.0.0",
    "eslint-plugin-react-refresh": "^0.4.14",
    "globals": "^15.11.0",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14",
    "typescript": "~5.6.2",
    "typescript-eslint": "^8.11.0",
    "vite": "^5.4.10"
  }
}
```

---

## 🗂️ Environment Variables

### Admin Backend `.env`

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/voltstream"

# Better Auth
BETTER_AUTH_SECRET="your-super-secret-key-here-min-32-chars"
BETTER_AUTH_URL="https://admin-api.voltstream.space"

# Frontend URL for CORS
FRONTEND_URL="https://admin.voltstream.space"

# Server
PORT=4000
NODE_ENV="production"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Admin Frontend `.env`

```env
# API URL
VITE_API_URL=https://admin-api.voltstream.space

# Better Auth
VITE_BETTER_AUTH_URL=https://admin-api.voltstream.space
```

---

## 🛣️ Complete Route Setup

### Admin Backend Routes Configuration

**`admin-backend/src/index.ts`**

```typescript
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { prisma } from './lib/db';
import { auth } from './lib/auth';
import { toNodeHandler } from 'better-auth/node';

// Import routes
import adminAuthRoutes from './routes/admin-auth.route';
import usersRoutes from './routes/users.route';
import creatorsRoutes from './routes/creators.route';
import contentRoutes from './routes/content.route';
import analyticsRoutes from './routes/analytics.route';

const app = express();
const PORT = process.env.PORT || 4000;

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests from this IP',
});

app.use('/api/admin', limiter);

// Body parsing
app.use(express.json());

// Better Auth handler
app.all("/api/auth/*", toNodeHandler(auth));

// Health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$connect();
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'error', error: 'Database connection failed' });
  }
});

// Admin routes
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/users', usersRoutes);
app.use('/api/admin/creators', creatorsRoutes);
app.use('/api/admin/content', contentRoutes);
app.use('/api/admin/analytics', analyticsRoutes);

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Admin API running on port ${PORT}`);
  console.log(`📊 Admin Frontend: ${process.env.FRONTEND_URL}`);
});
```

**`admin-backend/src/routes/users.route.ts`**

```typescript
import { Router } from 'express';
import { UserManagementController } from '../controllers/user-management.controller';
import { requireAdmin } from '../middleware/admin-auth';

const router = Router();

// All routes require admin authentication
router.use(requireAdmin);

// User management routes
router.get(
  '/',
  UserManagementController.getAllUsers
);

router.get(
  '/:userId',
  UserManagementController.getUserDetail
);

router.post(
  '/:userId/ban',
  UserManagementController.banUser
);

router.post(
  '/:userId/unban',
  UserManagementController.unbanUser
);

router.delete(
  '/:userId',
  UserManagementController.deleteUser
);

export default router;
```

**`admin-backend/src/routes/creators.route.ts`**

```typescript
import { Router } from 'express';
import { CreatorReviewController } from '../controllers/creator-review.controller';
import { requireAdmin } from '../middleware/admin-auth';

const router = Router();

router.use(requireAdmin);

router.get(
  '/pending',
  CreatorReviewController.getPendingApplications
);

router.get(
  '/applications/:applicationId',
  CreatorReviewController.getApplicationDetail
);

router.post(
  '/applications/:applicationId/review',
  CreatorReviewController.reviewApplication
);

export default router;
```

**`admin-backend/src/routes/content.route.ts`**

```typescript
import { Router } from 'express';
import { ContentModerationController } from '../controllers/content-moderation.controller';
import { requireAdmin } from '../middleware/admin-auth';

const router = Router();

router.use(requireAdmin);

// Content reports
router.get(
  '/reports',
  ContentModerationController.getReports
);

router.get(
  '/reports/:reportId',
  ContentModerationController.getReportDetail
);

router.post(
  '/reports/:reportId/review',
  ContentModerationController.reviewReport
);

// Content management
router.get(
  '/posts',
  ContentModerationController.getAllPosts
);

router.delete(
  '/posts/:postId',
  ContentModerationController.deletePost
);

router.patch(
  '/posts/:postId/hide',
  ContentModerationController.hidePost
);

export default router;
```

**`admin-backend/src/routes/analytics.route.ts`**

```typescript
import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { requireAdmin } from '../middleware/admin-auth';

const router = Router();

router.use(requireAdmin);

router.get(
  '/dashboard',
  AnalyticsController.getDashboardStats
);

router.get(
  '/users/growth',
  AnalyticsController.getUserGrowth
);

router.get(
  '/creators/stats',
  AnalyticsController.getCreatorStats
);

router.get(
  '/content/stats',
  AnalyticsController.getContentStats
);

export default router;
```

---

## 🚨 Content Moderation Implementation

### Content Moderation Controller

**`admin-backend/src/controllers/content-moderation.controller.ts`**

```typescript
import { Request, Response } from 'express';
import { prisma } from '../lib/db';
import { AdminRequest } from '../middleware/admin-auth';

export class ContentModerationController {
  // Get all content reports
  static async getReports(req: AdminRequest, res: Response) {
    try {
      const { page = 1, limit = 20, status, contentType } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (status) where.status = status;
      if (contentType) where.contentType = contentType;

      const [reports, total] = await Promise.all([
        prisma.contentReport.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            reporter: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
        }),
        prisma.contentReport.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          reports,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch reports',
      });
    }
  }

  // Review content report
  static async reviewReport(req: AdminRequest, res: Response) {
    try {
      const { reportId } = req.params;
      const { action, reviewNotes } = req.body;

      const report = await prisma.contentReport.update({
        where: { id: reportId },
        data: {
          status: 'RESOLVED',
          reviewedAt: new Date(),
          reviewedBy: req.admin!.id,
          reviewNotes,
          actionTaken: action,
        },
      });

      // Take action based on decision
      if (action === 'CONTENT_REMOVED') {
        if (report.contentType === 'POST') {
          await prisma.post.update({
            where: { id: report.contentId },
            data: {
              isHidden: true,
              hiddenReason: reviewNotes,
              hiddenBy: req.admin!.userId,
              hiddenAt: new Date(),
            },
          });
        }
      }

      // Log action
      await prisma.adminAction.create({
        data: {
          adminId: req.admin!.id,
          action: 'POST_DELETED',
          resource: report.contentType.toLowerCase(),
          resourceId: report.contentId,
          details: { reportId, action, reviewNotes },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      res.json({
        success: true,
        message: 'Report reviewed successfully',
        data: report,
      });
    } catch (error) {
      console.error('Error reviewing report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to review report',
      });
    }
  }

  // Delete post
  static async deletePost(req: AdminRequest, res: Response) {
    try {
      const { postId } = req.params;
      const { reason } = req.body;

      await prisma.post.delete({
        where: { id: postId },
      });

      // Log action
      await prisma.adminAction.create({
        data: {
          adminId: req.admin!.id,
          action: 'POST_DELETED',
          resource: 'post',
          resourceId: postId,
          details: { reason },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      res.json({
        success: true,
        message: 'Post deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete post',
      });
    }
  }

  // Hide post
  static async hidePost(req: AdminRequest, res: Response) {
    try {
      const { postId } = req.params;
      const { reason } = req.body;

      const post = await prisma.post.update({
        where: { id: postId },
        data: {
          isHidden: true,
          hiddenReason: reason,
          hiddenBy: req.admin!.userId,
          hiddenAt: new Date(),
        },
      });

      // Log action
      await prisma.adminAction.create({
        data: {
          adminId: req.admin!.id,
          action: 'POST_HIDDEN',
          resource: 'post',
          resourceId: postId,
          details: { reason },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      res.json({
        success: true,
        message: 'Post hidden successfully',
        data: post,
      });
    } catch (error) {
      console.error('Error hiding post:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to hide post',
      });
    }
  }

  // Get all posts with filters
  static async getAllPosts(req: AdminRequest, res: Response) {
    try {
      const { page = 1, limit = 20, isHidden, authorId } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (isHidden !== undefined) where.isHidden = isHidden === 'true';
      if (authorId) where.authorId = authorId;

      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
          },
        }),
        prisma.post.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          posts,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch posts',
      });
    }
  }
}
```

---

## 🎨 Additional Frontend Components

### Admin API Client

**`admin-frontend/src/lib/api.ts`**

```typescript
const API_URL = import.meta.env.VITE_API_URL;

export const adminApi = {
  // Users
  getUsers: async (params: any) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/api/admin/users?${query}`, {
      credentials: 'include',
    });
    return response.json();
  },

  getUserDetail: async (userId: string) => {
    const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
      credentials: 'include',
    });
    return response.json();
  },

  banUser: async (userId: string, data: any) => {
    const response = await fetch(`${API_URL}/api/admin/users/${userId}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Creator applications
  getPendingApplications: async (params: any) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(
      `${API_URL}/api/admin/creators/pending?${query}`,
      { credentials: 'include' }
    );
    return response.json();
  },

  reviewApplication: async (applicationId: string, data: any) => {
    const response = await fetch(
      `${API_URL}/api/admin/creators/applications/${applicationId}/review`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      }
    );
    return response.json();
  },

  // Analytics
  getDashboardStats: async () => {
    const response = await fetch(`${API_URL}/api/admin/analytics/dashboard`, {
      credentials: 'include',
    });
    return response.json();
  },
};
```

### Admin Auth Hook

**`admin-frontend/src/hooks/useAdminAuth.ts`**

```typescript
import { useQuery } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';

export function useAdminAuth() {
  const { data: session, isPending } = authClient.useSession();

  const { data: admin, isLoading: isLoadingAdmin } = useQuery({
    queryKey: ['admin-check', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) return null;
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/auth/me`,
        { credentials: 'include' }
      );
      
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    },
    enabled: !!session?.user,
  });

  return {
    admin,
    isLoading: isPending || isLoadingAdmin,
  };
}
```

### Users Table Component

**`admin-frontend/src/components/tables/users-table.tsx`**

```tsx
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ban, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface UsersTableProps {
  users: User[];
  onBan: (userId: string) => void;
  onUnban: (userId: string) => void;
}

export function UsersTable({ users, onBan, onUnban }: UsersTableProps) {
  return (
    <div className="bg-zinc-900 rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-zinc-800 border-b border-zinc-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
              Joined
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-zinc-800/50">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <img
                    src={user.image || `https://ui-avatars.com/api/?name=${user.name}`}
                    alt={user.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="font-medium text-white">{user.name}</div>
                    <div className="text-sm text-zinc-400">@{user.username}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-zinc-300">{user.email}</td>
              <td className="px-6 py-4">
                {user.isBanned ? (
                  <Badge variant="destructive">Banned</Badge>
                ) : (
                  <Badge variant="success">Active</Badge>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-zinc-400">
                {format(new Date(user.createdAt), 'MMM dd, yyyy')}
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  {user.isBanned ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUnban(user.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Unban
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onBan(user.id)}
                    >
                      <Ban className="w-4 h-4 mr-1" />
                      Ban
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 🔑 Creating the First Admin User

### Manual Database Insert

```sql
-- 1. First, ensure user exists
-- Find your user ID from the User table

-- 2. Insert admin record (there should be ONLY ONE)
INSERT INTO "admin" (
  id,
  "userId",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),  -- or use cuid() function if available
  'YOUR_USER_ID_HERE',  -- Replace with actual user ID
  NOW(),
  NOW()
);
```

### Seed Script

**`admin-backend/src/seed.ts`**

```typescript
import { prisma } from './lib/db';
import { auth } from './lib/auth';

async function seedAdmin() {
  // Create admin user (ONLY ONE for the entire platform)
  const email = 'admin@voltstream.space';
  const password = 'AdminPassword123!';  // Change this!
  const name = 'Super Admin';

  try {
    // 1. Create user via Better Auth
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
        username: 'superadmin',
      },
    });

    if (!result.user) {
      console.error('Failed to create user');
      return;
    }

    // 2. Create admin record (single super admin)
    await prisma.admin.create({
      data: {
        userId: result.user.id,
      },
    });

    console.log('✅ Super admin created successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log('⚠️  CHANGE THE PASSWORD IMMEDIATELY!');
    console.log('⚠️  This is the ONLY admin account for the platform!');
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
```

Run with: `bun run db:seed`

---

## �📝 Initial Setup Checklist

- [ ] Create `admin-backend` and `admin-frontend` directories
- [ ] Update Prisma schema with admin models
- [ ] Run database migrations
- [ ] **Create the single super admin user using the script above**
- [ ] Implement admin authentication
- [ ] Build user management features
- [ ] Build creator review system
- [ ] Implement audit logging
- [ ] Create admin dashboard UI
- [ ] Set up separate subdomain
- [ ] Configure CORS for admin domain
- [ ] Deploy admin backend
- [ ] Deploy admin frontend
- [ ] Test all features
- [ ] Enable production security measures
- [ ] **IMPORTANT: Secure the admin account with strong password and 2FA**

---

## 🎯 Quick Start Commands

```bash
# Create admin user (run in main backend)
npx prisma db seed
# Or manually insert into database

# Start admin backend
cd admin-backend
bun run dev

# Start admin frontend
cd admin-frontend
npm run dev
```

---

## 📚 Additional Resources

- [Prisma Admin Patterns](https://www.prisma.io/docs/guides/database/admin-patterns)
- [Better Auth Documentation](https://www.better-auth.com/docs) - For admin authentication
- [React Admin Dashboard Examples](https://github.com/topics/admin-dashboard)
- [TanStack Table](https://tanstack.com/table/latest) - For data tables

---

**End of Guide** 🎉

This admin dashboard will give you complete control over your VoltStream platform!
