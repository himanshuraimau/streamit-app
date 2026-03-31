import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";

interface GeoBlockRemoveDialogProps {
  isOpen: boolean;
  target: string;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function GeoBlockRemoveDialog({
  isOpen,
  target,
  onClose,
  onConfirm,
  isPending,
}: GeoBlockRemoveDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Geo-Block Rule</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove the geo-block rule for {target} permanently? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isPending} variant="destructive">
            {isPending ? "Removing..." : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
