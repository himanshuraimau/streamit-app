import { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetOTP, resetPassword } from "../lib/auth-client";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const result = await sendPasswordResetOTP(email);

      if (result.success) {
        setSuccess("Reset code sent to your email. Please check your inbox.");
        setStep("otp");
      } else {
        setError(result.error || "Failed to send reset code.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPassword(email, otp, newPassword);

      if (result.success) {
        setSuccess("Password reset successful! You can now sign in with your new password.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        setError(result.error || "Failed to reset password.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f0f10] px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600">
            <svg
              className="h-8 w-8 text-white"
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
          <h1 className="text-2xl font-semibold text-zinc-50">Reset Password</h1>
          <p className="mt-2 text-sm text-zinc-400">
            {step === "email"
              ? "Enter your email to receive a reset code"
              : "Enter the code and your new password"}
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-white/10 bg-[#17171a] p-6">
          {step === "email" ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-200">
                  {success}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-200">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  disabled={isLoading}
                  className="bg-[#0f0f10] border-white/10 text-zinc-100"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              >
                {isLoading ? "Sending..." : "Send Reset Code"}
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm text-sky-400 hover:text-sky-300 transition-colors"
                >
                  Back to Sign In
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-200">
                  {success}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="otp" className="text-zinc-200">
                  Reset Code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code"
                  required
                  disabled={isLoading}
                  maxLength={6}
                  className="bg-[#0f0f10] border-white/10 text-zinc-100 text-center text-2xl tracking-widest"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-zinc-200">
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  minLength={8}
                  className="bg-[#0f0f10] border-white/10 text-zinc-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-zinc-200">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  minLength={8}
                  className="bg-[#0f0f10] border-white/10 text-zinc-100"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="text-sm text-sky-400 hover:text-sky-300 transition-colors"
                  disabled={isLoading}
                >
                  Resend Code
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-zinc-500">
          <p>Check your spam folder if you don't see the email.</p>
        </div>
      </div>
    </div>
  );
}
