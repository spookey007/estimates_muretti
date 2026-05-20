import type { EstimateLineInput, EstimateRequest, Finish, LineRole } from "@/lib/types";

export function nextLineId(lines: EstimateLineInput[]): string {
  const nums = lines
    .map((l) => /^L0*(\d+)$/i.exec(l.line_id)?.[1])
    .filter(Boolean)
    .map((n) => Number(n));
  const n = nums.length ? Math.max(...nums) + 1 : 1;
  return `L${String(n).padStart(2, "0")}`;
}

export function createEmptyLine(
  lineId: string,
  role: LineRole = "shelf",
  overrides?: Partial<EstimateLineInput>,
): EstimateLineInput {
  return {
    line_id: lineId,
    role,
    quantity: 1,
    depth_type: role === "shelf" || role === "shoe_rack" ? "510" : undefined,
    ...overrides,
  };
}

export function createBlankRequest(
  overrides?: Partial<EstimateRequest>,
): EstimateRequest {
  return {
    schema_version: "1.0",
    project_name: "New walk-in estimate",
    price_list_id: "scenika-2023-10",
    measurement_unit: "mm",
    measurement_basis: "panel",
    system: "with_panels",
    finish: "melamine",
    currency_display: "EUR",
    lines: [],
    ...overrides,
  };
}

/** Quick-add presets for common parts. */
export const QUICK_ADD_ROLES: { role: LineRole; label: string; defaults?: Partial<EstimateLineInput> }[] = [
  { role: "shelf", label: "+ Shelf", defaults: { l: 903, depth_type: "510", notes: "F Ripiano" } },
  { role: "back_panel", label: "+ Back panel", defaults: { h: 2187, l: 640, notes: "C Schienale" } },
  { role: "upright", label: "+ Upright", defaults: { h: 2187, notes: "A Montante" } },
  { role: "corner_upright", label: "+ Corner upright", defaults: { h: 2187, side: "dx", notes: "B Angolare" } },
  { role: "footboard", label: "+ Footboard", defaults: { l: 1500, notes: "G Pedana" } },
  { role: "mirror", label: "+ Mirror", defaults: { h: 958, l: 638 } },
  { role: "hanging_drawer", label: "+ Drawer (H)", defaults: { l: 803, drawer_variant: "3" } },
  { role: "hanging_drawer_simple", label: "+ Drawer (J)", defaults: { h: 222, l: 903, drawer_material: "wood" } },
];

export function addLine(
  request: EstimateRequest,
  role: LineRole,
  defaults?: Partial<EstimateLineInput>,
): EstimateRequest {
  const line_id = nextLineId(request.lines);
  const finish: Finish | undefined = defaults?.finish;
  return {
    ...request,
    lines: [
      ...request.lines,
      createEmptyLine(line_id, role, {
        finish,
        ...defaults,
      }),
    ],
  };
}
