import { AdminSectionCard } from "@/components/admin/AdminSectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SettingCreateSectionProps {
  newSettingKey: string;
  newSettingValue: string;
  newSettingReason: string;
  newSettingIsPublic: boolean;
  isSubmitting: boolean;
  onKeyChange: (value: string) => void;
  onValueChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onIsPublicChange: (value: boolean) => void;
  onSubmit: () => void;
}

export function SettingCreateSection({
  newSettingKey,
  newSettingValue,
  newSettingReason,
  newSettingIsPublic,
  isSubmitting,
  onKeyChange,
  onValueChange,
  onReasonChange,
  onIsPublicChange,
  onSubmit,
}: SettingCreateSectionProps) {
  return (
    <AdminSectionCard
      title="Create / Upsert Setting"
      description="Create a new setting or update an existing one"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="setting-key">Setting key</Label>
          <Input
            id="setting-key"
            value={newSettingKey}
            onChange={(event) => onKeyChange(event.target.value)}
            placeholder="Setting key"
            className="text-xs"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="setting-value">Setting value</Label>
          <Textarea
            id="setting-value"
            value={newSettingValue}
            onChange={(event) => onValueChange(event.target.value)}
            rows={3}
            placeholder="Setting value"
            className="text-xs"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="setting-reason">Reason</Label>
          <Input
            id="setting-reason"
            value={newSettingReason}
            onChange={(event) => onReasonChange(event.target.value)}
            placeholder="Reason"
            className="text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="setting-public"
            checked={newSettingIsPublic}
            onChange={(event) => onIsPublicChange(event.target.checked)}
            className="h-4 w-4"
          />
          <Label htmlFor="setting-public" className="text-xs">
            Public setting
          </Label>
        </div>

        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Saving..." : "Save Setting"}
        </Button>
      </div>
    </AdminSectionCard>
  );
}
