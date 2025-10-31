import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authClient } from '@/lib/auth-client';
import { useCreatorApplication } from '@/hooks/useCreatorApplication';
import { DashboardNavbar } from './_components/dashboard-navbar';
import { CreatorSidebar } from './_components/creator-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function CreatorDashboard() {
  const { data: session, isPending } = authClient.useSession();
  const { status, loading, fetchApplication } = useCreatorApplication();


  // Fetch application details when component mounts
  useEffect(() => {
    if (status?.hasApplication && status.status === 'APPROVED') {
      fetchApplication();
    }
  }, [status, fetchApplication]);

  // Show loading state
  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }

  // Redirect to signin if not authenticated
  if (!session) {
    return <Navigate to="/auth/signin" replace />;
  }

  // Redirect to application if not approved
  if (!status?.hasApplication || status.status !== 'APPROVED') {
    return <Navigate to="/creator-application" replace />;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full flex-col bg-black">
        {/* Full-width navbar at the top */}
        <DashboardNavbar />

        {/* Sidebar and main content below navbar */}
        <div className="flex flex-1 pt-20">
          <CreatorSidebar />

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-6 py-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}