# Admin Panel - Backend Documentation

Complete backend implementation guide for the StreamIt admin panel.

## Table of Contents

1. [Overview](#overview)
2. [Database Changes](#database-changes)
3. [Authentication & Authorization](#authentication--authorization)
4. [API Routes](#api-routes)
5. [Middleware](#middleware)
6. [Controllers](#controllers)
7. [Services](#services)
8. [Security](#security)
9. [Testing](#testing)

---

## Overview

### Architecture Decision

**Completely SEPARATE backend application:**
- ✅ New Express.js app in `admin-backend/` directory
- ✅ Own Prisma client connected to same database
- ✅ Own Better Auth instance with admin role checking
- ✅ Independent deployment on separate subdomain
- ✅ Isolated from main backend for security
- ✅ Can scale independently

### Tech Stack (Same as Main Backend)

```typescript
Runtime:     Bun
Framework:   Express.js
Database:    PostgreSQL (shared with main backend)
ORM:         Prisma (same schema, separate client instance)
Auth:        Better Auth (with admin role enforcement)
Storage:     AWS S3 (shared credentials)
Email:       Resend (shared credentials)
```

### Directory Structure

```
admin-backend/                   # NEW: Separate backend app
├── prisma/
│   └── schema.prisma            # Copy from main backend
├── src/
│   ├── index.ts                 # Admin backend entry point
│   ├── controllers/
│   │   └── admin.controller.ts  # Admin operations
│   ├── routes/
│   │   └── admin.route.ts       # Admin routes
│   ├── services/
│   │   └── admin.service.ts     # Admin business logic
│   ├── middleware/
│   │   ├── auth.ts              # Admin auth middleware
│   │   └── cors.ts              # CORS for admin frontend
│   └── lib/
│       ├── auth.ts              # Better Auth config
│       ├── db.ts                # Prisma client
│       └── validations/
│           └── admin.validation.ts
├── .env
├── package.json
├── tsconfig.json
└── Dockerfile
```

---

## Project Setup

### Creating Admin Backend

```bash
# From project root
cd streamit

# Create admin backend directory
mkdir admin-backend
cd admin-backend

# Initialize Bun project
bun init

# Install dependencies
bun add express
bun add -d @types/express
bun add prisma @prisma/client
bun add better-auth
bun add zod
bun add cors
bun add -d @types/cors

# Copy Prisma schema from main backend
cp ../backend/prisma/schema.prisma ./prisma/

# Update .env with database connection
echo "DATABASE_URL=postgresql://user:password@localhost:5432/streamit" > .env
echo "BETTER_AUTH_SECRET=your-secret-key" >> .env
echo "BETTER_AUTH_URL=http://localhost:4000" >> .env
echo "ADMIN_FRONTEND_URL=http://localhost:3001" >> .env
echo "PORT=4000" >> .env

# Generate Prisma client
bun run prisma generate

# Run migrations (creates admin fields)
bun run prisma migrate dev --name add_admin_fields
```

### Package.json Scripts

```json
{
  "name": "admin-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "start": "bun src/index.ts",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:push": "prisma db push"
  },
  "dependencies": {
    "express": "^5.0.0",
    "@prisma/client": "^6.0.0",
    "better-auth": "latest",
    "zod": "^3.23.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/cors": "^2.8.17",
    "prisma": "^6.0.0",
    "typescript": "^5.6.0"
  }
}
```

### Environment Variables

```bash
# filepath: admin-backend/.env

# Database (same as main backend)
DATABASE_URL=postgresql://user:password@localhost:5432/streamit

# Better Auth
BETTER_AUTH_SECRET=your-super-secret-key-here
BETTER_AUTH_URL=http://localhost:4000

# CORS
ADMIN_FRONTEND_URL=http://localhost:3001

# Server
PORT=4000

# AWS S3 (shared with main backend - optional)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
S3_BUCKET=streamit-uploads

# Resend (shared with main backend - optional)
RESEND_API_KEY=your-resend-key
```

### Basic Server Setup

```typescript
// filepath: admin-backend/src/index.ts

import express from "express";
import cors from "cors";

const app = express();

// CORS - allow admin frontend only
app.use(cors({
  origin: process.env.ADMIN_FRONTEND_URL || "http://localhost:3001",
  credentials: true,
}));

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    service: "admin-backend",
    timestamp: new Date().toISOString()
  });
});

// Routes will be added here
// app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Admin backend running on http://localhost:${PORT}`);
});

export default app;
```

### Prisma Client Setup

```typescript
// filepath: admin-backend/src/lib/db.ts

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

### Better Auth Setup

```typescript
// filepath: admin-backend/src/lib/auth.ts

import { betterAuth } from "better-auth";
import { prisma } from "./db";
import { prismaAdapter } from "better-auth/adapters/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [process.env.ADMIN_FRONTEND_URL || "http://localhost:3001"],
});

export type Session = typeof auth.$Infer.Session;
```

### Test Admin Backend

```bash
# Start admin backend
cd admin-backend
bun run dev

# Test health endpoint
curl http://localhost:4000/health

# Should return:
# {"status":"ok","service":"admin-backend","timestamp":"..."}
```

---

## Database Changes

### Phase 1: Minimal Changes (MVP) ✅

#### Update User Model

```prisma
// filepath: backend/prisma/schema.prisma

model User {
  id              String   @id @default(cuid())
  email           String   @unique
  emailVerified   Boolean  @default(false)
  name            String?
  image           String?
  
  // Existing role field (already present)
  role            String   @default("USER") // USER, CREATOR, ADMIN, SUPER_ADMIN
  
  // NEW: User suspension
  isSuspended     Boolean  @default(false)
  suspendedReason String?
  suspendedBy     String?
  suspendedAt     DateTime?
  
  // NEW: Admin notes
  adminNotes      String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Existing relations (no changes)
  accounts        Account[]
  sessions        Session[]
  creator         Creator?
  posts           Post[]
  comments        Comment[]
  followers       Follow[]  @relation("Followers")
  following       Follow[]  @relation("Following")
  payments        Payment[]
  giftsSent       GiftTransaction[] @relation("GiftSender")
  giftsReceived   GiftTransaction[] @relation("GiftReceiver")
  
  // NEW: Admin relations
  adminLogs       AdminLog[]
  suspensions     User[]    @relation("SuspendedBy")
  suspendedBy     User?     @relation("SuspendedBy", fields: [suspendedByRef], references: [id])
  suspendedByRef  String?
  
  @@index([email])
  @@index([role])
  @@index([isSuspended])
  @@map("users")
}
```

**Migration Command:**
```bash
cd admin-backend
bun run prisma migrate dev --name add_admin_user_fields
```

---

### Phase 2: Admin Activity Tracking

```prisma
// filepath: backend/prisma/schema.prisma

model AdminLog {
  id          String   @id @default(cuid())
  
  // Admin who performed action
  adminId     String
  admin       User     @relation(fields: [adminId], references: [id], onDelete: Cascade)
  
  // Action details
  action      String   // "USER_SUSPENDED", "CREATOR_APPROVED", "PAYMENT_REFUNDED"
  targetType  String   // "USER", "CREATOR", "PAYMENT", "GIFT", "POST", "STREAM"
  targetId    String   // ID of affected resource
  
  // Additional data
  details     Json?    // Flexible field for action-specific data
  ipAddress   String?
  userAgent   String?
  
  createdAt   DateTime @default(now())
  
  @@index([adminId])
  @@index([action])
  @@index([targetType, targetId])
  @@index([createdAt(sort: Desc)])
  @@map("admin_logs")
}
```

**Migration Command:**
```bash
bun run prisma migrate dev --name add_admin_logs
```

---

### Phase 3: Content Moderation System

```prisma
// filepath: backend/prisma/schema.prisma

model Report {
  id            String   @id @default(cuid())
  
  // Reporter
  reporterId    String
  reporter      User     @relation("UserReports", fields: [reporterId], references: [id], onDelete: Cascade)
  
  // Target
  targetType    String   // "USER", "STREAM", "POST", "COMMENT"
  targetId      String
  
  // Report details
  reason        String   // "SPAM", "HARASSMENT", "INAPPROPRIATE", "COPYRIGHT", "OTHER"
  description   String?
  category      String?
  
  // Moderation
  status        String   @default("PENDING") // PENDING, REVIEWED, RESOLVED, DISMISSED
  priority      String   @default("MEDIUM")  // LOW, MEDIUM, HIGH, URGENT
  
  reviewedBy    String?
  reviewer      User?    @relation("ReviewedReports", fields: [reviewedBy], references: [id])
  reviewedAt    DateTime?
  resolution    String?
  resolutionNote String?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([status])
  @@index([priority])
  @@index([targetType, targetId])
  @@index([reporterId])
  @@index([createdAt(sort: Desc)])
  @@map("reports")
}

model User {
  // ...existing fields...
  
  // Add to User model
  reportsCreated  Report[] @relation("UserReports")
  reportsReviewed Report[] @relation("ReviewedReports")
}
```

**Migration Command:**
```bash
bun run prisma migrate dev --name add_reporting_system
```

---

### Phase 4: System Configuration

```prisma
// filepath: backend/prisma/schema.prisma

model SystemConfig {
  id          String   @id @default(cuid())
  
  // Configuration key
  key         String   @unique
  
  // Configuration value (JSON for flexibility)
  value       Json
  
  // Metadata
  description String?
  category    String?  // "FEATURE_FLAGS", "LIMITS", "PAYMENTS", "EMAIL"
  isPublic    Boolean  @default(false) // Can non-admins read this?
  
  // Audit trail
  updatedBy   String
  updater     User     @relation(fields: [updatedBy], references: [id])
  updatedAt   DateTime @updatedAt
  createdAt   DateTime @default(now())
  
  @@index([key])
  @@index([category])
  @@map("system_configs")
}

model User {
  // ...existing fields...
  
  // Add to User model
  configsUpdated SystemConfig[]
}
```

**Migration Command:**
```bash
bun run prisma migrate dev --name add_system_config
```

---

## Authentication & Authorization

### Admin Role System

**Role Hierarchy:**
```typescript
enum UserRole {
  USER = "USER",              // Regular viewer
  CREATOR = "CREATOR",        // Content creator
  ADMIN = "ADMIN",            // Full admin access
  SUPER_ADMIN = "SUPER_ADMIN" // Platform owner (cannot be suspended)
}
```

### Admin Middleware

```typescript
// filepath: admin-backend/src/middleware/admin.middleware.ts

import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth";
import { prisma } from "../lib/db";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        name: string | null;
      };
    }
  }
}

/**
 * Require authenticated admin user
 */
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (!session?.user) {
      return res.status(401).json({ 
        error: "Not authenticated",
        message: "Please log in to access admin panel"
      });
    }

    // Fetch full user from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true, 
        email: true, 
        role: true, 
        name: true,
        isSuspended: true 
      },
    });

    if (!user) {
      return res.status(401).json({ 
        error: "User not found" 
      });
    }

    // Check if user is suspended
    if (user.isSuspended) {
      return res.status(403).json({ 
        error: "Account suspended",
        message: "Your account has been suspended"
      });
    }

    // Check if user is admin
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ 
        error: "Admin access required",
        message: "You do not have permission to access this resource"
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    return res.status(500).json({ 
      error: "Internal server error" 
    });
  }
};

/**
 * Require super admin (platform owner only)
 */
export const requireSuperAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // First check if they're an admin
    await requireAdmin(req, res, () => {});
    
    // Check if they're super admin
    if (req.user?.role !== "SUPER_ADMIN") {
      return res.status(403).json({ 
        error: "Super admin access required",
        message: "This action requires super admin privileges"
      });
    }
    
    next();
  } catch (error) {
    console.error("Super admin auth error:", error);
    return res.status(500).json({ 
      error: "Internal server error" 
    });
  }
};

/**
 * Log admin action to audit trail
 */
export const logAdminAction = async (
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: any,
  req?: Request
) => {
  try {
    await prisma.adminLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId,
        details: details || {},
        ipAddress: req?.ip || req?.headers?.["x-forwarded-for"] as string,
        userAgent: req?.headers?.["user-agent"] as string,
      },
    });
  } catch (error) {
    console.error("Failed to log admin action:", error);
    // Don't throw - logging failure shouldn't break the request
  }
};
```

---

## API Routes

### Admin Route Structure

```typescript
// filepath: admin-backend/src/routes/admin.route.ts

import { Router } from "express";
import { requireAdmin, requireSuperAdmin } from "../middleware/admin.middleware";
import * as adminController from "../controllers/admin.controller";

const router = Router();

// Apply admin middleware to ALL routes
router.use(requireAdmin);

// ===================================
// DASHBOARD & ANALYTICS
// ===================================

router.get("/dashboard/stats", adminController.getDashboardStats);
router.get("/analytics/users", adminController.getUserAnalytics);
router.get("/analytics/revenue", adminController.getRevenueAnalytics);
router.get("/analytics/streams", adminController.getStreamAnalytics);

// ===================================
// USER MANAGEMENT
// ===================================

router.get("/users", adminController.getAllUsers);
router.get("/users/:id", adminController.getUserDetails);
router.patch("/users/:id/suspend", adminController.suspendUser);
router.patch("/users/:id/unsuspend", adminController.unsuspendUser);
router.patch("/users/:id/role", requireSuperAdmin, adminController.updateUserRole);
router.delete("/users/:id", requireSuperAdmin, adminController.deleteUser);
router.patch("/users/:id/notes", adminController.updateAdminNotes);

// ===================================
// CREATOR MANAGEMENT
// ===================================

router.get("/creators", adminController.getAllCreators);
router.get("/creators/applications", adminController.getCreatorApplications);
router.get("/creators/applications/:id", adminController.getApplicationDetails);
router.patch("/creators/applications/:id/approve", adminController.approveCreatorApplication);
router.patch("/creators/applications/:id/reject", adminController.rejectCreatorApplication);
router.patch("/creators/:id/suspend", adminController.suspendCreator);
router.get("/creators/:id/analytics", adminController.getCreatorAnalytics);

// ===================================
// PAYMENT MANAGEMENT
// ===================================

router.get("/payments", adminController.getAllPayments);
router.get("/payments/:id", adminController.getPaymentDetails);
router.post("/payments/:id/refund", adminController.refundPayment);
router.get("/payments/revenue/summary", adminController.getRevenueSummary);

// ===================================
// GIFT MANAGEMENT
// ===================================

router.get("/gifts", adminController.getAllGifts);
router.post("/gifts", adminController.createGift);
router.patch("/gifts/:id", adminController.updateGift);
router.delete("/gifts/:id", adminController.deleteGift);
router.get("/gifts/transactions", adminController.getGiftTransactions);

// ===================================
// COIN PACKAGE MANAGEMENT
// ===================================

router.get("/coin-packages", adminController.getAllCoinPackages);
router.post("/coin-packages", adminController.createCoinPackage);
router.patch("/coin-packages/:id", adminController.updateCoinPackage);
router.delete("/coin-packages/:id", adminController.deleteCoinPackage);

// ===================================
// DISCOUNT CODE MANAGEMENT
// ===================================

router.get("/discount-codes", adminController.getAllDiscountCodes);
router.post("/discount-codes", adminController.createDiscountCode);
router.patch("/discount-codes/:id", adminController.updateDiscountCode);
router.delete("/discount-codes/:id", adminController.deleteDiscountCode);
router.get("/discount-codes/:id/usage", adminController.getDiscountCodeUsage);

// ===================================
// CONTENT MODERATION
// ===================================

router.get("/content/posts", adminController.getAllPosts);
router.delete("/content/posts/:id", adminController.deletePost);
router.get("/content/streams", adminController.getAllStreams);
router.patch("/content/streams/:id/terminate", adminController.terminateStream);
router.get("/content/comments", adminController.getAllComments);
router.delete("/content/comments/:id", adminController.deleteComment);

// ===================================
// REPORTS & MODERATION
// ===================================

router.get("/reports", adminController.getAllReports);
router.get("/reports/:id", adminController.getReportDetails);
router.patch("/reports/:id/review", adminController.reviewReport);
router.patch("/reports/:id/resolve", adminController.resolveReport);
router.patch("/reports/:id/dismiss", adminController.dismissReport);

// ===================================
// SYSTEM CONFIGURATION
// ===================================

router.get("/config", adminController.getAllConfigs);
router.get("/config/:key", adminController.getConfig);
router.put("/config/:key", requireSuperAdmin, adminController.updateConfig);
router.delete("/config/:key", requireSuperAdmin, adminController.deleteConfig);

// ===================================
// ADMIN LOGS
// ===================================

router.get("/logs", adminController.getAdminLogs);
router.get("/logs/:adminId", adminController.getAdminLogsByUser);

export default router;
```

### Register Admin Routes

```typescript
// filepath: admin-backend/src/index.ts

import express from "express";
import cors from "cors";
import adminRoutes from "./routes/admin.route";

const app = express();

// CORS - allow admin frontend
app.use(cors({
  origin: process.env.ADMIN_FRONTEND_URL || "http://localhost:3001",
  credentials: true,
}));

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "admin-backend" });
});

// Admin routes (no /api/admin prefix since this whole backend is for admin)
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Admin backend running on port ${PORT}`);
});

export default app;
```

---

## Controllers

### Admin Controller Implementation

```typescript
// filepath: admin-backend/src/controllers/admin.controller.ts

import { Request, Response } from "express";
import * as adminService from "../services/admin.service";
import { logAdminAction } from "../middleware/admin.middleware";

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
};

/**
 * Get all users with pagination and filters
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { 
      page = "1", 
      limit = "20", 
      search, 
      role, 
      suspended 
    } = req.query;

    const result = await adminService.getAllUsers({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      search: search as string,
      role: role as string,
      suspended: suspended === "true",
    });

    res.json(result);
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

/**
 * Get user details
 */
export const getUserDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await adminService.getUserDetails(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get user details error:", error);
    res.status(500).json({ error: "Failed to fetch user details" });
  }
};

/**
 * Suspend user
 */
export const suspendUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: "Suspension reason is required" });
    }

    const user = await adminService.suspendUser(id, {
      reason,
      suspendedBy: req.user!.id,
    });

    // Log admin action
    await logAdminAction(
      req.user!.id,
      "USER_SUSPENDED",
      "USER",
      id,
      { reason },
      req
    );

    res.json({ message: "User suspended successfully", user });
  } catch (error) {
    console.error("Suspend user error:", error);
    res.status(500).json({ error: "Failed to suspend user" });
  }
};

