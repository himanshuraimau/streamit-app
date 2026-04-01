import { useAdminAuthStore } from '@/stores/adminAuthStore';

export function DashboardPage() {
  const { user } = useAdminAuthStore();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}</p>
      </header>

      <section aria-label="Platform statistics">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-lg border bg-card p-4 sm:p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Total Users</h3>
            <p className="mt-2 text-2xl sm:text-3xl font-bold">-</p>
          </article>
          <article className="rounded-lg border bg-card p-4 sm:p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Active Streams</h3>
            <p className="mt-2 text-2xl sm:text-3xl font-bold">-</p>
          </article>
          <article className="rounded-lg border bg-card p-4 sm:p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Pending Reports</h3>
            <p className="mt-2 text-2xl sm:text-3xl font-bold">-</p>
          </article>
          <article className="rounded-lg border bg-card p-4 sm:p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Revenue</h3>
            <p className="mt-2 text-2xl sm:text-3xl font-bold">-</p>
          </article>
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
