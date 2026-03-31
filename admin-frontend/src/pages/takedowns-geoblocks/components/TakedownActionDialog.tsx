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

import { TAKEDOWN_ACTION_META } from "../constants";
import type { TakedownActionDialogState } from "../types";

interface TakedownActionDialogProps {
  dialog: TakedownActionDialogState | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onNoteChange: (value: string) => void;
  onSubmit: () => void;
}

export function TakedownActionDialog({
  dialog,
  isPending,
  onOpenChange,
  onNoteChange,
  onSubmit,
}: TakedownActionDialogProps) {
  if (!dialog) {
    return null;
  }

  const meta = TAKEDOWN_ACTION_META[dialog.action];

  return (
    <Dialog open={Boolean(dialog)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{meta.title}</DialogTitle>
          <DialogDescription>{meta.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/50 p-3 text-xs">
            <p className="font-semibold text-foreground">Takedown Details</p>
            <div className="mt-2 space-y-1 text-muted-foreground">
              <p>
                Target: {dialog.takedown.targetType}:{dialog.takedown.targetId}
              </p>
              <p>Reason: {dialog.takedown.reason}</p>
              <p>Status: {dialog.takedown.status}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="action-note">
              {meta.noteLabel}
              {meta.noteRequired ? "" : " (optional)"}
            </Label>
            <Input
              id="action-note"
              value={dialog.note}
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder={meta.notePlaceholder}
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
          <Button
            onClick={onSubmit}
            disabled={isPending}
            variant={dialog.action === "REVERSE" ? "destructive" : "default"}
          >
            {isPending ? "Processing..." : meta.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