/**
 * Unsuspend user
 */
export const unsuspendUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await adminService.unsuspendUser(id);

    // Log admin action
    await logAdminAction(
      req.user!.id,
      "USER_UNSUSPENDED",
      "USER",
      id,
      {},
      req
    );

    res.json({ message: "User unsuspended successfully", user });
  } catch (error) {
    console.error("Unsuspend user error:", error);
    res.status(500).json({ error: "Failed to unsuspend user" });
  }
};

/**
 * Get creator applications (pending approval)
 */
export const getCreatorApplications = async (req: Request, res: Response) => {
  try {
    const { status = "PENDING" } = req.query;

    const applications = await adminService.getCreatorApplications(
      status as string
    );

    res.json(applications);
  } catch (error) {
    console.error("Get creator applications error:", error);
    res.status(500).json({ error: "Failed to fetch creator applications" });
  }
};

/**
 * Approve creator application
 */
export const approveCreatorApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const application = await adminService.approveCreatorApplication(id);

    // Log admin action
    await logAdminAction(
      req.user!.id,
      "CREATOR_APPROVED",
      "CREATOR_APPLICATION",
      id,
      {},
      req
    );

    res.json({ 
      message: "Creator application approved successfully", 
      application 
    });
  } catch (error) {
    console.error("Approve creator error:", error);
    res.status(500).json({ error: "Failed to approve creator application" });
  }
};

