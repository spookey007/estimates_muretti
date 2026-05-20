import type { EstimateResponse, PricedLine } from "@/lib/types";

export type CutSummary = {
  codes: string;
  total: number;
  lines: PricedLine[];
};

/** Page-52 cut surcharges linked to a product line. */
export function cutsForParent(
  parentLineId: string,
  result: EstimateResponse,
): CutSummary {
  const lines = result.lines.filter(
    (l) => l.parent_line_id === parentLineId && l.line_kind === "surcharge",
  );
  const total = lines.reduce((acc, l) => acc + l.line_total, 0);
  return {
    codes: lines.map((l) => l.code).join(" + "),
    total: Math.round(total * 100) / 100,
    lines,
  };
}
