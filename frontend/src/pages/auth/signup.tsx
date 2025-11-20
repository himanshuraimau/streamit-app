"use client";

import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSignUp } from '@/utils/queries/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Phone, Calendar, Lock, ArrowRight } from 'lucide-react';

const signUpFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.email('Invalid email address'),
  phone: z.string().optional(),
  age: z.string().min(1, 'Age is required').refine((val) => {
    const num = parseInt(val, 10);
    return !isNaN(num) && num >= 13;
  }, 'You must be at least 13 years old'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignUpFormValues = z.infer<typeof signUpFormSchema>;

export default function SignUp() {
  const { signUp } = useSignUp();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      name: '',
      username: '',
      email: '',
      phone: '',
      age: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: SignUpFormValues) => {
    await signUp({
      name: data.name,
      username: data.username,
      email: data.email,
      phone: data.phone,
      age: parseInt(data.age, 10),
      password: data.password,
    }, form.setError);
  };

  return (
    <div className="min-h-screen flex bg-black">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-600 via-purple-600 to-pink-800"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <Link to="/" className="flex items-center gap-3 mb-12">
            <img src="/logo_dark.svg" alt="StreamIt" className="h-12 w-auto" />
            <span className="text-3xl font-bold">StreamIt</span>
          </Link>
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Start your<br />streaming<br />journey today
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-md">
            Join thousands of creators and viewers in the fastest-growing streaming platform.
          </p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <img src="/logo_dark.svg" alt="StreamIt" className="h-10 w-auto" />
            <span className="text-2xl font-bold text-white">StreamIt</span>
          </Link>
          <Card className="bg-zinc-900/50 backdrop-blur-xl border-zinc-800 shadow-2xl">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-3xl font-bold text-white">Create account</CardTitle>
              <p className="text-zinc-400">Sign up to get started with StreamIt</p>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300 font-medium">Full Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <Input placeholder="John Doe" className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 h-11" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="username" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300 font-medium">Username</FormLabel>
                        <FormControl>
                          <Input placeholder="johndoe" className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 h-11" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                          <Input type="email" placeholder="you@example.com" className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 h-11" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300 font-medium">Phone <span className="text-zinc-500">(Optional)</span></FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <Input type="tel" placeholder="+1 (555) 000-0000" className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 h-11" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="age" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300 font-medium">Age</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <Input type="text" inputMode="numeric" placeholder="18" className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 h-11" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                          <Input type="password" placeholder="Create a password" className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 h-11" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs text-zinc-500">Minimum 8 characters</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                          <Input type="password" placeholder="Confirm your password" className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 h-11" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 h-12 text-base font-semibold mt-2" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Creating account...' : (<span className="flex items-center justify-center gap-2">Create account <ArrowRight className="h-5 w-5" /></span>)}
                  </Button>
                  <div className="text-center pt-4">
                    <p className="text-zinc-400">Already have an account? <Link to="/auth/signin" className="text-purple-400 hover:text-purple-300 font-semibold">Sign in</Link></p>
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