/**
 * Reject creator application
 */
export const rejectCreatorApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const application = await adminService.rejectCreatorApplication(id, reason);

    // Log admin action
    await logAdminAction(
      req.user!.id,
      "CREATOR_REJECTED",
      "CREATOR_APPLICATION",
      id,
      { reason },
      req
    );

    res.json({ 
      message: "Creator application rejected successfully", 
      application 
    });
  } catch (error) {
    console.error("Reject creator error:", error);
    res.status(500).json({ error: "Failed to reject creator application" });
  }
};

/**
 * Get all payments
 */
export const getAllPayments = async (req: Request, res: Response) => {
  try {
    const { 
      page = "1", 
      limit = "20", 
      status, 
      startDate, 
      endDate 
    } = req.query;

    const result = await adminService.getAllPayments({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.json(result);
  } catch (error) {
    console.error("Get all payments error:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};

/**
 * Refund payment
 */
export const refundPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const payment = await adminService.refundPayment(id, reason);

    // Log admin action
    await logAdminAction(
      req.user!.id,
      "PAYMENT_REFUNDED",
      "PAYMENT",
      id,
      { reason },
      req
    );

    res.json({ message: "Payment refunded successfully", payment });
  } catch (error) {
    console.error("Refund payment error:", error);
    res.status(500).json({ error: "Failed to refund payment" });
  }
};

/**
 * Create gift
 */
export const createGift = async (req: Request, res: Response) => {
  try {
    const giftData = req.body;

    const gift = await adminService.createGift(giftData);

    // Log admin action
    await logAdminAction(
      req.user!.id,
      "GIFT_CREATED",
      "GIFT",
      gift.id,
      giftData,
      req
    );

    res.status(201).json({ message: "Gift created successfully", gift });
  } catch (error) {
    console.error("Create gift error:", error);
    res.status(500).json({ error: "Failed to create gift" });
  }
};

/**
 * Update gift
 */
export const updateGift = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const gift = await adminService.updateGift(id, updates);

    // Log admin action
    await logAdminAction(
      req.user!.id,
      "GIFT_UPDATED",
      "GIFT",
      id,
      updates,
      req
    );

    res.json({ message: "Gift updated successfully", gift });
  } catch (error) {
    console.error("Update gift error:", error);
    res.status(500).json({ error: "Failed to update gift" });
  }
};

/**
 * Delete post
 */
export const deletePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await adminService.deletePost(id);

    // Log admin action
    await logAdminAction(
      req.user!.id,
      "POST_DELETED",
      "POST",
      id,
      { reason },
      req
    );

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ error: "Failed to delete post" });
  }
};

