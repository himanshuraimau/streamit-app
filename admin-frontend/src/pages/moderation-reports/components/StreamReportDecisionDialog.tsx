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
import type { StreamReportStatus } from "../types";

interface StreamReportDecisionDialogProps {
  isOpen: boolean;
  status: StreamReportStatus | null;
  onClose: () => void;
  onConfirm: (resolution?: string) => Promise<{ success: boolean; error?: string }>;
  isPending: boolean;
}

export function StreamReportDecisionDialog({
  isOpen,
  status,
  onClose,
  onConfirm,
  isPending,
}: StreamReportDecisionDialogProps) {
  const [resolution, setResolution] = useState("False positive");
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    const result = await onConfirm(
      status === "DISMISSED" ? resolution.trim() || undefined : undefined,
    );
    if (!result.success && result.error) {
      setError(result.error);
    } else if (result.success) {
      setResolution("False positive");
    }
  };

  const handleClose = () => {
    setResolution("False positive");
    setError(null);
    onClose();
  };

  const getTitle = () => {
    switch (status) {
      case "REVIEWED":
        return "Mark as Reviewed";
      case "RESOLVED":
        return "Resolve Stream Report";
      case "DISMISSED":
        return "Dismiss Stream Report";
      default:
        return "Action Stream Report";
    }
  };

  const getDescription = () => {
    switch (status) {
      case "REVIEWED":
        return "This will mark the stream report as reviewed.";
      case "RESOLVED":
        return "This will mark the stream report as resolved.";
      case "DISMISSED":
        return "This will dismiss the stream report. Optionally provide a dismissal note.";
      default:
        return "Take action on this stream report.";
    }
  };

  const showResolutionField = status === "DISMISSED";

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
              <Label htmlFor="resolution">Dismissal Note (Optional)</Label>
              <Textarea
                id="resolution"
                value={resolution}
                onChange={(event) => setResolution(event.target.value)}
                rows={3}
                placeholder="False positive"
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
