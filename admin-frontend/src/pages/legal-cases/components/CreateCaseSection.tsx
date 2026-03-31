import { useState } from "react";
import { AdminSectionCard } from "../../../components/admin/AdminSectionCard";
import { AdminNotice } from "../../../components/admin/AdminNotice";
import type { CaseFormState, LegalCaseType } from "../types";
import { LEGAL_CASE_TYPES } from "../constants";

interface CreateCaseSectionProps {
  formState: CaseFormState;
  onFormChange: (updates: Partial<CaseFormState>) => void;
  onSubmit: () => Promise<{ success: boolean; error?: string }>;
  isCreating: boolean;
}

export function CreateCaseSection({
  formState,
  onFormChange,
  onSubmit,
  isCreating,
}: CreateCaseSectionProps) {
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setValidationError(null);
    const result = await onSubmit();
    if (!result.success && result.error) {
      setValidationError(result.error);
    }
  };

  return (
    <AdminSectionCard title="Create Legal Case" description="File a new legal case">
      {validationError ? (
        <AdminNotice
          notice={{
            tone: "error",
            title: "Validation Error",
            description: validationError,
          }}
        />
      ) : null}

      <div className="space-y-3 text-xs">
        <label className="block text-zinc-400">
          Title
          <input
            value={formState.title}
            onChange={(event) => onFormChange({ title: event.target.value })}
            className="mt-1 w-full rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
          />
        </label>

        <label className="block text-zinc-400">
          Description
          <textarea
            value={formState.description}
            onChange={(event) => onFormChange({ description: event.target.value })}
            rows={3}
            className="mt-1 w-full rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
          />
        </label>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-zinc-400">
            Case Type
            <select
              value={formState.caseType}
              onChange={(event) =>
                onFormChange({ caseType: event.target.value as LegalCaseType })
              }
              className="mt-1 w-full rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
            >
              {LEGAL_CASE_TYPES.filter((value) => value !== "ALL").map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="text-zinc-400">
            Priority (1-5)
            <input
              value={formState.priority}
              onChange={(event) => onFormChange({ priority: event.target.value })}
              className="mt-1 w-full rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
            />
          </label>

          <label className="text-zinc-400">
            Target Type
            <input
              value={formState.targetType}
              onChange={(event) => onFormChange({ targetType: event.target.value })}
              className="mt-1 w-full rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
            />
          </label>

          <label className="text-zinc-400">
            Target ID
            <input
              value={formState.targetId}
              onChange={(event) => onFormChange({ targetId: event.target.value })}
              className="mt-1 w-full rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
            />
          </label>

          <label className="text-zinc-400">
            Requested By
            <input
              value={formState.requestedBy}
              onChange={(event) => onFormChange({ requestedBy: event.target.value })}
              placeholder="Optional user/admin id"
              className="mt-1 w-full rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
            />
          </label>

          <label className="text-zinc-400">
            Assigned To
            <input
              value={formState.assignedTo}
              onChange={(event) => onFormChange({ assignedTo: event.target.value })}
              placeholder="Optional admin id"
              className="mt-1 w-full rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
            />
          </label>

          <label className="text-zinc-400 md:col-span-2">
            Due At
            <input
              type="datetime-local"
              value={formState.dueAt}
              onChange={(event) => onFormChange({ dueAt: event.target.value })}
              className="mt-1 w-full rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={isCreating}
          className="w-full rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-40"
        >
          {isCreating ? "Creating..." : "Create Legal Case"}
        </button>
      </div>
    </AdminSectionCard>
  );
}
