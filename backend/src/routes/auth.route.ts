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

/**
 * @swagger
 * /api/auth/send-verification-otp:
 *   post:
 *     summary: Send a verification OTP via email
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, type]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               type:
 *                 type: string
 *                 enum: [email-verification, sign-in, forget-password]
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/send-verification-otp',
  validate(SendVerificationOTPSchema),
  AuthController.sendVerificationOTP
);

/**
 * @swagger
 * /api/auth/check-verification-otp:
 *   post:
 *     summary: Verify an OTP code
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp, type]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         description: Too many attempts
 */
router.post(
  '/check-verification-otp',
  validate(CheckVerificationOTPSchema),
  AuthController.checkVerificationOTP
);

/**
 * @swagger
 * /api/auth/signin/email-otp:
 *   post:
 *     summary: Sign in using email + OTP (passwordless)
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Signed in, session token returned
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/signin/email-otp', validate(SignInEmailOTPSchema), AuthController.signInEmailOTP);

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify email address with OTP
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified
 */
router.post('/verify-email', validate(VerifyOTPSchema), AuthController.verifyEmail);

/**
 * @swagger
 * /api/auth/forget-password/email-otp:
 *   post:
 *     summary: Request a password-reset OTP
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP sent
 */
router.post(
  '/forget-password/email-otp',
  validate(ForgetPasswordEmailOTPSchema),
  AuthController.forgetPasswordEmailOTP
);

/**
 * @swagger
 * /api/auth/reset-password/email-otp:
 *   post:
 *     summary: Reset password using email + OTP
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
router.post(
  '/reset-password/email-otp',
  validate(ResetPasswordEmailOTPSchema),
  AuthController.resetPasswordEmailOTP
);

/**
 * @swagger
 * /api/auth/signup/email:
 *   post:
 *     summary: Register a new user account
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               username:
 *                 type: string
 *               age:
 *                 type: integer
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account created, verification OTP sent
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/signup/email', validate(SignUpSchema), AuthController.signUpEmail);

/**
 * @swagger
 * /api/auth/signin/email:
 *   post:
 *     summary: Sign in with email and password
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               username:
 *                 type: string
 *                 description: Alias for email field
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Signed in, session token and cookie set
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/signin/email', validate(SignInSchema), AuthController.signInEmail);

export default router;
