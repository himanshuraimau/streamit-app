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
import type {
  GeoBlockReason,
  GeoBlockRuleItem,
  GeoBlockStatus,
  PaginationMeta,
} from "@/lib/admin-api";

import {
  GEOBLOCK_REASON_OPTIONS,
  GEOBLOCK_STATUS_OPTIONS,
} from "../constants";
import type { TakedownsNoticeState } from "../types";

interface GeoBlocksSectionProps {
  geoStatus: GeoBlockStatus | "ALL";
  geoReason: GeoBlockReason | "ALL";
  geoCountryCode: string;
  geoSearch: string;
  rows: GeoBlockRuleItem[];
  pagination: PaginationMeta | undefined;
  isLoading: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  notice: TakedownsNoticeState | null;
  onStatusChange: (value: GeoBlockStatus | "ALL") => void;
  onReasonChange: (value: GeoBlockReason | "ALL") => void;
  onCountryCodeChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onToggleStatus: (geoBlockId: string, status: GeoBlockStatus) => void;
  onEditReason: (geoBlock: GeoBlockRuleItem) => void;
  onRemove: (geoBlockId: string, target: string) => void;
  onRefresh: () => void;
}

export function GeoBlocksSection({
  geoStatus,
  geoReason,
  geoCountryCode,
  geoSearch,
  rows,
  pagination,
  isLoading,
  isSubmitting,
  errorMessage,
  notice,
  onStatusChange,
  onReasonChange,
  onCountryCodeChange,
  onSearchChange,
  onPreviousPage,
  onNextPage,
  onToggleStatus,
  onEditReason,
  onRemove,
  onRefresh,
}: GeoBlocksSectionProps) {
  return (
    <AdminSectionCard
      title="Geo-Block Rules"
      description="Manage geographic content restrictions"
      action={
        <Button onClick={onRefresh} variant="outline" size="sm">
          Refresh
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
          <Select
            value={geoStatus}
            onValueChange={(value) =>
              onStatusChange(value as GeoBlockStatus | "ALL")
            }
          >
            <SelectTrigger aria-label="Filter geoblocks by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GEOBLOCK_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  Status: {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={geoReason}
            onValueChange={(value) =>
              onReasonChange(value as GeoBlockReason | "ALL")
            }
          >
            <SelectTrigger aria-label="Filter geoblocks by reason">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GEOBLOCK_REASON_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  Reason: {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            aria-label="Filter geoblocks by country code"
            value={geoCountryCode}
            onChange={(event) => onCountryCodeChange(event.target.value)}
            placeholder="Country code"
            className="text-xs"
          />

          <Input
            aria-label="Search geoblock rules"
            value={geoSearch}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search target"
            className="text-xs"
          />
        </div>

        <AdminNotice notice={notice} />
        {errorMessage ? (
          <AdminNotice
            notice={{
              tone: "error",
              title: "Geo-blocks unavailable",
              description: errorMessage,
            }}
          />
        ) : null}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading geoblocks...</p>
        ) : rows.length ? (
          <div className="space-y-3">
            {rows.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-border bg-card p-3 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">
                      {item.targetType}:{item.targetId}
                    </p>
                    <p className="text-muted-foreground">
                      {item.countryCode} • {item.reason}
                    </p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">
                    {item.status}
                  </span>
                </div>

                <div className="mt-2 grid grid-cols-1 gap-2 text-muted-foreground md:grid-cols-2">
                  <p>Created: {formatDateTime(item.createdAt)}</p>
                  <p>Expires: {formatDateTime(item.expiresAt)}</p>
                </div>

                {item.note ? (
                  <p className="mt-2 rounded-lg border border-border bg-muted/50 px-2 py-1 text-foreground">
                    Note: {item.note}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    onClick={() => onToggleStatus(item.id, item.status)}
                    disabled={isSubmitting}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    {item.status === "ACTIVE" ? "Disable" : "Activate"}
                  </Button>
                  <Button
                    onClick={() => onEditReason(item)}
                    disabled={isSubmitting}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    Change Reason
                  </Button>
                  <Button
                    onClick={() =>
                      onRemove(item.id, `${item.targetType}:${item.targetId}`)
                    }
                    disabled={isSubmitting}
                    variant="destructive"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    Remove
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No geoblock rules found for current filters.
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
