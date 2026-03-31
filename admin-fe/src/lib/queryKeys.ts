// Query key factory for TanStack Query
export const queryKeys = {
  // User management
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.users.lists(), params] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },

  // Streamer management
  streamers: {
    all: ['streamers'] as const,
    applications: (params: Record<string, unknown>) =>
      [...queryKeys.streamers.all, 'applications', params] as const,
    application: (id: string) => [...queryKeys.streamers.all, 'application', id] as const,
    live: () => [...queryKeys.streamers.all, 'live'] as const,
  },

  // Content moderation
  moderation: {
    all: ['moderation'] as const,
    queue: (params: Record<string, unknown>) => [...queryKeys.moderation.all, 'queue', params] as const,
    content: (id: string) => [...queryKeys.moderation.all, 'content', id] as const,
    shorts: (params: Record<string, unknown>) => [...queryKeys.moderation.all, 'shorts', params] as const,
    posts: (params: Record<string, unknown>) => [...queryKeys.moderation.all, 'posts', params] as const,
  },

  // Reports
  reports: {
    all: ['reports'] as const,
    lists: () => [...queryKeys.reports.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.reports.lists(), params] as const,
    details: () => [...queryKeys.reports.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.reports.details(), id] as const,
    auditLog: (params: Record<string, unknown>) => [...queryKeys.reports.all, 'audit-log', params] as const,
  },

  // Monetization
  monetization: {
    all: ['monetization'] as const,
    ledger: (params: Record<string, unknown>) => [...queryKeys.monetization.all, 'ledger', params] as const,
    withdrawals: (params: Record<string, unknown>) =>
      [...queryKeys.monetization.all, 'withdrawals', params] as const,
    gifts: (params: Record<string, unknown>) => [...queryKeys.monetization.all, 'gifts', params] as const,
    wallet: (userId: string) => [...queryKeys.monetization.all, 'wallet', userId] as const,
  },

  // Advertisements
  ads: {
    all: ['ads'] as const,
    lists: () => [...queryKeys.ads.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.ads.lists(), params] as const,
    details: () => [...queryKeys.ads.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.ads.details(), id] as const,
    performance: (id: string) => [...queryKeys.ads.all, 'performance', id] as const,
  },

  // Analytics
  analytics: {
    all: ['analytics'] as const,
    overview: (dateRange: string) => [...queryKeys.analytics.all, 'overview', dateRange] as const,
    streamers: (dateRange: string) => [...queryKeys.analytics.all, 'streamers', dateRange] as const,
    content: (dateRange: string) => [...queryKeys.analytics.all, 'content', dateRange] as const,
    conversion: (dateRange: string) => [...queryKeys.analytics.all, 'conversion', dateRange] as const,
  },

  // Compliance
  compliance: {
    all: ['compliance'] as const,
    auditLog: (params: Record<string, unknown>) =>
      [...queryKeys.compliance.all, 'audit-log', params] as const,
    takedowns: () => [...queryKeys.compliance.all, 'takedowns'] as const,
  },

  // Settings
  settings: {
    all: ['settings'] as const,
    general: () => [...queryKeys.settings.all, 'general'] as const,
    admins: () => [...queryKeys.settings.all, 'admins'] as const,
  },
};
