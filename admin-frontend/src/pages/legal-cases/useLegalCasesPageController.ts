import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createLegalCase,
  getLegalCaseDetail,
  listLegalCases,
  updateLegalCase,
} from "../../lib/admin-api";
import type {
  LegalCaseStatus,
  LegalCaseType,
  CaseFormState,
  StatusUpdateDialogState,
  AssignDialogState,
} from "./types";
import { toIsoDateTime } from "./utils";

const INITIAL_FORM_STATE: CaseFormState = {
  title: "",
  description: "",
  caseType: "COPYRIGHT",
  priority: "3",
  targetType: "post",
  targetId: "",
  requestedBy: "",
  assignedTo: "",
  dueAt: "",
};

export function useLegalCasesPageController() {
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<LegalCaseStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<LegalCaseType | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [selectedLegalCaseId, setSelectedLegalCaseId] = useState<string | null>(null);
  const [formState, setFormState] = useState<CaseFormState>(INITIAL_FORM_STATE);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState<StatusUpdateDialogState>({
    isOpen: false,
    legalCaseId: null,
  });
  const [assignDialog, setAssignDialog] = useState<AssignDialogState>({
    isOpen: false,
    legalCaseId: null,
    currentAssignee: null,
  });

  const legalCasesQuery = useQuery({
    queryKey: ["admin", "phase6", "legal-cases", statusFilter, typeFilter, search, page],
    queryFn: () =>
      listLegalCases({
        page,
        limit: 10,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        caseType: typeFilter === "ALL" ? undefined : typeFilter,
        search: search.trim() || undefined,
      }),
  });

  const legalCaseDetailQuery = useQuery({
    queryKey: ["admin", "phase6", "legal-case-detail", selectedLegalCaseId],
    queryFn: () => getLegalCaseDetail(selectedLegalCaseId as string),
    enabled: Boolean(selectedLegalCaseId),
  });

  const createCaseMutation = useMutation({
    mutationFn: createLegalCase,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "legal-cases"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "audit-history"] });
    },
  });

  const updateCaseMutation = useMutation({
    mutationFn: (payload: {
      legalCaseId: string;
      body: Parameters<typeof updateLegalCase>[1];
    }) => updateLegalCase(payload.legalCaseId, payload.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "legal-cases"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "legal-case-detail"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "audit-history"] });
    },
  });

  const handleFilterChange = (
    filterType: "status" | "type",
    value: LegalCaseStatus | LegalCaseType | "ALL",
  ) => {
    setPage(1);
    if (filterType === "status") {
      setStatusFilter(value as LegalCaseStatus | "ALL");
    } else {
      setTypeFilter(value as LegalCaseType | "ALL");
    }
  };

  const handleSearchChange = (value: string) => {
    setPage(1);
    setSearch(value);
  };

  const handleRefresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "phase6", "legal-cases"] });
  };

  const handleCreateLegalCase = async () => {
    const normalizedTitle = formState.title.trim();
    const normalizedTargetType = formState.targetType.trim();
    const normalizedTargetId = formState.targetId.trim();

    if (normalizedTitle.length < 5) {
      return { success: false, error: "Title must be at least 5 characters." };
    }

    if (normalizedTargetType.length < 2 || normalizedTargetId.length < 1) {
      return { success: false, error: "Target type and target id are required." };
    }

    const numericPriority = Number(formState.priority);
    if (!Number.isInteger(numericPriority) || numericPriority < 1 || numericPriority > 5) {
      return { success: false, error: "Priority must be an integer between 1 and 5." };
    }

    const response = await createCaseMutation.mutateAsync({
      title: normalizedTitle,
      description: formState.description.trim() || undefined,
      caseType: formState.caseType,
      priority: numericPriority,
      targetType: normalizedTargetType,
      targetId: normalizedTargetId,
      requestedBy: formState.requestedBy.trim() || undefined,
      assignedTo: formState.assignedTo.trim() || undefined,
      dueAt: toIsoDateTime(formState.dueAt),
    });

    if (!response.success) {
      return { success: false, error: response.error };
    }

    setFormState(INITIAL_FORM_STATE);
    setSelectedLegalCaseId(response.data.id);
    return { success: true };
  };

  const handleOpenStatusUpdateDialog = (legalCaseId: string) => {
    setStatusUpdateDialog({ isOpen: true, legalCaseId });
  };

  const handleCloseStatusUpdateDialog = () => {
    setStatusUpdateDialog({ isOpen: false, legalCaseId: null });
  };

  const handleUpdateStatus = async (status: LegalCaseStatus, resolutionNote?: string) => {
    if (!statusUpdateDialog.legalCaseId) return { success: false, error: "No case selected" };

    const response = await updateCaseMutation.mutateAsync({
      legalCaseId: statusUpdateDialog.legalCaseId,
      body: {
        status,
        resolutionNote,
      },
    });

    if (!response.success) {
      return { success: false, error: response.error };
    }

    handleCloseStatusUpdateDialog();
    return { success: true };
  };

  const handleOpenAssignDialog = (legalCaseId: string, currentAssignee: string | null) => {
    setAssignDialog({ isOpen: true, legalCaseId, currentAssignee });
  };

  const handleCloseAssignDialog = () => {
    setAssignDialog({ isOpen: false, legalCaseId: null, currentAssignee: null });
  };

  const handleAssignCase = async (assignedTo: string | null) => {
    if (!assignDialog.legalCaseId) return { success: false, error: "No case selected" };

    const response = await updateCaseMutation.mutateAsync({
      legalCaseId: assignDialog.legalCaseId,
      body: {
        assignedTo,
      },
    });

    if (!response.success) {
      return { success: false, error: response.error };
    }

    handleCloseAssignDialog();
    return { success: true };
  };

  return {
    // Filters and pagination
    statusFilter,
    typeFilter,
    search,
    page,
    setPage,
    handleFilterChange,
    handleSearchChange,
    handleRefresh,

    // Queries
    legalCasesQuery,
    legalCaseDetailQuery,

    // Mutations
    createCaseMutation,
    updateCaseMutation,

    // Selected case
    selectedLegalCaseId,
    setSelectedLegalCaseId,

    // Form state
    formState,
    setFormState,

    // Actions
    handleCreateLegalCase,

    // Status update dialog
    statusUpdateDialog,
    handleOpenStatusUpdateDialog,
    handleCloseStatusUpdateDialog,
    handleUpdateStatus,

    // Assign dialog
    assignDialog,
    handleOpenAssignDialog,
    handleCloseAssignDialog,
    handleAssignCase,
  };
}
