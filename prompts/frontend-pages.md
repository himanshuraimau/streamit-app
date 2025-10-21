### Frontend Pages Documentation: "Coro" Media Streaming App

**Objective:**
Complete frontend page structure and implementation guide for the Coro streaming application, based on the backend authentication API endpoints and existing folder conventions.

---

## Folder Structure Convention

```
frontend/src/
├── types/                    # TypeScript type definitions
│   ├── auth.ts              # Auth-related types
│   └── index.ts             # Export all types
├── lib/                      # Core utilities
│   ├── auth-client.ts       # Better Auth client setup
│   └── query-client.ts      # TanStack Query setup
├── utils/
│   └── queries/
│       └── auth.ts          # Auth query hooks
├── pages/
│   ├── home/
│   │   ├── _components/     # Home page components
│   │   │   ├── navbar.tsx   # Main app navbar
│   │   │   └── stream-card.tsx # Stream preview card (future)
│   │   └── index.tsx        # Main landing page (/)
│   └── auth/
│       ├── _components/     # Shared auth components
│       │   ├── navbar.tsx   # Auth page navbar (existing)
│       │   └── otp-input.tsx # OTP input component
│       ├── index.tsx        # Auth layout/router
│       ├── login-options.tsx # Login method selection
│       ├── signup.tsx       # Email signup form
│       ├── signin.tsx       # Email signin form
│       ├── signin-otp.tsx   # OTP-based signin
│       ├── verify-email.tsx # Email verification
│       ├── forgot-password.tsx # Forgot password flow
│       └── reset-password.tsx # Reset password with OTP
└── components/
    ├── ui/                  # shadcn components
    └── shared/              # Shared components
```

---

## Required Pages & Implementation Details

### 1. Home/Landing Screen (Main Page)
**File:** `frontend/src/pages/home/index.tsx`  
**Route:** `/` (default landing page)  
**Purpose:** Main streaming platform page (like YouTube/Twitch homepage)

**Key Elements:**
- Navbar component (to be created in `pages/home/_components/navbar.tsx`)
  - Coro logo
  - Navigation links
  - Search bar (placeholder for now)
  - User profile/Sign In button (if not authenticated)
- Main content area:
  - Placeholder text: "Live Streams Coming Soon" or "Welcome to Coro"
  - Empty grid layout for future live stream windows
- Footer (optional)

**API Calls:** None (for now, will add live stream data fetching later)

**State Management:** 
- Auth state (check if user is logged in)
- Will add stream data state later

**Layout Structure:**
```
┌─────────────────────────────────────┐
│         Navbar (Logo, Nav, Auth)    │
├─────────────────────────────────────┤
│                                     │
│     [Placeholder Content Area]      │
│     "Live Streams Coming Soon"      │
│                                     │
│     [Future: Stream Grid Layout]    │
│                                     │
└─────────────────────────────────────┘
```

**Note:** This is the public landing page. Users can browse without auth, but need to sign in to interact/stream.

---

### 2. Login Options Screen
**File:** `frontend/src/pages/auth/login-options.tsx`  
**Route:** `/auth/login-options`  
**Purpose:** Present multiple authentication methods

**Key Elements:**
- Illustration at top (media/streaming themed)
- Page title: "Sign in to Coro"
- Two main authentication options:
  - "Sign in with Email & Password" button → navigates to `/auth/signin`
  - "Sign in with OTP" button → navigates to `/auth/signin-otp`
- Bottom link: "Don't have an account? Sign up" → navigates to `/auth/signup`
- Back link: "← Back to Home" → navigates to `/`

**API Calls:** None (navigation only)

**shadcn Components to Use:**
- `ui/button.tsx` (existing)
- `ui/card.tsx`

**Install Additional shadcn Components if Needed:**
```bash
bunx shadcn@latest add card
bunx shadcn@latest add form
bunx shadcn@latest add label
bunx shadcn@latest add toast
```

---

