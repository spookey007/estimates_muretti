import { SURCHARGES } from "@/data/scenika-2023-10";
import { applyMeasurementBasis } from "@/lib/measurement-basis";
import type { EstimateLineInput, EstimateRequest, PricedLine } from "@/lib/types";

export type SurchargeSpec = {
  code: string;
  label: string;
  price: number;
};

function cut(
  code: keyof typeof SURCHARGES,
  qty = 1,
): SurchargeSpec {
  const row = SURCHARGES[code];
  return { code, label: row.label, price: row.price * qty };
}

/**
 * Auto-add PDF p.52 cut surcharges when basis-adjusted size differs from catalog snap.
 * Muretti: order the next larger stock (e.g. 650 mm -> 803 mm shelf) and charge that
 * catalog price plus the cut code (e.g. TALARI) on a separate line.
 */
export function surchargesForLine(
  input: EstimateLineInput,
  priced: PricedLine,
  request: EstimateRequest,
): SurchargeSpec[] {
  const out: SurchargeSpec[] = [];
  const { role, input_mm, resolved_mm } = priced;
  const basisAdj = applyMeasurementBasis(
    input_mm.h,
    input_mm.l,
    role,
    request.measurement_basis,
  );
  const ih = basisAdj.h;
  const il = basisAdj.l;
  const rh = resolved_mm.h;
  const rl = resolved_mm.l;

  const heightCut = ih !== undefined && rh !== undefined && Math.abs(ih - rh) > 0.5;
  const widthCut = il !== undefined && rl !== undefined && Math.abs(il - rl) > 0.5;

  switch (role) {
    case "upright":
    case "corner_upright":
      if (heightCut) out.push(cut("TAALMO"));
      break;
    case "corner_filler":
      if (heightCut || widthCut) out.push(cut("TAALAN"));
      break;
    case "linear_filler":
      if (heightCut) out.push(cut("TAALMO"));
      if (widthCut) out.push(cut("TAALFL"));
      break;
    case "back_panel":
      if (heightCut) out.push(cut("TAALMO"));
      if (widthCut) {
        if (input.mansard_cut) out.push(cut("TAAMSC"));
        else out.push(cut("TALASC"));
      }
      break;
    case "shelf":
      if (widthCut) out.push(cut("TALARI"));
      break;
    case "clothes_tube":
      if (widthCut) out.push(cut("TALATU"));
      break;
    default:
      break;
  }

  return out;
}

export function buildSurchargeLines(
  input: EstimateLineInput,
  priced: PricedLine,
  specs: SurchargeSpec[],
): PricedLine[] {
  return specs.map((s, i) => ({
    line_id: `${priced.line_id}-cut-${i + 1}`,
    room: priced.room,
    role: priced.role,
    quantity: 1,
    input_mm: priced.input_mm,
    resolved_mm: {},
    code: s.code,
    description: s.label,
    unit_price: s.price,
    line_total: s.price,
    accuracy: "estimated" as const,
    warnings: [],
    line_kind: "surcharge" as const,
    parent_line_id: priced.line_id,
  }));
}

export function mergeAccuracy(
  product: PricedLine,
  hasSurcharges: boolean,
): PricedLine["accuracy"] {
  if (product.accuracy === "manual_review") return "manual_review";
  if (hasSurcharges) return "estimated";
  return product.accuracy;
}
