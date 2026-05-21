import { nextLineId } from "@/lib/blank-estimate";
import type {
  DrawerMaterial,
  DrawerVariant,
  EstimateLineInput,
  EstimateRequest,
  Finish,
  LineRole,
  MeasurementBasis,
  MeasurementUnit,
  RasterVariant,
  System,
} from "@/lib/types";
import type {
  DesignPdfClosetPayload,
  DesignPdfImportPayload,
  DesignPdfImportResult,
  DesignPdfLinePayload,
} from "@/lib/import/design-pdf-types";

const ROLES = new Set<LineRole>([
  "upright",
  "corner_upright",
  "corner_filler",
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
  "ral_setup",
  "flexy_led_shelf",
  "flexy_led_drawer",
  "flexy_led_side",
  "flexy_power",
  "flexy_cable",
  "product_code",
]);

function parseRole(raw: string): LineRole | null {
  const r = raw.trim().toLowerCase().replace(/\s+/g, "_") as LineRole;
  return ROLES.has(r) ? r : null;
}

function num(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function parseDepthType(v: unknown): "510" | "414" | undefined {
  if (v === "510" || v === 414 || v === "414") return String(v) as "510" | "414";
  return undefined;
}

function lineFromPayload(
  payload: DesignPdfLinePayload,
  lineId: string,
  room: string,
  defaultFinish: Finish,
): { line: EstimateLineInput | null; warning?: string } {
  const role = parseRole(payload.role);
  if (!role) {
    return {
      line: null,
      warning: `Skipped unknown role "${payload.role}" in ${room}`,
    };
  }

  const qty = Math.max(1, Math.round(num(payload.quantity) ?? 1));
  const line: EstimateLineInput = {
    line_id: lineId,
    room,
    role,
    quantity: qty,
    h: num(payload.h),
    l: num(payload.l),
    d: num(payload.d),
    notes: payload.notes?.trim() || undefined,
    mansard_cut: payload.mansard_cut === true,
    product_code: payload.product_code?.trim() || undefined,
  };

  if (payload.finish === "melamine" || payload.finish === "lacquered") {
    line.finish = payload.finish;
  }

  const side = payload.side?.trim().toLowerCase();
  if (side === "dx" || side === "sx" || side === "left" || side === "right") {
    line.side = side;
  }

  const depth = parseDepthType(payload.depth_type);
  if (depth) line.depth_type = depth;
  else if (role === "shelf" || role === "shoe_rack") line.depth_type = "510";

  if (payload.drawer_variant && ["1", "2", "3", "4"].includes(payload.drawer_variant)) {
    line.drawer_variant = payload.drawer_variant as DrawerVariant;
  }
  if (payload.drawer_material === "wood" || payload.drawer_material === "aluminium") {
    line.drawer_material = payload.drawer_material as DrawerMaterial;
  }
  if (payload.raster_variant === "hanging" || payload.raster_variant === "rested") {
    line.raster_variant = payload.raster_variant as RasterVariant;
  }

  if (payload.confidence === "low") {
    line.notes = [line.notes, "AI: low confidence — verify"].filter(Boolean).join(" | ");
  }

  if (!line.finish) line.finish = defaultFinish;

  return { line };
}

function flattenClosets(
  closets: DesignPdfClosetPayload[],
  defaultFinish: Finish,
): EstimateLineInput[] {
  const lines: EstimateLineInput[] = [];
  const warnings: string[] = [];

  for (const closet of closets) {
    const room = closet.room?.trim() || "Imported closet";
    if (!closet.lines?.length) {
      warnings.push(`Closet "${room}" has no lines`);
      continue;
    }
    for (const raw of closet.lines) {
      const line_id = nextLineId(lines);
      const { line, warning } = lineFromPayload(
        raw,
        line_id,
        room,
        defaultFinish,
      );
      if (warning) warnings.push(warning);
      if (line) lines.push(line);
    }
  }

  return lines;
}

export function extractJsonFromModelText(text: string): unknown {
  const trimmed = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/i.exec(trimmed);
  const body = fence ? fence[1].trim() : trimmed;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Model response did not contain a JSON object");
  }
  return JSON.parse(body.slice(start, end + 1)) as unknown;
}

export function parseDesignPdfPayload(raw: unknown): DesignPdfImportPayload {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid import payload");
  }
  const o = raw as Record<string, unknown>;
  if (!o.closets || !Array.isArray(o.closets)) {
    throw new Error("JSON must include closets[] array");
  }
  if (!o.project_name || typeof o.project_name !== "string") {
    throw new Error("JSON must include project_name");
  }
  return raw as DesignPdfImportPayload;
}

export function designImportToEstimateRequest(
  payload: DesignPdfImportPayload,
  overrides?: Partial<EstimateRequest>,
): DesignPdfImportResult {
  const warnings = [...(payload.warnings ?? [])];
  const unit = (payload.measurement_unit as MeasurementUnit) || "mm";
  const basis = (payload.measurement_basis as MeasurementBasis) || "finished";
  const system = (payload.system as System) || "with_panels";
  const finish = (payload.finish as Finish) || "melamine";
  const lines = flattenClosets(payload.closets, finish);
  if (lines.length === 0) {
    throw new Error("No valid estimate lines extracted from PDF");
  }

  for (const line of lines) {
    if (!line.finish) line.finish = finish;
  }

  const request: EstimateRequest = {
    schema_version: "1.0",
    project_name: payload.project_name.trim(),
    price_list_id: "scenika-2023-10",
    measurement_unit: unit,
    measurement_basis: basis,
    system,
    finish,
    currency_display: "EUR",
    margin_percent:
      typeof payload.margin_percent === "number" && payload.margin_percent >= 0
        ? payload.margin_percent
        : undefined,
    lines,
    ...overrides,
  };

  const closets = payload.closets.map((c) => ({
    room: c.room?.trim() || "Imported",
    lineCount: c.lines?.length ?? 0,
  }));

  return {
    request,
    warnings,
    import_notes: payload.import_notes,
    closets,
    model: "",
  };
}