### 3. Sign Up Screen
**File:** `frontend/src/pages/auth/signup.tsx`  
**Route:** `/auth/signup`  
**Purpose:** New user registration with email/password

**Key Elements:**
- Page title: "Create Account"
- Input fields:
  - Name (required)
  - Username (required)
  - Email (required)
  - Phone (optional)
  - Age (required)
  - Password (required)
  - Confirm Password (client-side validation)
- "Sign Up" button
- Bottom link: "Already have an account? Sign in" → navigates to `/auth/signin`

**API Endpoint:** `POST /api/auth/signup/email`

**Request Body:**
```json
{
  "name": "string",
  "username": "string",
  "email": "string",
  "phone": "string (optional)",
  "age": "number",
  "password": "string"
}
```

**Better Auth Implementation:**
```typescript
import { useSignUp } from '@/utils/queries/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

const { signUp } = useSignUp();
const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async (data: SignUpData) => {
  setIsLoading(true);
  await signUp(data);
  setIsLoading(false);
};

<Button disabled={isLoading}>
  {isLoading ? 'Creating account...' : 'Sign Up'}
</Button>
```

**Success Flow:**
- On 200 response → Navigate to `/auth/verify-email` with email in state
- Show toast: "Account created! Please verify your email"

**Error Handling:**
- Handled by `useSignUp` hook
- Toast notification with error message

---

### 4. Sign In Screen (Email/Password)
**File:** `frontend/src/pages/auth/signin.tsx`  
**Route:** `/auth/signin`  
**Purpose:** Traditional email/password login

**Key Elements:**
- Page title: "Login"
- Optional: Social proof (friends listening/watching)
- Input fields:
  - Email or Username (required)
  - Password (required)
- "Forgot password?" link → navigates to `/auth/forgot-password`
- "LOGIN" button (neon gradient)
- Bottom link: "Don't have an account? Sign up" → navigates to `/auth/signup`
- Alternative: "Sign in with OTP instead" → navigates to `/auth/signin-otp`

**API Endpoint:** `POST /api/auth/signin/email`

**Request Body:**
```json
{
  "email": "string (or username)",
  "password": "string"
}
```

**Better Auth Implementation:**
```typescript
import { useSignIn } from '@/utils/queries/auth';
import { useState } from 'react';

const { signIn } = useSignIn();
const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async (email: string, password: string) => {
  setIsLoading(true);
  await signIn(email, password);
  setIsLoading(false);
};
```

**Success Flow:**
- On 200 response → Store auth token/session
- Navigate to `/` (home page)
- Toast: "Welcome back!"

**Error Handling:**
- Handled by `useSignIn` hook
- Toast notification with error message

---

### 5. Sign In with OTP Screen
**File:** `frontend/src/pages/auth/signin-otp.tsx`  
**Route:** `/auth/signin-otp`  
**Purpose:** Passwordless login using email OTP

**Key Elements:**
- Page title: "Sign in with OTP"
- Step 1: Email input
  - Email field
  - "Send OTP" button
- Step 2: OTP verification (shown after OTP sent)
  - 6-digit OTP input component
  - "Verify & Sign In" button
  - "Resend OTP" link (with cooldown timer)
- Back link: "Use password instead" → navigates to `/auth/signin`

**API Endpoints:**

**Step 1 - Send OTP:**  
`POST /api/auth/send-verification-otp`
```json
{
  "email": "string",
  "type": "sign-in"
}
```

**Step 2 - Verify OTP:**  
`POST /api/auth/signin/email-otp`
```json
{
  "email": "string",
  "otp": "string"
}
```

**Better Auth Implementation:**
```typescript
import { useSendOTP, useSignInOTP } from '@/utils/queries/auth';
import { useState } from 'react';

const { sendOTP } = useSendOTP();
const { signInWithOTP } = useSignInOTP();
const [isLoading, setIsLoading] = useState(false);

// Step 1 - Send OTP
const handleSendOTP = async () => {
  setIsLoading(true);
  await sendOTP(email, 'sign-in');
  setIsLoading(false);
};

// Step 2 - Verify OTP
const handleVerifyOTP = async () => {
  setIsLoading(true);
  await signInWithOTP(email, otp);
  setIsLoading(false);
};
```

