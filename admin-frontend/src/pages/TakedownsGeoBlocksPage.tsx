import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  applyTakedownAction,
  createGeoBlock,
  createTakedown,
  listGeoBlocks,
  listTakedowns,
  removeGeoBlock,
  updateGeoBlock,
  type GeoBlockReason,
  type GeoBlockStatus,
  type TakedownReason,
  type TakedownStatus,
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

const TAKEDOWN_STATUS_OPTIONS: Array<TakedownStatus | "ALL"> = [
  "ALL",
  "PENDING",
  "EXECUTED",
  "APPEALED",
  "REVERSED",
  "REJECTED",
];

const TAKEDOWN_REASON_OPTIONS: Array<TakedownReason | "ALL"> = [
  "ALL",
  "COPYRIGHT",
  "LEGAL_ORDER",
  "PLATFORM_POLICY",
  "SAFETY",
  "FRAUD",
  "OTHER",
];

const GEOBLOCK_STATUS_OPTIONS: Array<GeoBlockStatus | "ALL"> = [
  "ALL",
  "ACTIVE",
  "DISABLED",
];

const GEOBLOCK_REASON_OPTIONS: Array<GeoBlockReason | "ALL"> = [
  "ALL",
  "LEGAL",
  "LICENSING",
  "REGULATORY",
  "SAFETY",
  "OTHER",
];

