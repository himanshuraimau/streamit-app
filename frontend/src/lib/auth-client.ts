import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  
  // Fetch options for cross-domain requests and Bearer token handling
  fetchOptions: {
    credentials: "include", // Send cookies with cross-origin requests (fallback)
    
    // Customize headers to include Bearer token
    customFetchImpl: async (url, init) => {
      const token = localStorage.getItem("better_auth_token");
      
      const headers = new Headers(init?.headers);
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      
      try {
        const response = await fetch(url, {
          ...init,
          headers,
        });
        
        // Store token from response header
        const authToken = response.headers.get("set-auth-token");
        if (authToken) {
          localStorage.setItem("better_auth_token", authToken);
          console.log("✅ Bearer token stored successfully");
        }
        
        // Clear token on 401
        if (response.status === 401) {
          localStorage.removeItem("better_auth_token");
          console.log("🔒 Token cleared due to 401 error");
        }
        
        return response;
      } catch (error) {
        console.error("❌ Auth fetch error:", error);
        throw error; // Re-throw to ensure error propagates
      }
    },
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

// Helper function to manually clear auth
export const clearAuth = () => {
  localStorage.removeItem("better_auth_token");
  console.log("🔒 Auth cleared manually");
};

// Helper function to check if user has valid token
export const hasAuthToken = (): boolean => {
  return !!localStorage.getItem("better_auth_token");
};
