import type { Request, Response } from 'express';
import { auth } from '../lib/auth';
import { prisma } from '../lib/db';
import { ErrorCode } from '../types/errors.types';
import { parseBetterAuthError, getHttpStatusCode } from '../lib/errors';

// better-auth plugins (emailOTP) add methods to auth.api that TypeScript's
// InferAPI type doesn't surface unless the full plugin return type is resolved.
// We use a helper to call them without false-positive TS errors.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function callAuthApi(method: string, ...args: any[]): Promise<unknown> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fn = (auth.api as Record<string, (...a: any[]) => Promise<unknown>>)[method];
  if (!fn) throw new Error(`auth.api.${method} not found`);
  return fn(...args);
}

export class AuthController {
  // POST /api/auth/send-verification-otp
  static async sendVerificationOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email, type } = req.body;
      const result = await callAuthApi('sendVerificationOTP', { body: { email, type } });
      res.status(200).json(result);
    } catch (error: unknown) {
      console.error('❌ Send verification OTP error:', error);
      const errorResponse = parseBetterAuthError(error);
      res.status(getHttpStatusCode(error, 500)).json(errorResponse);
    }
  }

  // POST /api/auth/check-verification-otp
  static async checkVerificationOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email, type, otp } = req.body;
      const result = await callAuthApi('checkVerificationOTP', { body: { email, type, otp } });
      res.status(200).json(result);
    } catch (error: unknown) {
      console.error('❌ Check verification OTP error:', error);
      const errorResponse = parseBetterAuthError(error);
      const status =
        errorResponse.code === ErrorCode.TOO_MANY_ATTEMPTS ? 429 : getHttpStatusCode(error, 400);
      res.status(status).json(errorResponse);
    }
  }

  // POST /api/auth/signin/email-otp
  static async signInEmailOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;
      const result = await callAuthApi('signInEmailOTP', { body: { email, otp } });
      res.status(200).json(result);
    } catch (error: unknown) {
      console.error('❌ Sign in with OTP error:', error);
      const errorResponse = parseBetterAuthError(error);
      res.status(getHttpStatusCode(error, 401)).json(errorResponse);
    }
  }

  // POST /api/auth/verify-email
  static async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;
      const result = await callAuthApi('verifyEmailOTP', { body: { email, otp } });
      res.status(200).json(result);
    } catch (error: unknown) {
      console.error('❌ Verify email error:', error);
      const errorResponse = parseBetterAuthError(error);
      res.status(getHttpStatusCode(error, 400)).json(errorResponse);
    }
  }

  // POST /api/auth/forget-password/email-otp
  static async forgetPasswordEmailOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      const result = await callAuthApi('forgetPasswordEmailOTP', { body: { email } });
      res.status(200).json(result);
    } catch (error: unknown) {
      console.error('❌ Forgot password error:', error);
      const errorResponse = parseBetterAuthError(error);
      res.status(getHttpStatusCode(error, 400)).json(errorResponse);
    }
  }

  // POST /api/auth/reset-password/email-otp
  static async resetPasswordEmailOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp, password } = req.body;
      const result = await callAuthApi('resetPasswordEmailOTP', { body: { email, otp, password } });
      res.status(200).json(result);
    } catch (error: unknown) {
      console.error('❌ Reset password error:', error);
      const errorResponse = parseBetterAuthError(error);
      res.status(getHttpStatusCode(error, 400)).json(errorResponse);
    }
  }

  // POST /api/auth/signup/email
  static async signUpEmail(req: Request, res: Response): Promise<void> {
    try {
      const { name, age, email, phone, username, password } = req.body;

      // additional fields (age, phone, username) defined in auth.ts user.additionalFields
      // are accepted at runtime but not in the narrow TS signature
      const result = await callAuthApi('signUpEmail', {
        body: { name, email, password, age, phone, username },
      });

      // Auto-create coin wallet for new user
      if (result && typeof result === 'object' && 'user' in result && result.user) {
        try {
          const userId = (result.user as { id: string }).id;
          await prisma.coinWallet.create({ data: { userId } });
          console.log(`✅ Coin wallet created for user ${userId}`);
        } catch (walletError) {
          console.error('❌ Failed to create coin wallet:', walletError);
          // Don't fail signup if wallet creation fails
        }
      }

      res.status(200).json(result);
    } catch (error: unknown) {
      console.error('❌ Sign up error:', error);
      const errorResponse = parseBetterAuthError(error);
      res.status(getHttpStatusCode(error, 400)).json(errorResponse);
    }
  }

  // POST /api/auth/signin/email
  static async signInEmail(req: Request, res: Response): Promise<void> {
    try {
      const { username, password, email } = req.body;
      const result = await callAuthApi('signInEmail', {
        body: { email: email || username, password },
      });
      res.status(200).json(result);
    } catch (error: unknown) {
      console.error('❌ Sign in error:', error);
      const errorResponse = parseBetterAuthError(error);
      res.status(getHttpStatusCode(error, 401)).json(errorResponse);
    }
  }
}
