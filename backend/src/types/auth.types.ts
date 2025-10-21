import type { z } from 'zod';
import type {
  SignUpSchema,
  SignInSchema,
  VerifyOTPSchema,
  SendVerificationOTPSchema,
  CheckVerificationOTPSchema,
  SignInEmailOTPSchema,
  ForgetPasswordEmailOTPSchema,
  ResetPasswordEmailOTPSchema,
} from '../lib/validations/auth.validation';

export type SignUpInput = z.infer<typeof SignUpSchema>;
export type SignInInput = z.infer<typeof SignInSchema>;
export type VerifyOTPInput = z.infer<typeof VerifyOTPSchema>;
export type SendVerificationOTPInput = z.infer<typeof SendVerificationOTPSchema>;
export type CheckVerificationOTPInput = z.infer<typeof CheckVerificationOTPSchema>;
export type SignInEmailOTPInput = z.infer<typeof SignInEmailOTPSchema>;
export type ForgetPasswordEmailOTPInput = z.infer<typeof ForgetPasswordEmailOTPSchema>;
export type ResetPasswordEmailOTPInput = z.infer<typeof ResetPasswordEmailOTPSchema>;

export type OTPType = 'sign-in' | 'email-verification' | 'forget-password';
