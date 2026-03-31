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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  formatCurrencyFromPaise,
  formatNumber,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";

import { WITHDRAWAL_DECISION_META } from "../constants";
import type { WithdrawalActionState } from "../types";
import { getStatusBadgeClassName } from "../utils";

export function WithdrawalDecisionDialog({
  action,
  isPending,
  onOpenChange,
  onReasonChange,
  onPayoutReferenceChange,
  onSubmit,
}: {
  action: WithdrawalActionState | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onReasonChange: (value: string) => void;
  onPayoutReferenceChange: (value: string) => void;
  onSubmit: () => void;
}) {
  if (!action) {
    return null;
  }

  const meta = WITHDRAWAL_DECISION_META[action.decision];

  return (
    <Dialog open={Boolean(action)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl" showCloseButton={!isPending}>
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle>{meta.title}</DialogTitle>
            <Badge
              variant="outline"
              className={cn(getStatusBadgeClassName(action.withdrawal.status))}
            >
              {action.withdrawal.status}
            </Badge>
          </div>
          <DialogDescription>{meta.description}</DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-border/60 bg-background/45 p-4 text-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-medium text-foreground">
                {action.withdrawal.user.name}
              </p>
              <p className="text-muted-foreground">
                @{action.withdrawal.user.username} · {action.withdrawal.user.email}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="font-medium text-foreground">
                {formatCurrencyFromPaise(action.withdrawal.netAmountPaise)}
              </p>
              <p className="text-muted-foreground">
                {formatNumber(action.withdrawal.amountCoins)} coins
              </p>
            </div>
          </div>
        </div>

        <Form
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit();
          }}
        >
          {meta.payoutReferenceRequired ? (
            <FormItem>
              <FormLabel htmlFor="withdrawal-payout-reference" required>
                {meta.payoutReferenceLabel}
              </FormLabel>
              <FormControl>
                <Input
                  id="withdrawal-payout-reference"
                  value={action.payoutReference}
                  onChange={(event) =>
                    onPayoutReferenceChange(event.target.value)
                  }
                  placeholder={meta.payoutReferencePlaceholder}
                />
              </FormControl>
              <FormDescription>
                Record the final transfer or settlement reference for audit history.
              </FormDescription>
            </FormItem>
          ) : null}

          <FormItem>
            <FormLabel
              htmlFor="withdrawal-reason"
              required={meta.reasonRequired}
            >
              {meta.reasonLabel}
            </FormLabel>
            <FormControl>
              <Textarea
                id="withdrawal-reason"
                value={action.reason}
                onChange={(event) => onReasonChange(event.target.value)}
                placeholder={meta.reasonPlaceholder}
                rows={4}
              />
            </FormControl>
            <FormDescription>
              {meta.reasonRequired
                ? "This note is required and should explain the decision clearly."
                : "Optional, but recommended when you want clearer payout history."}
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
              variant={meta.buttonVariant}
              className={meta.buttonClassName}
              disabled={isPending}
            >
              {isPending ? "Saving..." : meta.confirmLabel}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
