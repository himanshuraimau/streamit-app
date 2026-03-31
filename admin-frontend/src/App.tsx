import {
  Navigate,
  Outlet,
  RouterProvider,
  createBrowserRouter,
  useLocation,
} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "./components/layout/AdminShell";
import { getAdminMe } from "./lib/admin-api";
import {
  DashboardPage,
  UsersPage,
  CreatorApplicationsPage,
  ModerationReportsPage,
  FinancePage,
  AdsAnalyticsPage,
  LegalCasesPage,
  TakedownsGeoBlocksPage,
  SettingsAnnouncementsPage,
  ComplianceAuditHistoryPage,
  PermissionsPage,
  SecurityHardeningPage,
  UnauthorizedPage,
  AdminLoginPage,
  ForgotPasswordPage,
} from "./pages";

function isAuthorizationError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("authentication required") ||
    normalized.includes("admin access required") ||
    normalized.includes("suspended users") ||
    normalized.includes("user not found")
  );
}

function resolveUnauthorizedReason(message: string) {
  const normalized = message.toLowerCase();
  if (
    normalized.includes("authentication required") ||
    normalized.includes("user not found")
  ) {
    return "session-expired";
  }

  return "insufficient-access";
}

function AdminRouteGuard() {
  const location = useLocation();
  const adminQuery = useQuery({
    queryKey: ["admin", "me"],
    queryFn: getAdminMe,
    retry: false,
    staleTime: 60_000,
  });

  if (adminQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f10] text-sm text-zinc-300">
        Verifying admin session...
      </div>
    );
  }

  if (!adminQuery.data || !adminQuery.data.success) {
    const errorMessage = adminQuery.data?.error ?? "Unable to verify admin session.";
    if (isAuthorizationError(errorMessage)) {
      const reason = resolveUnauthorizedReason(errorMessage);
      const params = new URLSearchParams({
        reason,
        from: `${location.pathname}${location.search}`,
      });

      return <Navigate to={`/unauthorized?${params.toString()}`} replace />;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f10] px-4 text-center text-zinc-200">
        <div className="max-w-md rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-rose-200">Admin Session Check</p>
          <p className="mt-2 text-sm">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

function NotFoundPage() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-center">
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
          Admin Router
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-100">
          Page Not Found
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          The requested admin route does not exist.
        </p>
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/login",
    element: <AdminLoginPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/unauthorized",
    element: <UnauthorizedPage />,
  },
  {
    path: "/",
    element: <AdminRouteGuard />,
    children: [
      {
        element: <AdminShell />,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: "users",
            element: <UsersPage />,
          },
          {
            path: "creators/applications",
            element: <CreatorApplicationsPage />,
          },
          {
            path: "moderation/reports",
            element: <ModerationReportsPage />,
          },
          {
            path: "finance/wallet",
            element: <FinancePage />,
          },
          {
            path: "finance/withdrawals",
            element: <FinancePage />,
          },
          {
            path: "ads/campaigns",
            element: <AdsAnalyticsPage />,
          },
          {
            path: "analytics/founder",
            element: <AdsAnalyticsPage />,
          },
          {
            path: "compliance/legal-cases",
            element: <LegalCasesPage />,
          },
          {
            path: "compliance/takedowns",
            element: <TakedownsGeoBlocksPage />,
          },
          {
            path: "compliance/geoblocks",
            element: <TakedownsGeoBlocksPage />,
          },
          {
            path: "settings/system",
            element: <SettingsAnnouncementsPage />,
          },
          {
            path: "settings/announcements",
            element: <SettingsAnnouncementsPage />,
          },
          {
            path: "compliance/audit-history",
            element: <ComplianceAuditHistoryPage />,
          },
          {
            path: "permissions/scopes",
            element: <PermissionsPage />,
          },
          {
            path: "ops/security-summary",
            element: <SecurityHardeningPage />,
          },
          {
            path: "404",
            element: <NotFoundPage />,
          },
          {
            path: "*",
            element: <Navigate to="/404" replace />,
          },
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
