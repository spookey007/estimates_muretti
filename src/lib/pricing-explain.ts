import type { LineRole } from "./types";
import { RULES } from "@/data/scenika-2023-10";

/** Client-facing note for why a line was snapped (SCENIKA catalog ladders). */
export function explainSnap(
  role: LineRole,
  dimension: "height" | "width",
  input?: number,
  resolved?: number,
): string | null {
  if (input === undefined || resolved === undefined || input === resolved) {
    return null;
  }

  if (role === "shelf" && dimension === "width") {
    return (
      `Shelf width ${input} mm ? catalog ${resolved} mm. SCENIKA shelf lengths are ` +
      `${RULES.widthsShelf.join(", ")} mm (bay +3 mm vs panels 480/640/800/900). ` +
      `Enter ${resolved} in width_mm for an exact match.`
    );
  }

  if (role === "back_panel" && dimension === "width") {
    return `Panel width ${input} mm ? catalog ${resolved} mm (${RULES.widthsWithPanels.join(", ")}).`;
  }

  if (dimension === "height") {
    return `Height ${input} mm ? catalog ${resolved} mm (${RULES.heightsWithPanels.join(", ")}).`;
  }

  return `${dimension} ${input} mm ? catalog ${resolved} mm.`;
}
