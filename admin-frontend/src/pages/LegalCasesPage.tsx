import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createLegalCase,
  getLegalCaseDetail,
  listLegalCases,
  updateLegalCase,
  type LegalCaseStatus,
  type LegalCaseType,
} from "../lib/admin-api";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
}

function toIsoDateTime(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

const LEGAL_CASE_STATUSES: Array<LegalCaseStatus | "ALL"> = [
  "ALL",
  "OPEN",
  "UNDER_REVIEW",
  "ACTION_REQUIRED",
  "RESOLVED",
  "CLOSED",
];

const LEGAL_CASE_TYPES: Array<LegalCaseType | "ALL"> = [
  "ALL",
  "COPYRIGHT",
  "PLATFORM_POLICY",
  "REGULATORY",
  "PRIVACY",
  "FRAUD",
  "OTHER",
];

const UPDATABLE_STATUSES: LegalCaseStatus[] = [
  "OPEN",
  "UNDER_REVIEW",
  "ACTION_REQUIRED",
  "RESOLVED",
  "CLOSED",
];

export function LegalCasesPage() {
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<LegalCaseStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<LegalCaseType | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [selectedLegalCaseId, setSelectedLegalCaseId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [caseType, setCaseType] = useState<LegalCaseType>("COPYRIGHT");
  const [priority, setPriority] = useState("3");
  const [targetType, setTargetType] = useState("post");
  const [targetId, setTargetId] = useState("");
  const [requestedBy, setRequestedBy] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueAt, setDueAt] = useState("");

  const legalCasesQuery = useQuery({
    queryKey: ["admin", "phase6", "legal-cases", statusFilter, typeFilter, search, page],
    queryFn: () =>
      listLegalCases({
        page,
        limit: 10,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        caseType: typeFilter === "ALL" ? undefined : typeFilter,
        search: search.trim() || undefined,
      }),
  });

  const legalCaseDetailQuery = useQuery({
    queryKey: ["admin", "phase6", "legal-case-detail", selectedLegalCaseId],
    queryFn: () => getLegalCaseDetail(selectedLegalCaseId as string),
    enabled: Boolean(selectedLegalCaseId),
  });

  const createCaseMutation = useMutation({
    mutationFn: createLegalCase,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "legal-cases"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "audit-history"] });
    },
  });

  const updateCaseMutation = useMutation({
    mutationFn: (payload: {
      legalCaseId: string;
      body: Parameters<typeof updateLegalCase>[1];
    }) => updateLegalCase(payload.legalCaseId, payload.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "legal-cases"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "legal-case-detail"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "audit-history"] });
    },
  });

  const legalCaseData =
    legalCasesQuery.data && legalCasesQuery.data.success ? legalCasesQuery.data.data : null;
  const legalCaseError =
    legalCasesQuery.data && !legalCasesQuery.data.success ? legalCasesQuery.data.error : null;

  const legalCaseDetail =
    legalCaseDetailQuery.data && legalCaseDetailQuery.data.success
      ? legalCaseDetailQuery.data.data
      : null;
  const legalCaseDetailError =
    legalCaseDetailQuery.data && !legalCaseDetailQuery.data.success
      ? legalCaseDetailQuery.data.error
      : null;

  const caseRows = useMemo(() => legalCaseData?.items ?? [], [legalCaseData]);

  const handleCreateLegalCase = async () => {
    const normalizedTitle = title.trim();
    const normalizedTargetType = targetType.trim();
    const normalizedTargetId = targetId.trim();

    if (normalizedTitle.length < 5) {
      window.alert("Title must be at least 5 characters.");
      return;
    }

    if (normalizedTargetType.length < 2 || normalizedTargetId.length < 1) {
      window.alert("Target type and target id are required.");
      return;
    }

    const numericPriority = Number(priority);
    if (!Number.isInteger(numericPriority) || numericPriority < 1 || numericPriority > 5) {
      window.alert("Priority must be an integer between 1 and 5.");
      return;
    }

    const response = await createCaseMutation.mutateAsync({
      title: normalizedTitle,
      description: description.trim() || undefined,
      caseType,
      priority: numericPriority,
      targetType: normalizedTargetType,
      targetId: normalizedTargetId,
      requestedBy: requestedBy.trim() || undefined,
      assignedTo: assignedTo.trim() || undefined,
      dueAt: toIsoDateTime(dueAt),
    });

    if (!response.success) {
      window.alert(response.error);
      return;
    }

    setTitle("");
    setDescription("");
    setCaseType("COPYRIGHT");
    setPriority("3");
    setTargetType("post");
    setTargetId("");
    setRequestedBy("");
    setAssignedTo("");
    setDueAt("");
    setSelectedLegalCaseId(response.data.id);
  };

  const handleUpdateStatus = async (legalCaseId: string) => {
    const allowed = UPDATABLE_STATUSES.join(", ");
    const input = window.prompt(`New status (${allowed}):`, "UNDER_REVIEW");
    if (!input) return;

    const status = input.trim().toUpperCase() as LegalCaseStatus;
    if (!UPDATABLE_STATUSES.includes(status)) {
      window.alert("Invalid status value.");
      return;
    }

    const resolutionNote =
      status === "RESOLVED" || status === "CLOSED"
        ? window.prompt("Optional resolution note:", "Resolved by legal admin")?.trim() || undefined
        : undefined;

    const response = await updateCaseMutation.mutateAsync({
      legalCaseId,
      body: {
        status,
        resolutionNote,
      },
    });

    if (!response.success) {
      window.alert(response.error);
    }
  };

  const handleAssignCase = async (legalCaseId: string, currentAssignee: string | null) => {
    const input = window.prompt(
      "Assignee admin user ID (leave empty to unassign):",
      currentAssignee ?? "",
    );
    if (input === null) return;

    const response = await updateCaseMutation.mutateAsync({
      legalCaseId,
      body: {
        assignedTo: input.trim() || null,
      },
    });

    if (!response.success) {
      window.alert(response.error);
    }
  };

  return (
    <div>
      <header className="mb-6 border-b border-white/10 pb-5">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Phase 6</p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-50">Legal Case Workspace</h2>
      </header>

      <section className="mb-4 rounded-2xl border border-white/10 bg-[#111113] p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-zinc-400">
            Case Queue
          </h3>
          <button
            type="button"
            onClick={() => {
              void queryClient.invalidateQueries({
                queryKey: ["admin", "phase6", "legal-cases"],
              });
            }}
            className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-100 hover:bg-white/10"
          >
            Refresh
          </button>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-4">
          <select
            aria-label="Filter legal cases by status"
            value={statusFilter}
            onChange={(event) => {
              setPage(1);
              setStatusFilter(event.target.value as LegalCaseStatus | "ALL");
            }}
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
            onChange={(event) => {
              setPage(1);
              setTypeFilter(event.target.value as LegalCaseType | "ALL");
            }}
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
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Search by code/target"
            className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 md:col-span-2"
          />
        </div>

        {legalCaseError ? (
          <div className="mb-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {legalCaseError}
          </div>
        ) : null}

        {legalCasesQuery.isLoading ? (
          <p className="text-sm text-zinc-400">Loading legal cases...</p>
        ) : caseRows.length ? (
          <div className="space-y-3">
            {caseRows.map((item) => (
              <article key={item.id} className="rounded-xl border border-white/10 bg-[#0d0d0f] p-3 text-xs">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-zinc-100">{item.referenceCode}</p>
                    <p className="text-zinc-300">{item.title}</p>
                    <p className="text-zinc-500">
                      {item.caseType} • Priority {item.priority} • {item.targetType}:{item.targetId}
                    </p>
                  </div>
                  <span className="rounded-full bg-white/10 px-2 py-1 text-zinc-200">{item.status}</span>
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
                    onClick={() => setSelectedLegalCaseId(item.id)}
                    className="rounded-lg border border-white/15 px-2 py-1 text-zinc-200 hover:bg-white/10"
                  >
                    View Detail
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleUpdateStatus(item.id)}
                    disabled={updateCaseMutation.isPending}
                    className="rounded-lg border border-amber-400/30 px-2 py-1 text-amber-200 hover:bg-amber-500/10 disabled:opacity-40"
                  >
                    Update Status
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleAssignCase(item.id, item.assignedTo)}
                    disabled={updateCaseMutation.isPending}
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

        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
          <p className="text-zinc-400">
            Page {legalCaseData?.pagination.page ?? 1} / {Math.max(legalCaseData?.pagination.totalPages ?? 1, 1)}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={(legalCaseData?.pagination.page ?? 1) <= 1}
              className="rounded-md border border-white/15 px-2 py-1 text-zinc-200 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() =>
                setPage((prev) => Math.min(prev + 1, legalCaseData?.pagination.totalPages ?? 1))
              }
              disabled={(legalCaseData?.pagination.page ?? 1) >= (legalCaseData?.pagination.totalPages ?? 1)}
              className="rounded-md border border-white/15 px-2 py-1 text-zinc-200 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-[#111113] p-4">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-[0.14em] text-zinc-400">
            Create Legal Case
          </h3>

          <div className="space-y-3 text-xs">
            <label className="block text-zinc-400">
              Title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
              />
            </label>

            <label className="block text-zinc-400">
              Description
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
              />
            </label>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="text-zinc-400">
                Case Type
                <select
                  value={caseType}
                  onChange={(event) => setCaseType(event.target.value as LegalCaseType)}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
                >
                  {LEGAL_CASE_TYPES.filter((value) => value !== "ALL").map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-zinc-400">
                Priority (1-5)
                <input
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
                />
              </label>

              <label className="text-zinc-400">
                Target Type
                <input
                  value={targetType}
                  onChange={(event) => setTargetType(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
                />
              </label>

              <label className="text-zinc-400">
                Target ID
                <input
                  value={targetId}
                  onChange={(event) => setTargetId(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
                />
              </label>

              <label className="text-zinc-400">
                Requested By
                <input
                  value={requestedBy}
                  onChange={(event) => setRequestedBy(event.target.value)}
                  placeholder="Optional user/admin id"
                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
                />
              </label>

              <label className="text-zinc-400">
                Assigned To
                <input
                  value={assignedTo}
                  onChange={(event) => setAssignedTo(event.target.value)}
                  placeholder="Optional admin id"
                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
                />
              </label>

              <label className="text-zinc-400 md:col-span-2">
                Due At
                <input
                  type="datetime-local"
                  value={dueAt}
                  onChange={(event) => setDueAt(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => void handleCreateLegalCase()}
              disabled={createCaseMutation.isPending}
              className="w-full rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-40"
            >
              {createCaseMutation.isPending ? "Creating..." : "Create Legal Case"}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#111113] p-4">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-[0.14em] text-zinc-400">
            Case Detail
          </h3>

          {!selectedLegalCaseId ? (
            <p className="text-sm text-zinc-400">Select a legal case to inspect details and linked takedowns.</p>
          ) : legalCaseDetailError ? (
            <p className="text-sm text-rose-300">{legalCaseDetailError}</p>
          ) : legalCaseDetailQuery.isLoading ? (
            <p className="text-sm text-zinc-400">Loading case detail...</p>
          ) : legalCaseDetail ? (
            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-white/10 bg-[#0d0d0f] p-3">
                <p className="font-semibold text-zinc-100">{legalCaseDetail.referenceCode}</p>
                <p className="text-zinc-300">{legalCaseDetail.title}</p>
                <p className="text-zinc-500">
                  {legalCaseDetail.caseType} • {legalCaseDetail.status} • Priority {legalCaseDetail.priority}
                </p>
                <p className="mt-2 text-zinc-400">Target: {legalCaseDetail.targetType}:{legalCaseDetail.targetId}</p>
                <p className="text-zinc-400">Assigned: {legalCaseDetail.assignedTo ?? "Unassigned"}</p>
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
                      <div key={item.id} className="rounded-lg border border-white/10 bg-[#0d0d0f] p-2 text-zinc-300">
                        <p>{item.reason} • {item.status}</p>
                        <p className="text-zinc-500">{item.targetType}:{item.targetId}</p>
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
        </section>
      </div>
    </div>
  );
}
