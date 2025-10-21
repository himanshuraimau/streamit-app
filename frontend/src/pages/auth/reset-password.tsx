"use client";

import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useResetPassword } from '@/utils/queries/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { OTPInput } from './_components/otp-input';
import { ArrowLeft, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function ResetPassword() {
    const location = useLocation();
    const email = location.state?.email || '';

    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { resetPassword } = useResetPassword();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Password mismatch', {
                description: 'Passwords do not match',
            });
            return;
        }

        if (password.length < 8) {
            toast.error('Password too short', {
                description: 'Password must be at least 8 characters',
            });
            return;
        }

        setIsLoading(true);
        await resetPassword(email, otp, password);
        setIsLoading(false);
    };

    if (!email) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black px-4">
                <Card className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border-zinc-800">
                    <CardContent className="pt-6 text-center space-y-4">
                        <p className="text-zinc-400">No email provided for password reset.</p>
                        <Link to="/auth/forgot-password">
                            <Button className="bg-gradient-to-r from-pink-500 to-purple-600">
                                Go to Forgot Password
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
                <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                        <Link to="/auth/forgot-password" className="text-zinc-400 hover:text-white transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <img src="/logo_dark.svg" alt="StreamIt" className="h-10 w-auto" />
                    </div>

                    {/* Icon */}
                    <div className="flex justify-center py-4">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-600/20 flex items-center justify-center">
                            <Lock className="w-10 h-10 text-purple-400" />
                        </div>
                    </div>

                    <CardTitle className="text-2xl text-white text-center">
                        Reset Password
                    </CardTitle>
                    <CardDescription className="text-zinc-400 text-center">
                        Enter the code sent to
                        <br />
                        <span className="text-white font-medium">{email}</span>
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* OTP Input */}
                        <div className="space-y-2">
                            <Label className="text-zinc-300 text-center block">
                                Enter 6-digit code
                            </Label>
                            <OTPInput
                                length={6}
                                value={otp}
                                onChange={setOtp}
                                onComplete={(value) => setOtp(value)}
                            />
                        </div>

                        {/* New Password */}
                        <div>
                            <Label htmlFor="password" className="text-zinc-300">
                                New Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                                placeholder="••••••••"
                                required
                                minLength={8}
                            />
                            <p className="text-xs text-zinc-500 mt-1">Minimum 8 characters</p>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <Label htmlFor="confirmPassword" className="text-zinc-300">
                                Confirm New Password
                            </Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                            disabled={isLoading || otp.length !== 6}
                        >
                            {isLoading ? 'Resetting Password...' : 'Reset Password'}
                        </Button>

                        <div className="text-center pt-4">
                            <p className="text-sm text-zinc-500">
                                Remember your password?{' '}
                                <Link to="/auth/signin" className="text-purple-400 hover:text-purple-300">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
