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
import { Textarea } from "@/components/ui/textarea";

import { ANNOUNCEMENT_TYPES, ROLE_OPTIONS, type RoleFilter } from "../constants";

interface AnnouncementCreateSectionProps {
  newAnnouncementTitle: string;
  newAnnouncementContent: string;
  newAnnouncementType: string;
  newAnnouncementRole: RoleFilter;
  newAnnouncementStartsAt: string;
  newAnnouncementEndsAt: string;
  newAnnouncementIsActive: boolean;
  newAnnouncementIsPinned: boolean;
  isSubmitting: boolean;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onRoleChange: (value: RoleFilter) => void;
  onStartsAtChange: (value: string) => void;
  onEndsAtChange: (value: string) => void;
  onIsActiveChange: (value: boolean) => void;
  onIsPinnedChange: (value: boolean) => void;
  onSubmit: () => void;
}

export function AnnouncementCreateSection({
  newAnnouncementTitle,
  newAnnouncementContent,
  newAnnouncementType,
  newAnnouncementRole,
  newAnnouncementStartsAt,
  newAnnouncementEndsAt,
  newAnnouncementIsActive,
  newAnnouncementIsPinned,
  isSubmitting,
  onTitleChange,
  onContentChange,
  onTypeChange,
  onRoleChange,
  onStartsAtChange,
  onEndsAtChange,
  onIsActiveChange,
  onIsPinnedChange,
  onSubmit,
}: AnnouncementCreateSectionProps) {
  return (
    <AdminSectionCard
      title="Create Announcement"
      description="Create a new platform announcement with targeting and scheduling"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="announcement-title">Title</Label>
            <Input
              id="announcement-title"
              value={newAnnouncementTitle}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Title"
              className="text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="announcement-type">Type</Label>
            <Select value={newAnnouncementType} onValueChange={onTypeChange}>
              <SelectTrigger id="announcement-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ANNOUNCEMENT_TYPES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="announcement-content">Content</Label>
          <Textarea
            id="announcement-content"
            value={newAnnouncementContent}
            onChange={(event) => onContentChange(event.target.value)}
            rows={3}
            placeholder="Content"
            className="text-xs"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="announcement-role">Target Role</Label>
            <Select
              value={newAnnouncementRole}
              onValueChange={(value) => onRoleChange(value as RoleFilter)}
            >
              <SelectTrigger id="announcement-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    Target Role: {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="announcement-active"
                checked={newAnnouncementIsActive}
                onChange={(event) => onIsActiveChange(event.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="announcement-active" className="text-xs">
                Active
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="announcement-pinned"
                checked={newAnnouncementIsPinned}
                onChange={(event) => onIsPinnedChange(event.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="announcement-pinned" className="text-xs">
                Pinned
              </Label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="announcement-starts">Start datetime</Label>
            <Input
              id="announcement-starts"
              type="datetime-local"
              value={newAnnouncementStartsAt}
              onChange={(event) => onStartsAtChange(event.target.value)}
              className="text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="announcement-ends">End datetime</Label>
            <Input
              id="announcement-ends"
              type="datetime-local"
              value={newAnnouncementEndsAt}
              onChange={(event) => onEndsAtChange(event.target.value)}
              className="text-xs"
            />
          </div>
        </div>

        <Button onClick={onSubmit} disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Creating..." : "Create Announcement"}
        </Button>
      </div>
    </AdminSectionCard>
  );
}
