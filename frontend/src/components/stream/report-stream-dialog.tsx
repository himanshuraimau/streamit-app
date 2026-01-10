import { useState, useCallback } from 'react';
import { Flag, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { streamApi, type ReportReason } from '@/lib/api/stream';

interface ReportStreamDialogProps {
  streamId: string;
  creatorId: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ReportReasonOption {
  value: ReportReason;
  label: string;
  description: string;
}

const REPORT_REASONS: ReportReasonOption[] = [
  {
    value: 'INAPPROPRIATE_CONTENT',
    label: 'Inappropriate Content',
    description: 'Nudity, sexual content, or other inappropriate material',
  },
  {
    value: 'HARASSMENT',
    label: 'Harassment',
    description: 'Bullying, threats, or targeted harassment',
  },
  {
    value: 'SPAM',
    label: 'Spam',
    description: 'Misleading content, scams, or excessive promotion',
  },
  {
    value: 'VIOLENCE',
    label: 'Violence',
    description: 'Graphic violence, dangerous activities, or threats',
  },
  {
    value: 'COPYRIGHT',
    label: 'Copyright Violation',
    description: 'Unauthorized use of copyrighted material',
  },
  {
    value: 'OTHER',
    label: 'Other',
    description: 'Other violations not listed above',
  },
];

/**
 * ReportStreamDialog Component
 * 
 * Modal dialog for reporting inappropriate streams with reason selection
 * and optional description.
 * 
 * Requirements:
 * - 2.1: Display report icon in stream controls area
 * - 2.2: Display report dialog with reason options
 * - 2.3: Send report to backend and show confirmation
 * - 2.4: Display error message and allow retry on failure
 */
export function ReportStreamDialog({
  streamId,
  // creatorId is available for future use (e.g., preventing self-reports)
  creatorId: _creatorId,
  open,
  onClose,
  onSuccess,
}: ReportStreamDialogProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReasonSelect = useCallback((reason: ReportReason) => {
    setSelectedReason(reason);
    setError(null);
  }, []);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedReason) {
      setError('Please select a reason for your report');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await streamApi.reportStream({
        streamId,
        reason: selectedReason,
        description: description.trim() || undefined,
      });

      if (response.success && response.data) {
        toast.success('Report submitted successfully', {
          description: 'Thank you for helping keep our community safe.',
          duration: 4000,
        });
        
        // Reset form state
        setSelectedReason(null);
        setDescription('');
        
        onSuccess?.();
        onClose();
      } else {
        setError(response.error || 'Failed to submit report. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      setError('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [streamId, selectedReason, description, onSuccess, onClose]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setSelectedReason(null);
      setDescription('');
      setError(null);
      onClose();
    }
  }, [isSubmitting, onClose]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-500" />
            Report Stream
          </DialogTitle>
          <DialogDescription>
            Help us understand what's wrong with this stream. Your report will be reviewed by our team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reason Selection */}
          <div className="space-y-2">
            <Label>Select a reason</Label>
            <div className="grid gap-2">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason.value}
                  type="button"
                  onClick={() => handleReasonSelect(reason.value)}
                  disabled={isSubmitting}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedReason === reason.value
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-border hover:border-red-500/50 hover:bg-accent'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="font-medium text-sm">{reason.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {reason.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Description */}
          <div className="space-y-2">
            <Label htmlFor="report-description">
              Additional details (optional)
            </Label>
            <Textarea
              id="report-description"
              placeholder="Provide any additional context that might help us review this report..."
              value={description}
              onChange={handleDescriptionChange}
              disabled={isSubmitting}
              maxLength={1000}
              className="resize-none"
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/1000
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedReason}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Flag className="w-4 h-4 mr-2" />
                Submit Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
