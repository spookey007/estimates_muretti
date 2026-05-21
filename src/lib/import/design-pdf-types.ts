import type {
  EstimateLineInput,
  EstimateRequest,
  Finish,
  LineRole,
  MeasurementBasis,
  MeasurementUnit,
  System,
} from "@/lib/types";

/** Raw JSON shape returned by Claude (before normalization). */
export interface DesignPdfImportPayload {
  project_name: string;
  measurement_unit?: MeasurementUnit;
  measurement_basis?: MeasurementBasis;
  system?: System;
  finish?: Finish;
  margin_percent?: number;
  closets: DesignPdfClosetPayload[];
  warnings?: string[];
  import_notes?: string;
}

export interface DesignPdfClosetPayload {
  room: string;
  page_hint?: string;
  lines: DesignPdfLinePayload[];
}

export interface DesignPdfLinePayload {
  role: string;
  quantity?: number;
  h?: number;
  l?: number;
  d?: number;
  side?: string;
  depth_type?: string;
  drawer_variant?: string;
  drawer_material?: string;
  raster_variant?: string;
  product_code?: string;
  mansard_cut?: boolean;
  notes?: string;
  finish?: string;
  confidence?: "high" | "medium" | "low";
}

export interface DesignPdfImportResult {
  request: EstimateRequest;
  warnings: string[];
  import_notes?: string;
  closets: { room: string; lineCount: number }[];
  model: string;
  usage?: { input_tokens: number; output_tokens: number };
}

export type { EstimateLineInput, EstimateRequest };
