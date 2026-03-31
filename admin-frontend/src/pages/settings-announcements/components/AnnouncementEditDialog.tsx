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
import { Textarea } from "@/components/ui/textarea";

import type { AnnouncementEditDialogState } from "../types";

interface AnnouncementEditDialogProps {
  dialog: AnnouncementEditDialogState | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSubmit: () => void;
}

export function AnnouncementEditDialog({
  dialog,
  isPending,
  onOpenChange,
  onTitleChange,
  onContentChange,
  onSubmit,
}: AnnouncementEditDialogProps) {
  if (!dialog) {
    return null;
  }

  return (
    <Dialog open={Boolean(dialog)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Announcement</DialogTitle>
          <DialogDescription>
            Update the title and content for this announcement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-announcement-title">Title</Label>
            <Input
              id="edit-announcement-title"
              value={dialog.title}
              onChange={(event) => onTitleChange(event.target.value)}
              className="text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-announcement-content">Content</Label>
            <Textarea
              id="edit-announcement-content"
              value={dialog.content}
              onChange={(event) => onContentChange(event.target.value)}
              rows={4}
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
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
