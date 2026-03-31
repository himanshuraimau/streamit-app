import { useModerationReportsPageController } from "./useModerationReportsPageController";
import { ContentReportsSection } from "./components/ContentReportsSection";
import { StreamReportsSection } from "./components/StreamReportsSection";
import { ReportDecisionDialog } from "./components/ReportDecisionDialog";
import { StreamReportDecisionDialog } from "./components/StreamReportDecisionDialog";

export function ModerationReportsPage() {
  const controller = useModerationReportsPageController();

  return (
    <div>
      <header className="mb-6 border-b border-white/10 pb-5">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Phase 3</p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-50">Moderation Queue</h2>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ContentReportsSection
          query={controller.reportsQuery}
          reportStatus={controller.reportStatus}
          onStatusChange={controller.handleReportStatusChange}
          onDecision={controller.handleOpenReportDecisionDialog}
          onPreviousPage={() => controller.setReportPage((prev) => Math.max(prev - 1, 1))}
          onNextPage={() => {
            const data =
              controller.reportsQuery.data && controller.reportsQuery.data.success
                ? controller.reportsQuery.data.data
                : null;
            controller.setReportPage((prev) => Math.min(prev + 1, data?.pagination.totalPages ?? 1));
          }}
          isPending={controller.reportActionMutation.isPending}
        />

        <StreamReportsSection
          query={controller.streamReportsQuery}
          streamReportStatus={controller.streamReportStatus}
          onStatusChange={controller.handleStreamReportStatusChange}
          onDecision={controller.handleOpenStreamReportDecisionDialog}
          onPreviousPage={() => controller.setStreamReportPage((prev) => Math.max(prev - 1, 1))}
          onNextPage={() => {
            const data =
              controller.streamReportsQuery.data && controller.streamReportsQuery.data.success
                ? controller.streamReportsQuery.data.data
                : null;
            controller.setStreamReportPage((prev) =>
              Math.min(prev + 1, data?.pagination.totalPages ?? 1),
            );
          }}
          isPending={controller.streamReportActionMutation.isPending}
        />
      </div>

      <ReportDecisionDialog
        isOpen={controller.reportDecisionDialog.isOpen}
        decision={controller.reportDecisionDialog.decision}
        onClose={controller.handleCloseReportDecisionDialog}
        onConfirm={controller.handleReportDecision}
        isPending={controller.reportActionMutation.isPending}
      />

      <StreamReportDecisionDialog
        isOpen={controller.streamReportDecisionDialog.isOpen}
        status={controller.streamReportDecisionDialog.status}
        onClose={controller.handleCloseStreamReportDecisionDialog}
        onConfirm={controller.handleStreamReportDecision}
        isPending={controller.streamReportActionMutation.isPending}
      />
    </div>
  );
}
