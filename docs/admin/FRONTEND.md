# Admin Panel - Frontend Documentation

Complete frontend implementation guide for the StreamIt admin panel.

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Tech Stack](#tech-stack)
4. [Setup & Installation](#setup--installation)
5. [UI Components](#ui-components)
6. [Pages & Routes](#pages--routes)
7. [State Management](#state-management)
8. [API Integration](#api-integration)
9. [Authentication](#authentication)
10. [Deployment](#deployment)

---

## Overview

### Architecture Decision

**Completely Separate Admin System:**
- ✅ Separate React app in `admin-panel/` directory
- ✅ Separate backend in `admin-backend/` directory (Express.js on port 4000)
- ✅ Same design system (TailwindCSS, similar components)
- ✅ Same tech stack as main frontend (React + Vite + TypeScript)
- ✅ Connects to **admin backend** API (`http://localhost:4000/api/admin/*`)
- ✅ Connects to **shared database** (PostgreSQL)
- ✅ Separate authentication system (Better Auth in admin backend)
- ✅ Deployed on separate subdomains:
  - Frontend: `admin.streamit.com`
  - Backend: `admin-api.streamit.com`

### Why React + Vite for Admin?

**Same tech stack as main frontend:**
- ✅ Consistent development experience
- ✅ Reuse components and patterns from main frontend
- ✅ Same build tools and configurations
- ✅ Faster development with familiar stack
- ✅ Simpler deployment (static files + Nginx)

---

## Project Structure

```
admin-panel/
├── src/
│   ├── pages/                  # React pages
│   │   ├── auth/
│   │   │   └── LoginPage.tsx   # Admin login page
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx # Dashboard home (analytics)
│   │   ├── users/
│   │   │   ├── UsersPage.tsx   # User list
│   │   │   └── UserDetailPage.tsx # User details
│   │   ├── creators/
│   │   │   ├── CreatorsPage.tsx # Creator list
│   │   │   └── ApplicationsPage.tsx # Creator applications
│   │   ├── payments/
│   │   │   ├── PaymentsPage.tsx # Payment list
│   │   │   └── PaymentDetailPage.tsx # Payment details
│   │   ├── gifts/
│   │   │   └── GiftsPage.tsx   # Gift management
│   │   ├── discounts/
│   │   │   └── DiscountsPage.tsx # Discount codes
│   │   ├── content/
│   │   │   ├── PostsPage.tsx
│   │   │   ├── StreamsPage.tsx
│   │   │   └── CommentsPage.tsx
│   │   ├── reports/
│   │   │   └── ReportsPage.tsx # Moderation reports
│   │   ├── settings/
│   │   │   └── SettingsPage.tsx # System settings
│   │   └── logs/
│   │       └── LogsPage.tsx    # Admin activity logs
│   ├── components/
│   │   ├── ui/                 # Shadcn UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── select.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx     # Admin sidebar
│   │   │   ├── Header.tsx      # Top bar
│   │   │   ├── DashboardLayout.tsx # Main layout
│   │   │   └── Breadcrumbs.tsx # Navigation breadcrumbs
│   │   ├── dashboard/
│   │   │   ├── StatCard.tsx    # Dashboard stat card
│   │   │   └── Chart.tsx       # Analytics chart
│   │   ├── tables/
│   │   │   ├── UsersTable.tsx
│   │   │   ├── PaymentsTable.tsx
│   │   │   └── DataTable.tsx   # Generic data table
│   │   └── forms/
│   │       ├── gift-form.tsx
│   │       ├── discount-form.tsx
│   │       └── suspend-user-form.tsx
│   ├── lib/
│   │   ├── api.ts              # API client
│   │   ├── auth.ts             # Better Auth config
│   │   └── utils.ts            # Utilities
│   ├── hooks/
│   │   ├── use-admin.ts        # Admin auth hook
│   │   ├── use-users.ts        # User management hook
│   │   └── use-stats.ts        # Dashboard stats hook
│   ├── types/
│   │   └── index.ts            # TypeScript types
│   └── styles/
│       └── globals.css         # Global styles
├── public/
│   └── assets/
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Tech Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.x | React framework with App Router |
| **React** | 19.x | UI library |
| **TypeScript** | 5.6+ | Type safety |
| **TailwindCSS** | 4.0 | Styling (same config as main app) |
| **Shadcn/ui** | Latest | UI components |
| **TanStack Table** | 8.x | Data tables |
| **React Hook Form** | 7.x | Form handling |
| **Zod** | 3.x | Validation |
| **Better Auth** | Latest | Authentication (same as main) |
| **Recharts** | 2.x | Charts for analytics |
| **date-fns** | 3.x | Date formatting |
| **Lucide React** | Latest | Icons |

### Design System

**Reuse the same design tokens from main frontend:**
- Colors: Same OKLCH colors, brand gradients
- Typography: Inter font
- Spacing: Same TailwindCSS scale
- Border radius: Same `--radius` values

---

## Setup & Installation

### 1. Create Admin Panel Project

```bash
# From project root
cd streamit

# Create Next.js app with TypeScript and TailwindCSS
npx create-next-app@latest admin-panel --typescript --tailwind --app --no-src-dir --import-alias "@/*"

cd admin-panel
```

### 2. Install Dependencies

```bash
# UI Components (Shadcn)
npx shadcn@latest init

# Select options:
# - Style: New York
# - Base color: Neutral
# - CSS variables: Yes

# Install Shadcn components
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add table
npx shadcn@latest add dialog
npx shadcn@latest add select
npx shadcn@latest add dropdown-menu
npx shadcn@latest add badge
npx shadcn@latest add card
npx shadcn@latest add tabs
npx shadcn@latest add form
npx shadcn@latest add toast
npx shadcn@latest add avatar
npx shadcn@latest add separator
npx shadcn@latest add alert
npx shadcn@latest add skeleton

# Additional dependencies
bun add @tanstack/react-table
bun add recharts
bun add date-fns
bun add react-hook-form
bun add zod
bun add @hookform/resolvers
bun add axios
bun add better-auth
bun add lucide-react
```

### 3. Environment Variables

```bash
# filepath: admin-panel/.env

# Admin Backend API (port 4000, NOT main backend)
VITE_API_URL=http://localhost:4000
VITE_BETTER_AUTH_URL=http://localhost:4000/api/auth

# App URL (admin frontend runs on port 3001)
VITE_APP_URL=http://localhost:3001
```

### 4. Configure Vite

```typescript
// filepath: admin-panel/vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001, // Different from main frontend (5173)
  },
});
```

### 5. Configure TailwindCSS

```typescript
// filepath: admin-panel/tailwind.config.ts

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "oklch(0.04 0 0)",
        foreground: "oklch(0.98 0 0)",
        card: {
          DEFAULT: "oklch(0.10 0 0)",
          foreground: "oklch(0.98 0 0)",
        },
        popover: {
          DEFAULT: "oklch(0.10 0 0)",
          foreground: "oklch(0.98 0 0)",
        },
        primary: {
          DEFAULT: "oklch(0.54 0.28 328)",
          foreground: "oklch(0.98 0 0)",
        },
        secondary: {
          DEFAULT: "oklch(0.62 0.20 214)",
          foreground: "oklch(0.98 0 0)",
        },
        muted: {
          DEFAULT: "oklch(0.15 0 0)",
          foreground: "oklch(0.64 0 0)",
        },
        accent: {
          DEFAULT: "oklch(0.56 0.28 270)",
          foreground: "oklch(0.98 0 0)",
        },
        destructive: {
          DEFAULT: "oklch(0.60 0.25 27)",
          foreground: "oklch(0.98 0 0)",
        },
        border: "oklch(0.20 0 0)",
        input: "oklch(0.20 0 0)",
        ring: "oklch(0.56 0.28 270)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

### 5. Global Styles

```css
/* filepath: admin-panel/src/app/globals.css */

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --radius: 0.625rem; /* 10px */
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-family: 'Inter', system-ui, sans-serif;
  }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: oklch(0.10 0 0);
}

::-webkit-scrollbar-thumb {
  background: oklch(0.25 0 0);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: oklch(0.30 0 0);
}
```

---

## UI Components

### Generic Data Table

```typescript
// filepath: admin-panel/src/components/tables/data-table.tsx

"use client";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()} pages
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### Stat Card

```typescript
// filepath: admin-panel/src/components/dashboard/stat-card.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <p
            className={`text-xs ${
              trend.isPositive ? "text-green-500" : "text-red-500"
            }`}
          >
            {trend.isPositive ? "+" : ""}
            {trend.value}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

### Sidebar

```typescript
// filepath: admin-panel/src/components/layout/sidebar.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Video,
  DollarSign,
  Gift,
  Ticket,
  FileText,
  Flag,
  Settings,
  ScrollText,
} from "lucide-react";

const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
  },
  {
    title: "Creators",
    href: "/creators",
    icon: Video,
  },
  {
    title: "Payments",
    href: "/payments",
    icon: DollarSign,
  },
  {
    title: "Gifts",
    href: "/gifts",
    icon: Gift,
  },
  {
    title: "Discounts",
    href: "/discounts",
    icon: Ticket,
  },
  {
    title: "Content",
    href: "/content",
    icon: FileText,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: Flag,
  },
  {
    title: "Activity Logs",
    href: "/logs",
    icon: ScrollText,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600" />
          <span className="text-xl font-bold">StreamIt Admin</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
```

---

## Pages & Routes

### Dashboard Home (Analytics)

```typescript
// filepath: admin-panel/src/app/(dashboard)/page.tsx

import { StatCard } from "@/components/dashboard/stat-card";
import { Users, Video, DollarSign, TrendingUp } from "lucide-react";

async function getDashboardStats() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/dashboard/stats`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch stats");
  }

  return res.json();
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the StreamIt admin panel
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          description={`+${stats.newUsersLast30Days} this month`}
          icon={Users}
        />
        <StatCard
          title="Total Creators"
          value={stats.totalCreators.toLocaleString()}
          icon={Video}
        />
        <StatCard
          title="Active Streams"
          value={stats.activeStreams.toLocaleString()}
          icon={TrendingUp}
        />
        <StatCard
          title="Total Revenue"
          value={`$${(stats.totalRevenue / 100).toLocaleString()}`}
          icon={DollarSign}
        />
      </div>

      {/* Charts and Recent Activity would go here */}
    </div>
  );
}
```

### User List Page

```typescript
// filepath: admin-panel/src/app/(dashboard)/users/page.tsx

"use client";

import { useState } from "react";
import { DataTable } from "@/components/tables/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isSuspended: boolean;
  createdAt: string;
};

const columns: ColumnDef<User>[] = [
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      return (
        <Badge variant={role === "ADMIN" ? "default" : "secondary"}>
          {role}
        </Badge>
      );
    },
  },
  {
    accessorKey: "isSuspended",
    header: "Status",
    cell: ({ row }) => {
      const isSuspended = row.getValue("isSuspended") as boolean;
      return (
        <Badge variant={isSuspended ? "destructive" : "outline"}>
          {isSuspended ? "Suspended" : "Active"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return date.toLocaleDateString();
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>
              {user.isSuspended ? "Unsuspend" : "Suspend"}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              Delete user
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch users on mount
  // useEffect(() => { ... }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">
            Manage all platform users
          </p>
        </div>
      </div>

      <DataTable columns={columns} data={users} />
    </div>
  );
}
```

### Creator Applications Page

```typescript
// filepath: admin-panel/src/app/(dashboard)/creators/applications/page.tsx

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";

type Application = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  status: string;
  createdAt: string;
  user: {
    email: string;
    name: string;
  };
};

export default function CreatorApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);

  const handleApprove = async (id: string) => {
    // API call to approve
  };

  const handleReject = async (id: string) => {
    // API call to reject
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Creator Applications</h1>
        <p className="text-muted-foreground">
          Review and approve creator applications
        </p>
      </div>

      <div className="grid gap-4">
        {applications.map((app) => (
          <Card key={app.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{app.displayName}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    @{app.username}
                  </p>
                </div>
                <Badge>{app.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Bio</p>
                <p className="text-sm text-muted-foreground">{app.bio}</p>
              </div>

              <div>
                <p className="text-sm font-medium">Applicant</p>
                <p className="text-sm text-muted-foreground">
                  {app.user.name} ({app.user.email})
                </p>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => handleApprove(app.id)}
                  className="flex-1"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  onClick={() => handleReject(app.id)}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## State Management

### API Client

```typescript
// filepath: admin-panel/src/lib/api.ts

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // Send cookies for Better Auth
});

// Request interceptor
api.interceptors.request.use((config) => {
  // Better Auth handles cookies automatically
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Custom Hooks

```typescript
// filepath: admin-panel/src/hooks/use-users.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useUsers(params?: { search?: string; role?: string }) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/users", { params });
      return data;
    },
  });
}

export function useSuspendUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      reason,
    }: {
      userId: string;
      reason: string;
    }) => {
      const { data } = await api.patch(`/api/admin/users/${userId}/suspend`, {
        reason,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
```

---

## Authentication

### Admin Login Page

```typescript
// filepath: admin-panel/src/app/(auth)/login/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        setError("Invalid credentials");
        return;
      }

      // Check if user is admin
      const session = await authClient.getSession();

      if (session.data?.user.role !== "ADMIN" && 
          session.data?.user.role !== "SUPER_ADMIN") {
        await authClient.signOut();
        setError("Admin access required");
        return;
      }

      // Redirect to dashboard
      router.push("/");
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Admin Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Protected Layout

```typescript
// filepath: admin-panel/src/app/(dashboard)/layout.tsx

import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.Node;
}) {
  // Check authentication
  const session = await authClient.getSession();

  if (!session) {
    redirect("/login");
  }

  // Check admin role
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
```

---

## Deployment

### Production Build

```bash
# Build for production
bun run build

# Start production server
bun run start
```

### Docker Deployment

```dockerfile
# filepath: admin-panel/Dockerfile

FROM oven/bun:1 as builder

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM oven/bun:1-slim

WORKDIR /app

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3001

CMD ["bun", "server.js"]
```

### Environment Variables (Production)

```bash
# Production .env.local
NEXT_PUBLIC_API_URL=https://api.streamit.com
NEXT_PUBLIC_BETTER_AUTH_URL=https://api.streamit.com/api/auth
NEXT_PUBLIC_APP_URL=https://admin.streamit.com
```

---

## Next Steps

1. ✅ **Setup Project** - Create Next.js app with dependencies
2. ✅ **Build UI Components** - Create reusable components
3. ✅ **Create Pages** - Implement all admin pages
4. ⏭️ **Follow Implementation Phases** - See [PHASES.md](./PHASES.md)

---

**Frontend setup complete!** Ready to start implementation. 🚀
