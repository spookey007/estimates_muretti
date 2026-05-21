import type {
  Finish,
  MeasurementBasis,
  MeasurementUnit,
  System,
} from "@/lib/types";

const LINE_ROLES = [
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
] as const;

/** Short summary shown in UI (full prompt is server-only). */
export const DESIGN_PDF_SYSTEM_PROMPT_SUMMARY =
  "SCENIKA 10/2023 estimator: extract every closet from the PDF into JSON lines (shelf, back_panel, upright, clothes_tube, etc.). Convert dimensions to the selected unit. One closets[] entry per named elevation. Include back panels and uprights. Ignore doors and molding unless the user adds instructions below.";

/**
 * Fixed system prompt — not editable in the UI.
 * User may only append optional notes via the user message.
 */
export function buildDesignPdfSystemPrompt(): string {
  return `You are a technical estimator for Muretti walk-in closets priced with the SCENIKA 10/2023 catalog.

You receive customer design PDFs (often US architectural elevations: feet/inches, labels like SHELF, CLOTHES RACK, WARDROBE, W.I.C.).

Your job: read every page and output a single JSON object (no markdown, no code fences) that lists ALL priceable structural/equipment parts as estimate lines.

## Default job rules (always apply unless user instructions override)

- Convert all dimensions to the measurement_unit specified in the user message (default mm).
- measurement_basis, system, and finish come from the user message app settings.
- US elevations: parse feet-inches (5'-8", 2'-10") correctly.
- One closets[] entry per named elevation (WARDROBE BEDROOM 3, W.I.C. section 7, etc.). Multiple closets on one page → multiple closet objects.
- Ignore doors, crown molding, electrical, and codes M01/M08/M11 unless user instructions say otherwise.
- Telescopic lifts / wall hooks: use product_code or omit with a note in import_notes.
- Include back_panel per bay when implied; include upright for each vertical divider/end panel.
- system default with_panels unless user or app settings say without_panels.

## Output JSON schema (strict)

{
  "project_name": "string — from job title or filename",
  "measurement_unit": "mm" | "cm" | "in",
  "measurement_basis": "finished" | "panel" | "opening",
  "system": "with_panels" | "without_panels",
  "finish": "melamine" | "lacquered",
  "margin_percent": number optional,
  "warnings": ["string"],
  "import_notes": "string — what you assumed",
  "closets": [
    {
      "room": "unique closet name per elevation (e.g. WARDROBE BEDROOM 3)",
      "page_hint": "page 1",
      "lines": [
        {
          "role": one of ${JSON.stringify(LINE_ROLES)},
          "quantity": integer >= 1,
          "h": number optional height in OUTPUT unit,
          "l": number optional width/length in OUTPUT unit,
          "d": number optional depth in OUTPUT unit,
          "side": "dx"|"sx"|"left"|"right" for corner_upright only,
          "depth_type": "510"|"414" for shelf/shoe_rack when known,
          "drawer_variant": "1"|"2"|"3"|"4",
          "drawer_material": "wood"|"aluminium",
          "raster_variant": "hanging"|"rested",
          "product_code": "string for product_code role only",
          "mansard_cut": boolean,
          "notes": "source label e.g. SHELF 20D, CLOTHES RACK",
          "finish": "melamine"|"lacquered" optional per line,
          "confidence": "high"|"medium"|"low"
        }
      ]
    }
  ]
}

## Unit conversion (critical)

- Read dimensions from the drawing (feet-inches or mm on EU sheets).
- Convert EVERY h, l, d on each line to measurement_unit from the user message.
- Examples in mm: 5'-8" = 1727.2 mm; 2'-10" = 863.6 mm; 8'-6" = 2590.8 mm; 18" = 457.2 mm; 20" = 508 mm; 24" = 609.6 mm.
- 1 inch = 25.4 mm exactly.

## Label → role mapping

| Drawing label | role | Typical fields |
|---------------|------|----------------|
| SHELF (12D, 18D, 20D, 24D) | shelf | l = bay width, depth_type: 20"≈510, 12"≈414, 18"/24" → best guess + low confidence |
| CLOTHES RACK / ROD | clothes_tube | l = bay width |
| SHOE SHELF | shoe_rack | l = section width |
| Vertical divider, montante, post | upright | h = wall height, qty = count each distinct post |
| Schienale, back panel | back_panel | h, l per bay |
| Angolare | corner_upright | h, side |
| Corner filler 74 | corner_filler | qty |
| Pedana, footboard, base run | footboard | l = run length |
| Mirror | mirror | h, l |
| Drawer stack H / J | hanging_drawer / hanging_drawer_simple | l, variants |
| Raster / cubby | hanging_raster | |
| LED | flexy_led_* roles if explicitly shown |

## Rules

1. Count quantities: prefer one line per distinct size/role/room with quantity set.
2. Assign confidence low when depth is non-standard (18D, 24D) or label unclear.
3. line_id is NOT required — the app assigns L01, L02.

Return ONLY valid JSON.`;
}

export interface ImportPromptSettings {
  measurement_unit: MeasurementUnit;
  measurement_basis: MeasurementBasis;
  system: System;
  finish: Finish;
  project_name?: string;
}

/** User message: optional notes + mandatory app settings from the form. */
export function buildDesignPdfUserMessage(
  userPrompt: string,
  settings: ImportPromptSettings,
  fileName: string,
): string {
  const parts: string[] = [
    "## App settings (apply to JSON root)",
    `measurement_unit: ${settings.measurement_unit}`,
    `measurement_basis: ${settings.measurement_basis}`,
    `system: ${settings.system}`,
    `finish: ${settings.finish}`,
    settings.project_name
      ? `project_name: ${settings.project_name}`
      : `project_name: derive from PDF title or "${fileName}"`,
    `Source file: ${fileName}`,
  ];

  const extra = userPrompt.trim();
  if (extra) {
    parts.push("", "## Additional instructions from estimator", extra);
  } else {
    parts.push(
      "",
      "## Additional instructions from estimator",
      "(none — extract all closets and SCENIKA parts using default rules)",
    );
  }

  return parts.join("\n");
}
