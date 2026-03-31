import { useLegalCasesPageController } from "./useLegalCasesPageController";
import { CaseQueueSection } from "./components/CaseQueueSection";
import { CreateCaseSection } from "./components/CreateCaseSection";
import { CaseDetailSection } from "./components/CaseDetailSection";
import { StatusUpdateDialog } from "./components/StatusUpdateDialog";
import { AssignCaseDialog } from "./components/AssignCaseDialog";

export function LegalCasesPage() {
  const controller = useLegalCasesPageController();

  return (
    <div>
      <header className="mb-6 border-b border-white/10 pb-5">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Phase 6</p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-50">Legal Case Workspace</h2>
      </header>

      <div className="mb-4">
        <CaseQueueSection
          query={controller.legalCasesQuery}
          statusFilter={controller.statusFilter}
          typeFilter={controller.typeFilter}
          search={controller.search}
          page={controller.page}
          onStatusFilterChange={(value) => controller.handleFilterChange("status", value)}
          onTypeFilterChange={(value) => controller.handleFilterChange("type", value)}
          onSearchChange={controller.handleSearchChange}
          onPageChange={controller.setPage}
          onRefresh={controller.handleRefresh}
          onViewDetail={controller.setSelectedLegalCaseId}
          onUpdateStatus={controller.handleOpenStatusUpdateDialog}
          onAssignCase={controller.handleOpenAssignDialog}
          isUpdating={controller.updateCaseMutation.isPending}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <CreateCaseSection
          formState={controller.formState}
          onFormChange={(updates) =>
            controller.setFormState((prev) => ({ ...prev, ...updates }))
          }
          onSubmit={controller.handleCreateLegalCase}
          isCreating={controller.createCaseMutation.isPending}
        />

        <CaseDetailSection
          selectedCaseId={controller.selectedLegalCaseId}
          query={controller.legalCaseDetailQuery}
        />
      </div>

      <StatusUpdateDialog
        isOpen={controller.statusUpdateDialog.isOpen}
        onClose={controller.handleCloseStatusUpdateDialog}
        onConfirm={controller.handleUpdateStatus}
        isPending={controller.updateCaseMutation.isPending}
      />

      <AssignCaseDialog
        isOpen={controller.assignDialog.isOpen}
        currentAssignee={controller.assignDialog.currentAssignee}
        onClose={controller.handleCloseAssignDialog}
        onConfirm={controller.handleAssignCase}
        isPending={controller.updateCaseMutation.isPending}
      />
    </div>
  );
}
