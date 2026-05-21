import { L_CLOSET_PANELS_ONLY_LINES } from "@/cad/data/l-closet-panels-only-lines";
import { estimateToScene } from "@/cad/engine/scene/estimateToScene";
import type { Scene } from "@/cad/types";
import type { EstimateRequest } from "@/lib/types";

export function createLClosetPanelsOnlyRequest(): EstimateRequest {
  return {
    schema_version: "1.0",
    project_name: "L-Shaped Walk-In (panels only)",
    price_list_id: "scenika-2023-10",
    measurement_unit: "mm",
    measurement_basis: "finished",
    system: "with_panels",
    finish: "melamine",
    currency_display: "EUR",
    lines: L_CLOSET_PANELS_ONLY_LINES,
  };
}

/** L footprint with back panels only — no uprights, shelves, or accessories. */
export function createLClosetPanelsOnlyScene(): Scene {
  const scene = estimateToScene(createLClosetPanelsOnlyRequest(), {
    showComponents: false,
  });
  return {
    ...scene,
    id: "l-closet-panels-only",
    name: "L-Shaped Walk-In (panels only)",
    templateId: "l-closet-panels-only",
  };
}
