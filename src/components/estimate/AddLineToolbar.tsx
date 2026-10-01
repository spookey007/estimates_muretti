"use client";

import { addLine, QUICK_ADD_ROLES } from "@/lib/blank-estimate";
import type { EstimateRequest, LineRole } from "@/lib/types";

export function AddLineToolbar({
  request,
  onRequestChange,
}: {
  request: EstimateRequest;
  onRequestChange: (next: EstimateRequest) => void;
}) {
  const add = (role: LineRole, defaults?: Parameters<typeof addLine>[2]) => {
    onRequestChange(addLine(request, role, defaults));
  };

  return (
    <div className="rounded-xl border border-dashed border-[#c5d0db] bg-[#f8fafc] p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            Add items
          </h3>
          <p className="text-xs leading-relaxed text-[var(--muted)]">
            Add shelves, panels, and other parts — then edit sizes in the table.
          </p>
        </div>
        <button
          type="button"
          onClick={() => add("shelf")}
          className="btn-primary shrink-0 py-2 text-xs sm:text-sm"
        >
          + Empty line
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {QUICK_ADD_ROLES.map(({ role, label, defaults }) => (
          <button
            key={role}
            type="button"
            onClick={() => add(role, defaults)}
            className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-medium text-[var(--foreground)] hover:border-[#9eb0c2] hover:bg-white"
          >
            {label}
          </button>
        ))}
      </div>
      {request.lines.length === 0 && (
        <p className="mt-4 text-xs text-[var(--muted)]">
          No lines yet — use a quick-add button above to get started.
        </p>
      )}
    </div>
  );
}
