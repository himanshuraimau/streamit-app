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

interface RejectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<{ success: boolean; error?: string }>;
  isPending: boolean;
}

export function RejectionDialog({
  isOpen,
  onClose,
  onConfirm,
  isPending,
}: RejectionDialogProps) {
  const [reason, setReason] = useState("Insufficient verification data");
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    const result = await onConfirm(reason);
    if (!result.success && result.error) {
      setError(result.error);
    } else if (result.success) {
      setReason("Insufficient verification data");
    }
  };

  const handleClose = () => {
    setReason("Insufficient verification data");
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Creator Application</DialogTitle>
          <DialogDescription>
            Provide a reason for rejecting this creator application. The reason must be at least 5
            characters.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error ? (
            <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="reason">Rejection Reason (Required)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              placeholder="Insufficient verification data"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleConfirm()}
            disabled={isPending}
            variant="destructive"
          >
            {isPending ? "Rejecting..." : "Reject Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
