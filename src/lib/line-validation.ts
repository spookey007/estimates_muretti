import {
  BACK_PANEL_WIDTHS,
  SHELF_WIDTHS,
  SHELF_WIDTH_MAX,
  SHELF_WIDTH_MIN,
  UPRIGHT_HEIGHTS,
  isCatalogValue,
} from "@/lib/dimension-limits";
import type { EstimateLineInput, LineRole } from "@/lib/types";

const MIRROR_H = [958, 1278, 1817];
const MIRROR_L = [478, 638, 798, 898];

export type FieldValidation = {
  valid: boolean;
  message?: string;
  warn?: boolean;
};

export { SHELF_WIDTHS, UPRIGHT_HEIGHTS, BACK_PANEL_WIDTHS };

function num(v: string): number | undefined {
  if (v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function needsHeight(role: LineRole): boolean {
  return [
    "upright",
    "corner_upright",
    "corner_filler",
    "back_panel",
    "linear_filler",
    "mirror",
    "custom_panel_sqm",
    "hanging_raster",
    "hanging_drawer_simple",
  ].includes(role);
}

function needsWidth(role: LineRole): boolean {
  return [
    "back_panel",
    "linear_filler",
    "mirror",
    "shelf",
    "footboard",
    "shoe_rack",
    "clothes_tube",
    "hanging_drawer",
    "hanging_drawer_simple",
    "hanging_raster",
    "custom_panel_sqm",
  ].includes(role);
}

export function validateQuantity(raw: string): FieldValidation {
  const n = num(raw);
  if (n === undefined) return { valid: false, message: "Required" };
  if (!Number.isInteger(n) || n < 1) return { valid: false, message: "Min 1" };
  if (n > 99) return { valid: false, message: "Max 99" };
  return { valid: true };
}

export function validateHeight(role: LineRole, raw: string): FieldValidation {
  const n = num(raw);
  if (!needsHeight(role)) {
    if (raw.trim() === "") return { valid: true };
    if (n === undefined || n <= 0) return { valid: false, message: "Invalid mm" };
    return { valid: true, warn: true, message: "Not used for this role" };
  }
  if (n === undefined) return { valid: false, message: "Height required" };
  if (n <= 0 || n > 4000) return { valid: false, message: "1–4000 mm" };

  if (role === "mirror" && !MIRROR_H.includes(n)) {
    return {
      valid: true,
      warn: true,
      message: `Catalog heights: ${MIRROR_H.join(", ")} mm`,
    };
  }
  if (
    (role === "upright" ||
      role === "corner_upright" ||
      role === "back_panel" ||
      role === "linear_filler") &&
    !isCatalogValue(role, "h", n)
  ) {
    return {
      valid: true,
      warn: true,
      message: `Custom height — catalog: ${UPRIGHT_HEIGHTS.join(", ")} mm`,
    };
  }
  return { valid: true };
}

export function validateWidth(role: LineRole, raw: string): FieldValidation {
  const n = num(raw);
  if (!needsWidth(role)) {
    if (raw.trim() === "") return { valid: true };
    if (n === undefined || n <= 0) return { valid: false, message: "Invalid mm" };
    return { valid: true, warn: true, message: "Not used for this role" };
  }
  if (n === undefined) return { valid: false, message: "Width required" };

  if (role === "shelf" || role === "shoe_rack") {
    if (n <= 0 || n > 3500) return { valid: false, message: "1–3500 mm" };
    if (n < SHELF_WIDTH_MIN || n > SHELF_WIDTH_MAX) {
      return {
        valid: true,
        warn: true,
        message: `Outside PDF shelf range ${SHELF_WIDTH_MIN}–${SHELF_WIDTH_MAX} mm — verify pricing`,
      };
    }
    if (!isCatalogValue(role, "l", n)) {
      return {
        valid: true,
        warn: true,
        message: `Custom width — stock: ${SHELF_WIDTHS.join(", ")} mm (+cut if needed)`,
      };
    }
    return { valid: true };
  }

  if (n <= 0 || n > 3500) return { valid: false, message: "1–3500 mm" };

  if (
    (role === "back_panel" || role === "linear_filler") &&
    !(BACK_PANEL_WIDTHS as readonly number[]).includes(n)
  ) {
    return {
      valid: true,
      warn: true,
      message: `Custom — catalog panels: ${BACK_PANEL_WIDTHS.join(", ")} mm`,
    };
  }
  if (role === "mirror" && !MIRROR_L.includes(n)) {
    return {
      valid: true,
      warn: true,
      message: `Catalog widths: ${MIRROR_L.join(", ")} mm`,
    };
  }
  if (role === "footboard" && (n < 100 || n > 3000)) {
    return { valid: false, message: "100–3000 mm" };
  }
  return { valid: true };
}

export function validateDepth(role: LineRole, raw: string): FieldValidation {
  if (raw.trim() === "") {
    if (role === "shelf" || role === "shoe_rack") {
      return { valid: false, message: "Depth required (510 or 414)" };
    }
    return { valid: true };
  }
  const n = num(raw);
  if (n === undefined || n <= 0) return { valid: false, message: "Invalid mm" };
  if ((role === "shelf" || role === "shoe_rack") && n !== 510 && n !== 414) {
    return {
      valid: true,
      warn: true,
      message: "Catalog depths: 510 or 414 mm",
    };
  }
  return { valid: true };
}

export function validateSide(role: LineRole, raw: string): FieldValidation {
  const v = raw.trim().toLowerCase();
  if (!v) {
    if (role === "corner_upright") return { valid: false, message: "dx or sx" };
    return { valid: true };
  }
  if (["dx", "sx", "left", "right"].includes(v)) return { valid: true };
  return { valid: false, message: "dx, sx, left, right" };
}

export function validateLineField(
  line: Pick<EstimateLineInput, "role">,
  field: "quantity" | "h" | "l" | "d" | "side",
  raw: string,
): FieldValidation {
  switch (field) {
    case "quantity":
      return validateQuantity(raw);
    case "h":
      return validateHeight(line.role, raw);
    case "l":
      return validateWidth(line.role, raw);
    case "d":
      return validateDepth(line.role, raw);
    case "side":
      return validateSide(line.role, raw);
    default:
      return { valid: true };
  }
}
