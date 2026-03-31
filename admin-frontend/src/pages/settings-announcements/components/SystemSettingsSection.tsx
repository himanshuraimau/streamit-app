import { AdminNotice } from "@/components/admin/AdminNotice";
import { AdminPaginationControls } from "@/components/admin/AdminPaginationControls";
import { AdminSectionCard } from "@/components/admin/AdminSectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/formatters";
import type { PaginationMeta, SystemSettingItem } from "@/lib/admin-api";

import type { VisibilityFilter } from "../constants";
import type { SettingsNoticeState } from "../types";

interface SystemSettingsSectionProps {
  settingsSearch: string;
  settingsVisibility: VisibilityFilter;
  settingsPage: number;
  selectedSettingKey: string | null;
  rows: SystemSettingItem[];
  pagination: PaginationMeta | undefined;
  isLoading: boolean;
  errorMessage: string | null;
  notice: SettingsNoticeState | null;
  onSearchChange: (value: string) => void;
  onVisibilityChange: (value: VisibilityFilter) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onSelectSetting: (key: string) => void;
  onEditSetting: (setting: SystemSettingItem) => void;
  onRefresh: () => void;
}

export function SystemSettingsSection({
  settingsSearch,
  settingsVisibility,
  rows,
  pagination,
  isLoading,
  errorMessage,
  notice,
  onSearchChange,
  onVisibilityChange,
  onPreviousPage,
  onNextPage,
  onSelectSetting,
  onEditSetting,
  onRefresh,
}: SystemSettingsSectionProps) {
  return (
    <AdminSectionCard
      title="System Settings"
      description="Manage system configuration settings with version control"
      action={
        <Button onClick={onRefresh} variant="outline" size="sm">
          Refresh
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <Input
            aria-label="Search system settings"
            value={settingsSearch}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search setting key/description"
            className="text-xs"
          />
          <Select
            value={settingsVisibility}
            onValueChange={(value) =>
              onVisibilityChange(value as VisibilityFilter)
            }
          >
            <SelectTrigger aria-label="Filter settings by visibility">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Visibility: All</SelectItem>
              <SelectItem value="PUBLIC">Visibility: Public</SelectItem>
              <SelectItem value="PRIVATE">Visibility: Private</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <AdminNotice notice={notice} />
        {errorMessage ? (
          <AdminNotice
            notice={{
              tone: "error",
              title: "Settings unavailable",
              description: errorMessage,
            }}
          />
        ) : null}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        ) : rows.length ? (
          <div className="space-y-3">
            {rows.map((setting) => (
              <article
                key={setting.id}
                className="rounded-xl border border-border bg-card p-3 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">
                      {setting.key}
                    </p>
                    <p className="text-muted-foreground">
                      {setting.isPublic ? "Public" : "Private"}
                    </p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">
                    Updated {formatDateTime(setting.updatedAt)}
                  </span>
                </div>

                <pre className="mt-2 max-h-28 overflow-auto rounded-lg border border-border bg-muted/50 p-2 text-[11px] text-foreground">
                  {setting.value}
                </pre>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    onClick={() => onEditSetting(setting)}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => onSelectSetting(setting.key)}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    View History
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No settings found for current filters.
          </p>
        )}

        <AdminPaginationControls
          page={pagination?.page ?? 1}
          totalPages={pagination?.totalPages ?? 1}
          onPreviousPage={onPreviousPage}
          onNextPage={onNextPage}
        />
      </div>
    </AdminSectionCard>
  );
}
