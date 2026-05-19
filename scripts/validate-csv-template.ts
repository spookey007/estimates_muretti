/**
 * Parses the CSV template and checks pricing.
 * Run: npm run test:csv
 */
import { readFileSync } from "fs";
import { join } from "path";
import { buildEstimate } from "../src/lib/engine/price";
import { parseCsvRequest } from "../src/lib/parsers/parse-request";

const csvPath = join(process.cwd(), "public", "muretti-estimate-template.csv");
const csv = readFileSync(csvPath, "utf-8");

const request = parseCsvRequest(csv, {});
const result = buildEstimate(request);

const l1 = result.lines.find((l) => l.line_id === "L1");
const l2 = result.lines.find((l) => l.line_id === "L2");

const checks = [
  {
    label: "project from CSV",
    ok: request.project_name === "Sample master closet",
    detail: request.project_name,
  },
  {
    label: "L1 upright 1PC11F0 @ 84",
    ok: l1?.code === "1PC11F0" && l1?.unit_price === 84,
    detail: JSON.stringify(l1),
  },
  {
    label: "L2 back panel 1PN15F0 @ 143",
    ok: l2?.code === "1PN15F0" && l2?.unit_price === 143,
    detail: JSON.stringify(l2),
  },
  {
    label: "total 311 EUR",
    ok: result.total_net === 311,
    detail: String(result.total_net),
  },
];

let failed = 0;
for (const c of checks) {
  if (c.ok) console.log(`PASS ${c.label}`);
  else {
    failed++;
    console.log(`FAIL ${c.label}: ${c.detail}`);
  }
}

if (failed > 0) process.exit(1);
console.log("\nCSV template validation OK");
