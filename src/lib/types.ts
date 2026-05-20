export type MeasurementUnit = "mm" | "cm" | "in";
export type MeasurementBasis = "finished" | "panel" | "opening";
export type System = "with_panels" | "without_panels";
export type Finish = "melamine" | "lacquered";

export type DrawerVariant = "1" | "2" | "3" | "4";
export type DrawerMaterial = "wood" | "aluminium";
export type RasterVariant = "hanging" | "rested";

export type LineRole =
  | "upright"
  | "corner_upright"
  | "corner_filler"
  | "back_panel"
  | "linear_filler"
  | "mirror"
  | "shelf"
  | "footboard"
  | "shoe_rack"
  | "clothes_tube"
  | "hanging_drawer"
  | "hanging_drawer_simple"
  | "hanging_raster"
  | "custom_panel_sqm"
  | "ral_setup"
  | "flexy_led_shelf"
  | "flexy_led_drawer"
  | "flexy_led_side"
  | "flexy_power"
  | "flexy_cable"
  | "product_code";

export interface EstimateLineInput {
  line_id: string;
  room?: string;
  role: LineRole;
  quantity: number;
  h?: number;
  l?: number;
  d?: number;
  side?: "left" | "right" | "dx" | "sx";
  depth_type?: "510" | "414";
  drawer_variant?: DrawerVariant;
  drawer_material?: DrawerMaterial;
  raster_variant?: RasterVariant;
  product_code?: string;
  mansard_cut?: boolean;
  notes?: string;
  /** Per-line finish; falls back to project finish when omitted. */
  finish?: Finish;
}

export interface EstimateRequest {
  schema_version: string;
  project_name: string;
  price_list_id: string;
  measurement_unit: MeasurementUnit;
  measurement_basis: MeasurementBasis;
  system: System;
  finish: Finish;
  currency_display?: string;
  /** Optional markup % applied after catalog pricing (Phase E). */
  margin_percent?: number;
  lines: EstimateLineInput[];
}

export type Accuracy = "exact" | "snapped" | "estimated" | "manual_review";
export type LineKind = "product" | "surcharge" | "delivery";

export interface PricedLine {
  line_id: string;
  room?: string;
  role: LineRole;
  quantity: number;
  input_mm: { h?: number; l?: number; d?: number };
  resolved_mm: { h?: number; l?: number; d?: number };
  code: string;
  description: string;
  unit_price: number;
  line_total: number;
  accuracy: Accuracy;
  warnings: string[];
  notes?: string;
  line_kind?: LineKind;
  parent_line_id?: string;
  /** Finish used for pricing this line. */
  finish_applied?: Finish;
}

export interface EstimateResponse {
  estimate_id: string;
  created_at: string;
  price_list_id: string;
  price_list_label: string;
  currency: string;
  vat_included: false;
  project_name: string;
  measurement_basis_applied: MeasurementBasis;
  system: System;
  finish: Finish;
  lines: PricedLine[];
  subtotals: {
    structural: number;
    equipment: number;
    customization: number;
    led: number;
    delivery: number;
    unresolved: number;
  };
  total_net: number;
  overall_confidence: "high" | "medium" | "low";
  warnings: string[];
  disclaimer: string;
}
