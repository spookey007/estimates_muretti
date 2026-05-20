"use client";

import { getLineCustomization } from "@/lib/line-customization";
import type { MergedRow } from "@/components/estimate/line-shared";

/** Catalog + cut breakdown for customized lines. */
export function CustomPricingDisplay({
  row,
  compact,
}: {
  row: MergedRow;
  compact?: boolean;
}) {
  const c = getLineCustomization(row);

  if (!c.isCustom && !c.hasCut) {
    return (
      <span className={`tabular-nums ${compact ? "text-xs font-medium" : "text-sm font-bold"}`}>
        {c.lineTotal.toFixed(2)} EUR
      </span>
    );
  }

  if (compact) {
    return (
      <div className="space-y-0.5">
        <span className="block text-xs font-semibold tabular-nums text-amber-950">
          {c.lineTotal.toFixed(2)}
        </span>
        {c.hasCut ? (
          <span className="block text-[9px] leading-tight text-violet-800">
            {c.catalogTotal.toFixed(0)}+{c.cutTotal.toFixed(0)} cut
          </span>
        ) : (
          <span className="block text-[9px] text-orange-700">{c.summary}</span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200/80 bg-amber-50/60 px-2.5 py-2 text-xs">
      <div className="flex justify-between gap-2 tabular-nums text-stone-700">
        <span>Catalog</span>
        <span>{c.catalogTotal.toFixed(2)} EUR</span>
      </div>
      {c.hasCut && (
        <div className="mt-1 flex justify-between gap-2 tabular-nums text-violet-900">
          <span>
            Cut {row.cut_codes ? `(${row.cut_codes})` : ""}
          </span>
          <span className="font-medium">+{c.cutTotal.toFixed(2)} EUR</span>
        </div>
      )}
      {(c.hasSnap || row.accuracy !== "exact") && (
        <p className="mt-1 text-[10px] leading-snug text-orange-800">{c.summary}</p>
      )}
      <div className="mt-1.5 flex justify-between gap-2 border-t border-amber-200/80 pt-1.5 tabular-nums font-semibold text-stone-900">
        <span>Line total</span>
        <span>{c.lineTotal.toFixed(2)} EUR</span>
      </div>
    </div>
  );
}
