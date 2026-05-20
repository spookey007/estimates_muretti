import {
  BACK_PANEL_WITH_PANELS,
  BACK_PANEL_WITHOUT_PANELS,
  CORNER_UPRIGHT_WITH_PANELS,
  DELIVERY_MIN_NET_EUR,
  DELIVERY_SURCHARGE_EUR,
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
import {
  CUSTOM_PANEL_MIN_M2,
  CUSTOM_PANEL_PER_M2,
  RAL_SETUP_FEE,
} from "@/data/custom-panels-2023-10";
import {
  CLOTHES_TUBE_HEIGHT,
  CLOTHES_TUBE_WIDTHS,
  CORNER_FILLER_WITH_PANELS,
  HANGING_DRAWER_WIDTHS,
  SIMPLE_DRAWER_HEIGHTS,
  SIMPLE_DRAWER_WIDTHS,
  clothesTubeEntry,
  hangingDrawerEntry,
  hangingDrawerSimpleEntry,
  hangingRasterEntry,
  shoeRackEntry,
  SHOE_WIDTHS,
  type DrawerMaterial,
  type DrawerVariant,
  type RasterVariant,
} from "@/data/equipment-2023-10";
import {
  FLEXY_CABLE,
  FLEXY_POWER_100W,
  flexyDrawerLed,
  flexyShelfLed,
  flexySideLed,
} from "@/data/flexy-led-2023-10";
import { lookupProductCode } from "@/data/product-catalog-2023-10";
import {
  buildSurchargeLines,
  mergeAccuracy,
  surchargesForLine,
} from "@/lib/engine/surcharges";
import { applyMeasurementBasis } from "@/lib/measurement-basis";
import { snapUp, snapUpHeight, toMm } from "@/lib/units";
import type {
  Accuracy,
  EstimateLineInput,
  EstimateRequest,
  EstimateResponse,
  LineRole,
  PricedLine,
} from "@/lib/types";

function priceForFinish(
  entry: { melamine: number; lacquered: number },
  finish: Finish,
): number {
  return finish === "lacquered" ? entry.lacquered : entry.melamine;
}

function findGridRow<T extends { h: number; l: number }>(
  rows: T[],
  h: number,
  l: number,
): T | undefined {
  return rows.find((r) => r.h === h && r.l === l);
}

function sumMoney(values: number[]): number {
  const cents = values.reduce((acc, v) => acc + Math.round(v * 100), 0);
  return cents / 100;
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

function manualReview(
  line: EstimateLineInput,
  input_mm: PricedLine["input_mm"],
  warnings: string[],
  qty: number,
  finish: Finish,
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
    warnings: [...warnings, "No catalog match — review manually"],
    notes: line.notes,
    line_kind: "product",
    finish_applied: finish,
  };
}

function priceLine(req: EstimateRequest, line: EstimateLineInput): PricedLine {
  const warnings: string[] = [];
  const finish: Finish = line.finish ?? req.finish;
  const system = req.system;
  const unit = req.measurement_unit;

  let hMm = line.h !== undefined ? toMm(line.h, unit) : undefined;
  let lMm = line.l !== undefined ? toMm(line.l, unit) : undefined;
  const dMm = line.d !== undefined ? toMm(line.d, unit) : undefined;

  const inputMm = { h: hMm, l: lMm, d: dMm };
  const basisAdj = applyMeasurementBasis(hMm, lMm, line.role, req.measurement_basis);
  hMm = basisAdj.h;
  lMm = basisAdj.l;

  let code = "";
  let description = "";
  let unitPrice = 0;
  let resolvedH = hMm;
  let resolvedL = lMm;
  let accuracy: Accuracy = "exact";
  const qty = line.quantity || 1;

  const depthFromLine = (): 510 | 414 => {
    if (line.depth_type === "414" || line.depth_type === "510") {
      return line.depth_type === "414" ? 414 : 510;
    }
    if (dMm === 414 || dMm === 510) return dMm === 414 ? 414 : 510;
    return 510;
  };

  switch (line.role) {
    case "upright": {
      if (system !== "with_panels") {
        warnings.push("Upright aluminum catalog is with_panels only.");
        return manualReview(line, inputMm, warnings, qty, finish);
      }
      if (hMm === undefined) {
        warnings.push("Height (h) required for upright");
        return manualReview(line, inputMm, warnings, qty, finish);
      }
      const snapped = snapUpHeight(hMm, RULES.heightsWithPanels);
      warnSnap(warnings, "Height", hMm, snapped, unit);
      const entry = UPRIGHT_WITH_PANELS[snapped];
      if (!entry) return manualReview(line, inputMm, warnings, qty, finish);
      resolvedH = snapped;
      code = entry.code;
      description = `Upright aluminum H ${snapped} mm`;
      unitPrice = priceForFinish(entry, finish);
      accuracy = snapped === hMm ? "exact" : "snapped";
      break;
    }

    case "corner_upright": {
      if (system !== "with_panels") {
        return manualReview(line, inputMm, [...warnings, "Corner upright only for with_panels"], qty, finish);
      }
      if (hMm === undefined) {
        warnings.push("Height (h) required");
        return manualReview(line, inputMm, warnings, qty, finish);
      }
      const snapped = snapUpHeight(hMm, RULES.heightsWithPanels);
      warnSnap(warnings, "Height", hMm, snapped, unit);
      const entry = CORNER_UPRIGHT_WITH_PANELS[snapped];
      if (!entry) return manualReview(line, inputMm, warnings, qty, finish);
      const side = line.side === "left" || line.side === "sx" ? "sx" : "dx";
      resolvedH = snapped;
      code = side === "sx" ? entry.sx : entry.dx;
      description = `Corner upright ${side.toUpperCase()} H ${snapped} mm`;
      unitPrice = priceForFinish(entry, finish);
      accuracy = snapped === hMm ? "exact" : "snapped";
      break;
    }

    case "corner_filler": {
      if (system !== "with_panels") {
        return manualReview(line, inputMm, [...warnings, "Corner filler only for with_panels"], qty, finish);
      }
      if (hMm === undefined) {
        warnings.push("Height (h) required for corner filler");
        return manualReview(line, inputMm, warnings, qty, finish);
      }
      const snapped = snapUpHeight(hMm, RULES.heightsWithPanels);
      warnSnap(warnings, "Height", hMm, snapped, unit);
      const entry = CORNER_FILLER_WITH_PANELS[snapped];
      if (!entry) return manualReview(line, inputMm, warnings, qty, finish);
      const side = line.side === "left" || line.side === "sx" ? "sx" : "dx";
      resolvedH = snapped;
      resolvedL = 74;
      code = side === "sx" ? entry.sx : entry.dx;
      description = `Corner closing filler 74x74 H ${snapped} mm`;
      unitPrice = priceForFinish(entry, finish);
      accuracy = snapped === hMm ? "exact" : "snapped";
      break;
    }

    case "back_panel": {
      if (hMm === undefined || lMm === undefined) {
        warnings.push("Height and width (h, l) required");
        return manualReview(line, inputMm, warnings, qty, finish);
      }
      const heights =
        system === "with_panels" ? RULES.heightsWithPanels : RULES.heightsWithoutPanels;
      const widths =
        system === "with_panels" ? RULES.widthsWithPanels : RULES.widthsWithoutPanels;
      const rows =
        system === "with_panels" ? BACK_PANEL_WITH_PANELS : BACK_PANEL_WITHOUT_PANELS;
      const snappedH = snapUpHeight(hMm, heights);
      const snappedL = snapUp(lMm, widths);
      warnSnap(warnings, "Height", hMm, snappedH, unit);
      warnSnap(warnings, "Width", lMm, snappedL, unit);
      const row = findGridRow(rows, snappedH, snappedL);
      if (!row) return manualReview(line, inputMm, warnings, qty, finish);
      resolvedH = snappedH;
      resolvedL = snappedL;
      code = row.code;
      description =
        system === "with_panels"
          ? `Back panel 18mm H ${snappedH} L ${snappedL} mm`
          : `Wood filler panel H ${snappedH} L ${snappedL} mm`;
      unitPrice = priceForFinish(row, finish);
      accuracy = snappedH === hMm && snappedL === lMm ? "exact" : "snapped";
      break;
    }

    case "linear_filler": {
      if (system !== "with_panels") {
        return manualReview(line, inputMm, [...warnings, "Linear filler only for with_panels"], qty, finish);
      }
      if (hMm === undefined || lMm === undefined) {
        warnings.push("Height and width required");
        return manualReview(line, inputMm, warnings, qty, finish);
      }
      const snappedH = snapUpHeight(hMm, RULES.heightsWithPanels);
      const snappedL = snapUp(lMm, RULES.widthsLinearFiller);
      warnSnap(warnings, "Height", hMm, snappedH, unit);
      warnSnap(warnings, "Width", lMm, snappedL, unit);
      const row = findGridRow(LINEAR_FILLER_WITH_PANELS, snappedH, snappedL);
      if (!row) return manualReview(line, inputMm, warnings, qty, finish);
      resolvedH = snappedH;
      resolvedL = snappedL;
      code = row.code;
      description = `Linear closing filler H ${snappedH} L ${snappedL} mm`;
      unitPrice = priceForFinish(row, finish);
      accuracy = snappedH === hMm && snappedL === lMm ? "exact" : "snapped";
      break;
    }

    case "mirror": {
      if (system !== "with_panels") {
        return manualReview(line, inputMm, [...warnings, "Mirror table is with_panels"], qty, finish);
      }
      if (hMm === undefined || lMm === undefined) {
        warnings.push("Height and width required");
        return manualReview(line, inputMm, warnings, qty, finish);
      }
      const snappedH = snapUpHeight(hMm, RULES.heightsMirror);
      const snappedL = snapUp(lMm, RULES.widthsMirror);
      warnSnap(warnings, "Height", hMm, snappedH, unit);
      warnSnap(warnings, "Width", lMm, snappedL, unit);
      const row = findGridRow(MIRROR_WITH_PANELS, snappedH, snappedL);
      if (!row) return manualReview(line, inputMm, warnings, qty, finish);
      resolvedH = snappedH;
      resolvedL = snappedL;
      code = row.code;
      description = `Silver mirror 4mm H ${snappedH} L ${snappedL} mm`;
      unitPrice = priceForFinish(row, finish);
      accuracy = snappedH === hMm && snappedL === lMm ? "exact" : "snapped";
      break;
    }

    case "shelf": {
      if (lMm === undefined) {
        warnings.push("Width (l) required for shelf");
        return manualReview(line, inputMm, warnings, qty, finish);
      }
      const depth = depthFromLine();
      const snappedL = snapUp(lMm, RULES.widthsShelf);
      warnSnap(warnings, "Width", lMm, snappedL, unit);
      if (snappedL !== lMm) {
        warnings.push(
          `Muretti: order stock L ${snappedL} mm (not ${Math.round(lMm)} mm), price at ${snappedL} mm + cut surcharge p.52`,
        );
      }
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
        return manualReview(line, inputMm, warnings, qty, finish);
      }
      const band = FOOTBOARD_BANDS.find((b) => lMm! >= b.min && lMm! <= b.max);
      if (!band) {
        if (lMm < 100) warnings.push("Footboard length below minimum 100 mm");
        else warnings.push("Footboard length above maximum 3000 mm");
        return manualReview(line, inputMm, warnings, qty, finish);
      }
      const entry = system === "with_panels" ? band.withPanels : band.withoutPanels;
      resolvedL = lMm;
      code = entry.code;
      description = `Floor footboard L ${band.min}-${band.max} mm (input ${Math.round(lMm)} mm)`;
      unitPrice = priceForFinish(entry, finish);
      accuracy = "exact";
      break;
    }

    case "shoe_rack": {
      if (lMm === undefined) {
        warnings.push("Width (l) required for shoe rack");
        return manualReview(line, inputMm, warnings, qty, finish);
      }
      const depth = depthFromLine();
      const snappedL = snapUp(lMm, [...SHOE_WIDTHS]);
      warnSnap(warnings, "Width", lMm, snappedL, unit);
      try {
        const entry = shoeRackEntry(system, snappedL, depth);
        resolvedL = snappedL;
        code = entry.code;
        description = `Inclined shoe rack L ${snappedL} mm D ${depth} mm`;
        unitPrice = priceForFinish(entry, finish);
        accuracy = snappedL === lMm ? "exact" : "snapped";
      } catch {
        return manualReview(line, inputMm, warnings, qty, finish);
      }
      break;
    }

    case "clothes_tube": {
      if (lMm === undefined) {
        warnings.push("Width (l) required for clothes tube");
        return manualReview(line, inputMm, warnings, qty, finish);
      }
      const snappedL = snapUp(lMm, [...CLOTHES_TUBE_WIDTHS]);
      warnSnap(warnings, "Width", lMm, snappedL, unit);
      try {
        const entry = clothesTubeEntry(snappedL);
        resolvedH = CLOTHES_TUBE_HEIGHT;
        resolvedL = snappedL;
        code = entry.code;
        description = `Clothes tube H ${CLOTHES_TUBE_HEIGHT} L ${snappedL} mm`;
        unitPrice = priceForFinish(entry, finish);
        accuracy = snappedL === lMm ? "exact" : "snapped";
      } catch {
        return manualReview(line, inputMm, warnings, qty, finish);
      }
      break;
    }

    case "hanging_drawer": {
      const variant = (line.drawer_variant ?? "3") as DrawerVariant;
      if (lMm === undefined) {
        warnings.push("Width (l) required — use 803 or 903");
        return manualReview(line, inputMm, warnings, qty, finish);
      }
      const snappedL = snapUp(lMm, [...HANGING_DRAWER_WIDTHS]);
      warnSnap(warnings, "Width", lMm, snappedL, unit);
      try {
        const entry = hangingDrawerEntry(system, variant, snappedL);
        resolvedH = 222;
        resolvedL = snappedL;
        code = entry.code;
        description = `Hanging drawer (H) variant ${variant} L ${snappedL} mm`;
        unitPrice = priceForFinish(entry, finish);
        accuracy = snappedL === lMm ? "exact" : "snapped";
      } catch {
        return manualReview(line, inputMm, warnings, qty, finish);
      }
      break;
    }

    case "hanging_drawer_simple": {
      const material = (line.drawer_material ?? "wood") as DrawerMaterial;
      if (hMm === undefined || lMm === undefined) {
        warnings.push("Height (222|414) and width required");
        return manualReview(line, inputMm, warnings, qty, finish);
      }
      const snappedH = snapUpHeight(hMm, [...SIMPLE_DRAWER_HEIGHTS]);
      const snappedL = snapUp(lMm, [...SIMPLE_DRAWER_WIDTHS]);
      warnSnap(warnings, "Height", hMm, snappedH, unit);
      warnSnap(warnings, "Width", lMm, snappedL, unit);
      try {
        const entry = hangingDrawerSimpleEntry(system, material, snappedH, snappedL);
        resolvedH = snappedH;
        resolvedL = snappedL;
        code = entry.code;
        description = `Hanging drawer (J) ${material} H ${snappedH} L ${snappedL} mm`;
        unitPrice = priceForFinish(entry, finish);
        accuracy = snappedH === hMm && snappedL === lMm ? "exact" : "snapped";
      } catch {
        return manualReview(line, inputMm, warnings, qty, finish);
      }
      break;
    }

    case "hanging_raster": {
      const variant = (line.raster_variant ?? "hanging") as RasterVariant;
      if (hMm === undefined || lMm === undefined) {
        warnings.push("Height and width required for raster");
        return manualReview(line, inputMm, warnings, qty, finish);
      }
      const depth = depthFromLine();
      const heights = variant === "hanging" ? [606] : [414, 606];
      const snappedH = snapUpHeight(hMm, heights);
      const snappedL = snapUp(lMm, RULES.widthsShelf);
      warnSnap(warnings, "Height", hMm, snappedH, unit);
      warnSnap(warnings, "Width", lMm, snappedL, unit);
      try {
        const entry = hangingRasterEntry(system, variant, snappedH, snappedL, depth);
        resolvedH = snappedH;
        resolvedL = snappedL;
        code = entry.code;
        description = `Raster (${variant}) H ${snappedH} L ${snappedL} mm D ${depth} mm`;
        unitPrice = priceForFinish(entry, finish);
        accuracy = snappedH === hMm && snappedL === lMm ? "exact" : "snapped";
      } catch {
        return manualReview(line, inputMm, warnings, qty, finish);
      }
      break;
    }

    case "custom_panel_sqm": {
      if (hMm === undefined || lMm === undefined) {
        warnings.push("Height and width (mm) required for custom panel");
        return manualReview(line, inputMm, warnings, qty, finish);
      }
      const areaM2 = (hMm * lMm) / 1_000_000;
      const billableM2 = Math.max(areaM2, CUSTOM_PANEL_MIN_M2);
      resolvedH = hMm;
      resolvedL = lMm;
      code = CUSTOM_PANEL_PER_M2.code;
      const rate = priceForFinish(CUSTOM_PANEL_PER_M2, finish);
      unitPrice = Math.round(rate * billableM2 * 100) / 100;
      description = `Custom panel 18mm ${billableM2.toFixed(3)} m² (min ${CUSTOM_PANEL_MIN_M2} m²/piece)`;
      accuracy = areaM2 < CUSTOM_PANEL_MIN_M2 ? "estimated" : "exact";
      break;
    }

    case "ral_setup": {
      code = RAL_SETUP_FEE.code;
      description = RAL_SETUP_FEE.label;
      unitPrice = RAL_SETUP_FEE.price;
      accuracy = "exact";
      break;
    }

    case "flexy_led_shelf": {
      if (lMm === undefined) {
        warnings.push("Length (l) required for FlexyLED shelf lamp");
        return manualReview(line, inputMm, warnings, qty, finish);
      }
      const snappedL = snapUp(lMm, [483, 643, 803, 903]);
      try {
        const entry = flexyShelfLed(snappedL);
        resolvedL = snappedL;
        code = entry.code;
        description = `FlexyLED shelf lamp L ${snappedL} mm`;
        unitPrice = priceForFinish(entry, finish);
        accuracy = snappedL === lMm ? "exact" : "snapped";
      } catch {
        return manualReview(line, inputMm, warnings, qty, finish);
      }
      break;
    }

    case "flexy_led_drawer": {
      if (lMm === undefined) {
        warnings.push("Length (l) required for FlexyLED drawer lamp");
        return manualReview(line, inputMm, warnings, qty, finish);
      }
      const snappedL = snapUp(lMm, [447, 607, 767, 867]);
      try {
        const entry = flexyDrawerLed(snappedL);
        resolvedL = snappedL;
        code = entry.code;
        description = `FlexyLED drawer lamp L ${snappedL} mm`;
        unitPrice = priceForFinish(entry, finish);
        accuracy = snappedL === lMm ? "exact" : "snapped";
      } catch {
        return manualReview(line, inputMm, warnings, qty, finish);
      }
      break;
    }

    case "flexy_led_side": {
      if (hMm === undefined) {
        warnings.push("Height required for FlexyLED side lamp");
        return manualReview(line, inputMm, warnings, qty, finish);
      }
      const snappedH = snapUpHeight(hMm, [1189, 1509, 1829]);
      try {
        const entry = flexySideLed(snappedH);
        resolvedH = snappedH;
        code = entry.code;
        description = `FlexyLED side lamp H ${snappedH} mm`;
        unitPrice = priceForFinish(entry, finish);
        accuracy = snappedH === hMm ? "exact" : "snapped";
      } catch {
        return manualReview(line, inputMm, warnings, qty, finish);
      }
      break;
    }

    case "flexy_power": {
      code = FLEXY_POWER_100W.code;
      description = "FlexyLED power supply 12Vdc 100W + distributor";
      unitPrice = priceForFinish(FLEXY_POWER_100W, finish);
      accuracy = "exact";
      break;
    }

    case "flexy_cable": {
      code = FLEXY_CABLE.code;
      description = "FlexyLED Micro24 extension cable";
      unitPrice = priceForFinish(FLEXY_CABLE, finish);
      accuracy = "exact";
      break;
    }

    case "product_code": {
      const raw = line.product_code?.trim().toUpperCase();
      if (!raw) {
        warnings.push("product_code required");
        return manualReview(line, inputMm, warnings, qty, finish);
      }
      const entry = lookupProductCode(raw);
      if (!entry) {
        warnings.push(`Unknown product code: ${raw}`);
        return manualReview(line, inputMm, warnings, qty, finish);
      }
      code = entry.code;
      description = `Catalog code ${code}`;
      unitPrice = priceForFinish(entry, finish);
      accuracy = "exact";
      break;
    }

    default:
      return manualReview(line, inputMm, warnings, qty, finish);
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
    line_kind: "product",
    finish_applied: finish,
  };
}

