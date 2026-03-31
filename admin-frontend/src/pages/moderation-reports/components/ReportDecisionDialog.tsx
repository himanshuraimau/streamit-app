import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";

interface ReportDecisionDialogProps {
  isOpen: boolean;
  decision: "DISMISS" | "RESOLVE" | "HIDE_POST" | "HIDE_COMMENT" | "SUSPEND_REPORTED_USER" | null;
  onClose: () => void;
  onConfirm: (resolution?: string) => Promise<{ success: boolean; error?: string }>;
  isPending: boolean;
}

export function ReportDecisionDialog({
  isOpen,
  decision,
  onClose,
  onConfirm,
  isPending,
}: ReportDecisionDialogProps) {
  const [resolution, setResolution] = useState("Actioned by moderator");
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    const result = await onConfirm(decision === "DISMISS" ? undefined : resolution.trim() || undefined);
    if (!result.success && result.error) {
      setError(result.error);
    } else if (result.success) {
      setResolution("Actioned by moderator");
    }
  };

  const handleClose = () => {
    setResolution("Actioned by moderator");
    setError(null);
    onClose();
  };

  const getTitle = () => {
    switch (decision) {
      case "DISMISS":
        return "Dismiss Report";
      case "RESOLVE":
        return "Resolve Report";
      case "HIDE_POST":
        return "Hide Post";
      case "HIDE_COMMENT":
        return "Hide Comment";
      case "SUSPEND_REPORTED_USER":
        return "Suspend Reported User";
      default:
        return "Action Report";
    }
  };

  const getDescription = () => {
    switch (decision) {
      case "DISMISS":
        return "This will mark the report as dismissed without taking action.";
      case "RESOLVE":
        return "This will mark the report as resolved. Optionally provide a resolution note.";
      case "HIDE_POST":
        return "This will hide the reported post and mark the report as resolved.";
      case "HIDE_COMMENT":
        return "This will hide the reported comment and mark the report as resolved.";
      case "SUSPEND_REPORTED_USER":
        return "This will suspend the reported user and mark the report as resolved.";
      default:
        return "Take action on this report.";
    }
  };

  const showResolutionField = decision !== "DISMISS";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error ? (
            <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {showResolutionField ? (
            <div className="space-y-2">
              <Label htmlFor="resolution">Resolution Note (Optional)</Label>
              <Textarea
                id="resolution"
                value={resolution}
                onChange={(event) => setResolution(event.target.value)}
                rows={3}
                placeholder="Actioned by moderator"
              />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={() => void handleConfirm()} disabled={isPending}>
            {isPending ? "Processing..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
