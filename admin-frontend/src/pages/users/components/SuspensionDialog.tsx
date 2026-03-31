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

interface SuspensionDialogProps {
  isOpen: boolean;
  currentlySuspended: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<{ success: boolean; error?: string }>;
  isPending: boolean;
}

export function SuspensionDialog({
  isOpen,
  currentlySuspended,
  onClose,
  onConfirm,
  isPending,
}: SuspensionDialogProps) {
  const [reason, setReason] = useState("Policy violation");
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    const result = await onConfirm(currentlySuspended ? undefined : reason);
    if (!result.success && result.error) {
      setError(result.error);
    } else if (result.success) {
      setReason("Policy violation");
    }
  };

  const handleClose = () => {
    setReason("Policy violation");
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {currentlySuspended ? "Unsuspend User" : "Suspend User"}
          </DialogTitle>
          <DialogDescription>
            {currentlySuspended
              ? "This will restore the user's access to the platform."
              : "This will prevent the user from accessing the platform. Please provide a reason."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error ? (
            <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {!currentlySuspended ? (
            <div className="space-y-2">
              <Label htmlFor="reason">Suspension Reason (Required)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                placeholder="Policy violation"
              />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleConfirm()}
            disabled={isPending}
            variant={currentlySuspended ? "default" : "destructive"}
          >
            {isPending
              ? "Updating..."
              : currentlySuspended
                ? "Unsuspend User"
                : "Suspend User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
