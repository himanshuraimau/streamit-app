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

  trustedOrigins: [
    process.env.FRONTEND_URL || "http://localhost:5173",
  ],

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
