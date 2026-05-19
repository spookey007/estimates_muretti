/**
 * Validates engine output against SCENIKA PDF 10/2023 reference rows.
 * Run: npx tsx scripts/validate-pdf-prices.ts
 */
import { buildEstimate } from "../src/lib/engine/price";
import type { EstimateLineInput, EstimateRequest } from "../src/lib/types";

type PdfCase = {
  id: string;
  pdfRef: string;
  line: EstimateLineInput;
  expectedCode: string;
  expectedUnitMelamine?: number;
  expectedUnitLacquered?: number;
  expectAccuracy?: "exact" | "snapped";
  system?: EstimateRequest["system"];
  finish?: EstimateRequest["finish"];
};

function req(
  lines: EstimateLineInput[],
  overrides?: Partial<EstimateRequest>,
): EstimateRequest {
  const base: EstimateRequest = {
    schema_version: "1.0",
    project_name: "PDF validation",
    price_list_id: "scenika-2023-10",
    measurement_unit: "mm",
    measurement_basis: "finished",
    system: "with_panels",
    finish: "melamine",
    lines,
  };
  if (!overrides) return base;
  return {
    ...base,
    ...(overrides.system !== undefined ? { system: overrides.system } : {}),
    ...(overrides.finish !== undefined ? { finish: overrides.finish } : {}),
  };
}

const CASES: PdfCase[] = [
  {
    id: "T01",
    pdfRef: "p.17 upright H2187",
    line: { line_id: "1", role: "upright", quantity: 1, h: 2187 },
    expectedCode: "1PC11F0",
    expectedUnitMelamine: 84,
    expectAccuracy: "exact",
  },
  {
    id: "T02",
    pdfRef: "p.17 upright H2891",
    line: { line_id: "1", role: "upright", quantity: 1, h: 2891 },
    expectedCode: "1PC11I0",
    expectedUnitMelamine: 91,
    expectAccuracy: "exact",
  },
  {
    id: "T03",
    pdfRef: "p.17 back H2187 L480",
    line: { line_id: "1", role: "back_panel", quantity: 1, h: 2187, l: 480 },
    expectedCode: "1PN13F0",
    expectedUnitMelamine: 123,
    expectAccuracy: "exact",
  },
  {
    id: "T04",
    pdfRef: "p.17 back H2187 L640",
    line: { line_id: "1", role: "back_panel", quantity: 1, h: 2187, l: 640 },
    expectedCode: "1PN15F0",
    expectedUnitMelamine: 143,
    expectAccuracy: "exact",
  },
  {
    id: "T05",
    pdfRef: "p.17 back H2891 L900",
    line: { line_id: "1", role: "back_panel", quantity: 1, h: 2891, l: 900 },
    expectedCode: "1PN17I0",
    expectedUnitMelamine: 212,
    expectAccuracy: "exact",
  },
  {
    id: "T06",
    pdfRef: "p.17 corner H2187 Dx",
    line: { line_id: "1", role: "corner_upright", quantity: 1, h: 2187, side: "dx" },
    expectedCode: "1PA11F1",
    expectedUnitMelamine: 87,
    expectAccuracy: "exact",
  },
  {
    id: "T07",
    pdfRef: "p.19 linear H2187 L513",
    line: { line_id: "1", role: "linear_filler", quantity: 1, h: 2187, l: 513 },
    expectedCode: "1PN14F0",
    expectedUnitMelamine: 126,
    expectAccuracy: "exact",
  },
  {
    id: "T08",
    pdfRef: "p.19 linear H2187 L417",
    line: { line_id: "1", role: "linear_filler", quantity: 1, h: 2187, l: 417 },
    expectedCode: "1PN12F0",
    expectedUnitMelamine: 117,
    expectAccuracy: "exact",
  },
  {
    id: "T09",
    pdfRef: "p.20 mirror H958 L478",
    line: { line_id: "1", role: "mirror", quantity: 1, h: 958, l: 478 },
    expectedCode: "1SP13A0",
    expectedUnitMelamine: 67,
    expectAccuracy: "exact",
  },
  {
    id: "T10",
    pdfRef: "p.20 mirror H1817 L898",
    line: { line_id: "1", role: "mirror", quantity: 1, h: 1817, l: 898 },
    expectedCode: "1SP17F0",
    expectedUnitMelamine: 300,
    expectAccuracy: "exact",
  },
  {
    id: "T11",
    pdfRef: "p.30 shelf L483 D510 with panels",
    line: { line_id: "1", role: "shelf", quantity: 1, l: 483, depth_type: "510" },
    expectedCode: "1RL1310",
    expectedUnitMelamine: 73,
    expectAccuracy: "exact",
  },
  {
    id: "T12",
    pdfRef: "p.30 shelf L903 D414 with panels",
    line: { line_id: "1", role: "shelf", quantity: 1, l: 903, depth_type: "414" },
    expectedCode: "1RL1700",
    expectedUnitMelamine: 88,
    expectAccuracy: "exact",
  },
  {
    id: "T13",
    pdfRef: "p.30 shelf L643 without panels",
    line: { line_id: "1", role: "shelf", quantity: 1, l: 643, depth_type: "510" },
    expectedCode: "2RL1510",
    expectedUnitMelamine: 77,
    system: "without_panels",
    expectAccuracy: "exact",
  },
  {
    id: "T14",
    pdfRef: "p.31 footboard L100-1000",
    line: { line_id: "1", role: "footboard", quantity: 1, l: 950 },
    expectedCode: "1PE1110",
    expectedUnitMelamine: 152,
    expectAccuracy: "exact",
  },
  {
    id: "T15",
    pdfRef: "p.31 footboard L1001-1800",
    line: { line_id: "1", role: "footboard", quantity: 1, l: 1500 },
    expectedCode: "1PE1210",
    expectedUnitMelamine: 209,
    expectAccuracy: "exact",
  },
  {
    id: "T16",
    pdfRef: "p.31 footboard L1801-3000",
    line: { line_id: "1", role: "footboard", quantity: 1, l: 2500 },
    expectedCode: "1PE1310",
    expectedUnitMelamine: 296,
    expectAccuracy: "exact",
  },
  {
    id: "T17",
    pdfRef: "p.28 filler without panels H2188 L461",
    line: { line_id: "1", role: "back_panel", quantity: 1, h: 2188, l: 461 },
    expectedCode: "2PN13F0",
    expectedUnitMelamine: 114,
    system: "without_panels",
    expectAccuracy: "exact",
  },
  {
    id: "T18",
    pdfRef: "p.17 back lacquered H2187 L640",
    line: { line_id: "1", role: "back_panel", quantity: 1, h: 2187, l: 640 },
    expectedCode: "1PN15F0",
    expectedUnitLacquered: 207,
    finish: "lacquered",
    expectAccuracy: "exact",
  },
  {
    id: "T19",
    pdfRef: "snap: shelf input L640 -> catalog L643",
    line: { line_id: "1", role: "shelf", quantity: 1, l: 640, depth_type: "510" },
    expectedCode: "1RL1510",
    expectedUnitMelamine: 77,
    expectAccuracy: "snapped",
  },
  {
    id: "T20",
    pdfRef: "snap: back H2000 L500 -> 2187x640",
    line: { line_id: "1", role: "back_panel", quantity: 1, h: 2000, l: 500 },
    expectedCode: "1PN15F0",
    expectedUnitMelamine: 143,
    expectAccuracy: "snapped",
  },
];

