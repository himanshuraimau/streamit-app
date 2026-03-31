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
import type { GeoBlockReason } from "@/lib/admin-api";

import { GEOBLOCK_REASON_OPTIONS } from "../constants";

interface GeoBlockCreateSectionProps {
  newGeoTargetType: string;
  newGeoTargetId: string;
  newGeoCountryCode: string;
  newGeoReason: GeoBlockReason;
  newGeoNote: string;
  newGeoExpiresAt: string;
  isSubmitting: boolean;
  onTargetTypeChange: (value: string) => void;
  onTargetIdChange: (value: string) => void;
  onCountryCodeChange: (value: string) => void;
  onReasonChange: (value: GeoBlockReason) => void;
  onNoteChange: (value: string) => void;
  onExpiresAtChange: (value: string) => void;
  onSubmit: () => void;
}

export function GeoBlockCreateSection({
  newGeoTargetType,
  newGeoTargetId,
  newGeoCountryCode,
  newGeoReason,
  newGeoNote,
  newGeoExpiresAt,
  isSubmitting,
  onTargetTypeChange,
  onTargetIdChange,
  onCountryCodeChange,
  onReasonChange,
  onNoteChange,
  onExpiresAtChange,
  onSubmit,
}: GeoBlockCreateSectionProps) {
  return (
    <AdminSectionCard
      title="Create Geo-Block Rule"
      description="Create a new geographic content restriction"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="geo-target-type">Target type</Label>
            <Input
              id="geo-target-type"
              value={newGeoTargetType}
              onChange={(event) => onTargetTypeChange(event.target.value)}
              placeholder="Target type"
              className="text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="geo-target-id">Target ID</Label>
            <Input
              id="geo-target-id"
              value={newGeoTargetId}
              onChange={(event) => onTargetIdChange(event.target.value)}
              placeholder="Target id"
              className="text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="geo-country-code">Country code</Label>
            <Input
              id="geo-country-code"
              value={newGeoCountryCode}
              onChange={(event) => onCountryCodeChange(event.target.value)}
              placeholder="Country code"
              className="text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="geo-reason">Reason</Label>
            <Select
              value={newGeoReason}
              onValueChange={(value) => onReasonChange(value as GeoBlockReason)}
            >
              <SelectTrigger id="geo-reason">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GEOBLOCK_REASON_OPTIONS.filter((option) => option !== "ALL").map(
                  (option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="geo-note">Note (optional)</Label>
            <Input
              id="geo-note"
              value={newGeoNote}
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder="Note"
              className="text-xs"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="geo-expires">Expiration datetime (optional)</Label>
            <Input
              id="geo-expires"
              type="datetime-local"
              value={newGeoExpiresAt}
              onChange={(event) => onExpiresAtChange(event.target.value)}
              className="text-xs"
            />
          </div>
        </div>

        <Button onClick={onSubmit} disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Creating..." : "Create Geo-Block Rule"}
        </Button>
      </div>
    </AdminSectionCard>
  );
}