**Success Flow:**
- After OTP sent → Show OTP input step
- After OTP verified → Store auth token, navigate to `/`

**Error Handling:**
- 429: "Too many attempts, please try again later"
- Invalid OTP: "Invalid or expired OTP"
- Handled via toast notifications

**shadcn Components to Use:**
- `ui/input.tsx` (existing)
- `ui/button.tsx` (existing)
- Create: `_components/otp-input.tsx`

---

### 6. Email Verification Screen
**File:** `frontend/src/pages/auth/verify-email.tsx`  
**Route:** `/auth/verify-email`  
**Purpose:** Verify email after signup

**Key Elements:**
- Page title: "Verify Your Email"
- Subtitle: "We sent a code to [email]"
- Step 1: Request OTP button (if not auto-sent)
  - "Send Verification Code" button
- Step 2: OTP input
  - 6-digit OTP input
  - "Verify Email" button
  - "Resend Code" link
- Success message area

**API Endpoints:**

**Send Verification OTP:**  
`POST /api/auth/send-verification-otp`
```json
{
  "email": "string",
  "type": "email-verification"
}
```

**Verify Email:**  
`POST /api/auth/verify-email`
```json
{
  "email": "string",
  "otp": "string"
}
```

**Better Auth Implementation:**
```typescript
import { useSendOTP, useVerifyEmail } from '@/utils/queries/auth';
import { useState } from 'react';

const { sendOTP } = useSendOTP();
const { verifyEmail } = useVerifyEmail();
const [isLoading, setIsLoading] = useState(false);

// Send verification OTP
const handleSendOTP = async () => {
  await sendOTP(email, 'email-verification');
};

// Verify email
const handleVerifyEmail = async () => {
  setIsLoading(true);
  await verifyEmail(email, otp);
  setIsLoading(false);
};
```

**Success Flow:**
- After verification → Show success toast
- Auto-navigate to `/auth/signin` after 2 seconds
- Or provide "Continue to Login" button

**Error Handling:**
- Invalid OTP: "Invalid verification code"
- Expired OTP: "Code expired, please request a new one"
- Handled via toast notifications

---

### 7. Forgot Password Screen
**File:** `frontend/src/pages/auth/forgot-password.tsx`  
**Route:** `/auth/forgot-password`  
**Purpose:** Initiate password reset flow

**Key Elements:**
- Page title: "Forgot Password?"
- Subtitle: "Enter your email to receive a reset code"
- Email input field
- "Send Reset Code" button
- Back link: "Remember password? Sign in" → navigates to `/auth/signin`

**API Endpoint:** `POST /api/auth/forget-password/email-otp`

**Request Body:**
```json
{
  "email": "string"
}
```

**Better Auth Implementation:**
```typescript
import { useForgotPassword } from '@/utils/queries/auth';
import { useState } from 'react';

const { forgotPassword } = useForgotPassword();
const [isLoading, setIsLoading] = useState(false);

const handleForgotPassword = async () => {
  setIsLoading(true);
  await forgotPassword(email);
  setIsLoading(false);
};
```

**Success Flow:**
- On 200 response → Navigate to `/auth/reset-password` with email in state
- Show toast: "Reset code sent to your email"

**Error Handling:**
- 400: "Email not found" or display API error
- Handled via toast notifications

---

### 8. Reset Password Screen
**File:** `frontend/src/pages/auth/reset-password.tsx`  
**Route:** `/auth/reset-password`  
**Purpose:** Reset password using OTP

**Key Elements:**
- Page title: "Reset Password"
- Subtitle: "Enter the code sent to [email]"
- Input fields:
  - 6-digit OTP input
  - New Password (required)
  - Confirm Password (client-side validation)
- "Reset Password" button
- "Resend Code" link

**API Endpoint:** `POST /api/auth/reset-password/email-otp`

