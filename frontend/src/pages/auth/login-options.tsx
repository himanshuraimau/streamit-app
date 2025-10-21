import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, KeyRound, ArrowLeft } from 'lucide-react';

export default function LoginOptions() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border-zinc-800 relative z-10">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <img src="/logo_dark.svg" alt="StreamIt" className="h-12 w-auto" />
          </div>
          
          {/* Illustration/Icon */}
          <div className="flex justify-center py-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-600/20 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-zinc-900"></div>
            </div>
          </div>

          <div className="text-center space-y-2">
            <CardTitle className="text-3xl text-white font-bold">
              Sign in to StreamIt
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Choose your preferred sign in method
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Sign in with Email & Password */}
          <Link to="/auth/signin" className="block">
            <Button
              variant="outline"
              className="w-full h-14 bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:border-purple-500 text-white transition-all duration-300 group"
            >
              <Mail className="mr-3 h-5 w-5 text-purple-400 group-hover:text-purple-300" />
              <span className="font-semibold">Sign in with Email & Password</span>
            </Button>
          </Link>

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-zinc-900 text-zinc-500">or</span>
            </div>
          </div>

          {/* Sign in with OTP */}
          <Link to="/auth/signin-otp" className="block">
            <Button
              variant="outline"
              className="w-full h-14 bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:border-purple-500 text-white transition-all duration-300 group"
            >
              <KeyRound className="mr-3 h-5 w-5 text-purple-400 group-hover:text-purple-300" />
              <span className="font-semibold">Sign in with OTP</span>
            </Button>
          </Link>

          {/* Sign Up Link */}
          <div className="text-center pt-6">
            <p className="text-sm text-zinc-400">
              Don't have an account?{' '}
              <Link 
                to="/auth/signup" 
                className="text-gradient-primary font-semibold hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
