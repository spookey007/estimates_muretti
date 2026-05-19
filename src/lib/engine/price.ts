import {

  BACK_PANEL_WITH_PANELS,

  BACK_PANEL_WITHOUT_PANELS,

  CORNER_UPRIGHT_WITH_PANELS,

  FOOTBOARD_BANDS,

  LINEAR_FILLER_WITH_PANELS,

  MIRROR_WITH_PANELS,

  PRICE_LIST_LABEL,

  PRICE_LIST_ID,

  RULES,

  SURCHARGES,

  UPRIGHT_WITH_PANELS,

  shelfEntry,

  type Finish,

  type System,

} from "@/data/scenika-2023-10";

import { snapUp, snapUpHeight, toMm } from "@/lib/units";

import type {

  Accuracy,

  EstimateLineInput,

  EstimateRequest,

  EstimateResponse,

  PricedLine,

} from "@/lib/types";



function priceForFinish(

  entry: { melamine: number; lacquered: number },

  finish: Finish,

): number {

  return finish === "lacquered" ? entry.lacquered : entry.melamine;

}



function applyBasis(

  h: number | undefined,

  l: number | undefined,

  basis: EstimateRequest["measurement_basis"],

): { h?: number; l?: number } {

  const t = RULES.openingToleranceMm;

  if (basis === "opening") {

    return {

      h: h !== undefined ? h + t : undefined,

      l: l !== undefined ? l + t : undefined,

    };

  }

  return { h, l };

}



function findGridRow<T extends { h: number; l: number }>(

  rows: T[],

  h: number,

  l: number,

): T | undefined {

  return rows.find((r) => r.h === h && r.l === l);

}



function warnSnap(

  warnings: string[],

  label: string,

  from: number | undefined,

  to: number | undefined,

  unit: EstimateRequest["measurement_unit"],

): void {

  if (from !== undefined && to !== undefined && Math.abs(from - to) > 0.5) {

    warnings.push(`${label} snapped ${Math.round(from)} -> ${Math.round(to)} mm`);

  }

}



