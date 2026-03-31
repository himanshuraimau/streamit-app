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
import { Textarea } from "@/components/ui/textarea";

import type { SettingEditDialogState } from "../types";

interface SettingEditDialogProps {
  dialog: SettingEditDialogState | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onValueChange: (value: string) => void;
  onIsPublicChange: (value: boolean) => void;
  onReasonChange: (value: string) => void;
  onSubmit: () => void;
}

export function SettingEditDialog({
  dialog,
  isPending,
  onOpenChange,
  onValueChange,
  onIsPublicChange,
  onReasonChange,
  onSubmit,
}: SettingEditDialogProps) {
  if (!dialog) {
    return null;
  }

  return (
    <Dialog open={Boolean(dialog)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Setting</DialogTitle>
          <DialogDescription>
            Update the value and visibility for {dialog.setting.key}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-value">Setting value</Label>
            <Textarea
              id="edit-value"
              value={dialog.value}
              onChange={(event) => onValueChange(event.target.value)}
              rows={4}
              className="text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-public"
              checked={dialog.isPublic}
              onChange={(event) => onIsPublicChange(event.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="edit-public" className="text-xs">
              Public setting
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-reason">Reason (required)</Label>
            <Input
              id="edit-reason"
              value={dialog.reason}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder="Updated setting from admin panel"
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
          <Button onClick={onSubmit} disabled={isPending}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
