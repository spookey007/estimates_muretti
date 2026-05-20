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
    <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-stone-800">Add items</h3>
          <p className="mt-1 text-xs text-stone-600">
            No CSV needed — add lines here with qty, dimensions, finish, and notes like the
            template columns.
          </p>
        </div>
        <button
          type="button"
          onClick={() => add("shelf")}
          className="shrink-0 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          + Empty line
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK_ADD_ROLES.map(({ role, label, defaults }) => (
          <button
            key={role}
            type="button"
            onClick={() => add(role, defaults)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-800 hover:border-amber-400 hover:bg-amber-50"
          >
            {label}
          </button>
        ))}
      </div>
      {request.lines.length === 0 && (
        <p className="mt-3 text-xs text-amber-900">
          Start with a quick-add button above, then fill in width, height, finish, and notes
          in the table.
        </p>
      )}
    </div>
  );
}
