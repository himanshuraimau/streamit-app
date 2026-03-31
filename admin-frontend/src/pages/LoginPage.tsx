import { useEffect } from "react";

export function LoginPage() {
  const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

  useEffect(() => {
    // Check if we're already authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/me`, {
          credentials: "include",
        });
        if (response.ok) {
          // Already authenticated, redirect to dashboard
          window.location.href = "/";
        }
      } catch {
        // Not authenticated, show login options
      }
    };
    void checkAuth();
  }, [API_BASE_URL]);

  const handleLogin = () => {
    // Redirect to main app login with return URL
    const returnUrl = encodeURIComponent(window.location.origin);
    window.location.href = `${API_BASE_URL}/auth/login?returnTo=${returnUrl}`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f0f10] px-4">
      <article className="w-full max-w-md rounded-3xl border border-white/10 bg-[#17171a] p-8 text-center">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">StreamIt</p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-50">Admin Control Plane</h1>
          <p className="mt-3 text-sm text-zinc-400">
            Sign in with your admin account to access the control plane
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogin}
          className="w-full rounded-xl bg-sky-500 px-4 py-3 text-sm font-medium text-white hover:bg-sky-600 transition-colors"
        >
          Sign In with StreamIt Account
        </button>

        <div className="mt-6 rounded-lg border border-amber-400/20 bg-amber-500/10 p-3 text-xs text-amber-200">
          <p className="font-medium">Admin Access Required</p>
          <p className="mt-1 text-amber-300/80">
            You must have ADMIN or SUPER_ADMIN role to access this application
          </p>
        </div>

        <p className="mt-6 text-xs text-zinc-500">
          Need help? Contact your system administrator
        </p>
      </article>
    </div>
  );
}
