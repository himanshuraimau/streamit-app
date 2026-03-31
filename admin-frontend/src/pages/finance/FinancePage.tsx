import { CommissionConfigSection } from "./components/CommissionConfigSection";
import { FinanceSnapshotSection } from "./components/FinanceSnapshotSection";
import { ReconciliationSection } from "./components/ReconciliationSection";
import { TransactionsSection } from "./components/TransactionsSection";
import { WithdrawalDecisionDialog } from "./components/WithdrawalDecisionDialog";
import { WithdrawalsSection } from "./components/WithdrawalsSection";
import { useFinancePageController } from "./useFinancePageController";

export function FinancePage() {
  const controller = useFinancePageController();

  return (
    <div className="space-y-6">
      <header className="space-y-3 border-b border-border/60 pb-5">
        <p className="font-heading text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          Phase 4
        </p>
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            Finance And Withdrawals
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Modular finance operations for payout review, transaction
            investigation, and reconciliation snapshots. This refactor keeps
            the existing TanStack Query contracts intact while replacing native
            browser prompts with controlled admin dialogs.
          </p>
        </div>
      </header>

      <FinanceSnapshotSection {...controller.summarySection} />
      <CommissionConfigSection {...controller.configSection} />
      <TransactionsSection {...controller.transactionsSection} />
      <WithdrawalsSection {...controller.withdrawalsSection} />
      <ReconciliationSection {...controller.reconciliationSection} />
      <WithdrawalDecisionDialog {...controller.withdrawalDialog} />
    </div>
  );
}
