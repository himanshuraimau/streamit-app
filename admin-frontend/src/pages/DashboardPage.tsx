import { useQuery } from '@tanstack/react-query';
import { getAdminDashboardSummary, getAdminMe } from '../lib/admin-api';

function formatCount(value: number) {
  return new Intl.NumberFormat('en-IN').format(value);
}

function formatDateTime(value: string | null) {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString();
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-zinc-100">{formatCount(value)}</p>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      {message}
    </div>
  );
}

export function DashboardPage() {
  const adminQuery = useQuery({
    queryKey: ['admin', 'me'],
    queryFn: getAdminMe,
  });

  const summaryQuery = useQuery({
    queryKey: ['admin', 'dashboard', 'summary'],
    queryFn: getAdminDashboardSummary,
  });

  const adminError = adminQuery.data && !adminQuery.data.success ? adminQuery.data.error : null;
  const summaryError =
    summaryQuery.data && !summaryQuery.data.success ? summaryQuery.data.error : null;

  const admin = adminQuery.data && adminQuery.data.success ? adminQuery.data.data : null;
  const summary = summaryQuery.data && summaryQuery.data.success ? summaryQuery.data.data : null;

  return (
    <div>
      <header className="mb-8 border-b border-white/10 pb-5">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Phase 1 + Phase 2</p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-50">Admin Dashboard</h2>
      </header>

      {(adminError || summaryError) && (
        <div className="mb-6 space-y-3">
          {adminError ? <ErrorBanner message={adminError} /> : null}
          {summaryError ? <ErrorBanner message={summaryError} /> : null}
        </div>
      )}

      <section className="mb-6 rounded-2xl border border-white/10 bg-[#111113] p-5">
        <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-zinc-400">Admin Session</h3>
        {adminQuery.isLoading ? (
          <p className="mt-3 text-sm text-zinc-400">Loading admin profile...</p>
        ) : admin ? (
          <div className="mt-4 grid grid-cols-1 gap-4 text-sm text-zinc-300 md:grid-cols-2">
            <div>
              <p className="text-zinc-400">Name</p>
              <p className="mt-1 text-zinc-100">{admin.name}</p>
            </div>
            <div>
              <p className="text-zinc-400">Role</p>
              <p className="mt-1 text-zinc-100">{admin.role}</p>
            </div>
            <div>
              <p className="text-zinc-400">Username</p>
              <p className="mt-1 text-zinc-100">@{admin.username}</p>
            </div>
            <div>
              <p className="text-zinc-400">Last Login</p>
              <p className="mt-1 text-zinc-100">{formatDateTime(admin.lastLoginAt)}</p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-400">No admin profile returned from backend.</p>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#111113] p-5">
        <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-zinc-400">
          Operations Snapshot
        </h3>
        {summaryQuery.isLoading ? (
          <p className="mt-3 text-sm text-zinc-400">Loading summary...</p>
        ) : summary ? (
          <>
            <p className="mt-2 text-xs text-zinc-500">Updated: {formatDateTime(summary.generatedAt)}</p>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <MetricCard label="Total Users" value={summary.users.total} />
              <MetricCard label="Suspended Users" value={summary.users.suspended} />
              <MetricCard label="Approved Creators" value={summary.creators.approved} />
              <MetricCard
                label="Pending Creator Applications"
                value={summary.creators.pendingApplications}
              />
              <MetricCard label="Pending Reports" value={summary.moderation.pendingReports} />
              <MetricCard
                label="Pending Stream Reports"
                value={summary.moderation.pendingStreamReports}
              />
              <MetricCard label="Active Live Streams" value={summary.streaming.activeLiveStreams} />
              <MetricCard label="Active Announcements" value={summary.announcements.active} />
            </div>
          </>
        ) : (
          <p className="mt-3 text-sm text-zinc-400">No dashboard summary returned from backend.</p>
        )}
      </section>
    </div>
  );
}
