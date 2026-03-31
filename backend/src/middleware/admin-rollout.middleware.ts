import type { UserRole } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/db';

const ROLLOUT_CACHE_TTL_MS = 30_000;
const ROLLOUT_ADMIN_ROLES: UserRole[] = ['ADMIN', 'SUPER_ADMIN'];

const ROLLOUT_SETTING_KEYS = {
  enabled: 'admin.rollout.enabled',
  superAdminBypass: 'admin.rollout.superAdminBypass',
  allowedRoles: 'admin.rollout.allowedRoles',
  allowedCountries: 'admin.rollout.allowedCountries',
  blockedMessage: 'admin.rollout.blockedMessage',
} as const;

const DEFAULT_BLOCKED_MESSAGE =
  'Admin access is currently in staged rollout. Contact platform operations for access.';

export type AdminRolloutBlockedReason =
  | 'ROLE_NOT_IN_ROLLOUT'
  | 'COUNTRY_NOT_IN_ROLLOUT'
  | 'COUNTRY_UNRESOLVED';

export type AdminRolloutConfig = {
  enabled: boolean;
  superAdminBypass: boolean;
  allowedRoles: UserRole[];
  allowedCountries: string[];
  blockedMessage: string;
};

export type AdminRolloutEvaluation = {
  allowed: boolean;
  matchedBypass: boolean;
  reasons: AdminRolloutBlockedReason[];
};

declare global {
  namespace Express {
    interface Request {
      adminRolloutCountry?: string | null;
      adminRolloutEvaluation?: AdminRolloutEvaluation;
    }
  }
}

let rolloutConfigCache: {
  value: AdminRolloutConfig;
  expiresAt: number;
} | null = null;

function parseBooleanSetting(value: string | null | undefined, fallback: boolean): boolean {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return fallback;
}

function parseAdminRolesSetting(value: string | null | undefined): UserRole[] {
  if (!value) {
    return [];
  }

  const parsed = value
    .split(',')
    .map((role) => role.trim().toUpperCase())
    .filter((role): role is UserRole => ROLLOUT_ADMIN_ROLES.includes(role as UserRole));

  return [...new Set(parsed)];
}

function parseCountriesSetting(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  const parsed = value
    .split(',')
    .map((country) => country.trim().toUpperCase())
    .filter((country) => /^[A-Z]{2}$/.test(country));

  return [...new Set(parsed)];
}

function getHeaderValue(header: string | string[] | undefined): string | undefined {
  if (Array.isArray(header)) {
    return header[0];
  }

  return header;
}

export function extractAdminRequestCountry(req: Request): string | null {
  const candidates = [
    getHeaderValue(req.headers['x-admin-country']),
    getHeaderValue(req.headers['cf-ipcountry']),
    getHeaderValue(req.headers['x-vercel-ip-country']),
    getHeaderValue(req.headers['x-country-code']),
    getHeaderValue(req.headers['x-geo-country']),
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const normalized = candidate.trim().toUpperCase();
    if (/^[A-Z]{2}$/.test(normalized)) {
      return normalized;
    }
  }

  return null;
}

async function loadAdminRolloutConfig(): Promise<AdminRolloutConfig> {
  const settings = await prisma.systemSetting.findMany({
    where: {
      key: {
        in: [
          ROLLOUT_SETTING_KEYS.enabled,
          ROLLOUT_SETTING_KEYS.superAdminBypass,
          ROLLOUT_SETTING_KEYS.allowedRoles,
          ROLLOUT_SETTING_KEYS.allowedCountries,
          ROLLOUT_SETTING_KEYS.blockedMessage,
        ],
      },
    },
    select: {
      key: true,
      value: true,
    },
  });

  const byKey = new Map(settings.map((setting) => [setting.key, setting.value]));

  const blockedMessage = byKey.get(ROLLOUT_SETTING_KEYS.blockedMessage)?.trim();

  return {
    enabled: parseBooleanSetting(byKey.get(ROLLOUT_SETTING_KEYS.enabled), false),
    superAdminBypass: parseBooleanSetting(byKey.get(ROLLOUT_SETTING_KEYS.superAdminBypass), true),
    allowedRoles: parseAdminRolesSetting(byKey.get(ROLLOUT_SETTING_KEYS.allowedRoles)),
    allowedCountries: parseCountriesSetting(byKey.get(ROLLOUT_SETTING_KEYS.allowedCountries)),
    blockedMessage: blockedMessage || DEFAULT_BLOCKED_MESSAGE,
  };
}

export async function getAdminRolloutConfig(forceRefresh = false): Promise<AdminRolloutConfig> {
  const now = Date.now();

  if (!forceRefresh && rolloutConfigCache && rolloutConfigCache.expiresAt > now) {
    return rolloutConfigCache.value;
  }

  const config = await loadAdminRolloutConfig();
  rolloutConfigCache = {
    value: config,
    expiresAt: now + ROLLOUT_CACHE_TTL_MS,
  };

  return config;
}

export function invalidateAdminRolloutConfigCache() {
  rolloutConfigCache = null;
}

export function evaluateAdminRolloutAccess(
  config: AdminRolloutConfig,
  role: UserRole,
  country: string | null
): AdminRolloutEvaluation {
  if (!config.enabled) {
    return {
      allowed: true,
      matchedBypass: false,
      reasons: [],
    };
  }

  if (config.superAdminBypass && role === 'SUPER_ADMIN') {
    return {
      allowed: true,
      matchedBypass: true,
      reasons: [],
    };
  }

  const reasons: AdminRolloutBlockedReason[] = [];

  if (config.allowedRoles.length > 0 && !config.allowedRoles.includes(role)) {
    reasons.push('ROLE_NOT_IN_ROLLOUT');
  }

  if (config.allowedCountries.length > 0) {
    if (!country) {
      reasons.push('COUNTRY_UNRESOLVED');
    } else if (!config.allowedCountries.includes(country)) {
      reasons.push('COUNTRY_NOT_IN_ROLLOUT');
    }
  }

  return {
    allowed: reasons.length === 0,
    matchedBypass: false,
    reasons,
  };
}

export const requireAdminRolloutAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.adminRole) {
      return res.status(500).json({
        success: false,
        error: 'Admin role was not resolved for rollout validation',
      });
    }

    const config = await getAdminRolloutConfig();
    const country = extractAdminRequestCountry(req);
    const evaluation = evaluateAdminRolloutAccess(config, req.adminRole, country);

    req.adminRolloutCountry = country;
    req.adminRolloutEvaluation = evaluation;

    if (!evaluation.allowed) {
      return res.status(403).json({
        success: false,
        error: config.blockedMessage,
        rollout: {
          enabled: config.enabled,
          role: req.adminRole,
          country,
          reasons: evaluation.reasons,
          allowedRoles: config.allowedRoles,
          allowedCountries: config.allowedCountries,
        },
      });
    }

    next();
  } catch (error) {
    console.error('[AdminRolloutMiddleware] Error validating rollout access:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate admin rollout access',
    });
  }
};
