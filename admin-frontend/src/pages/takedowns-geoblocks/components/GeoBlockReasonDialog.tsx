import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { GEOBLOCK_REASON_OPTIONS } from "../constants";
import type { GeoBlockReasonDialogState } from "../types";

interface GeoBlockReasonDialogProps {
  dialog: GeoBlockReasonDialogState | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onReasonChange: (value: string) => void;
  onSubmit: () => void;
}

export function GeoBlockReasonDialog({
  dialog,
  isPending,
  onOpenChange,
  onReasonChange,
  onSubmit,
}: GeoBlockReasonDialogProps) {
  if (!dialog) {
    return null;
  }

  return (
    <Dialog open={Boolean(dialog)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Geo-Block Reason</DialogTitle>
          <DialogDescription>
            Update the reason for this geographic content restriction.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/50 p-3 text-xs">
            <p className="font-semibold text-foreground">Geo-Block Details</p>
            <div className="mt-2 space-y-1 text-muted-foreground">
              <p>
                Target: {dialog.geoBlock.targetType}:{dialog.geoBlock.targetId}
              </p>
              <p>Country: {dialog.geoBlock.countryCode}</p>
              <p>Current Reason: {dialog.geoBlock.reason}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason-select">New reason</Label>
            <Select
              value={dialog.reason}
              onValueChange={onReasonChange}
            >
              <SelectTrigger id="reason-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GEOBLOCK_REASON_OPTIONS.filter((option) => option !== "ALL").map(
                  (option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
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
