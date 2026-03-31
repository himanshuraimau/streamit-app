import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAnnouncement,
  deleteAnnouncement,
  getSystemSettingHistory,
  listAnnouncements,
  listSystemSettings,
  rollbackSystemSetting,
  updateAnnouncement,
  updateSystemSetting,
  type AnnouncementType,
  type AdminProfile,
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

const ANNOUNCEMENT_TYPES: AnnouncementType[] = [
  "INFO",
  "WARNING",
  "MAINTENANCE",
  "FEATURE",
  "PROMOTION",
];

type VisibilityFilter = "ALL" | "PUBLIC" | "PRIVATE";
type ActiveFilter = "ALL" | "ACTIVE" | "INACTIVE";
type AnnouncementTypeFilter = AnnouncementType | "ALL";
type RoleFilter = AdminProfile["role"] | "ALL";

const ROLE_OPTIONS: RoleFilter[] = ["ALL", "USER", "CREATOR", "ADMIN", "SUPER_ADMIN"];

export function SettingsAnnouncementsPage() {
  const queryClient = useQueryClient();

  const [settingsSearch, setSettingsSearch] = useState("");
  const [settingsVisibility, setSettingsVisibility] = useState<VisibilityFilter>("ALL");
  const [settingsPage, setSettingsPage] = useState(1);
  const [selectedSettingKey, setSelectedSettingKey] = useState<string | null>(null);

  const [newSettingKey, setNewSettingKey] = useState("");
  const [newSettingValue, setNewSettingValue] = useState("");
  const [newSettingReason, setNewSettingReason] = useState("");
  const [newSettingIsPublic, setNewSettingIsPublic] = useState(false);

  const [announcementsSearch, setAnnouncementsSearch] = useState("");
  const [announcementsType, setAnnouncementsType] = useState<AnnouncementTypeFilter>("ALL");
  const [announcementsActive, setAnnouncementsActive] = useState<ActiveFilter>("ALL");
  const [announcementsPage, setAnnouncementsPage] = useState(1);

  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState("");
  const [newAnnouncementContent, setNewAnnouncementContent] = useState("");
  const [newAnnouncementType, setNewAnnouncementType] = useState<AnnouncementType>("INFO");
  const [newAnnouncementRole, setNewAnnouncementRole] = useState<RoleFilter>("ALL");
  const [newAnnouncementStartsAt, setNewAnnouncementStartsAt] = useState("");
  const [newAnnouncementEndsAt, setNewAnnouncementEndsAt] = useState("");
  const [newAnnouncementIsActive, setNewAnnouncementIsActive] = useState(true);
  const [newAnnouncementIsPinned, setNewAnnouncementIsPinned] = useState(false);

  const settingsQuery = useQuery({
    queryKey: ["admin", "phase6", "settings", settingsSearch, settingsVisibility, settingsPage],
    queryFn: () =>
      listSystemSettings({
        page: settingsPage,
        limit: 10,
        search: settingsSearch.trim() || undefined,
        includePublic:
          settingsVisibility === "ALL"
            ? undefined
            : settingsVisibility === "PUBLIC"
              ? true
              : false,
      }),
  });

  const settingHistoryQuery = useQuery({
    queryKey: ["admin", "phase6", "settings-history", selectedSettingKey],
    queryFn: () => getSystemSettingHistory(selectedSettingKey as string),
    enabled: Boolean(selectedSettingKey),
  });

  const announcementsQuery = useQuery({
    queryKey: [
      "admin",
      "phase6",
      "announcements",
      announcementsSearch,
      announcementsType,
      announcementsActive,
      announcementsPage,
    ],
    queryFn: () =>
      listAnnouncements({
        page: announcementsPage,
        limit: 10,
        search: announcementsSearch.trim() || undefined,
        type: announcementsType === "ALL" ? undefined : announcementsType,
        isActive:
          announcementsActive === "ALL"
            ? undefined
            : announcementsActive === "ACTIVE"
              ? true
              : false,
      }),
  });

  const updateSettingMutation = useMutation({
    mutationFn: (payload: {
      settingKey: string;
      body: Parameters<typeof updateSystemSetting>[1];
    }) => updateSystemSetting(payload.settingKey, payload.body),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "settings"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "settings-history"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "audit-history"] });
      setSelectedSettingKey(variables.settingKey);
    },
  });

  const rollbackSettingMutation = useMutation({
    mutationFn: rollbackSystemSetting,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "settings"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "settings-history"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "audit-history"] });
    },
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "announcements"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "audit-history"] });
    },
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: (payload: {
      announcementId: string;
      body: Parameters<typeof updateAnnouncement>[1];
    }) => updateAnnouncement(payload.announcementId, payload.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "announcements"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "audit-history"] });
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "announcements"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "audit-history"] });
    },
  });

  const settingsData =
    settingsQuery.data && settingsQuery.data.success ? settingsQuery.data.data : null;
  const settingsError =
    settingsQuery.data && !settingsQuery.data.success ? settingsQuery.data.error : null;

  const settingsHistoryData =
    settingHistoryQuery.data && settingHistoryQuery.data.success
      ? settingHistoryQuery.data.data.items
      : [];
  const settingsHistoryError =
    settingHistoryQuery.data && !settingHistoryQuery.data.success
      ? settingHistoryQuery.data.error
      : null;

  const announcementsData =
    announcementsQuery.data && announcementsQuery.data.success ? announcementsQuery.data.data : null;
  const announcementsError =
    announcementsQuery.data && !announcementsQuery.data.success ? announcementsQuery.data.error : null;

  const settingRows = useMemo(() => settingsData?.items ?? [], [settingsData]);
  const announcementRows = useMemo(() => announcementsData?.items ?? [], [announcementsData]);

  const handleCreateOrUpdateSetting = async () => {
    const settingKey = newSettingKey.trim();
    const value = newSettingValue;
    const reason = newSettingReason.trim();

    if (settingKey.length < 1) {
      window.alert("Setting key is required.");
      return;
    }

    if (value.length < 1) {
      window.alert("Setting value is required.");
      return;
    }

    if (reason.length < 3) {
      window.alert("Reason must be at least 3 characters.");
      return;
    }

    const response = await updateSettingMutation.mutateAsync({
      settingKey,
      body: {
        value,
        isPublic: newSettingIsPublic,
        reason,
      },
    });

    if (!response.success) {
      window.alert(response.error);
      return;
    }

    setSelectedSettingKey(settingKey);
    setNewSettingKey("");
    setNewSettingValue("");
    setNewSettingReason("");
    setNewSettingIsPublic(false);
  };

  const handleEditSetting = async (setting: {
    key: string;
    value: string;
    isPublic: boolean;
  }) => {
    const nextValue = window.prompt("Setting value:", setting.value);
    if (nextValue === null) return;

    const visibilityInput = window.prompt(
      "Visibility (public/private):",
      setting.isPublic ? "public" : "private",
    );
    if (!visibilityInput) return;

    const normalizedVisibility = visibilityInput.trim().toLowerCase();
    if (normalizedVisibility !== "public" && normalizedVisibility !== "private") {
      window.alert("Visibility must be public or private.");
      return;
    }

    const reason = window.prompt("Reason (required):", "Updated setting from admin panel")?.trim() ?? "";
    if (reason.length < 3) {
      window.alert("Reason must be at least 3 characters.");
      return;
    }

    const response = await updateSettingMutation.mutateAsync({
      settingKey: setting.key,
      body: {
        value: nextValue,
        isPublic: normalizedVisibility === "public",
        reason,
      },
    });

    if (!response.success) {
      window.alert(response.error);
      return;
    }

    setSelectedSettingKey(setting.key);
  };

  const handleRollbackSettingVersion = async (versionId: string) => {
    const reason = window.prompt("Rollback reason (required):", "Rollback requested by compliance admin")?.trim() ?? "";

    if (reason.length < 3) {
      window.alert("Rollback reason must be at least 3 characters.");
      return;
    }

    const response = await rollbackSettingMutation.mutateAsync({
      versionId,
      reason,
    });

    if (!response.success) {
      window.alert(response.error);
    }
  };

  const handleCreateAnnouncement = async () => {
    const title = newAnnouncementTitle.trim();
    const content = newAnnouncementContent.trim();

    if (title.length < 3 || content.length < 5) {
      window.alert("Announcement title/content are too short.");
      return;
    }

    const response = await createAnnouncementMutation.mutateAsync({
      title,
      content,
      type: newAnnouncementType,
      isActive: newAnnouncementIsActive,
      startsAt: toIsoDateTime(newAnnouncementStartsAt),
      endsAt: toIsoDateTime(newAnnouncementEndsAt),
      targetRole: newAnnouncementRole === "ALL" ? null : newAnnouncementRole,
      isPinned: newAnnouncementIsPinned,
    });

    if (!response.success) {
      window.alert(response.error);
      return;
    }

    setNewAnnouncementTitle("");
    setNewAnnouncementContent("");
    setNewAnnouncementType("INFO");
    setNewAnnouncementRole("ALL");
    setNewAnnouncementStartsAt("");
    setNewAnnouncementEndsAt("");
    setNewAnnouncementIsActive(true);
    setNewAnnouncementIsPinned(false);
  };

  const handleEditAnnouncement = async (announcementId: string, currentTitle: string, currentContent: string) => {
    const title = window.prompt("Announcement title:", currentTitle);
    if (title === null) return;

    const content = window.prompt("Announcement content:", currentContent);
    if (content === null) return;

    if (title.trim().length < 3 || content.trim().length < 5) {
      window.alert("Announcement title/content are too short.");
      return;
    }

    const response = await updateAnnouncementMutation.mutateAsync({
      announcementId,
      body: {
        title: title.trim(),
        content: content.trim(),
      },
    });

    if (!response.success) {
      window.alert(response.error);
    }
  };

  const handleToggleAnnouncementActive = async (announcementId: string, nextValue: boolean) => {
    const response = await updateAnnouncementMutation.mutateAsync({
      announcementId,
      body: {
        isActive: nextValue,
      },
    });

    if (!response.success) {
      window.alert(response.error);
    }
  };

  const handleToggleAnnouncementPinned = async (announcementId: string, nextValue: boolean) => {
    const response = await updateAnnouncementMutation.mutateAsync({
      announcementId,
      body: {
        isPinned: nextValue,
      },
    });

    if (!response.success) {
      window.alert(response.error);
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!window.confirm("Delete this announcement permanently?")) {
      return;
    }

    const response = await deleteAnnouncementMutation.mutateAsync(announcementId);
    if (!response.success) {
      window.alert(response.error);
    }
  };

  return (
    <div>
      <header className="mb-6 border-b border-white/10 pb-5">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Phase 6</p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-50">Settings And Announcements</h2>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-[#111113] p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-zinc-400">
              System Settings
            </h3>
            <button
              type="button"
              onClick={() => {
                void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "settings"] });
              }}
              className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-100 hover:bg-white/10"
            >
              Refresh
            </button>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-3">
            <input
              aria-label="Search system settings"
              value={settingsSearch}
              onChange={(event) => {
                setSettingsPage(1);
                setSettingsSearch(event.target.value);
              }}
              placeholder="Search setting key/description"
              className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500"
            />
            <select
              aria-label="Filter settings by visibility"
              value={settingsVisibility}
              onChange={(event) => {
                setSettingsPage(1);
                setSettingsVisibility(event.target.value as VisibilityFilter);
              }}
              className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100"
            >
              <option value="ALL">Visibility: All</option>
              <option value="PUBLIC">Visibility: Public</option>
              <option value="PRIVATE">Visibility: Private</option>
            </select>
          </div>

          {settingsError ? (
            <div className="mb-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {settingsError}
            </div>
          ) : null}

          {settingsQuery.isLoading ? (
            <p className="text-sm text-zinc-400">Loading settings...</p>
          ) : settingRows.length ? (
            <div className="space-y-3">
              {settingRows.map((setting) => (
                <article key={setting.id} className="rounded-xl border border-white/10 bg-[#0d0d0f] p-3 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-zinc-100">{setting.key}</p>
                      <p className="text-zinc-400">{setting.isPublic ? "Public" : "Private"}</p>
                    </div>
                    <span className="rounded-full bg-white/10 px-2 py-1 text-zinc-200">
                      Updated {formatDateTime(setting.updatedAt)}
                    </span>
                  </div>

                  <pre className="mt-2 max-h-28 overflow-auto rounded-lg border border-white/10 bg-white/5 p-2 text-[11px] text-zinc-300">
                    {setting.value}
                  </pre>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleEditSetting(setting)}
                      disabled={updateSettingMutation.isPending}
                      className="rounded-lg border border-cyan-400/30 px-2 py-1 text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-40"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedSettingKey(setting.key)}
                      className="rounded-lg border border-white/15 px-2 py-1 text-zinc-200 hover:bg-white/10"
                    >
                      View History
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400">No settings found for current filters.</p>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
            <p className="text-zinc-400">
              Page {settingsData?.pagination.page ?? 1} / {Math.max(settingsData?.pagination.totalPages ?? 1, 1)}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSettingsPage((prev) => Math.max(prev - 1, 1))}
                disabled={(settingsData?.pagination.page ?? 1) <= 1}
                className="rounded-md border border-white/15 px-2 py-1 text-zinc-200 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() =>
                  setSettingsPage((prev) => Math.min(prev + 1, settingsData?.pagination.totalPages ?? 1))
                }
                disabled={(settingsData?.pagination.page ?? 1) >= (settingsData?.pagination.totalPages ?? 1)}
                className="rounded-md border border-white/15 px-2 py-1 text-zinc-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>

          <div className="mt-4 border-t border-white/10 pt-4">
            <h4 className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
              Create / Upsert Setting
            </h4>
            <div className="grid grid-cols-1 gap-2">
              <input
                aria-label="Setting key"
                value={newSettingKey}
                onChange={(event) => setNewSettingKey(event.target.value)}
                placeholder="Setting key"
                className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100"
              />
              <textarea
                aria-label="Setting value"
                value={newSettingValue}
                onChange={(event) => setNewSettingValue(event.target.value)}
                rows={3}
                placeholder="Setting value"
                className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100"
              />
              <input
                aria-label="Setting update reason"
                value={newSettingReason}
                onChange={(event) => setNewSettingReason(event.target.value)}
                placeholder="Reason"
                className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100"
              />
              <label className="inline-flex items-center gap-2 text-xs text-zinc-400">
                <input
                  type="checkbox"
                  checked={newSettingIsPublic}
                  onChange={(event) => setNewSettingIsPublic(event.target.checked)}
                />
                Public setting
              </label>
            </div>
            <button
              type="button"
              onClick={() => void handleCreateOrUpdateSetting()}
              disabled={updateSettingMutation.isPending}
              className="mt-3 w-full rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-40"
            >
              {updateSettingMutation.isPending ? "Saving..." : "Save Setting"}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#111113] p-4">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-[0.14em] text-zinc-400">
            Setting Version History
          </h3>

          {!selectedSettingKey ? (
            <p className="mb-4 text-sm text-zinc-400">Pick a setting from the left panel to view history.</p>
          ) : (
            <p className="mb-4 text-sm text-zinc-300">History for: {selectedSettingKey}</p>
          )}

          {settingsHistoryError ? (
            <div className="mb-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {settingsHistoryError}
            </div>
          ) : null}

          {settingHistoryQuery.isLoading ? (
            <p className="text-sm text-zinc-400">Loading setting history...</p>
          ) : settingsHistoryData.length ? (
            <div className="space-y-3">
              {settingsHistoryData.map((item) => (
                <article key={item.id} className="rounded-xl border border-white/10 bg-[#0d0d0f] p-3 text-xs">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-zinc-100">{item.settingKey}</p>
                      <p className="text-zinc-400">Changed At: {formatDateTime(item.createdAt)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleRollbackSettingVersion(item.id)}
                      disabled={rollbackSettingMutation.isPending}
                      className="rounded-lg border border-amber-400/30 px-2 py-1 text-amber-200 hover:bg-amber-500/10 disabled:opacity-40"
                    >
                      Rollback To Previous
                    </button>
                  </div>

                  <div className="mt-2 grid grid-cols-1 gap-2 text-zinc-400 md:grid-cols-2">
                    <p>Public: {item.newIsPublic ? "Yes" : "No"}</p>
                    <p>Rollback Ref: {item.rollbackOfVersionId ?? "N/A"}</p>
                  </div>

                  {item.changeReason ? (
                    <p className="mt-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-zinc-300">
                      Reason: {item.changeReason}
                    </p>
                  ) : null}

                  <details className="mt-2 text-zinc-400">
                    <summary className="cursor-pointer text-zinc-300">Show value diff snapshot</summary>
                    <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                      <pre className="max-h-28 overflow-auto rounded-lg border border-white/10 bg-white/5 p-2 text-[11px] text-zinc-300">
                        prev: {item.previousValue ?? "<null>"}
                      </pre>
                      <pre className="max-h-28 overflow-auto rounded-lg border border-white/10 bg-white/5 p-2 text-[11px] text-zinc-300">
                        next: {item.newValue}
                      </pre>
                    </div>
                  </details>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400">No history available for selected setting.</p>
          )}
        </section>
      </div>

      <section className="mt-4 rounded-2xl border border-white/10 bg-[#111113] p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-zinc-400">
            Announcement Manager
          </h3>
          <button
            type="button"
            onClick={() => {
              void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "announcements"] });
            }}
            className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-100 hover:bg-white/10"
          >
            Refresh
          </button>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-4">
          <input
            aria-label="Search announcements"
            value={announcementsSearch}
            onChange={(event) => {
              setAnnouncementsPage(1);
              setAnnouncementsSearch(event.target.value);
            }}
            placeholder="Search announcements"
            className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500"
          />
          <select
            aria-label="Filter announcements by type"
            value={announcementsType}
            onChange={(event) => {
              setAnnouncementsPage(1);
              setAnnouncementsType(event.target.value as AnnouncementTypeFilter);
            }}
            className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100"
          >
            <option value="ALL">Type: All</option>
            {ANNOUNCEMENT_TYPES.map((option) => (
              <option key={option} value={option}>
                Type: {option}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter announcements by active state"
            value={announcementsActive}
            onChange={(event) => {
              setAnnouncementsPage(1);
              setAnnouncementsActive(event.target.value as ActiveFilter);
            }}
            className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100"
          >
            <option value="ALL">State: All</option>
            <option value="ACTIVE">State: Active</option>
            <option value="INACTIVE">State: Inactive</option>
          </select>
        </div>

        {announcementsError ? (
          <div className="mb-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {announcementsError}
          </div>
        ) : null}

        {announcementsQuery.isLoading ? (
          <p className="text-sm text-zinc-400">Loading announcements...</p>
        ) : announcementRows.length ? (
          <div className="space-y-3">
            {announcementRows.map((item) => (
              <article key={item.id} className="rounded-xl border border-white/10 bg-[#0d0d0f] p-3 text-xs">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-zinc-100">{item.title}</p>
                    <p className="text-zinc-400">
                      {item.type} • {item.targetRole ?? "ALL_ROLES"} • {item.isPinned ? "Pinned" : "Not pinned"}
                    </p>
                  </div>
                  <span className="rounded-full bg-white/10 px-2 py-1 text-zinc-200">
                    {item.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>

                <p className="mt-2 line-clamp-3 text-zinc-300">{item.content}</p>
                <p className="mt-2 text-zinc-500">
                  Window: {formatDateTime(item.startsAt)} - {formatDateTime(item.endsAt)}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleEditAnnouncement(item.id, item.title, item.content)}
                    disabled={updateAnnouncementMutation.isPending}
                    className="rounded-lg border border-cyan-400/30 px-2 py-1 text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-40"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleToggleAnnouncementActive(item.id, !item.isActive)}
                    disabled={updateAnnouncementMutation.isPending}
                    className="rounded-lg border border-amber-400/30 px-2 py-1 text-amber-200 hover:bg-amber-500/10 disabled:opacity-40"
                  >
                    {item.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleToggleAnnouncementPinned(item.id, !item.isPinned)}
                    disabled={updateAnnouncementMutation.isPending}
                    className="rounded-lg border border-white/15 px-2 py-1 text-zinc-200 hover:bg-white/10 disabled:opacity-40"
                  >
                    {item.isPinned ? "Unpin" : "Pin"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteAnnouncement(item.id)}
                    disabled={deleteAnnouncementMutation.isPending}
                    className="rounded-lg border border-rose-400/30 px-2 py-1 text-rose-200 hover:bg-rose-500/10 disabled:opacity-40"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-400">No announcements found for current filters.</p>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
          <p className="text-zinc-400">
            Page {announcementsData?.pagination.page ?? 1} / {Math.max(announcementsData?.pagination.totalPages ?? 1, 1)}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAnnouncementsPage((prev) => Math.max(prev - 1, 1))}
              disabled={(announcementsData?.pagination.page ?? 1) <= 1}
              className="rounded-md border border-white/15 px-2 py-1 text-zinc-200 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() =>
                setAnnouncementsPage((prev) =>
                  Math.min(prev + 1, announcementsData?.pagination.totalPages ?? 1),
                )
              }
              disabled={
                (announcementsData?.pagination.page ?? 1) >=
                (announcementsData?.pagination.totalPages ?? 1)
              }
              className="rounded-md border border-white/15 px-2 py-1 text-zinc-200 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>

        <div className="mt-4 border-t border-white/10 pt-4">
          <h4 className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
            Create Announcement
          </h4>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <input
              aria-label="New announcement title"
              value={newAnnouncementTitle}
              onChange={(event) => setNewAnnouncementTitle(event.target.value)}
              placeholder="Title"
              className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100"
            />
            <select
              aria-label="New announcement type"
              value={newAnnouncementType}
              onChange={(event) => setNewAnnouncementType(event.target.value as AnnouncementType)}
              className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100"
            >
              {ANNOUNCEMENT_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <textarea
              aria-label="New announcement content"
              value={newAnnouncementContent}
              onChange={(event) => setNewAnnouncementContent(event.target.value)}
              rows={3}
              placeholder="Content"
              className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100 md:col-span-2"
            />
            <select
              aria-label="New announcement target role"
              value={newAnnouncementRole}
              onChange={(event) => setNewAnnouncementRole(event.target.value as RoleFilter)}
              className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  Target Role: {option}
                </option>
              ))}
            </select>
            <label className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={newAnnouncementIsActive}
                onChange={(event) => setNewAnnouncementIsActive(event.target.checked)}
              />
              Active
            </label>
            <label className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={newAnnouncementIsPinned}
                onChange={(event) => setNewAnnouncementIsPinned(event.target.checked)}
              />
              Pinned
            </label>
            <input
              aria-label="Announcement start datetime"
              type="datetime-local"
              value={newAnnouncementStartsAt}
              onChange={(event) => setNewAnnouncementStartsAt(event.target.value)}
              className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100"
            />
            <input
              aria-label="Announcement end datetime"
              type="datetime-local"
              value={newAnnouncementEndsAt}
              onChange={(event) => setNewAnnouncementEndsAt(event.target.value)}
              className="rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-xs text-zinc-100"
            />
          </div>
          <button
            type="button"
            onClick={() => void handleCreateAnnouncement()}
            disabled={createAnnouncementMutation.isPending}
            className="mt-3 w-full rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-40"
          >
            {createAnnouncementMutation.isPending ? "Creating..." : "Create Announcement"}
          </button>
        </div>
      </section>
    </div>
  );
}
