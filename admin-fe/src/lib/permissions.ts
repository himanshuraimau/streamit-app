import type { AdminRole } from '@/types/admin.types';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  Radio,
  ShieldAlert,
  Flag,
  Wallet,
  Megaphone,
  BarChart3,
  Scale,
  Settings,
  List,
  FileCheck,
  Activity,
  Inbox,
  Film,
  FileText,
  Coins,
  ArrowDownToLine,
  Gift,
  FileWarning,
  ClipboardList,
  SlidersHorizontal,
  UserCog,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  allowedRoles: AdminRole[];
  children?: NavItem[];
  badge?: string;
}

// Permission matrix mapping routes to allowed roles
export const ROUTE_PERMISSIONS: Record<string, AdminRole[]> = {
  // Dashboard
  '/dashboard': ['super_admin', 'moderator', 'finance_admin', 'support_admin', 'compliance_officer'],

  // User Management
  '/users': ['super_admin', 'support_admin', 'compliance_officer'],
  '/users/:id': ['super_admin', 'support_admin', 'compliance_officer'],

  // Streamer Management
  '/streamers/applications': ['super_admin', 'moderator', 'support_admin'],
  '/streamers/live': ['super_admin', 'moderator'],

  // Content Moderation
  '/moderation': ['super_admin', 'moderator'],
  '/moderation/shorts': ['super_admin', 'moderator'],
  '/moderation/posts': ['super_admin', 'moderator'],

  // Reports
  '/reports': ['super_admin', 'moderator', 'support_admin', 'compliance_officer'],
  '/reports/:id': ['super_admin', 'moderator', 'support_admin', 'compliance_officer'],

  // Monetization
  '/monetization/ledger': ['super_admin', 'finance_admin', 'compliance_officer'],
  '/monetization/withdrawals': ['super_admin', 'finance_admin', 'compliance_officer'],
  '/monetization/gifts': ['super_admin', 'finance_admin', 'compliance_officer'],

  // Advertisements
  '/ads': ['super_admin', 'finance_admin'],
  '/ads/create': ['super_admin', 'finance_admin'],
  '/ads/:id/edit': ['super_admin', 'finance_admin'],

  // Analytics
  '/analytics': ['super_admin', 'moderator', 'finance_admin', 'compliance_officer'],

  // Compliance
  '/compliance': ['super_admin', 'compliance_officer'],
  '/compliance/audit-log': ['super_admin', 'compliance_officer'],

  // Settings
  '/settings': ['super_admin'],
  '/settings/admins': ['super_admin'],
};

// Helper function to check if user has permission for a route
export function hasPermission(userRole: AdminRole | undefined, route: string): boolean {
  if (!userRole) return false;

  // Check exact match first
  const allowedRoles = ROUTE_PERMISSIONS[route];
  if (allowedRoles) {
    return allowedRoles.includes(userRole);
  }

  // Check pattern match for dynamic routes (e.g., /users/:id)
  const routePattern = Object.keys(ROUTE_PERMISSIONS).find((pattern) => {
    const regex = new RegExp(`^${pattern.replace(/:[^/]+/g, '[^/]+')}$`);
    return regex.test(route);
  });

  if (routePattern) {
    return ROUTE_PERMISSIONS[routePattern].includes(userRole);
  }

  return false;
}

// Navigation items with permission matrix
export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    allowedRoles: ['super_admin', 'moderator', 'finance_admin', 'support_admin', 'compliance_officer'],
  },
  {
    label: 'Users',
    href: '/users',
    icon: Users,
    allowedRoles: ['super_admin', 'support_admin', 'compliance_officer'],
  },
  {
    label: 'Streamers',
    href: '/streamers',
    icon: Radio,
    allowedRoles: ['super_admin', 'moderator', 'support_admin'],
    children: [
      {
        label: 'All Streamers',
        href: '/streamers',
        icon: List,
        allowedRoles: ['super_admin', 'moderator', 'support_admin'],
      },
      {
        label: 'Applications',
        href: '/streamers/applications',
        icon: FileCheck,
        allowedRoles: ['super_admin', 'moderator', 'support_admin'],
      },
      {
        label: 'Live Monitor',
        href: '/streamers/live',
        icon: Activity,
        allowedRoles: ['super_admin', 'moderator'],
      },
    ],
  },
  {
    label: 'Moderation',
    href: '/moderation',
    icon: ShieldAlert,
    allowedRoles: ['super_admin', 'moderator'],
    children: [
      {
        label: 'Queue',
        href: '/moderation',
        icon: Inbox,
        allowedRoles: ['super_admin', 'moderator'],
      },
      {
        label: 'Shorts',
        href: '/moderation/shorts',
        icon: Film,
        allowedRoles: ['super_admin', 'moderator'],
      },
      {
        label: 'Posts',
        href: '/moderation/posts',
        icon: FileText,
        allowedRoles: ['super_admin', 'moderator'],
      },
    ],
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: Flag,
    allowedRoles: ['super_admin', 'moderator', 'support_admin', 'compliance_officer'],
  },
  {
    label: 'Monetization',
    href: '/monetization/ledger',
    icon: Wallet,
    allowedRoles: ['super_admin', 'finance_admin', 'compliance_officer'],
    children: [
      {
        label: 'Coin Ledger',
        href: '/monetization/ledger',
        icon: Coins,
        allowedRoles: ['super_admin', 'finance_admin', 'compliance_officer'],
      },
      {
        label: 'Withdrawals',
        href: '/monetization/withdrawals',
        icon: ArrowDownToLine,
        allowedRoles: ['super_admin', 'finance_admin'],
      },
      {
        label: 'Gift Transactions',
        href: '/monetization/gifts',
        icon: Gift,
        allowedRoles: ['super_admin', 'finance_admin', 'compliance_officer'],
      },
    ],
  },
  {
    label: 'Advertisements',
    href: '/ads',
    icon: Megaphone,
    allowedRoles: ['super_admin', 'finance_admin'],
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    allowedRoles: ['super_admin', 'moderator', 'finance_admin', 'compliance_officer'],
  },
  {
    label: 'Compliance',
    href: '/compliance',
    icon: Scale,
    allowedRoles: ['super_admin', 'compliance_officer'],
    children: [
      {
        label: 'Overview',
        href: '/compliance',
        icon: FileWarning,
        allowedRoles: ['super_admin', 'compliance_officer'],
      },
      {
        label: 'Audit Log',
        href: '/compliance/audit',
        icon: ClipboardList,
        allowedRoles: ['super_admin', 'compliance_officer'],
      },
    ],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    allowedRoles: ['super_admin'],
    children: [
      {
        label: 'Platform',
        href: '/settings',
        icon: SlidersHorizontal,
        allowedRoles: ['super_admin'],
      },
      {
        label: 'Admin Roles',
        href: '/settings/roles',
        icon: UserCog,
        allowedRoles: ['super_admin'],
      },
    ],
  },
];