/**
 * Get admin logs
 */
export const getAdminLogs = async (req: Request, res: Response) => {
  try {
    const { 
      page = "1", 
      limit = "50", 
      action, 
      targetType 
    } = req.query;

    const result = await adminService.getAdminLogs({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      action: action as string,
      targetType: targetType as string,
    });

    res.json(result);
  } catch (error) {
    console.error("Get admin logs error:", error);
    res.status(500).json({ error: "Failed to fetch admin logs" });
  }
};
```

---

## Services

### Admin Service Implementation

```typescript
// filepath: admin-backend/src/services/admin.service.ts

import { prisma } from "../lib/db";

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async () => {
  const [
    totalUsers,
    totalCreators,
    activeStreams,
    totalRevenue,
    pendingApplications,
    pendingReports,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.creator.count(),
    prisma.stream.count({ where: { isLive: true } }),
    prisma.payment.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.creatorApplication.count({ where: { status: "PENDING" } }),
    prisma.report.count({ where: { status: "PENDING" } }),
  ]);

  // Get user growth (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const newUsers = await prisma.user.count({
    where: { createdAt: { gte: thirtyDaysAgo } },
  });

  return {
    totalUsers,
    totalCreators,
    activeStreams,
    totalRevenue: totalRevenue._sum.amount || 0,
    pendingApplications,
    pendingReports,
    newUsersLast30Days: newUsers,
  };
};

