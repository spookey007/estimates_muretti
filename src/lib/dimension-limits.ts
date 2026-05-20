import type { LineRole } from "@/lib/types";

/** SCENIKA 10/2023 shelf stock widths (PDF p.14 / price grid). */
export const SHELF_WIDTHS = [483, 643, 803, 903] as const;

export const UPRIGHT_HEIGHTS = [2187, 2411, 2571, 2891] as const;

export const BACK_PANEL_WIDTHS = [480, 640, 800, 900] as const;

/** PDF catalog range for shelf width (mm). Custom values in range get cut surcharge. */
export const SHELF_WIDTH_MIN = 483;
export const SHELF_WIDTH_MAX = 903;

export type NumericFieldConfig = {
  min?: number;
  max?: number;
  /** Step for − / + and arrow keys (mm). */
  step: number;
  /** Quick-jump stock sizes (optional UI hint only). */
  catalogSteps?: readonly number[];
};

export function getNumericFieldConfig(
  role: LineRole,
  field: "quantity" | "h" | "l" | "d",
): NumericFieldConfig {
  if (field === "quantity") {
    return { min: 1, max: 99, step: 1 };
  }
  if (field === "h") {
    return {
      min: 1,
      max: 4000,
      step: 1,
      catalogSteps:
        role === "upright" ||
        role === "corner_upright" ||
        role === "back_panel" ||
        role === "linear_filler"
          ? UPRIGHT_HEIGHTS
          : undefined,
    };
  }
  if (field === "l") {
    if (role === "shelf" || role === "shoe_rack") {
      return {
        min: 1,
        max: 3500,
        step: 1,
        catalogSteps: SHELF_WIDTHS,
      };
    }
    if (role === "back_panel" || role === "linear_filler") {
      return { min: 100, max: 3500, step: 1, catalogSteps: BACK_PANEL_WIDTHS };
    }
    if (role === "footboard") {
      return { min: 100, max: 3000, step: 1 };
    }
    return { min: 1, max: 3500, step: 1 };
  }
  if (field === "d") {
    return { min: 1, max: 2000, step: 1 };
  }
  return { step: 1 };
}

export function isCatalogValue(
  role: LineRole,
  field: "h" | "l",
  value: number,
): boolean {
  if (field === "l" && (role === "shelf" || role === "shoe_rack")) {
    return (SHELF_WIDTHS as readonly number[]).includes(value);
  }
  if (field === "h") {
    return (UPRIGHT_HEIGHTS as readonly number[]).includes(value);
  }
  if (field === "l" && (role === "back_panel" || role === "linear_filler")) {
    return (BACK_PANEL_WIDTHS as readonly number[]).includes(value);
  }
  return false;
}
