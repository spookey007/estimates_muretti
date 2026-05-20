import type { EstimateResponse, LineRole, PricedLine } from "@/lib/types";

const ROLE_LABELS: Record<LineRole, string> = {
  upright: "Upright (aluminum)",
  corner_upright: "Corner upright",
  corner_filler: "Corner closing filler 74x74",
  back_panel: "Back panel 18 mm",
  linear_filler: "Linear closing filler",
  mirror: "Mirror 4 mm",
  shelf: "Shelf 30 mm",
  footboard: "Floor footboard",
  shoe_rack: "Inclined shoe rack",
  clothes_tube: "Clothes hanging tube",
  hanging_drawer: "Hanging drawer with frames (H)",
  hanging_drawer_simple: "Hanging drawer unit (J)",
  hanging_raster: "Hanging raster / cubby (I)",
  custom_panel_sqm: "Custom panel per m2",
  ral_setup: "RAL/NCS setup fee",
  flexy_led_shelf: "FlexyLED shelf lamp",
  flexy_led_drawer: "FlexyLED drawer lamp",
  flexy_led_side: "FlexyLED side lamp",
  flexy_power: "FlexyLED power supply",
  flexy_cable: "FlexyLED extension cable",
  product_code: "Catalog product code",
};

const SYSTEM_LABELS = {
  with_panels: "Walk-in with panels",
  without_panels: "Walk-in without panels",
};

const FINISH_LABELS = {
  melamine: "Melamine (Tela / Noce / Juta)",
  lacquered: "Lacquered",
};

const BASIS_LABELS = {
  finished: "Finished dimensions",
  panel: "Panel dimensions",
  opening: "Opening (+10 mm allowance)",
};

export function roleLabel(role: LineRole): string {
  return ROLE_LABELS[role] ?? role;
}

export function formatMoney(amount: number, currency = "EUR"): string {
  return `${currency} ${amount.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function quoteRef(estimateId: string): string {
  return `EST-${estimateId.slice(0, 8).toUpperCase()}`;
}

export function formatDimensions(line: PricedLine): string {
  const { h, l, d } = line.resolved_mm;
  const parts: string[] = [];
  if (h) parts.push(`H ${h}`);
  if (l) parts.push(`L ${l}`);
  if (d) parts.push(`D ${d}`);
  return parts.length ? `${parts.join("  x  ")} mm` : "";
}

export function projectMeta(result: EstimateResponse) {
  return {
    quoteRef: quoteRef(result.estimate_id),
    date: formatDate(result.created_at),
    system: SYSTEM_LABELS[result.system],
    finish: FINISH_LABELS[result.finish],
    basis: BASIS_LABELS[result.measurement_basis_applied],
    list: result.price_list_label,
  };
}

export function safeFilename(projectName: string, estimateId: string): string {
  const slug = projectName
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "estimate";
  return `Muretti-Estimate-${slug}-${estimateId.slice(0, 8)}.pdf`;
}