function run() {
  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  for (const c of CASES) {
    const estimate = buildEstimate(
      req([c.line], {
        system: c.system,
        finish: c.finish,
      }),
    );
    const row = estimate.lines[0];
    const finish = c.finish ?? "melamine";
    const expectedPrice =
      finish === "lacquered" ? c.expectedUnitLacquered : c.expectedUnitMelamine;

    const codeOk = row.code === c.expectedCode;
    const priceOk = expectedPrice === undefined || row.unit_price === expectedPrice;
    const accOk = !c.expectAccuracy || row.accuracy === c.expectAccuracy;

    if (codeOk && priceOk && accOk) {
      passed++;
      console.log(`PASS ${c.id} ${c.pdfRef}`);
    } else {
      failed++;
      const msg = [
        `FAIL ${c.id} ${c.pdfRef}`,
        `  code: ${row.code} (expected ${c.expectedCode})`,
        `  price: ${row.unit_price} (expected ${expectedPrice})`,
        `  accuracy: ${row.accuracy} (expected ${c.expectAccuracy ?? "any"})`,
      ].join("\n");
      failures.push(msg);
      console.log(msg);
    }
  }

  // Full template integration test (sample CSV totals)
  const templateLines: EstimateLineInput[] = [
    { line_id: "L1", role: "upright", quantity: 2, h: 2187 },
    { line_id: "L2", role: "back_panel", quantity: 1, h: 2187, l: 640 },
    { line_id: "L3", role: "shelf", quantity: 4, l: 640, depth_type: "510" },
    { line_id: "L4", role: "footboard", quantity: 1, l: 950 },
  ];
  const templateEst = buildEstimate(req(templateLines));
  const expectedTotal = 168 + 143 + 308 + 152; // 771
  if (templateEst.total_net === expectedTotal) {
    passed++;
    console.log(`PASS T21 sample template total ${expectedTotal} EUR`);
  } else {
    failed++;
    failures.push(
      `FAIL T21 sample total ${templateEst.total_net} expected ${expectedTotal}`,
    );
    console.log(failures[failures.length - 1]);
  }

  console.log("\n---");
  console.log(`Passed: ${passed}  Failed: ${failed}`);
  if (failed > 0) {
    process.exit(1);
  }
}

run();
