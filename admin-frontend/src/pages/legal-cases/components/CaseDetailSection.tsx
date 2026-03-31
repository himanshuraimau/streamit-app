import type { UseQueryResult } from "@tanstack/react-query";
import { AdminSectionCard } from "../../../components/admin/AdminSectionCard";
import type { LegalCaseDetail } from "../types";
import { formatDateTime } from "../utils";

interface CaseDetailSectionProps {
  selectedCaseId: string | null;
  query: UseQueryResult<
    { success: true; data: LegalCaseDetail } | { success: false; error: string }
  >;
}

export function CaseDetailSection({ selectedCaseId, query }: CaseDetailSectionProps) {
  const legalCaseDetail = query.data && query.data.success ? query.data.data : null;
  const legalCaseDetailError = query.data && !query.data.success ? query.data.error : null;

  return (
    <AdminSectionCard
      title="Case Detail"
      description="View detailed information about a selected legal case"
    >
      {!selectedCaseId ? (
        <p className="text-sm text-zinc-400">
          Select a legal case to inspect details and linked takedowns.
        </p>
      ) : legalCaseDetailError ? (
        <p className="text-sm text-rose-300">{legalCaseDetailError}</p>
      ) : query.isLoading ? (
        <p className="text-sm text-zinc-400">Loading case detail...</p>
      ) : legalCaseDetail ? (
        <div className="space-y-3 text-xs">
          <div className="rounded-xl border border-white/10 bg-[#0d0d0f] p-3">
            <p className="font-semibold text-zinc-100">{legalCaseDetail.referenceCode}</p>
            <p className="text-zinc-300">{legalCaseDetail.title}</p>
            <p className="text-zinc-500">
              {legalCaseDetail.caseType} • {legalCaseDetail.status} • Priority{" "}
              {legalCaseDetail.priority}
            </p>
            <p className="mt-2 text-zinc-400">
              Target: {legalCaseDetail.targetType}:{legalCaseDetail.targetId}
            </p>
            <p className="text-zinc-400">
              Assigned: {legalCaseDetail.assignedTo ?? "Unassigned"}
            </p>
            {legalCaseDetail.description ? (
              <p className="mt-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-zinc-300">
                {legalCaseDetail.description}
              </p>
            ) : null}
          </div>

          <div>
            <p className="mb-2 text-zinc-400">
              Linked Takedowns ({legalCaseDetail.takedowns.length})
            </p>
            {legalCaseDetail.takedowns.length ? (
              <div className="space-y-2">
                {legalCaseDetail.takedowns.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-white/10 bg-[#0d0d0f] p-2 text-zinc-300"
                  >
                    <p>
                      {item.reason} • {item.status}
                    </p>
                    <p className="text-zinc-500">
                      {item.targetType}:{item.targetId}
                    </p>
                    <p className="text-zinc-500">Requested: {formatDateTime(item.requestedAt)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500">No takedown linked to this case yet.</p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-zinc-400">Case detail unavailable.</p>
      )}
    </AdminSectionCard>
  );
}
