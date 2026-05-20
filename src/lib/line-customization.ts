import type { MergedRow } from "@/components/estimate/line-shared";

export type LineCustomization = {
  /** Line uses non-exact catalog pricing (snap, cut, custom panel, etc.). */
  isCustom: boolean;
  hasCut: boolean;
  hasSnap: boolean;
  widthCustom: boolean;
  heightCustom: boolean;
  catalogTotal: number;
  cutTotal: number;
  lineTotal: number;
  summary: string;
};

function dimDiff(input?: number, resolved?: number): boolean {
  return (
    input !== undefined &&
    resolved !== undefined &&
    input !== resolved
  );
}

export function getLineCustomization(row: MergedRow): LineCustomization {
  const cutTotal = row.cut_total ?? 0;
  const catalogTotal = row.line_total;
  const lineTotal = row.line_total_with_cuts ?? row.line_total;
  const hasCut = cutTotal > 0.005;
  const widthCustom = dimDiff(row.input_mm.l, row.resolved_mm.l);
  const heightCustom = dimDiff(row.input_mm.h, row.resolved_mm.h);
  const hasSnap = widthCustom || heightCustom;

  const isCustom =
    hasCut ||
    hasSnap ||
    row.accuracy === "estimated" ||
    row.accuracy === "manual_review" ||
    row.role === "custom_panel_sqm" ||
    (row.accuracy === "snapped" && (hasSnap || hasCut));

  const parts: string[] = [];
  if (hasSnap) parts.push("snapped size");
  if (hasCut) parts.push("cut surcharge");
  if (row.role === "custom_panel_sqm") parts.push("custom m²");
  if (row.accuracy === "estimated" && !parts.length) parts.push("estimated");
  if (row.accuracy === "manual_review") parts.push("review");

  const summary =
    parts.length > 0 ? parts.join(" + ") : isCustom ? "custom pricing" : "catalog";

  return {
    isCustom,
    hasCut,
    hasSnap,
    widthCustom,
    heightCustom,
    catalogTotal,
    cutTotal,
    lineTotal,
    summary,
  };
}

/** Table cell background for customized pricing columns. */
export function customTableCellClass(
  columnId: string,
  row: MergedRow,
): string {
  const c = getLineCustomization(row);
  if (!c.isCustom) return "";

  if (columnId === "h" && c.heightCustom) {
    return "bg-orange-50/90 ring-1 ring-inset ring-orange-300/80";
  }
  if (columnId === "l" && c.widthCustom) {
    return "bg-orange-50/90 ring-1 ring-inset ring-orange-300/80";
  }
  if ((columnId === "cut_code" || columnId === "cut_eur") && c.hasCut) {
    return "bg-violet-50/90 ring-1 ring-inset ring-violet-300/80";
  }
  if (
    columnId === "line_total_with_cuts" ||
    columnId === "unit_price" ||
    columnId === "resolved"
  ) {
    return "bg-amber-50/80 ring-1 ring-inset ring-amber-200/90";
  }
  if (columnId === "accuracy" && row.accuracy !== "exact") {
    return "bg-orange-50/70";
  }
  return "";
}
