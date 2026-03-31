import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { formatPercent } from "@/lib/formatters";

import type { FinanceNoticeState } from "../types";
import { FinanceNotice } from "./FinanceNotice";
import { FinanceSectionCard } from "./FinanceSectionCard";

export function CommissionConfigSection({
  config,
  commissionRateInput,
  coinToPaiseRateInput,
  onCommissionRateChange,
  onCoinToPaiseRateChange,
  onSubmit,
  isSaving,
  notice,
}: {
  config: { commissionRate: number; coinToPaiseRate: number } | null;
  commissionRateInput: string;
  coinToPaiseRateInput: string;
  onCommissionRateChange: (value: string) => void;
  onCoinToPaiseRateChange: (value: string) => void;
  onSubmit: () => void;
  isSaving: boolean;
  notice: FinanceNoticeState | null;
}) {
  return (
    <FinanceSectionCard
      title="Commission Configuration"
      description="Control payout math for gifts and withdrawals without changing backend payload contracts."
    >
      <div className="space-y-4">
        {notice ? <FinanceNotice notice={notice} /> : null}

        {config ? (
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-border/70 bg-background/45">
              Live commission: {formatPercent(config.commissionRate)}
            </Badge>
            <Badge variant="outline" className="border-border/70 bg-background/45">
              Live coin value: {config.coinToPaiseRate} paise
            </Badge>
          </div>
        ) : null}

        <Form
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit();
          }}
          className="space-y-0"
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_auto]">
            <FormItem>
              <FormLabel htmlFor="commission-rate" required>
                Commission rate
              </FormLabel>
              <FormControl>
                <Input
                  id="commission-rate"
                  value={commissionRateInput}
                  onChange={(event) =>
                    onCommissionRateChange(event.target.value)
                  }
                  inputMode="decimal"
                />
              </FormControl>
              <FormDescription>
                Decimal value between 0 and 0.9.
              </FormDescription>
            </FormItem>

            <FormItem>
              <FormLabel htmlFor="coin-to-paise-rate" required>
                Coin to paise rate
              </FormLabel>
              <FormControl>
                <Input
                  id="coin-to-paise-rate"
                  value={coinToPaiseRateInput}
                  onChange={(event) =>
                    onCoinToPaiseRateChange(event.target.value)
                  }
                  inputMode="numeric"
                />
              </FormControl>
              <FormDescription>
                Integer payout conversion used across reconciliation.
              </FormDescription>
            </FormItem>

            <div className="flex items-end">
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full lg:w-auto"
              >
                {isSaving ? "Saving..." : "Save configuration"}
              </Button>
            </div>
          </div>
        </Form>
      </div>
    </FinanceSectionCard>
  );
}
