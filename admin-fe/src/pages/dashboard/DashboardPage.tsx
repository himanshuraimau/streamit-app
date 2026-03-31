import { useAdminAuthStore } from '@/stores/adminAuthStore';

export function DashboardPage() {
  const { user } = useAdminAuthStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Total Users</h3>
          <p className="mt-2 text-3xl font-bold">-</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Active Streams</h3>
          <p className="mt-2 text-3xl font-bold">-</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Pending Reports</h3>
          <p className="mt-2 text-3xl font-bold">-</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Revenue</h3>
          <p className="mt-2 text-3xl font-bold">-</p>
        </div>
      </div>
    </div>
  );
}
