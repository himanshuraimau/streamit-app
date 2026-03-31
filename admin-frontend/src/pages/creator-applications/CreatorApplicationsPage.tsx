import { AdminNotice } from "../../components/admin/AdminNotice";
import { useCreatorApplicationsPageController } from "./useCreatorApplicationsPageController";
import { ApplicationsSection } from "./components/ApplicationsSection";
import { RejectionDialog } from "./components/RejectionDialog";
import { APPLICATION_STATUSES } from "./constants";
import type { CreatorApplicationStatus } from "./types";

export function CreatorApplicationsPage() {
  const controller = useCreatorApplicationsPageController();

  const listError =
    controller.applicationsQuery.data && !controller.applicationsQuery.data.success
      ? controller.applicationsQuery.data.error
      : null;

  return (
    <div>
      <header className="mb-6 border-b border-white/10 pb-5">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Phase 2</p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-50">Creator Applications</h2>
      </header>

      <section className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[#111113] p-4">
        <select
          aria-label="Filter creator applications by status"
          value={controller.status}
          onChange={(event) =>
            controller.handleStatusChange(
              event.target.value as CreatorApplicationStatus | "PENDING_REVIEW",
            )
          }
          className="rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
        >
          {APPLICATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "PENDING_REVIEW" ? "Pending/Under Review" : s}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={controller.handleRefresh}
          aria-label="Refresh creator applications"
          className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-white/10"
        >
          Refresh
        </button>
      </section>

      {listError ? (
        <div className="mb-4">
          <AdminNotice
            notice={{
              tone: "error",
              title: "Error Loading Applications",
              description: listError,
            }}
          />
        </div>
      ) : null}

      <ApplicationsSection
        query={controller.applicationsQuery}
        onApprove={controller.handleApprove}
        onReject={controller.handleOpenRejectionDialog}
        onPreviousPage={() => controller.setPage((prev) => Math.max(prev - 1, 1))}
        onNextPage={() => {
          const data =
            controller.applicationsQuery.data && controller.applicationsQuery.data.success
              ? controller.applicationsQuery.data.data
              : null;
          controller.setPage((prev) => Math.min(prev + 1, data?.pagination.totalPages || 1));
        }}
        isApproving={controller.approveMutation.isPending}
        isRejecting={controller.rejectMutation.isPending}
      />

      <RejectionDialog
        isOpen={controller.rejectionDialog.isOpen}
        onClose={controller.handleCloseRejectionDialog}
        onConfirm={controller.handleReject}
        isPending={controller.rejectMutation.isPending}
      />
    </div>
  );
}
