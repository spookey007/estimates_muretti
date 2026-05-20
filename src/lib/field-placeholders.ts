import type { Finish, LineRole } from "@/lib/types";

export type FieldHints = {
  room?: string;
  h?: string;
  l?: string;
  d?: string;
  side?: string;
  depth_type?: string;
  finish?: string;
  notes?: string;
  quantity?: string;
  product_code?: string;
};

const HEIGHTS = "2187, 2411, 2571, 2891";
const SHELF_W = "483, 643, 803, 903 (650→803+ cut)";
const PANEL_W = "480, 640, 800, 900";

export function placeholdersForRole(role: LineRole): FieldHints {
  switch (role) {
    case "upright":
    case "corner_upright":
    case "corner_filler":
      return {
        room: "e.g. Wall 1 left",
        h: `Height mm — ${HEIGHTS}`,
        side: "dx or sx",
        finish: "melamine / lacquered",
        notes: "e.g. A Montante",
        quantity: "1",
      };
    case "back_panel":
    case "linear_filler":
      return {
        room: "e.g. Bay 2",
        h: `Height mm — ${HEIGHTS}`,
        l: `Width mm — ${PANEL_W}`,
        finish: "melamine / lacquered",
        notes: "e.g. C Schienale",
        quantity: "1",
      };
    case "mirror":
      return {
        h: "958, 1278, 1817",
        l: "478, 638, 798, 898",
        finish: "melamine / lacquered",
        quantity: "1",
      };
    case "shelf":
    case "shoe_rack":
      return {
        room: "e.g. Upper bay",
        l: `Width mm — ${SHELF_W}`,
        depth_type: "510 or 414",
        finish: "melamine / lacquered",
        notes: "e.g. F Ripiano",
        quantity: "1",
      };
    case "footboard":
      return {
        l: "Length mm 100–3000",
        finish: "melamine / lacquered",
        quantity: "1",
      };
    case "clothes_tube":
      return {
        l: "483, 643, 803, 903",
        finish: "melamine / lacquered",
        quantity: "1",
      };
    case "hanging_drawer":
      return {
        l: "803 or 903",
        finish: "melamine / lacquered",
        notes: "drawer_variant 1–4 in CSV",
        quantity: "1",
      };
    case "hanging_drawer_simple":
      return {
        h: "222 or 414",
        l: "483–903",
        finish: "melamine / lacquered",
        notes: "wood or aluminium drawer",
        quantity: "1",
      };
    case "hanging_raster":
      return {
        h: "414 or 606",
        l: "483–903",
        depth_type: "510 or 414",
        finish: "melamine / lacquered",
        quantity: "1",
      };
    case "custom_panel_sqm":
      return {
        h: "Panel height mm",
        l: "Panel width mm",
        finish: "melamine / lacquered",
        notes: "min 0.5 m² per piece",
        quantity: "1",
      };
    case "ral_setup":
      return {
        finish: "melamine / lacquered",
        notes: "RAL/NCS setup per colour",
        quantity: "1",
      };
    case "product_code":
      return {
        product_code: "SCENIKA code e.g. 1PN15F0",
        finish: "melamine / lacquered",
        quantity: "1",
      };
    default:
      return {
        finish: "melamine / lacquered",
        quantity: "1",
      };
  }
}

export function parseFinish(value: string | undefined): Finish | undefined {
  if (!value?.trim()) return undefined;
  const v = value.trim().toLowerCase();
  if (v === "melamine" || v === "mel" || v === "m") return "melamine";
  if (v === "lacquered" || v === "lacquer" || v === "lac" || v === "l") return "lacquered";
  return undefined;
}
