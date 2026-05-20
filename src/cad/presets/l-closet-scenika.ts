import { L_CLOSET_SAMPLE_LINES } from "@/cad/data/l-closet-sample-lines";
import { estimateToScene } from "@/cad/engine/scene/estimateToScene";
import type { Scene } from "@/cad/types";
import type { EstimateRequest } from "@/lib/types";

export function createLClosetScenikaRequest(): EstimateRequest {
  return {
    schema_version: "1.0",
    project_name: "L-Shaped Walk-In (SCENIKA sample)",
    price_list_id: "scenika-2023-10",
    measurement_unit: "mm",
    measurement_basis: "finished",
    system: "with_panels",
    finish: "melamine",
    currency_display: "EUR",
    lines: L_CLOSET_SAMPLE_LINES,
  };
}

/** Full L-closet like the SCENIKA technical sheet (900×3 + return bays). */
export function createLClosetScenikaScene(): Scene {
  const scene = estimateToScene(createLClosetScenikaRequest());
  return {
    ...scene,
    id: "l-closet-scenika",
    name: "L-Shaped Walk-In (SCENIKA sample)",
    templateId: "l-closet-scenika",
  };
}
