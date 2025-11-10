import type { Request, Response } from 'express';
import { auth } from '../lib/auth';
import { prisma } from '../lib/db';
import { parseBetterAuthError, ErrorCode, ErrorMessages } from '../types/errors';

export class AuthController {
  // POST /api/auth/send-verification-otp
  async sendVerificationOTP(req: Request, res: Response) {
    try {
      const { email, type } = req.body;
      
      const result = await auth.api.sendVerificationOTP({
        body: { email, type },
      });
      
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('❌ Send verification OTP error:', error);
      const errorResponse = parseBetterAuthError(error);
      return res.status(error.status || 500).json(errorResponse);
    }
  }

  // POST /api/auth/check-verification-otp
  async checkVerificationOTP(req: Request, res: Response) {
    try {
      const { email, type, otp } = req.body;
      
      const result = await auth.api.checkVerificationOTP({
        body: { email, type, otp },
      });
      
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('❌ Check verification OTP error:', error);
      const errorResponse = parseBetterAuthError(error);
      const status = errorResponse.code === ErrorCode.TOO_MANY_ATTEMPTS ? 429 : (error.status || 400);
      return res.status(status).json(errorResponse);
    }
  }

  // POST /api/auth/signin/email-otp
  async signInEmailOTP(req: Request, res: Response) {
    try {
      const { email, otp } = req.body;
      
      const result = await auth.api.signInEmailOTP({
        body: { email, otp },
      });
      
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('❌ Sign in with OTP error:', error);
      const errorResponse = parseBetterAuthError(error);
      return res.status(error.status || 401).json(errorResponse);
    }
  }

  // POST /api/auth/verify-email
  async verifyEmail(req: Request, res: Response) {
    try {
      const { email, otp } = req.body;
      
      const result = await auth.api.verifyEmailOTP({
        body: { email, otp },
      });
      
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('❌ Verify email error:', error);
      const errorResponse = parseBetterAuthError(error);
      return res.status(error.status || 400).json(errorResponse);
    }
  }

  // POST /api/auth/forget-password/email-otp
  async forgetPasswordEmailOTP(req: Request, res: Response) {
    try {
      const { email } = req.body;
      
      const result = await auth.api.forgetPasswordEmailOTP({
        body: { email },
      });
      
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('❌ Forgot password error:', error);
      const errorResponse = parseBetterAuthError(error);
      return res.status(error.status || 400).json(errorResponse);
    }
  }

  // POST /api/auth/reset-password/email-otp
  async resetPasswordEmailOTP(req: Request, res: Response) {
    try {
      const { email, otp, password } = req.body;
      
      const result = await auth.api.resetPasswordEmailOTP({
        body: { email, otp, password },
      });
      
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('❌ Reset password error:', error);
      const errorResponse = parseBetterAuthError(error);
      return res.status(error.status || 400).json(errorResponse);
    }
  }

  // POST /api/auth/signup/email
  async signUpEmail(req: Request, res: Response) {
    try {
      const { name, age, email, phone, username, password } = req.body;
      
      const result = await auth.api.signUpEmail({
        body: { 
          name, 
          email, 
          password,
          age,
          phone,
          username,
        },
      });
      
      // Auto-create coin wallet for new user
      if (result.user) {
        try {
          await prisma.coinWallet.create({
            data: { userId: result.user.id },
          });
          console.log(`✅ Coin wallet created for user ${result.user.id}`);
        } catch (walletError) {
          console.error('❌ Failed to create coin wallet:', walletError);
          // Don't fail signup if wallet creation fails
        }
      }
      
      // After successful signup, send verification OTP
      if (result.user && !result.user.emailVerified) {
        try {
          await auth.api.sendVerificationOTP({
            body: { 
              email, 
              type: 'email-verification' 
            },
          });
          console.log(`✅ Verification OTP sent to ${email} after signup`);
        } catch (otpError) {
          console.error('❌ Failed to send verification OTP:', otpError);
          // Don't fail signup if OTP fails, user can request it manually
        }
      }
      
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      const errorResponse = parseBetterAuthError(error);
      return res.status(error.status || 400).json(errorResponse);
    }
  }

  // POST /api/auth/signin/email
  async signInEmail(req: Request, res: Response) {
    try {
      const { username, password, email } = req.body;
      const result = await auth.api.signInEmail({
        body: { 
          email: email || username,
          password 
        },
      });
      
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      const errorResponse = parseBetterAuthError(error);
      return res.status(error.status || 401).json(errorResponse);
    }
  }
}
