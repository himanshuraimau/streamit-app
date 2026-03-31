import type { UseQueryResult } from "@tanstack/react-query";
import { AdminSectionCard } from "../../../components/admin/AdminSectionCard";
import type { UserDetail } from "../types";

interface UserDetailSectionProps {
  query: UseQueryResult<{ success: true; data: UserDetail } | { success: false; error: string }>;
  selectedDetail: UserDetail | null;
  onToggleSuspension: (userId: string, currentlySuspended: boolean) => void;
  isPending: boolean;
}

export function UserDetailSection({
  query,
  selectedDetail,
  onToggleSuspension,
  isPending,
}: UserDetailSectionProps) {
  const detailError = query.data && !query.data.success ? query.data.error : null;

  return (
    <AdminSectionCard title="User Detail" description="View and manage selected user details">
      {detailError ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {detailError}
        </div>
      ) : query.isLoading ? (
        <p className="text-sm text-zinc-400">Loading user detail...</p>
      ) : selectedDetail ? (
        <div className="space-y-4 text-sm text-zinc-300">
          <div>
            <p className="text-zinc-500">Name</p>
            <p className="text-zinc-100">{selectedDetail.name}</p>
          </div>
          <div>
            <p className="text-zinc-500">Email</p>
            <p>{selectedDetail.email}</p>
          </div>
          <div>
            <p className="text-zinc-500">Role</p>
            <p>{selectedDetail.role}</p>
          </div>
          <div>
            <p className="text-zinc-500">Current State</p>
            <p>{selectedDetail.isSuspended ? "SUSPENDED" : "ACTIVE"}</p>
          </div>
          <div>
            <p className="text-zinc-500">Suspension Reason</p>
            <p>{selectedDetail.suspendedReason ?? "N/A"}</p>
          </div>
          <div>
            <p className="text-zinc-500">Wallet Balance</p>
            <p>{selectedDetail.coinWallet?.balance ?? 0}</p>
          </div>
          <div>
            <p className="text-zinc-500">Creator Application</p>
            <p>{selectedDetail.creatorApplication?.status ?? "NONE"}</p>
          </div>

          <button
            type="button"
            onClick={() => onToggleSuspension(selectedDetail.id, selectedDetail.isSuspended)}
            disabled={isPending}
            className={`w-full rounded-xl px-3 py-2 text-sm font-medium text-white ${
              selectedDetail.isSuspended
                ? "bg-emerald-500/80 hover:bg-emerald-500"
                : "bg-red-500/80 hover:bg-red-500"
            } disabled:opacity-40`}
          >
            {isPending
              ? "Updating..."
              : selectedDetail.isSuspended
                ? "Unsuspend User"
                : "Suspend User"}
          </button>
        </div>
      ) : (
        <p className="text-sm text-zinc-400">Select a user to view details.</p>
      )}
    </AdminSectionCard>
  );
}
