import { authClient } from '@/lib/auth-client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { SignUpData, OTPType } from '@/types';
import { handleApiResponse, formatErrorForToast } from '@/lib/errors';

/**
 * Sign Up Hook
 * Uses better-auth signUp.email method
 */
export const useSignUp = () => {
  const navigate = useNavigate();

  const signUp = async (data: SignUpData) => {
    try {
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

      await handleApiResponse(response);

      toast.success('Account created!', {
        description: 'Please verify your email',
      });
      navigate('/auth/verify-email', { state: { email: data.email } });
    } catch (error: unknown) {
      const errorInfo = formatErrorForToast(error);
      toast.error(errorInfo.title, {
        description: errorInfo.description,
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
          const errorInfo = formatErrorForToast(ctx.error);
          toast.error(errorInfo.title, {
            description: errorInfo.description,
          });
        },
      });
    } catch (error: unknown) {
      const errorInfo = formatErrorForToast(error);
      toast.error(errorInfo.title, {
        description: errorInfo.description,
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

      await handleApiResponse(response);

      toast.success('OTP sent!', {
        description: 'Check your email for the verification code',
      });
    } catch (error: unknown) {
      const errorInfo = formatErrorForToast(error);
      toast.error(errorInfo.title, {
        description: errorInfo.description,
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

      await handleApiResponse(response);

      toast.success('Email verified!', {
        description: 'You can now sign in',
      });
      setTimeout(() => navigate('/auth/signin'), 2000);
    } catch (error: unknown) {
      const errorInfo = formatErrorForToast(error);
      toast.error(errorInfo.title, {
        description: errorInfo.description,
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

      await handleApiResponse(response);

      toast.success('Signed in successfully!');
      navigate('/');
    } catch (error: unknown) {
      const errorInfo = formatErrorForToast(error);
      toast.error(errorInfo.title, {
        description: errorInfo.description,
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

      await handleApiResponse(response);

      toast.success('Reset code sent!', {
        description: 'Check your email',
      });
      navigate('/auth/reset-password', { state: { email } });
    } catch (error: unknown) {
      const errorInfo = formatErrorForToast(error);
      toast.error(errorInfo.title, {
        description: errorInfo.description,
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

      await handleApiResponse(response);

      toast.success('Password reset successful!', {
        description: 'You can now sign in with your new password',
      });
      setTimeout(() => navigate('/auth/signin'), 2000);
    } catch (error: unknown) {
      const errorInfo = formatErrorForToast(error);
      toast.error(errorInfo.title, {
        description: errorInfo.description,
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
    } catch (error: unknown) {
      const errorInfo = formatErrorForToast(error);
      toast.error(errorInfo.title, {
        description: errorInfo.description,
      });
    }
  };

  return { signOut };
};