function priceLine(

  req: EstimateRequest,

  line: EstimateLineInput,

): PricedLine {

  const warnings: string[] = [];

  const finish = req.finish;

  const system = req.system;

  const unit = req.measurement_unit;



  let hMm = line.h !== undefined ? toMm(line.h, unit) : undefined;

  let lMm = line.l !== undefined ? toMm(line.l, unit) : undefined;

  const dMm = line.d !== undefined ? toMm(line.d, unit) : undefined;



  const inputMm = { h: hMm, l: lMm, d: dMm };

  const basisAdj = applyBasis(hMm, lMm, req.measurement_basis);

  hMm = basisAdj.h;

  lMm = basisAdj.l;



  let code = "";

  let description = "";

  let unitPrice = 0;

  let resolvedH = hMm;

  let resolvedL = lMm;

  let accuracy: Accuracy = "exact";



  const qty = line.quantity || 1;



  switch (line.role) {

    case "upright": {

      if (system !== "with_panels") {

        warnings.push("Upright aluminum catalog is with_panels only; use back_panel for without_panels filler.");

        return manualReview(line, inputMm, warnings, qty);

      }

      if (hMm === undefined) {

        warnings.push("Height (h) required for upright");

        return manualReview(line, inputMm, warnings, qty);

      }

      const snapped = snapUpHeight(hMm, RULES.heightsWithPanels);

      warnSnap(warnings, "Height", hMm, snapped, unit);

      const entry = UPRIGHT_WITH_PANELS[snapped];

      if (!entry) return manualReview(line, inputMm, warnings, qty);

      resolvedH = snapped;

      code = entry.code;

      description = `Upright aluminum H ${snapped} mm`;

      unitPrice = priceForFinish(entry, finish);

      accuracy = snapped === hMm ? "exact" : "snapped";

      break;

    }



    case "corner_upright": {

      if (system !== "with_panels") {

        return manualReview(line, inputMm, [...warnings, "Corner upright only for with_panels"], qty);

      }

      if (hMm === undefined) {

        warnings.push("Height (h) required");

        return manualReview(line, inputMm, warnings, qty);

      }

      const snapped = snapUpHeight(hMm, RULES.heightsWithPanels);

      warnSnap(warnings, "Height", hMm, snapped, unit);

      const entry = CORNER_UPRIGHT_WITH_PANELS[snapped];

      if (!entry) return manualReview(line, inputMm, warnings, qty);

      const side = line.side === "left" || line.side === "sx" ? "sx" : "dx";

      resolvedH = snapped;

      code = side === "sx" ? entry.sx : entry.dx;

      description = `Corner upright ${side.toUpperCase()} H ${snapped} mm`;

      unitPrice = priceForFinish(entry, finish);

      accuracy = snapped === hMm ? "exact" : "snapped";

      break;

    }



    case "back_panel": {

      if (hMm === undefined || lMm === undefined) {

        warnings.push("Height and width (h, l) required");

        return manualReview(line, inputMm, warnings, qty);

      }

      const heights =

        system === "with_panels"

          ? RULES.heightsWithPanels

          : RULES.heightsWithoutPanels;

      const widths =

        system === "with_panels"

          ? RULES.widthsWithPanels

          : RULES.widthsWithoutPanels;

      const rows =

        system === "with_panels"

          ? BACK_PANEL_WITH_PANELS

          : BACK_PANEL_WITHOUT_PANELS;

      const snappedH = snapUpHeight(hMm, heights);

      const snappedL = snapUp(lMm, widths);

      warnSnap(warnings, "Height", hMm, snappedH, unit);

      warnSnap(warnings, "Width", lMm, snappedL, unit);

      const row = findGridRow(rows, snappedH, snappedL);

      if (!row) return manualReview(line, inputMm, warnings, qty);

      resolvedH = snappedH;

      resolvedL = snappedL;

      code = row.code;

      description =

        system === "with_panels"

          ? `Back panel 18mm H ${snappedH}  L ${snappedL} mm`

          : `Wood filler panel H ${snappedH}  L ${snappedL} mm`;

      unitPrice = priceForFinish(row, finish);

      accuracy =

        snappedH === hMm && snappedL === lMm ? "exact" : "snapped";

      break;

    }



    case "linear_filler": {

      if (system !== "with_panels") {

        return manualReview(line, inputMm, [...warnings, "Linear filler only for with_panels"], qty);

      }

      if (hMm === undefined || lMm === undefined) {

        warnings.push("Height and width required");

        return manualReview(line, inputMm, warnings, qty);

      }

      const snappedH = snapUpHeight(hMm, RULES.heightsWithPanels);

      const snappedL = snapUp(lMm, RULES.widthsLinearFiller);

      warnSnap(warnings, "Height", hMm, snappedH, unit);

      warnSnap(warnings, "Width", lMm, snappedL, unit);

      const row = findGridRow(LINEAR_FILLER_WITH_PANELS, snappedH, snappedL);

      if (!row) return manualReview(line, inputMm, warnings, qty);

      resolvedH = snappedH;

      resolvedL = snappedL;

      code = row.code;

      description = `Linear closing filler H ${snappedH}  L ${snappedL} mm`;

      unitPrice = priceForFinish(row, finish);

      accuracy =

        snappedH === hMm && snappedL === lMm ? "exact" : "snapped";

      break;

    }



    case "mirror": {

      if (system !== "with_panels") {

        return manualReview(line, inputMm, [...warnings, "Mirror table is with_panels in this list"], qty);

      }

      if (hMm === undefined || lMm === undefined) {

        warnings.push("Height and width required");

        return manualReview(line, inputMm, warnings, qty);

      }

      const snappedH = snapUpHeight(hMm, RULES.heightsMirror);

      const snappedL = snapUp(lMm, RULES.widthsMirror);

      warnSnap(warnings, "Height", hMm, snappedH, unit);

      warnSnap(warnings, "Width", lMm, snappedL, unit);

      const row = findGridRow(MIRROR_WITH_PANELS, snappedH, snappedL);

      if (!row) return manualReview(line, inputMm, warnings, qty);

      resolvedH = snappedH;

      resolvedL = snappedL;

      code = row.code;

      description = `Silver mirror 4mm H ${snappedH}  L ${snappedL} mm`;

      unitPrice = priceForFinish(row, finish);

      accuracy =

        snappedH === hMm && snappedL === lMm ? "exact" : "snapped";

      break;

    }



    case "shelf": {

      if (lMm === undefined) {

        warnings.push("Width (l) required for shelf");

        return manualReview(line, inputMm, warnings, qty);

      }

      const depth: 510 | 414 =
        line.depth_type === "414" || line.depth_type === "510"
          ? Number(line.depth_type)
          : dMm === 414 || dMm === 510
            ? (dMm as 510 | 414)
            : 510;

      const snappedL = snapUp(lMm, RULES.widthsShelf);

      warnSnap(warnings, "Width", lMm, snappedL, unit);

      const entry = shelfEntry(system, snappedL, depth);

      resolvedL = snappedL;

      code = entry.code;

      description = `Shelf th.30 L ${snappedL} mm D ${depth} mm`;

      unitPrice = priceForFinish(entry, finish);

      accuracy = snappedL === lMm ? "exact" : "snapped";

      break;

    }



    case "footboard": {

      if (lMm === undefined) {

        warnings.push("Length (l) required for footboard");

        return manualReview(line, inputMm, warnings, qty);

      }

      const band = FOOTBOARD_BANDS.find((b) => lMm! >= b.min && lMm! <= b.max);

      if (!band) {

        if (lMm < 100) warnings.push("Footboard length below minimum 100 mm");

        else warnings.push("Footboard length above maximum 3000 mm");

        return manualReview(line, inputMm, warnings, qty);

      }

      const entry =

        system === "with_panels" ? band.withPanels : band.withoutPanels;

      resolvedL = lMm;

      code = entry.code;

      description = `Floor footboard L ${band.min}-${band.max} mm (input ${Math.round(lMm)} mm)`;

      unitPrice = priceForFinish(entry, finish);

      accuracy = lMm >= band.min && lMm <= band.max ? "exact" : "estimated";

      break;

    }



    default:

      return manualReview(line, inputMm, warnings, qty);

  }



  return {

    line_id: line.line_id,

    room: line.room,

    role: line.role,

    quantity: qty,

    input_mm: inputMm,

    resolved_mm: { h: resolvedH, l: resolvedL, d: dMm },

    code,

    description,

    unit_price: unitPrice,

    line_total: Math.round(unitPrice * qty * 100) / 100,

    accuracy,

    warnings,

    notes: line.notes,

  };

}



