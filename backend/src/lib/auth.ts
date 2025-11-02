import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { prisma } from "./db";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
  },

  // Base path for auth routes (default is /api/auth)
  basePath: "/api/auth",
  
  // Base URL of the auth server
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  
  // Secret for encryption
  secret: process.env.BETTER_AUTH_SECRET,

  trustedOrigins: [
    process.env.FRONTEND_URL || "http://localhost:5173",
  ],

  // Advanced session configuration for cross-domain
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  // Advanced cookie configuration for cross-domain
  advanced: {
    cookiePrefix: "better-auth",
    crossSubDomainCookies: {
      enabled: false, // Set to false since you have different domains
    },
    // Use secure cookies in production
    useSecureCookies: process.env.NODE_ENV === "production",
    
    // CRITICAL: Cookie attributes for cross-domain setup
    defaultCookieAttributes: {
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production", // Required with SameSite=none
      httpOnly: true,
      ...(process.env.NODE_ENV === "production" ? { partitioned: true } : {}),
    },
  },

  user: {
    additionalFields: {
      age: {
        type: "number",
        required: false,
      },
      phone: {
        type: "string",
        required: false,
      },
      username: {
        type: "string",
        required: true,
        unique: true,
      },
    },
  },





  plugins: [
    emailOTP({
      overrideDefaultEmailVerification: true,
      sendVerificationOnSignUp: true, // triggers OTP after signup
      async sendVerificationOTP({ email, otp, type }) {
        await resend.emails.send({
          from: "YourApp <onboarding@resend.dev>", // verified sender domain
          to: email,
          subject:
            type === "email-verification"
              ? "Verify your email"
              : type === "sign-in"
                ? "Sign in to YourApp"
                : "Reset your password",
          html: `<p>Your verification code is: <b>${otp}</b></p>`,
        });
      },
      otpLength: 6,
      expiresIn: 600, // 10 minutes
      allowedAttempts: 3,
    }),
  ],
});