**Request Body:**
```json
{
  "email": "string",
  "otp": "string",
  "password": "string"
}
```

**Better Auth Implementation:**
```typescript
import { useResetPassword } from '@/utils/queries/auth';
import { useState } from 'react';

const { resetPassword } = useResetPassword();
const [isLoading, setIsLoading] = useState(false);

const handleResetPassword = async () => {
  setIsLoading(true);
  await resetPassword(email, otp, password);
  setIsLoading(false);
};
```

**Success Flow:**
- On 200 response → Show success toast
- Navigate to `/auth/signin` after 2 seconds
- Or provide "Continue to Login" button

**Error Handling:**
- 400: "Invalid or expired OTP"
- Handled via toast notifications

**shadcn Components to Use:**
- `ui/input.tsx` (existing)
- `ui/button.tsx` (existing)
- Create: `_components/otp-input.tsx`

---

## Shared Components to Create

### 1. OTP Input Component
**File:** `frontend/src/pages/auth/_components/otp-input.tsx`

**Purpose:** 6-digit OTP input with auto-focus

**Props:**
```typescript
interface OTPInputProps {
  length?: number; // default 6
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
}
```

**Features:**
- Auto-focus next input on digit entry
- Auto-focus previous on backspace
- Paste support (auto-fill all digits)
- Neon border on focus
- Error state styling

---

## Routing Structure

**Recommended Router Setup (React Router v6):**

```typescript
// In App.tsx or main router file
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from '@/pages/home';

<Routes>
  {/* Public routes */}
  <Route path="/" element={<Home />} />
  
  {/* Auth routes */}
  <Route path="/auth">
    <Route path="login-options" element={<LoginOptions />} />
    <Route path="signup" element={<SignUp />} />
    <Route path="signin" element={<SignIn />} />
    <Route path="signin-otp" element={<SignInOTP />} />
    <Route path="verify-email" element={<VerifyEmail />} />
    <Route path="forgot-password" element={<ForgotPassword />} />
    <Route path="reset-password" element={<ResetPassword />} />
  </Route>
  
  {/* Future protected routes */}
  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
  <Route path="/stream/:id" element={<StreamPage />} />
  
  {/* Fallback */}
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

---

## State Management Recommendations

**Auth Context/Store:**
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}
```

**Store in:**
- Context API + useReducer
- Zustand store
- Redux/Redux Toolkit

---

## Tech Stack Requirements

**Package Manager:** Bun  
**UI Components:** shadcn/ui (already configured)  
**Auth Library:** Better Auth (React client)  
**Data Fetching:** TanStack Query (React Query) - for non-auth API calls  
**Routing:** React Router v6  
**Styling:** Tailwind CSS (via shadcn)

**Install Required Packages:**
```bash
# Better Auth client
bun add better-auth

# TanStack Query (for other API calls)
bun add @tanstack/react-query
```

---

## Better Auth Client Setup

**Create Auth Client:**
```typescript
// frontend/src/lib/auth-client.ts
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
```

**TanStack Query Setup (for non-auth API calls):**
```typescript
// frontend/src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
```

**Wrap App with QueryClientProvider:**
```typescript
// frontend/src/main.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query-client';

<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

**Better Auth Wrapper Hooks:**
```typescript
// frontend/src/utils/queries/auth.ts
import { authClient } from '@/lib/auth-client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

/**
 * Sign Up Hook
 * Uses better-auth signUp.email method
 */
export const useSignUp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const signUp = async (data: {
    name: string;
    username: string;
    email: string;
    password: string;
    phone?: string;
    age: number;
  }) => {
    try {
      await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
        // Additional fields
        username: data.username,
        age: data.age,
        phone: data.phone,
      }, {
        onSuccess: () => {
          toast({
            title: 'Account created!',
            description: 'Please verify your email',
          });
          navigate('/auth/verify-email', { state: { email: data.email } });
        },
        onError: (ctx) => {
          toast({
            title: 'Sign up failed',
            description: ctx.error.message,
            variant: 'destructive',
          });
        },
      });
    } catch (error: any) {
      toast({
        title: 'Sign up failed',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    }
  };
  
  return { signUp };
};

