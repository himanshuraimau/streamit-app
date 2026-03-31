import { useMemo } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { AdminSectionCard } from "../../../components/admin/AdminSectionCard";
import { AdminPaginationControls } from "../../../components/admin/AdminPaginationControls";
import type { LegalCaseStatus, LegalCaseType, LegalCaseListItem } from "../types";
import { LEGAL_CASE_STATUSES, LEGAL_CASE_TYPES } from "../constants";
import { formatDateTime } from "../utils";

interface CaseQueueSectionProps {
  query: UseQueryResult<
    | { success: true; data: { items: LegalCaseListItem[]; pagination: any } }
    | { success: false; error: string }
  >;
  statusFilter: LegalCaseStatus | "ALL";
  typeFilter: LegalCaseType | "ALL";
  search: string;
  page: number;
  onStatusFilterChange: (value: LegalCaseStatus | "ALL") => void;
  onTypeFilterChange: (value: LegalCaseType | "ALL") => void;
  onSearchChange: (value: string) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onRefresh: () => void;
  onViewDetail: (caseId: string) => void;
  onUpdateStatus: (caseId: string) => void;
  onAssignCase: (caseId: string, currentAssignee: string | null) => void;
  isUpdating: boolean;
}

export function CaseQueueSection({
  query,
  statusFilter,
  typeFilter,
  search,
  page,
  onStatusFilterChange,
  onTypeFilterChange,
  onSearchChange,
  onPreviousPage,
  onNextPage,
  onRefresh,
  onViewDetail,
  onUpdateStatus,
  onAssignCase,
  isUpdating,
}: CaseQueueSectionProps) {
  const legalCaseData = query.data && query.data.success ? query.data.data : null;
  const legalCaseError = query.data && !query.data.success ? query.data.error : null;
  const caseRows = useMemo(() => legalCaseData?.items ?? [], [legalCaseData]);

  return (
    <AdminSectionCard
      title="Case Queue"
      description="Browse and manage legal cases"
      action={
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-100 hover:bg-white/10"
        >
          Refresh
        </button>
      }
    >
      <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-4">
        <select
          aria-label="Filter legal cases by status"
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value as LegalCaseStatus | "ALL")}
          className="rounded-lg border border-white/15 bg-[#0d0d0f] px-2 py-2 text-xs text-zinc-100"
        >
          {LEGAL_CASE_STATUSES.map((status) => (
            <option key={status} value={status}>
              Status: {status}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter legal cases by type"
          value={typeFilter}
          onChange={(event) => onTypeFilterChange(event.target.value as LegalCaseType | "ALL")}
          className="rounded-lg border border-white/15 bg-[#0d0d0f] px-2 py-2 text-xs text-zinc-100"
        >
          {LEGAL_CASE_TYPES.map((type) => (
            <option key={type} value={type}>
              Type: {type}
            </option>
          ))}
        </select>

        <input
          aria-label="Search legal cases"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by code/target"
          className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 md:col-span-2"
        />
      </div>

      {legalCaseError ? (
        <div className="mb-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {legalCaseError}
        </div>
      ) : null}

      {query.isLoading ? (
        <p className="text-sm text-zinc-400">Loading legal cases...</p>
      ) : caseRows.length ? (
        <div className="space-y-3">
          {caseRows.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-white/10 bg-[#0d0d0f] p-3 text-xs"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-zinc-100">{item.referenceCode}</p>
                  <p className="text-zinc-300">{item.title}</p>
                  <p className="text-zinc-500">
                    {item.caseType} • Priority {item.priority} • {item.targetType}:{item.targetId}
                  </p>
                </div>
                <span className="rounded-full bg-white/10 px-2 py-1 text-zinc-200">
                  {item.status}
                </span>
              </div>

              <div className="mt-2 grid grid-cols-1 gap-2 text-zinc-400 md:grid-cols-3">
                <p>Created: {formatDateTime(item.createdAt)}</p>
                <p>Due: {formatDateTime(item.dueAt)}</p>
                <p>Takedowns: {item._count.takedowns}</p>
                <p>Assigned: {item.assignedTo ?? "Unassigned"}</p>
                <p>Requested By: {item.requestedBy ?? "N/A"}</p>
                <p>Resolved: {formatDateTime(item.resolvedAt)}</p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onViewDetail(item.id)}
                  className="rounded-lg border border-white/15 px-2 py-1 text-zinc-200 hover:bg-white/10"
                >
                  View Detail
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateStatus(item.id)}
                  disabled={isUpdating}
                  className="rounded-lg border border-amber-400/30 px-2 py-1 text-amber-200 hover:bg-amber-500/10 disabled:opacity-40"
                >
                  Update Status
                </button>
                <button
                  type="button"
                  onClick={() => onAssignCase(item.id, item.assignedTo)}
                  disabled={isUpdating}
                  className="rounded-lg border border-cyan-400/30 px-2 py-1 text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-40"
                >
                  Assign / Unassign
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-400">No legal cases found for current filters.</p>
      )}

      <AdminPaginationControls
        page={legalCaseData?.pagination.page ?? 1}
        totalPages={Math.max(legalCaseData?.pagination.totalPages ?? 1, 1)}
        onPreviousPage={onPreviousPage}
        onNextPage={onNextPage}
      />
    </AdminSectionCard>
  );
}
