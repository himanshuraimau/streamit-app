import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { logout } from "../../lib/auth-client";
import { Button } from "../ui/button";

function navClassName(isActive: boolean) {
  return `rounded-xl px-3 py-2 text-sm transition ${
    isActive
      ? "bg-white/10 text-zinc-100"
      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
  }`;
}

export function AdminShell() {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect even if logout fails
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f10] text-[#f5f5f7]">
      <a
        href="#admin-main-content"
        className="sr-only left-3 top-3 z-50 rounded-md bg-sky-500 px-3 py-2 text-xs font-medium text-white focus:not-sr-only focus:absolute"
      >
        Skip to main content
      </a>
      <div className="mx-auto flex min-h-screen w-full max-w-7xl gap-6 px-5 py-6 lg:px-8">
        <aside className="hidden w-64 shrink-0 rounded-3xl border border-white/10 bg-[#17171a] p-5 lg:block">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">
            StreamIt Admin
          </p>
          <h1 className="mt-2 text-xl font-semibold text-zinc-50">
            Control Plane
          </h1>

          <nav className="mt-8 flex flex-col gap-2" aria-label="Primary admin navigation">
            <NavLink
              to="/"
              end
              className={({ isActive }) => navClassName(isActive)}
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/users"
              className={({ isActive }) => navClassName(isActive)}
            >
              Users
            </NavLink>
            <NavLink
              to="/creators/applications"
              className={({ isActive }) => navClassName(isActive)}
            >
              Creator Applications
            </NavLink>
            <NavLink
              to="/moderation/reports"
              className={({ isActive }) => navClassName(isActive)}
            >
              Moderation
            </NavLink>
            <NavLink
              to="/finance/wallet"
              className={({ isActive }) => navClassName(isActive)}
            >
              Finance
            </NavLink>
            <NavLink
              to="/ads/campaigns"
              className={({ isActive }) => navClassName(isActive)}
            >
              Ads
            </NavLink>
            <NavLink
              to="/analytics/founder"
              className={({ isActive }) => navClassName(isActive)}
            >
              Analytics
            </NavLink>
            <NavLink
              to="/compliance/legal-cases"
              className={({ isActive }) => navClassName(isActive)}
            >
              Legal Cases
            </NavLink>
            <NavLink
              to="/compliance/takedowns"
              className={({ isActive }) => navClassName(isActive)}
            >
              Takedowns
            </NavLink>
            <NavLink
              to="/settings/system"
              className={({ isActive }) => navClassName(isActive)}
            >
              Settings
            </NavLink>
            <NavLink
              to="/compliance/audit-history"
              className={({ isActive }) => navClassName(isActive)}
            >
              Audit History
            </NavLink>
            <NavLink
              to="/permissions/scopes"
              className={({ isActive }) => navClassName(isActive)}
            >
              Permissions
            </NavLink>
            <NavLink
              to="/ops/security-summary"
              className={({ isActive }) => navClassName(isActive)}
            >
              Security Ops
            </NavLink>
          </nav>

          <div className="mt-8 border-t border-white/10 pt-4">
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              variant="outline"
              className="w-full text-sm"
            >
              {isLoggingOut ? "Signing out..." : "Sign Out"}
            </Button>
          </div>
        </aside>

        <main id="admin-main-content" className="flex-1 rounded-3xl border border-white/10 bg-[#17171a] p-4 md:p-6">
          <nav
            className="mb-5 flex gap-2 overflow-x-auto border-b border-white/10 pb-4 whitespace-nowrap lg:hidden"
            aria-label="Mobile admin navigation"
          >
            <NavLink
              to="/"
              end
              className={({ isActive }) => navClassName(isActive)}
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/users"
              className={({ isActive }) => navClassName(isActive)}
            >
              Users
            </NavLink>
            <NavLink
              to="/creators/applications"
              className={({ isActive }) => navClassName(isActive)}
            >
              Creator Applications
            </NavLink>
            <NavLink
              to="/moderation/reports"
              className={({ isActive }) => navClassName(isActive)}
            >
              Moderation
            </NavLink>
            <NavLink
              to="/finance/wallet"
              className={({ isActive }) => navClassName(isActive)}
            >
              Finance
            </NavLink>
            <NavLink
              to="/ads/campaigns"
              className={({ isActive }) => navClassName(isActive)}
            >
              Ads
            </NavLink>
            <NavLink
              to="/analytics/founder"
              className={({ isActive }) => navClassName(isActive)}
            >
              Analytics
            </NavLink>
            <NavLink
              to="/compliance/legal-cases"
              className={({ isActive }) => navClassName(isActive)}
            >
              Legal Cases
            </NavLink>
            <NavLink
              to="/compliance/takedowns"
              className={({ isActive }) => navClassName(isActive)}
            >
              Takedowns
            </NavLink>
            <NavLink
              to="/settings/system"
              className={({ isActive }) => navClassName(isActive)}
            >
              Settings
            </NavLink>
            <NavLink
              to="/compliance/audit-history"
              className={({ isActive }) => navClassName(isActive)}
            >
              Audit History
            </NavLink>
            <NavLink
              to="/permissions/scopes"
              className={({ isActive }) => navClassName(isActive)}
            >
              Permissions
            </NavLink>
            <NavLink
              to="/ops/security-summary"
              className={({ isActive }) => navClassName(isActive)}
            >
              Security Ops
            </NavLink>
          </nav>

          <Outlet />
        </main>
      </div>
    </div>
  );
}