/**
 * Sign In Hook
 * Uses better-auth signIn.email method
 */
export const useSignIn = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const signIn = async (email: string, password: string) => {
    try {
      await authClient.signIn.email({
        email,
        password,
      }, {
        onSuccess: () => {
          toast({ title: 'Welcome back!' });
          navigate('/');
        },
        onError: (ctx) => {
          toast({
            title: 'Sign in failed',
            description: ctx.error.message,
            variant: 'destructive',
          });
        },
      });
    } catch (error: any) {
      toast({
        title: 'Sign in failed',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    }
  };
  
  return { signIn };
};

/**
 * Send OTP Hook
 * Uses better-auth emailOTP plugin
 */
export const useSendOTP = () => {
  const { toast } = useToast();
  
  const sendOTP = async (email: string, type: 'sign-in' | 'email-verification' | 'forget-password') => {
    try {
      await authClient.sendVerificationOTP({
        email,
        type,
      }, {
        onSuccess: () => {
          toast({
            title: 'OTP sent!',
            description: 'Check your email for the verification code',
          });
        },
        onError: (ctx) => {
          toast({
            title: 'Failed to send OTP',
            description: ctx.error.message,
            variant: 'destructive',
          });
        },
      });
    } catch (error: any) {
      toast({
        title: 'Failed to send OTP',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    }
  };
  
  return { sendOTP };
};

/**
 * Verify Email OTP Hook
 */
export const useVerifyEmail = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const verifyEmail = async (email: string, otp: string) => {
    try {
      await authClient.verifyEmailOTP({
        email,
        otp,
      }, {
        onSuccess: () => {
          toast({
            title: 'Email verified!',
            description: 'You can now sign in',
          });
          setTimeout(() => navigate('/auth/signin'), 2000);
        },
        onError: (ctx) => {
          toast({
            title: 'Verification failed',
            description: ctx.error.message,
            variant: 'destructive',
          });
        },
      });
    } catch (error: any) {
      toast({
        title: 'Verification failed',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    }
  };
  
  return { verifyEmail };
};

/**
 * Sign In with OTP Hook
 */
export const useSignInOTP = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const signInWithOTP = async (email: string, otp: string) => {
    try {
      await authClient.signIn.emailOtp({
        email,
        otp,
      }, {
        onSuccess: () => {
          toast({ title: 'Signed in successfully!' });
          navigate('/');
        },
        onError: (ctx) => {
          toast({
            title: 'Sign in failed',
            description: ctx.error.message,
            variant: 'destructive',
          });
        },
      });
    } catch (error: any) {
      toast({
        title: 'Sign in failed',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    }
  };
  
  return { signInWithOTP };
};

/**
 * Forgot Password Hook
 */
export const useForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const forgotPassword = async (email: string) => {
    try {
      await authClient.forgetPasswordEmailOTP({
        email,
      }, {
        onSuccess: () => {
          toast({
            title: 'Reset code sent!',
            description: 'Check your email',
          });
          navigate('/auth/reset-password', { state: { email } });
        },
        onError: (ctx) => {
          toast({
            title: 'Failed to send reset code',
            description: ctx.error.message,
            variant: 'destructive',
          });
        },
      });
    } catch (error: any) {
      toast({
        title: 'Failed to send reset code',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    }
  };
  
  return { forgotPassword };
};

/**
 * Reset Password Hook
 */
export const useResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const resetPassword = async (email: string, otp: string, password: string) => {
    try {
      await authClient.resetPasswordEmailOTP({
        email,
        otp,
        password,
      }, {
        onSuccess: () => {
          toast({
            title: 'Password reset successful!',
            description: 'You can now sign in with your new password',
          });
          setTimeout(() => navigate('/auth/signin'), 2000);
        },
        onError: (ctx) => {
          toast({
            title: 'Reset failed',
            description: ctx.error.message,
            variant: 'destructive',
          });
        },
      });
    } catch (error: any) {
      toast({
        title: 'Reset failed',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    }
  };
  
  return { resetPassword };
};

/**
 * Sign Out Hook
 */
export const useSignOut = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const signOut = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            toast({ title: 'Signed out successfully' });
            navigate('/auth/signin');
          },
        },
      });
    } catch (error: any) {
      toast({
        title: 'Sign out failed',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    }
  };
  
  return { signOut };
};
```

---

## Design System Consistency

**Colors (from auth-page.md):**
- Background: Deep Black (#0A0A0A) / Dark Grey (#1A1A1A)
- Primary Accent: Pink-to-Purple gradient (#FF006E → #8338EC)
- Secondary Accent: Blue-to-Cyan gradient (#3A86FF → #06FFF0)
- Text: White (#FFFFFF) / Light Grey (#E0E0E0)
- Error: Red (#FF3B30)
- Success: Green (#34C759)

**Typography:**
- Font: Inter or Montserrat
- Headings: Bold, 24-32px
- Body: Regular, 14-16px
- Buttons: Semi-bold, 16px

**Components:**
- Use existing UI components from `components/ui/`
- Maintain dark mode aesthetic
- Add neon glow effects on interactive elements
- Consistent spacing and padding

---

## Error Handling Pattern

**Consistent error display across all pages:**
```typescript
interface ErrorState {
  message: string;
  code?: string;
}

// Display errors in a toast or inline error component
// Use ui/dialog.tsx for critical errors
// Use inline text for form validation errors
```

---

## Loading States

**All API calls should show loading indicators:**
- Button loading state (spinner + disabled)
- Skeleton loaders for content
- Full-page loader for authentication checks

**Use existing shadcn components:**
- `ui/skeleton.tsx` (existing)
- Button `disabled` and loading state
- Local state management with `useState` for loading states

**Example:**
```typescript
const { signIn } = useSignIn();
const [isLoading, setIsLoading] = useState(false);

const handleSignIn = async () => {
  setIsLoading(true);
  await signIn(email, password);
  setIsLoading(false);
};

<Button disabled={isLoading} onClick={handleSignIn}>
  {isLoading ? 'Signing in...' : 'Sign In'}
</Button>
```

---

## Success Feedback

**Provide clear success feedback:**
- Toast notifications (use shadcn toast)
- Success icons with animations
- Auto-navigation with countdown
- Confirmation messages

**Install shadcn toast:**
```bash
bunx shadcn@latest add toast
bunx shadcn@latest add sonner
```

**Use toast hook:**
```typescript
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();

toast({
  title: 'Success!',
  description: 'Your action was completed',
});
```

---

## Accessibility Requirements

**All pages must include:**
- Proper ARIA labels
- Keyboard navigation support
- Focus management (especially for OTP inputs)
- Screen reader announcements for errors/success
- Sufficient color contrast
- Form validation messages

---

## Testing Checklist

**For each page, test:**
- [ ] Form validation (client-side)
- [ ] API error handling
- [ ] Success flow navigation
- [ ] Loading states
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] OTP resend cooldown
- [ ] Token/session persistence
- [ ] Logout functionality

---

## Priority Implementation Order

1. **Phase 1 (Home & Core Auth):**
   - Home page with navbar and placeholder content
   - Login options
   - Sign in (email/password)
   - Sign up

2. **Phase 2 (OTP Features):**
   - OTP input component
   - Sign in with OTP
   - Email verification

3. **Phase 3 (Password Recovery):**
   - Forgot password
   - Reset password

4. **Phase 4 (Polish & UX):**
   - Animations and transitions
   - Error handling refinements
   - Loading states optimization

5. **Phase 5 (Streaming Features - Future):**
   - Live stream grid/cards
   - Stream detail pages
   - User dashboard
   - Stream creation/management

---

## Package Installation Commands

**Install all required dependencies:**
```bash
# Better Auth client
bun add better-auth

# TanStack Query (for non-auth API calls)
bun add @tanstack/react-query

# React Router
bun add react-router-dom
bun add -d @types/react-router-dom

# Additional shadcn components
bunx shadcn@latest add card
bunx shadcn@latest add form
bunx shadcn@latest add label
bunx shadcn@latest add toast
bunx shadcn@latest add sonner
```

---

## Example Page Implementation

**Sign In Page with TanStack Query + shadcn:**
```typescript
// frontend/src/pages/auth/signin.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSignIn } from '@/utils/queries/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { mutate: signIn, isPending } = useSignIn();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-zinc-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-zinc-300">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
                required
              />
            </div>

            <Link 
              to="/auth/forgot-password" 
              className="text-sm text-purple-400 hover:text-purple-300"
            >
              Forgot password?
            </Link>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600"
              disabled={isPending}
            >
              {isPending ? 'Signing in...' : 'LOGIN'}
            </Button>

            <p className="text-center text-sm text-zinc-400">
              Don't have an account?{' '}
              <Link to="/auth/signup" className="text-purple-400 hover:text-purple-300">
                Sign up
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Notes

- All pages should use the existing `_components/navbar.tsx` where appropriate
- Maintain consistent styling with the Coro brand identity
- Store auth tokens securely (httpOnly cookies preferred, or secure localStorage)
- Implement CSRF protection for sensitive operations
- Add rate limiting feedback for OTP endpoints
- Use **Bun** for all package management (`bun add`, `bun install`)
- Use **shadcn/ui** components exclusively for UI elements
- Use **Better Auth** client for all authentication operations
- Use **TanStack Query** for non-auth API calls (streams, user data, etc.)
- All auth operations use Better Auth's built-in callbacks (`onSuccess`, `onError`)
- All success/error feedback via shadcn toast
- Session management via Better Auth's `useSession` hook
- Consider implementing biometric auth for mobile (future enhancement)


---

## Example Page Implementation with Better Auth

**Sign In Page with Better Auth + shadcn:**
```typescript
// frontend/src/pages/auth/signin.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSignIn } from '@/utils/queries/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useSignIn();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await signIn(email, password);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-zinc-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-zinc-300">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
                required
              />
            </div>

            <Link 
              to="/auth/forgot-password" 
              className="text-sm text-purple-400 hover:text-purple-300"
            >
              Forgot password?
            </Link>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'LOGIN'}
            </Button>

            <p className="text-center text-sm text-zinc-400">
              Don't have an account?{' '}
              <Link to="/auth/signup" className="text-purple-400 hover:text-purple-300">
                Sign up
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Using Session in Components:**
```typescript
// frontend/src/pages/home/index.tsx
import { authClient } from '@/lib/auth-client';
import { useSignOut } from '@/utils/queries/auth';

export default function Home() {
  const session = authClient.useSession();
  const { signOut } = useSignOut();

  return (
    <div>
      {session.data ? (
        <div>
          <p>Welcome, {session.data.user.name}!</p>
          <button onClick={signOut}>Sign Out</button>
        </div>
      ) : (
        <div>
          <p>Not signed in</p>
          <Link to="/auth/signin">Sign In</Link>
        </div>
      )}
    </div>
  );
}
```

---

## Better Auth Backend Integration Notes

Your backend is already configured with:
- **Better Auth** with Prisma adapter (PostgreSQL)
- **Email OTP Plugin** for passwordless auth and email verification
- **Custom fields**: `username`, `age`, `phone`
- **Resend** for sending OTP emails

**Backend Endpoints Available:**
- All Better Auth default endpoints at `/api/auth/*`
- Custom wrapped endpoints for validation (already implemented)

**Session Management:**
- Better Auth handles sessions via cookies automatically
- Use `authClient.useSession()` on frontend
- Use `auth.api.getSession({ headers })` on backend

**No Changes Needed in Backend** - Your current setup is perfect for the frontend integration!
