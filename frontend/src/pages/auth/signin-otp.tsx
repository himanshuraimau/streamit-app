import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useSendOTP, useSignInOTP } from '@/utils/queries/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { OTPInput } from './_components/otp-input';
import { ArrowLeft, Mail } from 'lucide-react';

export default function SignInOTP() {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [isLoading, setIsLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    const { sendOTP } = useSendOTP();
    const { signInWithOTP } = useSignInOTP();

    const handleSendOTP = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await sendOTP(email, 'sign-in');
        setIsLoading(false);
        setStep('otp');
        setCooldown(60);

        // Cooldown timer
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

    const handleVerifyOTP = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await signInWithOTP(email, otp);
        setIsLoading(false);
    };

    const handleResendOTP = async () => {
        if (cooldown > 0) return;
        setIsLoading(true);
        await sendOTP(email, 'sign-in');
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
                        <Link
                            to={step === 'email' ? '/auth/login-options' : '#'}
                            onClick={(e) => {
                                if (step === 'otp') {
                                    e.preventDefault();
                                    setStep('email');
                                    setOtp('');
                                }
                            }}
                            className="text-zinc-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <img src="/logo_dark.svg" alt="StreamIt" className="h-10 w-auto" />
                    </div>
                    <CardTitle className="text-2xl text-white">
                        {step === 'email' ? 'Sign in with OTP' : 'Enter OTP Code'}
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                        {step === 'email'
                            ? 'Enter your email to receive a one-time password'
                            : `We sent a 6-digit code to ${email}`
                        }
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {step === 'email' ? (
                        <form onSubmit={handleSendOTP} className="space-y-4">
                            <div>
                                <Label htmlFor="email" className="text-zinc-300">
                                    Email Address
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 pl-10"
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Sending OTP...' : 'Send OTP'}
                            </Button>

                            <div className="space-y-2 text-center text-sm">
                                <p className="text-zinc-500">
                                    <Link to="/auth/signin" className="hover:text-zinc-400">
                                        Use password instead
                                    </Link>
                                </p>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOTP} className="space-y-6">
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

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                                disabled={isLoading || otp.length !== 6}
                            >
                                {isLoading ? 'Verifying...' : 'Verify & Sign In'}
                            </Button>

                            <div className="text-center space-y-2">
                                <p className="text-sm text-zinc-400">
                                    Didn't receive the code?
                                </p>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleResendOTP}
                                    disabled={cooldown > 0 || isLoading}
                                    className="text-purple-400 hover:text-purple-300 hover:bg-transparent"
                                >
                                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
