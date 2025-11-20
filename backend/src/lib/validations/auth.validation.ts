import * as z from "zod";

export const SignUpSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  age: z.number().int().min(13, "You must be at least 13 years old").optional(),
  phone: z.string().min(1).optional().or(z.literal('')),
});

export const SignInSchema = z.object({
  username: z.string().min(1, "Username is required").optional(),
  email: z.email("Invalid email address").optional(),
  password: z.string().min(1, "Password is required"),
}).refine((data) => data.username || data.email, {
  message: "Either username or email is required",
});

export const VerifyOTPSchema = z.object({
  email: z.email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const SendVerificationOTPSchema = z.object({
  email: z.email("Invalid email address"),
  type: z.enum(["sign-in", "email-verification", "forget-password"]),
});

export const CheckVerificationOTPSchema = z.object({
  email: z.email("Invalid email address"),
  type: z.enum(["sign-in", "email-verification", "forget-password"]),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const SignInEmailOTPSchema = z.object({
  email: z.email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const ForgetPasswordEmailOTPSchema = z.object({
  email: z.email("Invalid email address"),
});

export const ResetPasswordEmailOTPSchema = z.object({
  email: z.email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
