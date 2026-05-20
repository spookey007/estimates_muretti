import type { Scene } from "@/cad/types";
import { DEFAULT_SCENE_SETTINGS } from "@/cad/types";

/** Two uprights + one shelf — minimal CAD tutorial layout (mm). */
export function createStarterRunScene(): Scene {
  const h = 2187;
  return {
    id: "starter-run",
    name: "Starter run (CAD)",
    templateId: "starter-run",
    settings: { ...DEFAULT_SCENE_SETTINGS },
    objects: [
      {
        id: "u-left",
        type: "upright",
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        dimensions: { width: 50, height: h, depth: 510 },
        constraints: {},
        pricing: {
          role: "upright",
          lineId: "U1",
          quantity: 1,
          notes: "A Montante",
          room: "Run 1 left",
        },
      },
      {
        id: "u-right",
        type: "upright",
        position: [908, 0, 0],
        rotation: [0, 0, 0],
        dimensions: { width: 50, height: h, depth: 510 },
        constraints: {},
        pricing: {
          role: "upright",
          lineId: "U2",
          quantity: 1,
          notes: "A Montante",
          room: "Run 1 right",
        },
      },
      {
        id: "s-mid",
        type: "shelf",
        position: [454, 1200, 255],
        rotation: [0, 0, 0],
        dimensions: { width: 803, height: 30, depth: 510 },
        constraints: { attachedTo: "u-left" },
        pricing: {
          role: "shelf",
          lineId: "S1",
          quantity: 1,
          depth_type: "510",
          notes: "F Ripiano",
          room: "Between uprights",
        },
      },
    ],
  };
}