function manualReview(

  line: EstimateLineInput,

  input_mm: PricedLine["input_mm"],

  warnings: string[],

  qty: number,

): PricedLine {

  return {

    line_id: line.line_id,

    room: line.room,

    role: line.role,

    quantity: qty,

    input_mm,

    resolved_mm: {},

    code: "-",

    description: `Unresolved: ${line.role}`,

    unit_price: 0,

    line_total: 0,

    accuracy: "manual_review",

    warnings: [...warnings, "No catalog match  review manually"],

    notes: line.notes,

  };

}



export function buildEstimate(request: EstimateRequest): EstimateResponse {

  if (request.price_list_id !== PRICE_LIST_ID) {

    throw new Error(`Unsupported price_list_id: ${request.price_list_id}`);

  }



  const lines = request.lines.map((l) => priceLine(request, l));

  const structuralRoles = new Set([

    "upright",

    "corner_upright",

    "back_panel",

    "linear_filler",

    "mirror",

  ]);

  const subtotals = {

    structural: 0,

    equipment: 0,

    unresolved: 0,

  };



  for (const line of lines) {

    const t = line.line_total;

    if (line.accuracy === "manual_review") subtotals.unresolved += t;

    else if (structuralRoles.has(line.role)) subtotals.structural += t;

    else subtotals.equipment += t;

  }



  const total_net =

    Math.round(

      (subtotals.structural + subtotals.equipment + subtotals.unresolved) * 100,

    ) / 100;



  const hasManual = lines.some((l) => l.accuracy === "manual_review");

  const hasSnap = lines.some((l) => l.accuracy === "snapped");

  const overall_confidence = hasManual

    ? "low"

    : hasSnap

      ? "medium"

      : "high";



  const allWarnings = lines.flatMap((l) =>

    l.warnings.map((w) => `${l.line_id}: ${w}`),

  );



  return {

    estimate_id: crypto.randomUUID(),

    created_at: new Date().toISOString(),

    price_list_id: PRICE_LIST_ID,

    price_list_label: PRICE_LIST_LABEL,

    currency: request.currency_display || "EUR",

    vat_included: false,

    project_name: request.project_name,

    measurement_basis_applied: request.measurement_basis,

    system: request.system,

    finish: request.finish,

    lines,

    subtotals,

    total_net,

    overall_confidence,

    warnings: allWarnings,

    disclaimer:

      "Indicative estimate from SCENIKA list 10/2023 (Play s.r.l.). Prices EUR net excl. VAT. Snapped to standard catalog sizes.",

  };

}



export { SURCHARGES };

