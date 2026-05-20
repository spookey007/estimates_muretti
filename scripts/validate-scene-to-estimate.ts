/**
 * Scene → estimate bridge tests.
 * Run: npm run test:cad
 */
import { sceneToEstimate } from "../src/cad/engine/scene/sceneToEstimate";
import { estimateToScene } from "../src/cad/engine/scene/estimateToScene";
import { createLClosetScenikaScene } from "../src/cad/presets/l-closet-scenika";
import { createStarterRunScene } from "../src/cad/presets/starter-run";
import { buildEstimate } from "../src/lib/engine/price";

const scene = createStarterRunScene();
const request = sceneToEstimate(scene);
const lScene = createLClosetScenikaScene();
const lRequest = sceneToEstimate(lScene);
const roundTrip = sceneToEstimate(estimateToScene(lRequest));

const checks = [
  {
    label: "3 lines from starter scene",
    ok: request.lines.length === 3,
    detail: String(request.lines.length),
  },
  {
    label: "U1 upright line id",
    ok: request.lines.some((l) => l.line_id === "U1" && l.role === "upright"),
    detail: request.lines.map((l) => l.line_id).join(","),
  },
  {
    label: "S1 shelf width 803",
    ok: request.lines.some((l) => l.line_id === "S1" && l.l === 803),
    detail: JSON.stringify(request.lines.find((l) => l.line_id === "S1")),
  },
  {
    label: "buildEstimate succeeds",
    ok: (() => {
      try {
        buildEstimate(request);
        return true;
      } catch {
        return false;
      }
    })(),
    detail: "ok",
  },
  {
    label: "L-closet preset has 19 lines",
    ok: lRequest.lines.length === 19,
    detail: String(lRequest.lines.length),
  },
  {
    label: "L-closet buildEstimate succeeds",
    ok: (() => {
      try {
        const r = buildEstimate(lRequest);
        return r.total_net > 0;
      } catch {
        return false;
      }
    })(),
    detail: "ok",
  },
  {
    label: "estimateToScene round-trip line count",
    ok: roundTrip.lines.length === lRequest.lines.length,
    detail: `${roundTrip.lines.length} vs ${lRequest.lines.length}`,
  },
];

let failed = 0;
for (const c of checks) {
  const mark = c.ok ? "PASS" : "FAIL";
  if (!c.ok) failed++;
  console.log(`${mark} ${c.label}${c.ok ? "" : ` — ${c.detail}`}`);
}

if (failed > 0) {
  process.exit(1);
}
console.log("\nScene → estimate validation OK");
