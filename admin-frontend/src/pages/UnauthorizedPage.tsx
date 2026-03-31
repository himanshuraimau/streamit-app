import { Link, useSearchParams } from "react-router-dom";

function getMessage(reason: string | null) {
  if (reason === "session-expired") {
    return "Your admin session has expired or is no longer valid. Please sign in again.";
  }

  if (reason === "insufficient-access") {
    return "Your account does not currently have permission to access this admin control plane.";
  }

  return "Unable to verify admin access for this page.";
}

export function UnauthorizedPage() {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get("reason");
  const from = searchParams.get("from");
  const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

  const handleLogin = () => {
    const returnUrl = encodeURIComponent(window.location.origin + (from || "/"));
    window.location.href = `${API_BASE_URL}/auth/login?returnTo=${returnUrl}`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f0f10] px-4 text-[#f5f5f7]">
      <article className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#17171a] p-6 text-center">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Admin Access</p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-50">Unauthorized Or Session Expired</h1>
        <p className="mt-3 text-sm text-zinc-300">{getMessage(reason)}</p>

        {from ? (
          <p className="mt-2 text-xs text-zinc-500">Requested route: {from}</p>
        ) : null}

        <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleLogin}
            className="w-full rounded-xl bg-sky-500 px-4 py-3 text-sm font-medium text-white hover:bg-sky-600 transition-colors"
          >
            Sign In to Admin Panel
          </button>
          
          <div className="flex gap-2">
            <a
              href="/"
              className="flex-1 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-100 hover:bg-white/10"
            >
              Retry Session
            </a>
            <Link
              to="/login"
              className="flex-1 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-100 hover:bg-white/10"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
