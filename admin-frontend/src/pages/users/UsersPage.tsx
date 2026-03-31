import { AdminNotice } from "../../components/admin/AdminNotice";
import { useUsersPageController } from "./useUsersPageController";
import { UserFiltersSection } from "./components/UserFiltersSection";
import { UsersListSection } from "./components/UsersListSection";
import { UserDetailSection } from "./components/UserDetailSection";
import { SuspensionDialog } from "./components/SuspensionDialog";

export function UsersPage() {
  const controller = useUsersPageController();

  const listError =
    controller.listQuery.data && !controller.listQuery.data.success
      ? controller.listQuery.data.error
      : null;

  return (
    <div>
      <header className="mb-6 border-b border-white/10 pb-5">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Phase 2</p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-50">User Management</h2>
      </header>

      <UserFiltersSection
        search={controller.search}
        role={controller.role}
        suspensionFilter={controller.suspensionFilter}
        onSearchChange={controller.handleSearchChange}
        onRoleChange={controller.handleRoleChange}
        onSuspensionFilterChange={controller.handleSuspensionFilterChange}
        onRefresh={controller.handleRefresh}
      />

      {listError ? (
        <div className="mb-4">
          <AdminNotice
            notice={{
              tone: "error",
              title: "Error Loading Users",
              description: listError,
            }}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <UsersListSection
          query={controller.listQuery}
          users={controller.users}
          pagination={controller.pagination}
          selectedId={controller.selectedId}
          onSelectUser={controller.setSelectedUserId}
          onPreviousPage={() => controller.setPage((prev) => Math.max(prev - 1, 1))}
          onNextPage={() =>
            controller.setPage((prev) =>
              Math.min(prev + 1, controller.pagination.totalPages || 1),
            )
          }
        />

        <UserDetailSection
          query={controller.detailQuery}
          selectedDetail={controller.selectedDetail}
          onToggleSuspension={controller.handleOpenSuspensionDialog}
          isPending={controller.updateSuspensionMutation.isPending}
        />
      </div>

      <SuspensionDialog
        isOpen={controller.suspensionDialog.isOpen}
        currentlySuspended={controller.suspensionDialog.currentlySuspended}
        onClose={controller.handleCloseSuspensionDialog}
        onConfirm={controller.handleToggleSuspension}
        isPending={controller.updateSuspensionMutation.isPending}
      />
    </div>
  );
}
