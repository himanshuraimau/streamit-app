import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import {
  SignUpSchema,
  SignInSchema,
  VerifyOTPSchema,
  SendVerificationOTPSchema,
  CheckVerificationOTPSchema,
  SignInEmailOTPSchema,
  ForgetPasswordEmailOTPSchema,
  ResetPasswordEmailOTPSchema,
} from '../lib/validations/auth.validation';

const router = Router();
const authController = new AuthController();

// OTP verification routes
router.post(
  '/send-verification-otp',
  validate(SendVerificationOTPSchema),
  (req, res) => authController.sendVerificationOTP(req, res)
);

router.post(
  '/check-verification-otp',
  validate(CheckVerificationOTPSchema),
  (req, res) => authController.checkVerificationOTP(req, res)
);

// OTP sign-in flow
router.post(
  '/signin/email-otp',
  validate(SignInEmailOTPSchema),
  (req, res) => authController.signInEmailOTP(req, res)
);

// Email verification flow
router.post(
  '/verify-email',
  validate(VerifyOTPSchema),
  (req, res) => authController.verifyEmail(req, res)
);

// Password reset flow
router.post(
  '/forget-password/email-otp',
  validate(ForgetPasswordEmailOTPSchema),
  (req, res) => authController.forgetPasswordEmailOTP(req, res)
);

router.post(
  '/reset-password/email-otp',
  validate(ResetPasswordEmailOTPSchema),
  (req, res) => authController.resetPasswordEmailOTP(req, res)
);

// Classic email+password routes
router.post(
  '/signup/email',
  validate(SignUpSchema),
  (req, res) => authController.signUpEmail(req, res)
);

router.post(
  '/signin/email',
  validate(SignInSchema),
  (req, res) => authController.signInEmail(req, res)
);

export default router;
