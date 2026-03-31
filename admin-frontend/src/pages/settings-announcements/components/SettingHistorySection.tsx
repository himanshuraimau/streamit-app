import { AdminNotice } from "@/components/admin/AdminNotice";
import { AdminSectionCard } from "@/components/admin/AdminSectionCard";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/formatters";
import type { SystemSettingVersionItem } from "@/lib/admin-api";

interface SettingHistorySectionProps {
  selectedSettingKey: string | null;
  historyItems: SystemSettingVersionItem[];
  isLoading: boolean;
  errorMessage: string | null;
  onRollback: (version: SystemSettingVersionItem) => void;
}

export function SettingHistorySection({
  selectedSettingKey,
  historyItems,
  isLoading,
  errorMessage,
  onRollback,
}: SettingHistorySectionProps) {
  return (
    <AdminSectionCard
      title="Setting Version History"
      description="View and rollback setting changes"
    >
      <div className="space-y-4">
        {!selectedSettingKey ? (
          <p className="text-sm text-muted-foreground">
            Pick a setting from the left panel to view history.
          </p>
        ) : (
          <p className="text-sm text-foreground">
            History for: {selectedSettingKey}
          </p>
        )}

        {errorMessage ? (
          <AdminNotice
            notice={{
              tone: "error",
              title: "History unavailable",
              description: errorMessage,
            }}
          />
        ) : null}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">
            Loading setting history...
          </p>
        ) : historyItems.length ? (
          <div className="space-y-3">
            {historyItems.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-border bg-card p-3 text-xs"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">
                      {item.settingKey}
                    </p>
                    <p className="text-muted-foreground">
                      Changed At: {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                  <Button
                    onClick={() => onRollback(item)}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    Rollback To Previous
                  </Button>
                </div>

                <div className="mt-2 grid grid-cols-1 gap-2 text-muted-foreground md:grid-cols-2">
                  <p>Public: {item.newIsPublic ? "Yes" : "No"}</p>
                  <p>Rollback Ref: {item.rollbackOfVersionId ?? "N/A"}</p>
                </div>

                {item.changeReason ? (
                  <p className="mt-2 rounded-lg border border-border bg-muted/50 px-2 py-1 text-foreground">
                    Reason: {item.changeReason}
                  </p>
                ) : null}

                <details className="mt-2 text-muted-foreground">
                  <summary className="cursor-pointer text-foreground">
                    Show value diff snapshot
                  </summary>
                  <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                    <pre className="max-h-28 overflow-auto rounded-lg border border-border bg-muted/50 p-2 text-[11px] text-foreground">
                      prev: {item.previousValue ?? "<null>"}
                    </pre>
                    <pre className="max-h-28 overflow-auto rounded-lg border border-border bg-muted/50 p-2 text-[11px] text-foreground">
                      next: {item.newValue}
                    </pre>
                  </div>
                </details>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No history available for selected setting.
          </p>
        )}
      </div>
    </AdminSectionCard>
  );
}
