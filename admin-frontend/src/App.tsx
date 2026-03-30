import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";
import { AdminShell } from "./components/layout/AdminShell";
import { DashboardPage } from "./pages/DashboardPage";
import { UsersPage } from "./pages/UsersPage";
import { CreatorApplicationsPage } from "./pages/CreatorApplicationsPage";
import { ModerationReportsPage } from "./pages/ModerationReportsPage";
import { FinancePage } from "./pages/FinancePage";
import { AdsAnalyticsPage } from "./pages/AdsAnalyticsPage";
import { LegalCasesPage } from "./pages/LegalCasesPage";
import { TakedownsGeoBlocksPage } from "./pages/TakedownsGeoBlocksPage";
import { SettingsAnnouncementsPage } from "./pages/SettingsAnnouncementsPage";
import { ComplianceAuditHistoryPage } from "./pages/ComplianceAuditHistoryPage";
import { PermissionsPage } from "./pages/PermissionsPage";
import { SecurityHardeningPage } from "./pages/SecurityHardeningPage";

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
    path: "/",
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
]);

export default function App() {
  return <RouterProvider router={router} />;
}