/**
 * Get all users with pagination and filters
 */
export const getAllUsers = async (params: {
  page: number;
  limit: number;
  search?: string;
  role?: string;
  suspended?: boolean;
}) => {
  const { page, limit, search, role, suspended } = params;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (suspended !== undefined) {
    where.isSuspended = suspended;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        isSuspended: true,
        suspendedReason: true,
        createdAt: true,
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get user details
 */
export const getUserDetails = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      creator: true,
      payments: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      posts: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      _count: {
        select: {
          followers: true,
          following: true,
          posts: true,
          payments: true,
        },
      },
    },
  });

  return user;
};

/**
 * Suspend user
 */
export const suspendUser = async (
  userId: string,
  data: { reason: string; suspendedBy: string }
) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      isSuspended: true,
      suspendedReason: data.reason,
      suspendedBy: data.suspendedBy,
      suspendedAt: new Date(),
    },
  });

  return user;
};

/**
 * Unsuspend user
 */
export const unsuspendUser = async (userId: string) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      isSuspended: false,
      suspendedReason: null,
      suspendedBy: null,
      suspendedAt: null,
    },
  });

  return user;
};

/**
 * Get creator applications
 */
export const getCreatorApplications = async (status: string) => {
  const applications = await prisma.creatorApplication.findMany({
    where: { status },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return applications;
};

/**
 * Approve creator application
 */
export const approveCreatorApplication = async (applicationId: string) => {
  // Get application
  const application = await prisma.creatorApplication.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    throw new Error("Application not found");
  }

  // Update application status
  const updatedApplication = await prisma.creatorApplication.update({
    where: { id: applicationId },
    data: { status: "APPROVED" },
  });

  // Create creator profile
  await prisma.creator.create({
    data: {
      userId: application.userId,
      username: application.username,
      displayName: application.displayName,
      bio: application.bio || "",
    },
  });

  // Update user role
  await prisma.user.update({
    where: { id: application.userId },
    data: { role: "CREATOR" },
  });

  return updatedApplication;
};

/**
 * Reject creator application
 */
export const rejectCreatorApplication = async (
  applicationId: string,
  reason?: string
) => {
  const application = await prisma.creatorApplication.update({
    where: { id: applicationId },
    data: { 
      status: "REJECTED",
      adminNotes: reason,
    },
  });

  return application;
};

/**
 * Get all payments
 */
export const getAllPayments = async (params: {
  page: number;
  limit: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const { page, limit, status, startDate, endDate } = params;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    payments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Refund payment (placeholder - integrate with Dodo Payments)
 */
export const refundPayment = async (paymentId: string, reason: string) => {
  // TODO: Integrate with Dodo Payments refund API

  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: "REFUNDED",
      // Add refund details
    },
  });

  return payment;
};