export function TakedownsGeoBlocksPage() {
  const queryClient = useQueryClient();

  const [takedownStatus, setTakedownStatus] = useState<TakedownStatus | "ALL">("ALL");
  const [takedownReason, setTakedownReason] = useState<TakedownReason | "ALL">("ALL");
  const [takedownSearch, setTakedownSearch] = useState("");
  const [takedownPage, setTakedownPage] = useState(1);

  const [geoStatus, setGeoStatus] = useState<GeoBlockStatus | "ALL">("ALL");
  const [geoReason, setGeoReason] = useState<GeoBlockReason | "ALL">("ALL");
  const [geoCountryCode, setGeoCountryCode] = useState("");
  const [geoSearch, setGeoSearch] = useState("");
  const [geoPage, setGeoPage] = useState(1);

  const [newTakedownLegalCaseId, setNewTakedownLegalCaseId] = useState("");
  const [newTakedownTargetType, setNewTakedownTargetType] = useState("post");
  const [newTakedownTargetId, setNewTakedownTargetId] = useState("");
  const [newTakedownReason, setNewTakedownReason] = useState<TakedownReason>("COPYRIGHT");
  const [newTakedownNote, setNewTakedownNote] = useState("");

  const [newGeoTargetType, setNewGeoTargetType] = useState("stream");
  const [newGeoTargetId, setNewGeoTargetId] = useState("");
  const [newGeoCountryCode, setNewGeoCountryCode] = useState("IN");
  const [newGeoReason, setNewGeoReason] = useState<GeoBlockReason>("REGULATORY");
  const [newGeoNote, setNewGeoNote] = useState("");
  const [newGeoExpiresAt, setNewGeoExpiresAt] = useState("");

  const takedownsQuery = useQuery({
    queryKey: [
      "admin",
      "phase6",
      "takedowns",
      takedownStatus,
      takedownReason,
      takedownSearch,
      takedownPage,
    ],
    queryFn: () =>
      listTakedowns({
        page: takedownPage,
        limit: 10,
        status: takedownStatus === "ALL" ? undefined : takedownStatus,
        reason: takedownReason === "ALL" ? undefined : takedownReason,
        search: takedownSearch.trim() || undefined,
      }),
  });

  const geoBlocksQuery = useQuery({
    queryKey: [
      "admin",
      "phase6",
      "geoblocks",
      geoStatus,
      geoReason,
      geoCountryCode,
      geoSearch,
      geoPage,
    ],
    queryFn: () =>
      listGeoBlocks({
        page: geoPage,
        limit: 10,
        status: geoStatus === "ALL" ? undefined : geoStatus,
        reason: geoReason === "ALL" ? undefined : geoReason,
        countryCode: geoCountryCode.trim() || undefined,
        search: geoSearch.trim() || undefined,
      }),
  });

  const createTakedownMutation = useMutation({
    mutationFn: createTakedown,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "takedowns"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "legal-cases"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "audit-history"] });
    },
  });

  const takedownActionMutation = useMutation({
    mutationFn: (payload: {
      takedownId: string;
      action: "EXECUTE" | "APPEAL" | "REVERSE" | "REJECT";
      note?: string;
    }) =>
      applyTakedownAction(payload.takedownId, {
        action: payload.action,
        note: payload.note,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "takedowns"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "legal-cases"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "legal-case-detail"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "audit-history"] });
    },
  });

  const createGeoBlockMutation = useMutation({
    mutationFn: createGeoBlock,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "geoblocks"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "audit-history"] });
    },
  });

  const updateGeoBlockMutation = useMutation({
    mutationFn: (payload: {
      geoBlockId: string;
      body: Parameters<typeof updateGeoBlock>[1];
    }) => updateGeoBlock(payload.geoBlockId, payload.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "geoblocks"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "audit-history"] });
    },
  });

  const removeGeoBlockMutation = useMutation({
    mutationFn: removeGeoBlock,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "geoblocks"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "audit-history"] });
    },
  });

  const takedownData =
    takedownsQuery.data && takedownsQuery.data.success ? takedownsQuery.data.data : null;
  const takedownError =
    takedownsQuery.data && !takedownsQuery.data.success ? takedownsQuery.data.error : null;

  const geoData =
    geoBlocksQuery.data && geoBlocksQuery.data.success ? geoBlocksQuery.data.data : null;
  const geoError = geoBlocksQuery.data && !geoBlocksQuery.data.success ? geoBlocksQuery.data.error : null;

  const takedownRows = useMemo(() => takedownData?.items ?? [], [takedownData]);
  const geoRows = useMemo(() => geoData?.items ?? [], [geoData]);

  const handleCreateTakedown = async () => {
    const targetType = newTakedownTargetType.trim();
    const targetId = newTakedownTargetId.trim();

    if (targetType.length < 2 || targetId.length < 1) {
      window.alert("Target type and target id are required.");
      return;
    }

    const response = await createTakedownMutation.mutateAsync({
      legalCaseId: newTakedownLegalCaseId.trim() || undefined,
      targetType,
      targetId,
      reason: newTakedownReason,
      note: newTakedownNote.trim() || undefined,
    });

    if (!response.success) {
      window.alert(response.error);
      return;
    }

    setNewTakedownLegalCaseId("");
    setNewTakedownTargetType("post");
    setNewTakedownTargetId("");
    setNewTakedownReason("COPYRIGHT");
    setNewTakedownNote("");
  };

  const handleTakedownAction = async (
    takedownId: string,
    action: "EXECUTE" | "APPEAL" | "REVERSE" | "REJECT",
  ) => {
    const requiresNote = action === "EXECUTE" || action === "REVERSE";
    const promptLabel = requiresNote ? "Action note (required):" : "Action note (optional):";
    const noteInput = window.prompt(promptLabel, requiresNote ? "Legal action executed" : "");
    if (noteInput === null) return;

    const note = noteInput.trim();

    if (requiresNote && note.length < 3) {
      window.alert("This action requires a note with at least 3 characters.");
      return;
    }

    const response = await takedownActionMutation.mutateAsync({
      takedownId,
      action,
      note: note || undefined,
    });

    if (!response.success) {
      window.alert(response.error);
    }
  };

  const handleCreateGeoBlock = async () => {
    const targetType = newGeoTargetType.trim();
    const targetId = newGeoTargetId.trim();
    const countryCode = newGeoCountryCode.trim().toUpperCase();

    if (targetType.length < 2 || targetId.length < 1 || countryCode.length !== 2) {
      window.alert("Target type, target id, and 2-letter country code are required.");
      return;
    }

    const response = await createGeoBlockMutation.mutateAsync({
      targetType,
      targetId,
      countryCode,
      reason: newGeoReason,
      note: newGeoNote.trim() || undefined,
      expiresAt: toIsoDateTime(newGeoExpiresAt),
    });

    if (!response.success) {
      window.alert(response.error);
      return;
    }

    setNewGeoTargetType("stream");
    setNewGeoTargetId("");
    setNewGeoCountryCode("IN");
    setNewGeoReason("REGULATORY");
    setNewGeoNote("");
    setNewGeoExpiresAt("");
  };

  const handleToggleGeoBlockStatus = async (geoBlockId: string, status: GeoBlockStatus) => {
    const nextStatus: GeoBlockStatus = status === "ACTIVE" ? "DISABLED" : "ACTIVE";

    const response = await updateGeoBlockMutation.mutateAsync({
      geoBlockId,
      body: {
        status: nextStatus,
      },
    });

    if (!response.success) {
      window.alert(response.error);
    }
  };

  const handleEditGeoBlockReason = async (geoBlockId: string, currentReason: GeoBlockReason) => {
    const input = window.prompt(
      `Reason (${GEOBLOCK_REASON_OPTIONS.filter((item) => item !== "ALL").join(", ")}):`,
      currentReason,
    );

    if (!input) return;

    const nextReason = input.trim().toUpperCase() as GeoBlockReason;
    if (!GEOBLOCK_REASON_OPTIONS.filter((item) => item !== "ALL").includes(nextReason)) {
      window.alert("Invalid geoblock reason value.");
      return;
    }

    const response = await updateGeoBlockMutation.mutateAsync({
      geoBlockId,
      body: {
        reason: nextReason,
      },
    });

    if (!response.success) {
      window.alert(response.error);
    }
  };

  const handleRemoveGeoBlock = async (geoBlockId: string) => {
    const confirmed = window.confirm("Remove this geoblock rule permanently?");
    if (!confirmed) return;

    const response = await removeGeoBlockMutation.mutateAsync(geoBlockId);
    if (!response.success) {
      window.alert(response.error);
    }
  };

  return (
    <div>
      <header className="mb-6 border-b border-white/10 pb-5">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Phase 6</p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-50">Takedowns And Geo-Blocks</h2>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-[#111113] p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-zinc-400">
              Takedown Operations
            </h3>
            <button
              type="button"
              onClick={() => {
                void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "takedowns"] });
              }}
              className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-100 hover:bg-white/10"
            >
              Refresh
            </button>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-3">
            <select
              aria-label="Filter takedowns by status"
              value={takedownStatus}
              onChange={(event) => {
                setTakedownPage(1);
                setTakedownStatus(event.target.value as TakedownStatus | "ALL");
              }}
              className="rounded-lg border border-white/15 bg-[#0d0d0f] px-2 py-2 text-xs text-zinc-100"
            >
              {TAKEDOWN_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  Status: {option}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter takedowns by reason"
              value={takedownReason}
              onChange={(event) => {
                setTakedownPage(1);
                setTakedownReason(event.target.value as TakedownReason | "ALL");
              }}
              className="rounded-lg border border-white/15 bg-[#0d0d0f] px-2 py-2 text-xs text-zinc-100"
            >
              {TAKEDOWN_REASON_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  Reason: {option}
                </option>
              ))}
            </select>

            <input
              aria-label="Search takedown requests"
              value={takedownSearch}
              onChange={(event) => {
                setTakedownPage(1);
                setTakedownSearch(event.target.value);
              }}
              placeholder="Search target/note"
              className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500"
            />
          </div>

          {takedownError ? (
            <div className="mb-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {takedownError}
            </div>
          ) : null}

          {takedownsQuery.isLoading ? (
            <p className="text-sm text-zinc-400">Loading takedowns...</p>
          ) : takedownRows.length ? (
            <div className="space-y-3">
              {takedownRows.map((item) => {
                const canExecute = item.status === "PENDING" || item.status === "APPEALED";
                const canAppeal = item.status === "EXECUTED";
                const canReverse = item.status === "EXECUTED" || item.status === "APPEALED";
                const canReject = item.status === "PENDING" || item.status === "APPEALED";

                return (
                  <article key={item.id} className="rounded-xl border border-white/10 bg-[#0d0d0f] p-3 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-zinc-100">
                          {item.targetType}:{item.targetId}
                        </p>
                        <p className="text-zinc-400">
                          {item.reason} • Requested {formatDateTime(item.requestedAt)}
                        </p>
                      </div>
                      <span className="rounded-full bg-white/10 px-2 py-1 text-zinc-200">{item.status}</span>
                    </div>

                    <div className="mt-2 grid grid-cols-1 gap-2 text-zinc-400 md:grid-cols-2">
                      <p>Legal Case: {item.legalCase?.referenceCode ?? "N/A"}</p>
                      <p>Executed At: {formatDateTime(item.executedAt)}</p>
                      <p>Appealed At: {formatDateTime(item.appealedAt)}</p>
                      <p>Reversed At: {formatDateTime(item.reversedAt)}</p>
                    </div>

                    {item.note ? (
                      <p className="mt-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-zinc-300">
                        Note: {item.note}
                      </p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {canExecute ? (
                        <button
                          type="button"
                          onClick={() => void handleTakedownAction(item.id, "EXECUTE")}
                          disabled={takedownActionMutation.isPending}
                          className="rounded-lg border border-emerald-400/30 px-2 py-1 text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-40"
                        >
                          Execute
                        </button>
                      ) : null}
                      {canAppeal ? (
                        <button
                          type="button"
                          onClick={() => void handleTakedownAction(item.id, "APPEAL")}
                          disabled={takedownActionMutation.isPending}
                          className="rounded-lg border border-amber-400/30 px-2 py-1 text-amber-200 hover:bg-amber-500/10 disabled:opacity-40"
                        >
                          Appeal
                        </button>
                      ) : null}
                      {canReverse ? (
                        <button
                          type="button"
                          onClick={() => void handleTakedownAction(item.id, "REVERSE")}
                          disabled={takedownActionMutation.isPending}
                          className="rounded-lg border border-rose-400/30 px-2 py-1 text-rose-200 hover:bg-rose-500/10 disabled:opacity-40"
                        >
                          Reverse
                        </button>
                      ) : null}
                      {canReject ? (
                        <button
                          type="button"
                          onClick={() => void handleTakedownAction(item.id, "REJECT")}
                          disabled={takedownActionMutation.isPending}
                          className="rounded-lg border border-white/15 px-2 py-1 text-zinc-200 hover:bg-white/10 disabled:opacity-40"
                        >
                          Reject
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-zinc-400">No takedowns found for current filters.</p>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
            <p className="text-zinc-400">
              Page {takedownData?.pagination.page ?? 1} / {Math.max(takedownData?.pagination.totalPages ?? 1, 1)}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTakedownPage((prev) => Math.max(prev - 1, 1))}
                disabled={(takedownData?.pagination.page ?? 1) <= 1}
                className="rounded-md border border-white/15 px-2 py-1 text-zinc-200 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() =>
                  setTakedownPage((prev) => Math.min(prev + 1, takedownData?.pagination.totalPages ?? 1))
                }
                disabled={(takedownData?.pagination.page ?? 1) >= (takedownData?.pagination.totalPages ?? 1)}
                className="rounded-md border border-white/15 px-2 py-1 text-zinc-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>

          <div className="mt-4 border-t border-white/10 pt-4">
            <h4 className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
              Create Takedown Request
            </h4>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <input
                aria-label="Related legal case id"
                value={newTakedownLegalCaseId}
                onChange={(event) => setNewTakedownLegalCaseId(event.target.value)}
                placeholder="Legal case ID (optional)"
                className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100"
              />
              <select
                aria-label="New takedown reason"
                value={newTakedownReason}
                onChange={(event) => setNewTakedownReason(event.target.value as TakedownReason)}
                className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100"
              >
                {TAKEDOWN_REASON_OPTIONS.filter((option) => option !== "ALL").map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <input
                aria-label="New takedown target type"
                value={newTakedownTargetType}
                onChange={(event) => setNewTakedownTargetType(event.target.value)}
                placeholder="Target type"
                className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100"
              />
              <input
                aria-label="New takedown target id"
                value={newTakedownTargetId}
                onChange={(event) => setNewTakedownTargetId(event.target.value)}
                placeholder="Target id"
                className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100"
              />
              <input
                aria-label="New takedown note"
                value={newTakedownNote}
                onChange={(event) => setNewTakedownNote(event.target.value)}
                placeholder="Note (optional)"
                className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100 md:col-span-2"
              />
            </div>
            <button
              type="button"
              onClick={() => void handleCreateTakedown()}
              disabled={createTakedownMutation.isPending}
              className="mt-3 w-full rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-500/20 disabled:opacity-40"
            >
              {createTakedownMutation.isPending ? "Creating..." : "Create Takedown"}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#111113] p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-zinc-400">
              Geo-Block Rules
            </h3>
            <button
              type="button"
              onClick={() => {
                void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "geoblocks"] });
              }}
              className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-100 hover:bg-white/10"
            >
              Refresh
            </button>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-4">
            <select
              aria-label="Filter geoblocks by status"
              value={geoStatus}
              onChange={(event) => {
                setGeoPage(1);
                setGeoStatus(event.target.value as GeoBlockStatus | "ALL");
              }}
              className="rounded-lg border border-white/15 bg-[#0d0d0f] px-2 py-2 text-xs text-zinc-100"
            >
              {GEOBLOCK_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  Status: {option}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter geoblocks by reason"
              value={geoReason}
              onChange={(event) => {
                setGeoPage(1);
                setGeoReason(event.target.value as GeoBlockReason | "ALL");
              }}
              className="rounded-lg border border-white/15 bg-[#0d0d0f] px-2 py-2 text-xs text-zinc-100"
            >
              {GEOBLOCK_REASON_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  Reason: {option}
                </option>
              ))}
            </select>

            <input
              aria-label="Filter geoblocks by country code"
              value={geoCountryCode}
              onChange={(event) => {
                setGeoPage(1);
                setGeoCountryCode(event.target.value.toUpperCase());
              }}
              placeholder="Country code"
              className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100"
            />

            <input
              aria-label="Search geoblock rules"
              value={geoSearch}
              onChange={(event) => {
                setGeoPage(1);
                setGeoSearch(event.target.value);
              }}
              placeholder="Search target"
              className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500"
            />
          </div>

          {geoError ? (
            <div className="mb-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {geoError}
            </div>
          ) : null}

          {geoBlocksQuery.isLoading ? (
            <p className="text-sm text-zinc-400">Loading geoblocks...</p>
          ) : geoRows.length ? (
            <div className="space-y-3">
              {geoRows.map((item) => (
                <article key={item.id} className="rounded-xl border border-white/10 bg-[#0d0d0f] p-3 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-zinc-100">
                        {item.targetType}:{item.targetId}
                      </p>
                      <p className="text-zinc-400">
                        {item.countryCode} • {item.reason}
                      </p>
                    </div>
                    <span className="rounded-full bg-white/10 px-2 py-1 text-zinc-200">{item.status}</span>
                  </div>

                  <div className="mt-2 grid grid-cols-1 gap-2 text-zinc-400 md:grid-cols-2">
                    <p>Created: {formatDateTime(item.createdAt)}</p>
                    <p>Expires: {formatDateTime(item.expiresAt)}</p>
                  </div>

                  {item.note ? (
                    <p className="mt-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-zinc-300">
                      Note: {item.note}
                    </p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleToggleGeoBlockStatus(item.id, item.status)}
                      disabled={updateGeoBlockMutation.isPending}
                      className="rounded-lg border border-amber-400/30 px-2 py-1 text-amber-200 hover:bg-amber-500/10 disabled:opacity-40"
                    >
                      {item.status === "ACTIVE" ? "Disable" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleEditGeoBlockReason(item.id, item.reason)}
                      disabled={updateGeoBlockMutation.isPending}
                      className="rounded-lg border border-cyan-400/30 px-2 py-1 text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-40"
                    >
                      Change Reason
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRemoveGeoBlock(item.id)}
                      disabled={removeGeoBlockMutation.isPending}
                      className="rounded-lg border border-rose-400/30 px-2 py-1 text-rose-200 hover:bg-rose-500/10 disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400">No geoblock rules found for current filters.</p>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
            <p className="text-zinc-400">
              Page {geoData?.pagination.page ?? 1} / {Math.max(geoData?.pagination.totalPages ?? 1, 1)}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGeoPage((prev) => Math.max(prev - 1, 1))}
                disabled={(geoData?.pagination.page ?? 1) <= 1}
                className="rounded-md border border-white/15 px-2 py-1 text-zinc-200 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setGeoPage((prev) => Math.min(prev + 1, geoData?.pagination.totalPages ?? 1))}
                disabled={(geoData?.pagination.page ?? 1) >= (geoData?.pagination.totalPages ?? 1)}
                className="rounded-md border border-white/15 px-2 py-1 text-zinc-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>

          <div className="mt-4 border-t border-white/10 pt-4">
            <h4 className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
              Create Geo-Block Rule
            </h4>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <input
                aria-label="New geoblock target type"
                value={newGeoTargetType}
                onChange={(event) => setNewGeoTargetType(event.target.value)}
                placeholder="Target type"
                className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100"
              />
              <input
                aria-label="New geoblock target id"
                value={newGeoTargetId}
                onChange={(event) => setNewGeoTargetId(event.target.value)}
                placeholder="Target id"
                className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100"
              />
              <input
                aria-label="New geoblock country code"
                value={newGeoCountryCode}
                onChange={(event) => setNewGeoCountryCode(event.target.value.toUpperCase())}
                placeholder="Country code"
                className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100"
              />
              <select
                aria-label="New geoblock reason"
                value={newGeoReason}
                onChange={(event) => setNewGeoReason(event.target.value as GeoBlockReason)}
                className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100"
              >
                {GEOBLOCK_REASON_OPTIONS.filter((option) => option !== "ALL").map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <input
                aria-label="New geoblock note"
                value={newGeoNote}
                onChange={(event) => setNewGeoNote(event.target.value)}
                placeholder="Note (optional)"
                className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100 md:col-span-2"
              />
              <input
                aria-label="New geoblock expiration datetime"
                type="datetime-local"
                value={newGeoExpiresAt}
                onChange={(event) => setNewGeoExpiresAt(event.target.value)}
                className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100 md:col-span-2"
              />
            </div>
            <button
              type="button"
              onClick={() => void handleCreateGeoBlock()}
              disabled={createGeoBlockMutation.isPending}
              className="mt-3 w-full rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-40"
            >
              {createGeoBlockMutation.isPending ? "Creating..." : "Create Geo-Block Rule"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
