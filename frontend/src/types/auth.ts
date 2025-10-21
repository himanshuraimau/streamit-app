/**
 * Auth-related TypeScript types
 */

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  image?: string;
  age?: number;
  phone?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  user: User;
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

export interface SignUpData {
  name: string;
  username: string;
  email: string;
  password: string;
  phone?: string;
  age: number;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface OTPData {
  email: string;
  otp: string;
}

export interface ResetPasswordData {
  email: string;
  otp: string;
  password: string;
}

export type OTPType = 'sign-in' | 'email-verification' | 'forget-password';
