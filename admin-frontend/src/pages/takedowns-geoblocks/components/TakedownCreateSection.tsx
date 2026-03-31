import { AdminSectionCard } from "@/components/admin/AdminSectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TakedownReason } from "@/lib/admin-api";

import { TAKEDOWN_REASON_OPTIONS } from "../constants";

interface TakedownCreateSectionProps {
  newTakedownLegalCaseId: string;
  newTakedownTargetType: string;
  newTakedownTargetId: string;
  newTakedownReason: TakedownReason;
  newTakedownNote: string;
  isSubmitting: boolean;
  onLegalCaseIdChange: (value: string) => void;
  onTargetTypeChange: (value: string) => void;
  onTargetIdChange: (value: string) => void;
  onReasonChange: (value: TakedownReason) => void;
  onNoteChange: (value: string) => void;
  onSubmit: () => void;
}

export function TakedownCreateSection({
  newTakedownLegalCaseId,
  newTakedownTargetType,
  newTakedownTargetId,
  newTakedownReason,
  newTakedownNote,
  isSubmitting,
  onLegalCaseIdChange,
  onTargetTypeChange,
  onTargetIdChange,
  onReasonChange,
  onNoteChange,
  onSubmit,
}: TakedownCreateSectionProps) {
  return (
    <AdminSectionCard
      title="Create Takedown Request"
      description="Submit a new content takedown request"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="takedown-legal-case">Legal case ID (optional)</Label>
            <Input
              id="takedown-legal-case"
              value={newTakedownLegalCaseId}
              onChange={(event) => onLegalCaseIdChange(event.target.value)}
              placeholder="Legal case ID"
              className="text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="takedown-reason">Reason</Label>
            <Select
              value={newTakedownReason}
              onValueChange={(value) => onReasonChange(value as TakedownReason)}
            >
              <SelectTrigger id="takedown-reason">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TAKEDOWN_REASON_OPTIONS.filter((option) => option !== "ALL").map(
                  (option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="takedown-target-type">Target type</Label>
            <Input
              id="takedown-target-type"
              value={newTakedownTargetType}
              onChange={(event) => onTargetTypeChange(event.target.value)}
              placeholder="Target type"
              className="text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="takedown-target-id">Target ID</Label>
            <Input
              id="takedown-target-id"
              value={newTakedownTargetId}
              onChange={(event) => onTargetIdChange(event.target.value)}
              placeholder="Target id"
              className="text-xs"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="takedown-note">Note (optional)</Label>
            <Input
              id="takedown-note"
              value={newTakedownNote}
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder="Note"
              className="text-xs"
            />
          </div>
        </div>

        <Button onClick={onSubmit} disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Creating..." : "Create Takedown"}
        </Button>
      </div>
    </AdminSectionCard>
  );
}
