export type MeasurementUnit = "mm" | "cm" | "in";
export type MeasurementBasis = "finished" | "panel" | "opening";
export type System = "with_panels" | "without_panels";
export type Finish = "melamine" | "lacquered";

export type LineRole =
  | "upright"
  | "corner_upright"
  | "back_panel"
  | "linear_filler"
  | "mirror"
  | "shelf"
  | "footboard";

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
  notes?: string;
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
  lines: EstimateLineInput[];
}

export type Accuracy = "exact" | "snapped" | "estimated" | "manual_review";

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
  subtotals: Record<string, number>;
  total_net: number;
  overall_confidence: "high" | "medium" | "low";
  warnings: string[];
  disclaimer: string;
}
