import {
  LayoutDashboard,
  Users,
  Video,
  Flag,
  MessageSquareWarning,
  DollarSign,
  Megaphone,
  BarChart3,
  Shield,
  Settings,
} from 'lucide-react';
import type { NavItem } from './permissions';

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    allowedRoles: ['super_admin', 'moderator', 'finance_admin', 'support_admin', 'compliance_officer'],
  },
  {
    label: 'User Management',
    href: '/users',
    icon: Users,
    allowedRoles: ['super_admin', 'support_admin', 'compliance_officer'],
  },
  {
    label: 'Streamers',
    href: '/streamers',
    icon: Video,
    allowedRoles: ['super_admin', 'moderator', 'support_admin'],
    children: [
      {
        label: 'Applications',
        href: '/streamers/applications',
        icon: Video,
        allowedRoles: ['super_admin', 'moderator', 'support_admin'],
      },
      {
        label: 'Live Monitor',
        href: '/streamers/live',
        icon: Video,
        allowedRoles: ['super_admin', 'moderator'],
      },
    ],
  },
  {
    label: 'Moderation',
    href: '/moderation',
    icon: Flag,
    allowedRoles: ['super_admin', 'moderator'],
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: MessageSquareWarning,
    allowedRoles: ['super_admin', 'moderator', 'support_admin', 'compliance_officer'],
  },
  {
    label: 'Monetization',
    href: '/monetization',
    icon: DollarSign,
    allowedRoles: ['super_admin', 'finance_admin', 'compliance_officer'],
    children: [
      {
        label: 'Coin Ledger',
        href: '/monetization/ledger',
        icon: DollarSign,
        allowedRoles: ['super_admin', 'finance_admin', 'compliance_officer'],
      },
      {
        label: 'Withdrawals',
        href: '/monetization/withdrawals',
        icon: DollarSign,
        allowedRoles: ['super_admin', 'finance_admin', 'compliance_officer'],
      },
      {
        label: 'Gifts',
        href: '/monetization/gifts',
        icon: DollarSign,
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
    icon: Shield,
    allowedRoles: ['super_admin', 'compliance_officer'],
    children: [
      {
        label: 'Compliance Tools',
        href: '/compliance',
        icon: Shield,
        allowedRoles: ['super_admin', 'compliance_officer'],
      },
      {
        label: 'Audit Log',
        href: '/compliance/audit',
        icon: Shield,
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
        label: 'Platform Settings',
        href: '/settings',
        icon: Settings,
        allowedRoles: ['super_admin'],
      },
      {
        label: 'Admin Roles',
        href: '/settings/roles',
        icon: Settings,
        allowedRoles: ['super_admin'],
      },
    ],
  },
];