/**
 * Create gift
 */
export const createGift = async (data: any) => {
  const gift = await prisma.gift.create({
    data: {
      name: data.name,
      imageUrl: data.imageUrl,
      coinCost: data.coinCost,
      isActive: data.isActive ?? true,
    },
  });

  return gift;
};

/**
 * Update gift
 */
export const updateGift = async (giftId: string, data: any) => {
  const gift = await prisma.gift.update({
    where: { id: giftId },
    data,
  });

  return gift;
};

/**
 * Delete post
 */
export const deletePost = async (postId: string) => {
  await prisma.post.delete({
    where: { id: postId },
  });
};

/**
 * Get admin logs
 */
export const getAdminLogs = async (params: {
  page: number;
  limit: number;
  action?: string;
  targetType?: string;
}) => {
  const { page, limit, action, targetType } = params;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (action) {
    where.action = action;
  }

  if (targetType) {
    where.targetType = targetType;
  }

  const [logs, total] = await Promise.all([
    prisma.adminLog.findMany({
      where,
      skip,
      take: limit,
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.adminLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
```

---

## Security

### Security Best Practices

1. **Role-Based Access Control**
   ```typescript
   // Always check role in middleware
   if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
     return res.status(403).json({ error: "Forbidden" });
   }
   ```

2. **Audit Logging**
   ```typescript
   // Log all admin actions
   await logAdminAction(adminId, "USER_SUSPENDED", "USER", userId, data);
   ```

3. **Input Validation**
   ```typescript
   import { z } from "zod";
   
   const suspendUserSchema = z.object({
     reason: z.string().min(10).max(500),
   });
   ```

4. **Rate Limiting**
   ```typescript
   import rateLimit from "express-rate-limit";
   
   const adminLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // limit each IP to 100 requests per windowMs
   });
   
   router.use("/api/admin", adminLimiter);
   ```

5. **IP Whitelisting** (Optional)
   ```typescript
   const allowedIPs = process.env.ADMIN_ALLOWED_IPS?.split(",") || [];
   
   export const checkIP = (req: Request, res: Response, next: NextFunction) => {
     const clientIP = req.ip;
     if (allowedIPs.length && !allowedIPs.includes(clientIP)) {
       return res.status(403).json({ error: "IP not allowed" });
     }
     next();
   };
   ```

---

## Testing

### Example Test Cases

```typescript
// filepath: backend/src/__tests__/admin.test.ts

import { describe, it, expect, beforeAll } from "bun:test";
import request from "supertest";
import app from "../index";

describe("Admin API", () => {
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    // Setup: Create admin and regular user, get tokens
    // ...
  });

  describe("GET /api/admin/dashboard/stats", () => {
    it("should return dashboard stats for admin", async () => {
      const res = await request(app)
        .get("/api/admin/dashboard/stats")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("totalUsers");
      expect(res.body).toHaveProperty("totalCreators");
    });

    it("should reject non-admin users", async () => {
      const res = await request(app)
        .get("/api/admin/dashboard/stats")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("PATCH /api/admin/users/:id/suspend", () => {
    it("should suspend user", async () => {
      const res = await request(app)
        .patch("/api/admin/users/test-user-id/suspend")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reason: "Violating terms of service" });

      expect(res.status).toBe(200);
      expect(res.body.user.isSuspended).toBe(true);
    });
  });
});
```

---

## Environment Variables

Add these to your `.env`:

```bash
# Admin Configuration
ADMIN_ALLOWED_IPS=127.0.0.1,::1  # Optional: comma-separated IPs
ADMIN_RATE_LIMIT=100              # Requests per 15 minutes
```

---

## Next Steps

1. ✅ **Database Migration** - Run Prisma migrations
2. ✅ **Make Yourself Admin** - Update your user role to ADMIN
3. ⏭️ **Build Admin Frontend** - See [FRONTEND.md](./FRONTEND.md)
4. ⏭️ **Follow Implementation Phases** - See [PHASES.md](./PHASES.md)

---

**Backend setup complete!** Ready to build the admin frontend. 🚀
