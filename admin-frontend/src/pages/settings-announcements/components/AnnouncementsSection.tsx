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
import type { AnnouncementItem, PaginationMeta } from "@/lib/admin-api";

import {
  ANNOUNCEMENT_TYPES,
  type ActiveFilter,
  type AnnouncementTypeFilter,
} from "../constants";
import type { SettingsNoticeState } from "../types";

interface AnnouncementsSectionProps {
  announcementsSearch: string;
  announcementsType: AnnouncementTypeFilter;
  announcementsActive: ActiveFilter;
  rows: AnnouncementItem[];
  pagination: PaginationMeta | undefined;
  isLoading: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  notice: SettingsNoticeState | null;
  onSearchChange: (value: string) => void;
  onTypeChange: (value: AnnouncementTypeFilter) => void;
  onActiveChange: (value: ActiveFilter) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onEdit: (announcement: AnnouncementItem) => void;
  onToggleActive: (announcementId: string, nextValue: boolean) => void;
  onTogglePinned: (announcementId: string, nextValue: boolean) => void;
  onDelete: (announcementId: string) => void;
  onRefresh: () => void;
}

export function AnnouncementsSection({
  announcementsSearch,
  announcementsType,
  announcementsActive,
  rows,
  pagination,
  isLoading,
  isSubmitting,
  errorMessage,
  notice,
  onSearchChange,
  onTypeChange,
  onActiveChange,
  onPreviousPage,
  onNextPage,
  onEdit,
  onToggleActive,
  onTogglePinned,
  onDelete,
  onRefresh,
}: AnnouncementsSectionProps) {
  const handleDelete = (announcementId: string, title: string) => {
    if (window.confirm(`Delete "${title}" permanently?`)) {
      onDelete(announcementId);
    }
  };

  return (
    <AdminSectionCard
      title="Announcement Manager"
      description="Create and manage platform announcements"
      action={
        <Button onClick={onRefresh} variant="outline" size="sm">
          Refresh
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
          <Input
            aria-label="Search announcements"
            value={announcementsSearch}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search announcements"
            className="text-xs"
          />
          <Select
            value={announcementsType}
            onValueChange={(value) =>
              onTypeChange(value as AnnouncementTypeFilter)
            }
          >
            <SelectTrigger aria-label="Filter announcements by type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Type: All</SelectItem>
              {ANNOUNCEMENT_TYPES.map((option) => (
                <SelectItem key={option} value={option}>
                  Type: {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={announcementsActive}
            onValueChange={(value) => onActiveChange(value as ActiveFilter)}
          >
            <SelectTrigger aria-label="Filter announcements by active state">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">State: All</SelectItem>
              <SelectItem value="ACTIVE">State: Active</SelectItem>
              <SelectItem value="INACTIVE">State: Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <AdminNotice notice={notice} />
        {errorMessage ? (
          <AdminNotice
            notice={{
              tone: "error",
              title: "Announcements unavailable",
              description: errorMessage,
            }}
          />
        ) : null}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">
            Loading announcements...
          </p>
        ) : rows.length ? (
          <div className="space-y-3">
            {rows.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-border bg-card p-3 text-xs"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="text-muted-foreground">
                      {item.type} • {item.targetRole ?? "ALL_ROLES"} •{" "}
                      {item.isPinned ? "Pinned" : "Not pinned"}
                    </p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">
                    {item.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>

                <p className="mt-2 line-clamp-3 text-foreground">
                  {item.content}
                </p>
                <p className="mt-2 text-muted-foreground">
                  Window: {formatDateTime(item.startsAt)} -{" "}
                  {formatDateTime(item.endsAt)}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    onClick={() => onEdit(item)}
                    disabled={isSubmitting}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => onToggleActive(item.id, !item.isActive)}
                    disabled={isSubmitting}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    {item.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    onClick={() => onTogglePinned(item.id, !item.isPinned)}
                    disabled={isSubmitting}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    {item.isPinned ? "Unpin" : "Pin"}
                  </Button>
                  <Button
                    onClick={() => handleDelete(item.id, item.title)}
                    disabled={isSubmitting}
                    variant="destructive"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    Delete
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No announcements found for current filters.
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
