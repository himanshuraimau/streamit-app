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
  PaginationMeta,
  TakedownListItem,
  TakedownReason,
  TakedownStatus,
} from "@/lib/admin-api";

import {
  TAKEDOWN_REASON_OPTIONS,
  TAKEDOWN_STATUS_OPTIONS,
} from "../constants";
import type { TakedownAction, TakedownsNoticeState } from "../types";

interface TakedownsSectionProps {
  takedownStatus: TakedownStatus | "ALL";
  takedownReason: TakedownReason | "ALL";
  takedownSearch: string;
  rows: TakedownListItem[];
  pagination: PaginationMeta | undefined;
  isLoading: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  notice: TakedownsNoticeState | null;
  onStatusChange: (value: TakedownStatus | "ALL") => void;
  onReasonChange: (value: TakedownReason | "ALL") => void;
  onSearchChange: (value: string) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onAction: (takedown: TakedownListItem, action: TakedownAction) => void;
  onRefresh: () => void;
}

export function TakedownsSection({
  takedownStatus,
  takedownReason,
  takedownSearch,
  rows,
  pagination,
  isLoading,
  isSubmitting,
  errorMessage,
  notice,
  onStatusChange,
  onReasonChange,
  onSearchChange,
  onPreviousPage,
  onNextPage,
  onAction,
  onRefresh,
}: TakedownsSectionProps) {
  return (
    <AdminSectionCard
      title="Takedown Operations"
      description="Manage content takedown requests and legal actions"
      action={
        <Button onClick={onRefresh} variant="outline" size="sm">
          Refresh
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <Select
            value={takedownStatus}
            onValueChange={(value) =>
              onStatusChange(value as TakedownStatus | "ALL")
            }
          >
            <SelectTrigger aria-label="Filter takedowns by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAKEDOWN_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  Status: {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={takedownReason}
            onValueChange={(value) =>
              onReasonChange(value as TakedownReason | "ALL")
            }
          >
            <SelectTrigger aria-label="Filter takedowns by reason">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAKEDOWN_REASON_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  Reason: {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            aria-label="Search takedown requests"
            value={takedownSearch}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search target/note"
            className="text-xs"
          />
        </div>

        <AdminNotice notice={notice} />
        {errorMessage ? (
          <AdminNotice
            notice={{
              tone: "error",
              title: "Takedowns unavailable",
              description: errorMessage,
            }}
          />
        ) : null}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading takedowns...</p>
        ) : rows.length ? (
          <div className="space-y-3">
            {rows.map((item) => {
              const canExecute = item.status === "PENDING" || item.status === "APPEALED";
              const canAppeal = item.status === "EXECUTED";
              const canReverse = item.status === "EXECUTED" || item.status === "APPEALED";
              const canReject = item.status === "PENDING" || item.status === "APPEALED";

              return (
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
                        {item.reason} • Requested {formatDateTime(item.requestedAt)}
                      </p>
                    </div>
                    <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">
                      {item.status}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-1 gap-2 text-muted-foreground md:grid-cols-2">
                    <p>Legal Case: {item.legalCase?.referenceCode ?? "N/A"}</p>
                    <p>Executed At: {formatDateTime(item.executedAt)}</p>
                    <p>Appealed At: {formatDateTime(item.appealedAt)}</p>
                    <p>Reversed At: {formatDateTime(item.reversedAt)}</p>
                  </div>

                  {item.note ? (
                    <p className="mt-2 rounded-lg border border-border bg-muted/50 px-2 py-1 text-foreground">
                      Note: {item.note}
                    </p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {canExecute ? (
                      <Button
                        onClick={() => onAction(item, "EXECUTE")}
                        disabled={isSubmitting}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                      >
                        Execute
                      </Button>
                    ) : null}
                    {canAppeal ? (
                      <Button
                        onClick={() => onAction(item, "APPEAL")}
                        disabled={isSubmitting}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                      >
                        Appeal
                      </Button>
                    ) : null}
                    {canReverse ? (
                      <Button
                        onClick={() => onAction(item, "REVERSE")}
                        disabled={isSubmitting}
                        variant="destructive"
                        size="sm"
                        className="h-7 text-xs"
                      >
                        Reverse
                      </Button>
                    ) : null}
                    {canReject ? (
                      <Button
                        onClick={() => onAction(item, "REJECT")}
                        disabled={isSubmitting}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                      >
                        Reject
                      </Button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No takedowns found for current filters.
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
