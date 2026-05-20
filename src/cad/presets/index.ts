import type { Scene } from "@/cad/types";
import { createLClosetScenikaScene } from "@/cad/presets/l-closet-scenika";
import { createStarterRunScene } from "@/cad/presets/starter-run";

export type PresetId = "empty" | "starter-run" | "l-closet-scenika";

export function loadPreset(id: PresetId): Scene {
  switch (id) {
    case "l-closet-scenika":
      return createLClosetScenikaScene();
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
