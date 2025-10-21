"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSendOTP, useVerifyEmail } from '@/utils/queries/auth';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { OTPInput } from './_components/otp-input';
import { Mail, CheckCircle2 } from 'lucide-react';

export default function VerifyEmail() {
  const location = useLocation();
  const email = location.state?.email || '';
  
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [autoSent, setAutoSent] = useState(false);
  
  const { sendOTP } = useSendOTP();
  const { verifyEmail } = useVerifyEmail();

  // Don't auto-send OTP since Better Auth already sends it on signup
  // Users can manually request a new one if needed
  useEffect(() => {
    // Just mark as initialized, don't auto-send
    if (email && !autoSent) {
      setAutoSent(true);
    }
  }, [email, autoSent]);

  const handleSendOTP = async () => {
    if (!email) return;
    
    setIsLoading(true);
    await sendOTP(email, 'email-verification');
    setIsLoading(false);
    setCooldown(60);
    
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerifyEmail = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await verifyEmail(email, otp);
    setIsLoading(false);
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <Card className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border-zinc-800">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-zinc-400">No email provided for verification.</p>
            <Link to="/auth/signup">
              <Button className="bg-gradient-to-r from-pink-500 to-purple-600">
                Go to Sign Up
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border-zinc-800 relative z-10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-600/20 flex items-center justify-center">
                <Mail className="w-10 h-10 text-purple-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center glow-primary">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          
          <CardTitle className="text-2xl text-white">
            Verify Your Email
          </CardTitle>
          <CardDescription className="text-zinc-400">
            A 6-digit verification code has been sent to
            <br />
            <span className="text-white font-medium">{email}</span>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleVerifyEmail} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-zinc-300 text-center block">
                Enter verification code
              </Label>
              <OTPInput
                length={6}
                value={otp}
                onChange={setOtp}
                onComplete={(value) => setOtp(value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-zinc-400">
                Didn't receive the code?
              </p>
              <Button
                type="button"
                variant="ghost"
                onClick={handleSendOTP}
                disabled={cooldown > 0 || isLoading}
                className="text-purple-400 hover:text-purple-300 hover:bg-transparent"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
              </Button>
            </div>

            <div className="text-center pt-4">
              <p className="text-sm text-zinc-500">
                Wrong email?{' '}
                <Link to="/auth/signup" className="text-purple-400 hover:text-purple-300">
                  Sign up again
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
