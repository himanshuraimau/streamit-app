// Better Auth types with custom fields
export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Additional fields from Better Auth config
  username: string;
  age?: number | null;
  phone?: string | null;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  user: User;
}

export interface AuthSession {
  user: User;
  session: Session;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  username: string;
  age?: number;
  phone?: string;
}

export type OTPType = 'email-verification' | 'sign-in' | 'forget-password';