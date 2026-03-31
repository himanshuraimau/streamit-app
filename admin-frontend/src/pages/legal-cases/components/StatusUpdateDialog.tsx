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
import type { LegalCaseStatus } from "../types";
import { UPDATABLE_STATUSES } from "../constants";

interface StatusUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: LegalCaseStatus, resolutionNote?: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  isPending: boolean;
}

export function StatusUpdateDialog({
  isOpen,
  onClose,
  onConfirm,
  isPending,
}: StatusUpdateDialogProps) {
  const [status, setStatus] = useState<LegalCaseStatus>("UNDER_REVIEW");
  const [resolutionNote, setResolutionNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    const note =
      status === "RESOLVED" || status === "CLOSED"
        ? resolutionNote.trim() || undefined
        : undefined;

    const result = await onConfirm(status, note);
    if (!result.success && result.error) {
      setError(result.error);
    } else if (result.success) {
      setStatus("UNDER_REVIEW");
      setResolutionNote("");
    }
  };

  const handleClose = () => {
    setStatus("UNDER_REVIEW");
    setResolutionNote("");
    setError(null);
    onClose();
  };

  const showResolutionNote = status === "RESOLVED" || status === "CLOSED";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Case Status</DialogTitle>
          <DialogDescription>
            Change the status of this legal case. Resolution note is optional for RESOLVED or
            CLOSED statuses.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error ? (
            <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="status">New Status</Label>
            <select
              id="status"
              value={status}
              onChange={(event) => setStatus(event.target.value as LegalCaseStatus)}
              className="w-full rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
            >
              {UPDATABLE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {showResolutionNote ? (
            <div className="space-y-2">
              <Label htmlFor="resolutionNote">Resolution Note (Optional)</Label>
              <textarea
                id="resolutionNote"
                value={resolutionNote}
                onChange={(event) => setResolutionNote(event.target.value)}
                rows={3}
                placeholder="Resolved by legal admin"
                className="w-full rounded-lg border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
              />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={() => void handleConfirm()} disabled={isPending}>
            {isPending ? "Updating..." : "Update Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
