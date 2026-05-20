import { RULES } from "@/data/scenika-2023-10";
import type { EstimateRequest, LineRole } from "@/lib/types";

/** Apply SCENIKA / Muretti measurement basis before catalog snap. */
export function applyMeasurementBasis(
  h: number | undefined,
  l: number | undefined,
  role: LineRole,
  basis: EstimateRequest["measurement_basis"],
): { h?: number; l?: number } {
  const t = RULES.openingToleranceMm;
  if (basis === "opening") {
    return {
      h: h !== undefined ? h + t : undefined,
      l: l !== undefined ? l + t : undefined,
    };
  }
  if (
    basis === "finished" &&
    role === "shelf" &&
    l !== undefined &&
    !RULES.widthsShelf.includes(l)
  ) {
    return { h, l: l + RULES.shelfProtrusionMm };
  }
  return { h, l };
}
