import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AnnouncementDeleteDialogProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function AnnouncementDeleteDialog({
  isOpen,
  title,
  onClose,
  onConfirm,
  isPending,
}: AnnouncementDeleteDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Announcement</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{title}" permanently? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isPending} variant="destructive">
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
