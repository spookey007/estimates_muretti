import { parseFinish } from "@/lib/field-placeholders";
import type { EstimateRequest, EstimateLineInput, LineRole } from "@/lib/types";

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

const SETTING_KEYS = new Set([
  "project_name",
  "measurement_unit",
  "measurement_basis",
  "system",
  "finish",
  "price_list_id",
  "currency_display",
]);

function num(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

export function parseJsonRequest(raw: unknown): EstimateRequest {
  const o = raw as Record<string, unknown>;
  if (!o.schema_version || !o.project_name || !o.lines) {
    throw new Error("Invalid JSON: schema_version, project_name, and lines required");
  }
  const lines = (o.lines as EstimateLineInput[]).map((line, i) => {
    if (!line.line_id) line.line_id = `L${i + 1}`;
    if (!ROLES.has(line.role)) throw new Error(`Unknown role: ${line.role}`);
    return line;
  });
  return {
    schema_version: String(o.schema_version),
    project_name: String(o.project_name),
    price_list_id: String(o.price_list_id || "scenika-2023-10"),
    measurement_unit: (o.measurement_unit as EstimateRequest["measurement_unit"]) || "mm",
    measurement_basis: (o.measurement_basis as EstimateRequest["measurement_basis"]) || "finished",
    system: (o.system as EstimateRequest["system"]) || "with_panels",
    finish: (o.finish as EstimateRequest["finish"]) || "melamine",
    currency_display: o.currency_display ? String(o.currency_display) : "EUR",
    lines,
  };
}

/** Parse CSV with optional SETTINGS block + ITEMS table. */
export function parseCsvRequest(
  text: string,
  meta: Partial<EstimateRequest> = {},
): EstimateRequest {
  const rawLines = text.split(/\r?\n/);
  const settings: Record<string, string> = {};
  let itemsStart = -1;

  for (let i = 0; i < rawLines.length; i++) {
    const trimmed = rawLines[i].trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const cols = parseCsvLine(rawLines[i]);
    const c0 = cols[0]?.toLowerCase();

    if (c0 === "line_id") {
      itemsStart = i;
      break;
    }

    if (cols.length >= 2 && SETTING_KEYS.has(c0)) {
      settings[c0] = cols[1];
    }
  }

  if (itemsStart < 0) {
    throw new Error(
      "CSV must include an ITEMS header row starting with: line_id,room,role,...",
    );
  }

  const header = parseCsvLine(rawLines[itemsStart]).map((h) => {
    const k = h.trim().toLowerCase();
    if (k === "height_mm") return "h";
    if (k === "width_mm") return "l";
    if (k === "depth_mm") return "d";
    return k;
  });
  const idx = (name: string) => header.indexOf(name);

  const rows: EstimateLineInput[] = [];
  for (let i = itemsStart + 1; i < rawLines.length; i++) {
    const trimmed = rawLines[i].trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const cols = parseCsvLine(rawLines[i]);
    if (cols.every((c) => !c)) continue;

    const role = cols[idx("role")] as LineRole;
    if (!role || !ROLES.has(role)) {
      throw new Error(`Row ${i + 1}: unknown or missing role "${role}"`);
    }
    const finishCol = idx("finish") >= 0 ? parseFinish(cols[idx("finish")]) : undefined;
    rows.push({
      line_id: cols[idx("line_id")] || `L${rows.length + 1}`,
      room: cols[idx("room")] || undefined,
      role,
      quantity: num(cols[idx("quantity")]) ?? 1,
      h: num(cols[idx("h")]),
      l: num(cols[idx("l")]),
      d: num(cols[idx("d")]),
      side: (cols[idx("side")] as EstimateLineInput["side"]) || undefined,
      depth_type: (cols[idx("depth_type")] as "510" | "414") || undefined,
      finish: finishCol,
      notes: cols[idx("notes")] || undefined,
      product_code: cols[idx("product_code")] || undefined,
      drawer_variant:
        (cols[idx("drawer_variant")] as EstimateLineInput["drawer_variant"]) || undefined,
      drawer_material:
        (cols[idx("drawer_material")] as EstimateLineInput["drawer_material"]) ||
        undefined,
      raster_variant:
        (cols[idx("raster_variant")] as EstimateLineInput["raster_variant"]) || undefined,
    });
  }

  if (rows.length === 0) {
    throw new Error("CSV has no item rows under the line_id header");
  }

  const project_name =
    settings.project_name || meta.project_name || "Uploaded project";

  return {
    schema_version: "1.0",
    project_name,
    price_list_id: settings.price_list_id || meta.price_list_id || "scenika-2023-10",
    measurement_unit:
      (settings.measurement_unit as EstimateRequest["measurement_unit"]) ||
      meta.measurement_unit ||
      "mm",
    measurement_basis:
      (settings.measurement_basis as EstimateRequest["measurement_basis"]) ||
      meta.measurement_basis ||
      "finished",
    system:
      (settings.system as EstimateRequest["system"]) ||
      meta.system ||
      "with_panels",
    finish:
      (settings.finish as EstimateRequest["finish"]) || meta.finish || "melamine",
    currency_display: settings.currency_display || meta.currency_display || "EUR",
    lines: rows,
  };
}
