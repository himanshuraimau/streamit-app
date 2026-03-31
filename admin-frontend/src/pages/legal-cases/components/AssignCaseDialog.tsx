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
import { Input } from "../../../components/ui/input";

interface AssignCaseDialogProps {
  isOpen: boolean;
  currentAssignee: string | null;
  onClose: () => void;
  onConfirm: (assignedTo: string | null) => Promise<{ success: boolean; error?: string }>;
  isPending: boolean;
}

export function AssignCaseDialog({
  isOpen,
  currentAssignee,
  onClose,
  onConfirm,
  isPending,
}: AssignCaseDialogProps) {
  const [assignedTo, setAssignedTo] = useState(currentAssignee ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    const result = await onConfirm(assignedTo.trim() || null);
    if (!result.success && result.error) {
      setError(result.error);
    } else if (result.success) {
      setAssignedTo("");
    }
  };

  const handleClose = () => {
    setAssignedTo(currentAssignee ?? "");
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Case</DialogTitle>
          <DialogDescription>
            Assign this legal case to an admin user. Leave empty to unassign.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error ? (
            <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assignee Admin User ID</Label>
            <Input
              id="assignedTo"
              value={assignedTo}
              onChange={(event) => setAssignedTo(event.target.value)}
              placeholder="Leave empty to unassign"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={() => void handleConfirm()} disabled={isPending}>
            {isPending ? "Assigning..." : "Assign Case"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
