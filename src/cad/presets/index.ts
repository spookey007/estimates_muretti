import type { Scene } from "@/cad/types";
import { createLClosetPanelsOnlyScene } from "@/cad/presets/l-closet-panels-only";
import { createLClosetScenikaScene } from "@/cad/presets/l-closet-scenika";
import { createStarterRunScene } from "@/cad/presets/starter-run";

export type PresetId =
  | "empty"
  | "starter-run"
  | "l-closet-standard"
  | "l-closet-panels-only";

/** @deprecated */
export type LegacyPresetId = "l-closet-scenika" | "l-closet-with-components";

export function loadPreset(id: PresetId | LegacyPresetId): Scene {
  switch (id) {
    case "l-closet-standard":
    case "l-closet-with-components":
    case "l-closet-scenika":
      return createLClosetScenikaScene();
    case "l-closet-panels-only":
      return createLClosetPanelsOnlyScene();
    case "starter-run":
      return createStarterRunScene();
    case "empty":
    default:
      return {
        id: "empty",
        name: "New closet (CAD)",
        settings: createStarterRunScene().settings,
        objects: [],
      };
  }
}
