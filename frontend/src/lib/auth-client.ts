import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  
  // Fetch options for cross-domain requests
  fetchOptions: {
    credentials: "include", // Send cookies with cross-origin requests
  },
  
  plugins: [
    emailOTPClient(),
  ],
});

// Export specific methods for convenience
export const {
  signUp,
  signIn,
  signOut,
  useSession,
} = authClient;
