"use client";

import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSignIn } from '@/utils/queries/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, ArrowRight } from 'lucide-react';

const signInSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export default function SignIn() {
  const { signIn } = useSignIn();

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignInFormValues) => {
    await signIn(data.email, data.password, form.setError);
  };

  return (
    <div className="min-h-screen flex bg-black">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-purple-800"></div>
        <div className="absolute inset-0 bg-black/20"></div>

        {/* Animated Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <Link to="/" className="flex items-center gap-3 mb-12">
            <img src="/logo_dark.svg" alt="StreamIt" className="h-12 w-auto" />
            <span className="text-3xl font-bold">StreamIt</span>
          </Link>

          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Welcome back to<br />your streaming<br />community
          </h1>

          <p className="text-xl text-white/80 mb-8 max-w-md">
            Connect with creators, watch live streams, and be part of something amazing.
          </p>

          <div className="flex gap-8 text-sm">
            <div>
              <div className="text-3xl font-bold mb-1">10K+</div>
              <div className="text-white/70">Active Streamers</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">500K+</div>
              <div className="text-white/70">Community Members</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <img src="/logo_dark.svg" alt="StreamIt" className="h-10 w-auto" />
            <span className="text-2xl font-bold text-white">StreamIt</span>
          </Link>

          <Card className="bg-zinc-900/50 backdrop-blur-xl border-zinc-800 shadow-2xl">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-3xl font-bold text-white">Sign in</CardTitle>
              <p className="text-zinc-400">Enter your credentials to access your account</p>
            </CardHeader>

            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300 font-medium">Email address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              className="pl-11 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 h-12 focus:border-purple-500 transition-colors"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-zinc-300 font-medium">Password</FormLabel>
                          <Link
                            to="/auth/forgot-password"
                            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            Forgot password?
                          </Link>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                            <Input
                              type="password"
                              placeholder="Enter your password"
                              className="pl-11 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 h-12 focus:border-purple-500 transition-colors"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 h-12 text-base font-semibold transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? (
                      'Signing in...'
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Sign in
                        <ArrowRight className="h-5 w-5" />
                      </span>
                    )}
                  </Button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-zinc-800"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-zinc-900/50 text-zinc-500">Or continue with</span>
                    </div>
                  </div>

                  <Link to="/auth/signin-otp">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-zinc-700 bg-zinc-800/30 hover:bg-zinc-800 text-white h-12"
                    >
                      <Mail className="h-5 w-5 mr-2" />
                      Sign in with OTP
                    </Button>
                  </Link>

                  <div className="text-center pt-4">
                    <p className="text-zinc-400">
                      Don't have an account?{' '}
                      <Link
                        to="/auth/signup"
                        className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                      >
                        Sign up for free
                      </Link>
                    </p>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
