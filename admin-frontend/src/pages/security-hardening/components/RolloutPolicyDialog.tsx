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

import type { RolloutPolicyDialogState } from "../types";

interface RolloutPolicyDialogProps {
  dialog: RolloutPolicyDialogState | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onReasonChange: (value: string) => void;
  onSubmit: () => void;
}

export function RolloutPolicyDialog({
  dialog,
  isPending,
  onOpenChange,
  onReasonChange,
  onSubmit,
}: RolloutPolicyDialogProps) {
  if (!dialog) {
    return null;
  }

  const preview = [
    `Enabled: ${dialog.enabled ? "yes" : "no"}`,
    `Super-admin bypass: ${dialog.superAdminBypass ? "yes" : "no"}`,
    `Allowed roles: ${dialog.allowedRoles.length ? dialog.allowedRoles.join(", ") : "ALL admin roles"}`,
    `Allowed countries: ${dialog.allowedCountries.length ? dialog.allowedCountries.join(", ") : "ALL countries"}`,
  ].join("\n");

  return (
    <Dialog open={Boolean(dialog)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Rollout Policy Update</DialogTitle>
          <DialogDescription>
            Review the policy changes before applying them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/50 p-3 text-xs">
            <p className="font-semibold text-foreground">Policy Preview</p>
            <pre className="mt-2 whitespace-pre-wrap text-muted-foreground">
              {preview}
            </pre>
          </div>

          <div className="space-y-2">
            <Label htmlFor="policy-reason">Update reason (required)</Label>
            <Input
              id="policy-reason"
              value={dialog.reason}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder="Phase 8 rollout policy update"
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
            {isPending ? "Applying..." : "Apply Policy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
