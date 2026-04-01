import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ContentPreview } from './ContentPreview';
import { moderationApi } from '@/lib/api/moderation.api';
import type { ContentDetail, ModerationActionData } from '@/lib/api/moderation.api';
import { AlertTriangle, Ban, Flag, MessageSquare, Trash2, X } from 'lucide-react';

interface ModerationActionDialogProps {
  content: ContentDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModerationActionDialog({
  content,
  open,
  onOpenChange,
}: ModerationActionDialogProps) {
  const [selectedAction, setSelectedAction] = useState<ModerationActionData['action'] | null>(null);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: ModerationActionData) =>
      moderationApi.moderationAction(content.id, content.type as 'post' | 'short' | 'comment', data),
    onSuccess: () => {
      toast.success('Moderation action completed successfully');
      queryClient.invalidateQueries({ queryKey: ['moderation'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to perform moderation action');
    },
  });

  const resetForm = () => {
    setSelectedAction(null);
    setReason('');
    setMessage('');
    setShowConfirm(false);
  };

  const handleAction = (action: ModerationActionData['action']) => {
    setSelectedAction(action);
    
    if (action === 'strike' || action === 'ban') {
      setShowConfirm(true);
    } else {
      executeAction(action);
    }
  };

  const executeAction = (action: ModerationActionData['action']) => {
    const data: ModerationActionData = { action };
    
    if (action === 'warn' && message) {
      data.message = message;
    }
    
    if ((action === 'remove' || action === 'strike' || action === 'ban') && reason) {
      data.reason = reason;
    }
    
    mutation.mutate(data);
  };

  const handleConfirm = () => {
    if (selectedAction) {
      executeAction(selectedAction);
    }
    setShowConfirm(false);
  };

  return (
    <>
      <Dialog open={open && !showConfirm} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Moderate Content</DialogTitle>
            <DialogDescription>
              Review the flagged content and take appropriate action
            </DialogDescription>
          </DialogHeader>

          <ContentPreview content={content} />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Warning Message (for Warn action)</Label>
              <Textarea
                placeholder="Enter warning message to send to the author..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Reason (for Remove, Strike, or Ban actions)</Label>
              <Textarea
                placeholder="Enter reason for the action..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => handleAction('dismiss')}
              disabled={mutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Dismiss Flags
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAction('warn')}
              disabled={mutation.isPending || !message}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Warn Author
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleAction('remove')}
              disabled={mutation.isPending || !reason}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Content
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleAction('strike')}
              disabled={mutation.isPending || !reason}
            >
              <Flag className="h-4 w-4 mr-2" />
              Strike Author
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleAction('ban')}
              disabled={mutation.isPending || !reason}
            >
              <Ban className="h-4 w-4 mr-2" />
              Ban Author
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm {selectedAction === 'strike' ? 'Strike' : 'Ban'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedAction === 'strike' ? (
                <>
                  This will add a strike to the author's account. Multiple strikes may result in
                  automatic suspension. Are you sure you want to proceed?
                </>
              ) : (
                <>
                  This will permanently ban the author's account and hide all their content. This
                  action cannot be undone. Are you sure you want to proceed?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirm(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm {selectedAction === 'strike' ? 'Strike' : 'Ban'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
