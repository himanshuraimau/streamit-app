import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { CAMPAIGN_STATUS_ACTIONS } from "../constants";
import type { CampaignStatusActionState } from "../types";
import { getCampaignStatusBadgeClassName } from "../utils";

export function CampaignStatusDialog({
  action,
  isPending,
  onOpenChange,
  onReasonChange,
  onSubmit,
}: {
  action: CampaignStatusActionState | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onReasonChange: (value: string) => void;
  onSubmit: () => void;
}) {
  if (!action) {
    return null;
  }

  const nextAction = CAMPAIGN_STATUS_ACTIONS[action.nextStatus];

  return (
    <Dialog open={Boolean(action)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl" showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>{nextAction.label} campaign</DialogTitle>
          <DialogDescription>
            Record an optional transition note before updating campaign state.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-3xl border border-border/60 bg-background/45 p-4">
          <div className="space-y-2">
            <h4 className="text-base font-medium text-foreground">
              {action.campaign.name}
            </h4>
            <p className="text-sm text-muted-foreground">
              {action.campaign.objective || "No objective"}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  getCampaignStatusBadgeClassName(action.campaign.status),
                )}
              >
                {action.campaign.status}
              </Badge>
              <span className="text-sm text-muted-foreground">to</span>
              <Badge variant="outline" className={cn(nextAction.className)}>
                {action.nextStatus}
              </Badge>
            </div>
          </div>
        </div>

        <Form
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit();
          }}
        >
          <FormItem>
            <FormLabel htmlFor="campaign-status-reason">Transition note</FormLabel>
            <FormControl>
              <Textarea
                id="campaign-status-reason"
                value={action.reason}
                onChange={(event) => onReasonChange(event.target.value)}
                placeholder="Status updated by admin"
                rows={4}
              />
            </FormControl>
            <FormDescription>
              Optional, but useful for audit context and future investigations.
            </FormDescription>
          </FormItem>

          {action.error ? <FormMessage>{action.error}</FormMessage> : null}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={nextAction.buttonVariant}
              className={nextAction.className}
              disabled={isPending}
            >
              {isPending ? "Saving..." : nextAction.label}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
