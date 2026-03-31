import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/formatters";

import type { SettingRollbackDialogState } from "../types";

interface SettingRollbackDialogProps {
  dialog: SettingRollbackDialogState | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onReasonChange: (value: string) => void;
  onSubmit: () => void;
}

export function SettingRollbackDialog({
  dialog,
  isPending,
  onOpenChange,
  onReasonChange,
  onSubmit,
}: SettingRollbackDialogProps) {
  if (!dialog) {
    return null;
  }

  return (
    <Dialog open={Boolean(dialog)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rollback Setting</DialogTitle>
          <DialogDescription>
            Rollback {dialog.version.settingKey} to the version from{" "}
            {formatDateTime(dialog.version.createdAt)}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/50 p-3 text-xs">
            <p className="font-semibold text-foreground">Version Details</p>
            <div className="mt-2 space-y-1 text-muted-foreground">
              <p>Public: {dialog.version.newIsPublic ? "Yes" : "No"}</p>
              <p>Changed: {formatDateTime(dialog.version.createdAt)}</p>
              {dialog.version.changeReason ? (
                <p>Reason: {dialog.version.changeReason}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rollback-reason">Rollback reason (required)</Label>
            <Input
              id="rollback-reason"
              value={dialog.reason}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder="Rollback requested by compliance admin"
              className="text-xs"
            />
          </div>

          {dialog.error ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {dialog.error}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isPending} variant="destructive">
            {isPending ? "Rolling back..." : "Confirm Rollback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