const STRUCTURAL_ROLES = new Set<LineRole>([
  "upright",
  "corner_upright",
  "corner_filler",
  "back_panel",
  "linear_filler",
  "mirror",
]);

const LED_ROLES = new Set<LineRole>([
  "flexy_led_shelf",
  "flexy_led_drawer",
  "flexy_led_side",
  "flexy_power",
  "flexy_cable",
]);

const CUSTOMIZATION_ROLES = new Set<LineRole>([
  "custom_panel_sqm",
  "ral_setup",
]);

const NO_SURCHARGE_ROLES = new Set<LineRole>([
  "hanging_drawer",
  "hanging_drawer_simple",
  "hanging_raster",
  "shoe_rack",
  "flexy_led_shelf",
  "flexy_led_drawer",
  "flexy_led_side",
  "flexy_power",
  "flexy_cable",
  "ral_setup",
  "product_code",
]);

export function buildEstimate(request: EstimateRequest): EstimateResponse {
  if (request.price_list_id !== PRICE_LIST_ID) {
    throw new Error(`Unsupported price_list_id: ${request.price_list_id}`);
  }

  const productLines: PricedLine[] = [];
  const allLines: PricedLine[] = [];

  for (const input of request.lines) {
    let priced = priceLine(request, input);
    priced = { ...priced, line_kind: "product" };

    const specs = NO_SURCHARGE_ROLES.has(input.role)
      ? []
      : surchargesForLine(input, priced, request);
    const surchargeLines = buildSurchargeLines(input, priced, specs);
    priced = { ...priced, accuracy: mergeAccuracy(priced, specs.length > 0) };

    productLines.push(priced);
    allLines.push(priced, ...surchargeLines);
  }

  let subtotalBeforeDelivery = sumMoney(allLines.map((l) => l.line_total));

  if (request.margin_percent && request.margin_percent !== 0) {
    const factor = 1 + request.margin_percent / 100;
    for (let i = 0; i < allLines.length; i++) {
      const l = allLines[i];
      if (l.line_kind === "delivery") continue;
      const adjusted = Math.round(l.line_total * factor * 100) / 100;
      allLines[i] = {
        ...l,
        unit_price: Math.round((l.unit_price * factor) * 100) / 100,
        line_total: adjusted,
      };
    }
    subtotalBeforeDelivery = sumMoney(
      allLines.filter((l) => l.line_kind !== "delivery").map((l) => l.line_total),
    );
  }

  if (subtotalBeforeDelivery > 0 && subtotalBeforeDelivery < DELIVERY_MIN_NET_EUR) {
    allLines.push({
      line_id: "delivery",
      role: "product_code",
      quantity: 1,
      input_mm: {},
      resolved_mm: {},
      code: "DELIVERY",
      description: `Delivery surcharge (order under EUR ${DELIVERY_MIN_NET_EUR} net)`,
      unit_price: DELIVERY_SURCHARGE_EUR,
      line_total: DELIVERY_SURCHARGE_EUR,
      accuracy: "exact",
      warnings: [],
      line_kind: "delivery",
    });
  }

  const buckets = {
    structural: [] as number[],
    equipment: [] as number[],
    customization: [] as number[],
    led: [] as number[],
    delivery: [] as number[],
    unresolved: [] as number[],
  };

  for (const line of allLines) {
    const t = line.line_total;
    if (line.line_kind === "delivery") {
      buckets.delivery.push(t);
      continue;
    }
    if (line.line_kind === "surcharge") {
      buckets.customization.push(t);
      continue;
    }
    if (line.accuracy === "manual_review") {
      buckets.unresolved.push(t);
      continue;
    }
    if (CUSTOMIZATION_ROLES.has(line.role)) {
      buckets.customization.push(t);
      continue;
    }
    if (LED_ROLES.has(line.role)) {
      buckets.led.push(t);
      continue;
    }
    if (STRUCTURAL_ROLES.has(line.role)) {
      buckets.structural.push(t);
      continue;
    }
    buckets.equipment.push(t);
  }

  const subtotals = {
    structural: sumMoney(buckets.structural),
    equipment: sumMoney(buckets.equipment),
    customization: sumMoney(buckets.customization),
    led: sumMoney(buckets.led),
    delivery: sumMoney(buckets.delivery),
    unresolved: sumMoney(buckets.unresolved),
  };

  const total_net = sumMoney([
    subtotals.structural,
    subtotals.equipment,
    subtotals.customization,
    subtotals.led,
    subtotals.delivery,
    subtotals.unresolved,
  ]);

  const hasManual = allLines.some((l) => l.accuracy === "manual_review");
  const hasEstimated = allLines.some((l) => l.accuracy === "estimated");
  const hasSnap = allLines.some((l) => l.accuracy === "snapped");
  const overall_confidence = hasManual ? "low" : hasEstimated || hasSnap ? "medium" : "high";

  const allWarnings = allLines.flatMap((l) =>
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
    lines: allLines,
    subtotals,
    total_net,
    overall_confidence,
    warnings: allWarnings,
    disclaimer:
      "Indicative estimate from SCENIKA list 10/2023 (Play s.r.l.). Prices EUR net excl. VAT. Snapped to catalog where applicable; cut surcharges added when input differs from catalog size.",
  };
}

export { SURCHARGES };
