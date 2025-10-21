import { authClient } from '@/lib/auth-client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { SignUpData, OTPType } from '@/types';

/**
 * Sign Up Hook
 * Uses better-auth signUp.email method
 */
export const useSignUp = () => {
  const navigate = useNavigate();

  const signUp = async (data: SignUpData) => {
    try {
      // Better Auth requires additional fields to be passed separately
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.name,
          username: data.username,
          age: data.age,
          phone: data.phone,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sign up failed');
      }

      toast.success('Account created!', {
        description: 'Please verify your email',
      });
      navigate('/auth/verify-email', { state: { email: data.email } });
    } catch (error: any) {
      toast.error('Sign up failed', {
        description: error.message || 'An error occurred',
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

  const signIn = async (email: string, password: string) => {
    try {
      await authClient.signIn.email({
        email,
        password,
      }, {
        onSuccess: () => {
          toast.success('Welcome back!');
          navigate('/');
        },
        onError: (ctx) => {
          toast.error('Sign in failed', {
            description: ctx.error.message,
          });
        },
      });
    } catch (error: any) {
      toast.error('Sign in failed', {
        description: error.message || 'An error occurred',
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
  const sendOTP = async (email: string, type: OTPType) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/send-verification-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, type }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send OTP');
      }

      toast.success('OTP sent!', {
        description: 'Check your email for the verification code',
      });
    } catch (error: any) {
      toast.error('Failed to send OTP', {
        description: error.message || 'An error occurred',
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

  const verifyEmail = async (email: string, otp: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Verification failed');
      }

      toast.success('Email verified!', {
        description: 'You can now sign in',
      });
      setTimeout(() => navigate('/auth/signin'), 2000);
    } catch (error: any) {
      toast.error('Verification failed', {
        description: error.message || 'An error occurred',
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

  const signInWithOTP = async (email: string, otp: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/signin/email-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sign in failed');
      }

      toast.success('Signed in successfully!');
      navigate('/');
    } catch (error: any) {
      toast.error('Sign in failed', {
        description: error.message || 'An error occurred',
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

  const forgotPassword = async (email: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/forget-password/email-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send reset code');
      }

      toast.success('Reset code sent!', {
        description: 'Check your email',
      });
      navigate('/auth/reset-password', { state: { email } });
    } catch (error: any) {
      toast.error('Failed to send reset code', {
        description: error.message || 'An error occurred',
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

  const resetPassword = async (email: string, otp: string, password: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/reset-password/email-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Reset failed');
      }

      toast.success('Password reset successful!', {
        description: 'You can now sign in with your new password',
      });
      setTimeout(() => navigate('/auth/signin'), 2000);
    } catch (error: any) {
      toast.error('Reset failed', {
        description: error.message || 'An error occurred',
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

  const signOut = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success('Signed out successfully');
            navigate('/auth/signin');
          },
        },
      });
    } catch (error: any) {
      toast.error('Sign out failed', {
        description: error.message || 'An error occurred',
      });
    }
  };

  return { signOut };
};
