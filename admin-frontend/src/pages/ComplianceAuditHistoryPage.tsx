import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  downloadComplianceAuditExport,
  generateComplianceAuditExport,
  listComplianceAuditHistory,
  type ComplianceAuditExportTokenResult,
} from "../lib/admin-api";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
}

function formatMetadata(value: Record<string, unknown> | null): string {
  if (!value) return "-";

  const entries = Object.entries(value).slice(0, 4);
  if (!entries.length) return "-";

  return entries
    .map(([key, item]) => `${key}: ${typeof item === "string" ? item : JSON.stringify(item)}`)
    .join(" | ");
}

function toIsoDateTime(value: string): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.toISOString();
}

export function ComplianceAuditHistoryPage() {
  const queryClient = useQueryClient();

  const [actionFilter, setActionFilter] = useState("");
  const [targetTypeFilter, setTargetTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");
  const [exportExpiryMinutes, setExportExpiryMinutes] = useState(30);
  const [lastExportToken, setLastExportToken] =
    useState<ComplianceAuditExportTokenResult | null>(null);

  const auditHistoryQuery = useQuery({
    queryKey: ["admin", "phase6", "audit-history", actionFilter, targetTypeFilter, search, page],
    queryFn: () =>
      listComplianceAuditHistory({
        page,
        limit: 20,
        action: actionFilter.trim() || undefined,
        targetType: targetTypeFilter.trim() || undefined,
        search: search.trim() || undefined,
      }),
  });

  const generateExportMutation = useMutation({
    mutationFn: generateComplianceAuditExport,
    onSuccess: (response) => {
      if (response.success) {
        setLastExportToken(response.data);
      }
    },
  });

  const downloadExportMutation = useMutation({
    mutationFn: downloadComplianceAuditExport,
  });

  const auditData =
    auditHistoryQuery.data && auditHistoryQuery.data.success ? auditHistoryQuery.data.data : null;
  const auditError =
    auditHistoryQuery.data && !auditHistoryQuery.data.success ? auditHistoryQuery.data.error : null;

  const items = useMemo(() => auditData?.items ?? [], [auditData]);

  const handleGenerateExport = async () => {
    const response = await generateExportMutation.mutateAsync({
      action: actionFilter.trim() || undefined,
      targetType: targetTypeFilter.trim() || undefined,
      search: search.trim() || undefined,
      from: toIsoDateTime(exportFrom),
      to: toIsoDateTime(exportTo),
      expiresInMinutes: exportExpiryMinutes,
    });

    if (!response.success) {
      window.alert(response.error);
      return;
    }

    setLastExportToken(response.data);
  };

  const handleDownloadSignedExport = async () => {
    if (!lastExportToken) {
      window.alert("Generate a signed token first.");
      return;
    }

    const response = await downloadExportMutation.mutateAsync(lastExportToken.token);
    if (!response.success) {
      window.alert(response.error);
      return;
    }

    const downloadUrl = URL.createObjectURL(response.data.blob);
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = response.data.fileName;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div>
      <header className="mb-6 border-b border-white/10 pb-5">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Phase 6</p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-50">Compliance Change History</h2>
      </header>

      <section className="rounded-2xl border border-white/10 bg-[#111113] p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-zinc-400">
            Sensitive Action Audit Trail
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "audit-history"] });
              }}
              className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-100 hover:bg-white/10"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => void handleGenerateExport()}
              disabled={generateExportMutation.isPending}
              className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-40"
            >
              {generateExportMutation.isPending ? "Signing..." : "Generate Signed Export"}
            </button>
            <button
              type="button"
              onClick={() => void handleDownloadSignedExport()}
              disabled={!lastExportToken || downloadExportMutation.isPending}
              className="rounded-xl border border-cyan-300/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-100 hover:bg-cyan-500/20 disabled:opacity-40"
            >
              {downloadExportMutation.isPending ? "Downloading..." : "Download Export"}
            </button>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-3">
          <label className="text-xs text-zinc-400" htmlFor="audit-export-from">
            Export From
            <input
              id="audit-export-from"
              type="datetime-local"
              value={exportFrom}
              onChange={(event) => setExportFrom(event.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100"
            />
          </label>
          <label className="text-xs text-zinc-400" htmlFor="audit-export-to">
            Export To
            <input
              id="audit-export-to"
              type="datetime-local"
              value={exportTo}
              onChange={(event) => setExportTo(event.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100"
            />
          </label>
          <label className="text-xs text-zinc-400" htmlFor="audit-export-expiry">
            Link Expiry (minutes)
            <input
              id="audit-export-expiry"
              type="number"
              min={5}
              max={120}
              value={exportExpiryMinutes}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (Number.isNaN(next)) return;
                setExportExpiryMinutes(Math.min(Math.max(next, 5), 120));
              }}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100"
            />
          </label>
        </div>

        {lastExportToken ? (
          <div className="mb-4 rounded-xl border border-emerald-300/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
            Signed export ready. Token expires at {formatDateTime(lastExportToken.expiresAt)} and will include up
            to {lastExportToken.estimatedRows} rows.
          </div>
        ) : null}

        <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-3">
          <input
            aria-label="Filter audit action"
            value={actionFilter}
            onChange={(event) => {
              setPage(1);
              setActionFilter(event.target.value);
            }}
            placeholder="Filter by action"
            className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500"
          />
          <input
            aria-label="Filter audit target type"
            value={targetTypeFilter}
            onChange={(event) => {
              setPage(1);
              setTargetTypeFilter(event.target.value);
            }}
            placeholder="Filter by target type"
            className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500"
          />
          <input
            aria-label="Search audit entries"
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Search description/target/admin"
            className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500"
          />
        </div>

        {auditError ? (
          <div className="mb-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {auditError}
          </div>
        ) : null}

        {auditHistoryQuery.isLoading ? (
          <p className="text-sm text-zinc-400">Loading audit history...</p>
        ) : items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-225 text-left text-xs">
              <thead className="text-zinc-500">
                <tr>
                  <th className="pb-2">When</th>
                  <th className="pb-2">Action</th>
                  <th className="pb-2">Target</th>
                  <th className="pb-2">Admin</th>
                  <th className="pb-2">Description</th>
                  <th className="pb-2">Metadata</th>
                  <th className="pb-2">IP</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-white/5 align-top text-zinc-300">
                    <td className="py-2 pr-3">{formatDateTime(item.createdAt)}</td>
                    <td className="py-2 pr-3 text-zinc-200">{item.action}</td>
                    <td className="py-2 pr-3">
                      <p>{item.targetType}</p>
                      <p className="text-zinc-500">{item.targetId}</p>
                    </td>
                    <td className="py-2 pr-3">
                      <p>{item.admin.name}</p>
                      <p className="text-zinc-500">@{item.admin.username}</p>
                    </td>
                    <td className="py-2 pr-3">{item.description}</td>
                    <td className="py-2 pr-3 text-zinc-500">{formatMetadata(item.metadata)}</td>
                    <td className="py-2 pr-3 text-zinc-500">{item.ipAddress ?? "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">No audit records found for current filters.</p>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
          <p className="text-zinc-400">
            Page {auditData?.pagination.page ?? 1} / {Math.max(auditData?.pagination.totalPages ?? 1, 1)}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={(auditData?.pagination.page ?? 1) <= 1}
              className="rounded-md border border-white/15 px-2 py-1 text-zinc-200 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(prev + 1, auditData?.pagination.totalPages ?? 1))}
              disabled={(auditData?.pagination.page ?? 1) >= (auditData?.pagination.totalPages ?? 1)}
              className="rounded-md border border-white/15 px-2 py-1 text-zinc-200 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
