/** Content mirrors templates/muretti-estimate-template.csv exactly (1:1). */

export const TEMPLATE_FILENAME = "muretti-estimate-template.csv";

export const SETTINGS_ROWS: { name: string; example: string; description: string }[] = [
  { name: "project_name", example: "Sample master closet", description: "Job name on estimate" },
  { name: "measurement_unit", example: "mm", description: "mm, cm, or in" },
  { name: "measurement_basis", example: "finished", description: "finished, panel, or opening" },
  { name: "system", example: "with_panels", description: "with_panels or without_panels" },
  { name: "finish", example: "melamine", description: "melamine or lacquered" },
];

/** Exact header row from the CSV file */
export const ITEM_COLUMNS = [
  "line_id",
  "room",
  "role",
  "quantity",
  "height_mm",
  "width_mm",
  "depth_mm",
  "side",
  "depth_type",
  "notes",
] as const;

/** Exact sample rows from the CSV file */
export const SAMPLE_ROWS = [
  {
    line_id: "L1",
    room: "Master",
    role: "upright",
    quantity: "2",
    height_mm: "2187",
    width_mm: "",
    depth_mm: "",
    side: "",
    depth_type: "",
    notes: "",
  },
  {
    line_id: "L2",
    room: "Master",
    role: "back_panel",
    quantity: "1",
    height_mm: "2187",
    width_mm: "640",
    depth_mm: "",
    side: "",
    depth_type: "",
    notes: "",
  },
] as const;

export function sampleRowToCsv(row: (typeof SAMPLE_ROWS)[number]): string {
  return [
    row.line_id,
    row.room,
    row.role,
    row.quantity,
    row.height_mm,
    row.width_mm,
    row.depth_mm,
    row.side,
    row.depth_type,
    row.notes,
  ].join(",");
}

/** Full file text as uploaded (1:1) */
export function fullTemplateCsv(): string {
  const settings = SETTINGS_ROWS.map((r) => `${r.name},${r.example}`).join("\n");
  const header = ITEM_COLUMNS.join(",");
  const samples = SAMPLE_ROWS.map(sampleRowToCsv).join("\n");
  return `${settings}\n${header}\n${samples}`;
}
