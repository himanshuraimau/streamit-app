import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  plugins: [
    emailOTPClient({
      // OTP verification page
      otpVerifyPath: "/auth/verify-email",
    }),
  ],
});

// Export specific methods for convenience
export const {
  signUp,
  signIn,
  signOut,
  useSession,
  // Email OTP methods
  sendVerificationOTP,
  verifyEmailOTP,
  forgetPasswordEmailOTP,
  resetPasswordEmailOTP,
} = authClient;
