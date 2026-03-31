import type { UserListItem } from "../types";
import { USER_ROLES, SUSPENSION_FILTERS } from "../constants";

interface UserFiltersSectionProps {
  search: string;
  role: "ALL" | UserListItem["role"];
  suspensionFilter: "ALL" | "ACTIVE" | "SUSPENDED";
  onSearchChange: (value: string) => void;
  onRoleChange: (value: "ALL" | UserListItem["role"]) => void;
  onSuspensionFilterChange: (value: "ALL" | "ACTIVE" | "SUSPENDED") => void;
  onRefresh: () => void;
}

export function UserFiltersSection({
  search,
  role,
  suspensionFilter,
  onSearchChange,
  onRoleChange,
  onSuspensionFilterChange,
  onRefresh,
}: UserFiltersSectionProps) {
  return (
    <section className="mb-4 grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-[#111113] p-4 md:grid-cols-4">
      <input
        aria-label="Search users by name, username, or email"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by name, username, email"
        className="rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
      />

      <select
        aria-label="Filter users by role"
        value={role}
        onChange={(event) => onRoleChange(event.target.value as "ALL" | UserListItem["role"])}
        className="rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
      >
        {USER_ROLES.map((r) => (
          <option key={r} value={r}>
            {r === "ALL" ? "All Roles" : r.replace("_", " ")}
          </option>
        ))}
      </select>

      <select
        aria-label="Filter users by account state"
        value={suspensionFilter}
        onChange={(event) =>
          onSuspensionFilterChange(event.target.value as "ALL" | "ACTIVE" | "SUSPENDED")
        }
        className="rounded-xl border border-white/15 bg-[#0d0d0f] px-3 py-2 text-sm text-zinc-100"
      >
        {SUSPENSION_FILTERS.map((filter) => (
          <option key={filter} value={filter}>
            {filter === "ALL" ? "All States" : filter}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={onRefresh}
        aria-label="Refresh users list"
        className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-white/10"
      >
        Refresh
      </button>
    </section>
  );
}
