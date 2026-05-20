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
      `Customer width ${input} mm -> order stock ${resolved} mm (catalog ${RULES.widthsShelf.join(", ")}). ` +
      `Charged at ${resolved} mm price + cut surcharge (PDF p.52, e.g. TALARI).`
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
