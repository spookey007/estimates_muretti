/**
 * Scene → estimate bridge tests.
 * Run: npm run test:cad
 */
import { sceneToEstimate } from "../src/cad/engine/scene/sceneToEstimate";
import { estimateToScene } from "../src/cad/engine/scene/estimateToScene";
import { createLClosetPanelsOnlyScene } from "../src/cad/presets/l-closet-panels-only";
import {
  createLClosetScenikaRequest,
  createLClosetScenikaScene,
} from "../src/cad/presets/l-closet-scenika";
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
    label: "L-closet CSV sample has 19 estimate lines",
    ok: createLClosetScenikaRequest().lines.length === 19,
    detail: String(createLClosetScenikaRequest().lines.length),
  },
  {
    label: "L-closet with components exports 13 visible 3D lines",
    ok: lRequest.lines.length === 13,
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
  {
    label: "L-closet with components has uprights and shelves, no corner/mirror mesh",
    ok:
      lScene.objects.length >= 14 &&
      lScene.objects.some((o) => o.type === "upright") &&
      lScene.objects.some((o) => o.type === "shelf") &&
      !lScene.objects.some(
        (o) => o.type === "corner_upright" || o.pricing.role === "mirror",
      ),
    detail: String(lScene.objects.length),
  },
  {
    label: "L return has exactly 3 shelves (one per bay)",
    ok: (() => {
      const ret = lScene.objects.filter(
        (o) => o.type === "shelf" && o.position[0] >= 2100,
      );
      const depths = ret
        .sort((a, b) => a.position[2] - b.position[2])
        .map((o) => o.dimensions.depth);
      return (
        ret.length === 3 &&
        ret.every(
          (o) => o.dimensions.width === 480 && o.dimensions.depth === 480,
        ) &&
        depths.every((d) => d === 480)
      );
    })(),
    detail: "ok",
  },
  {
    label: "L return shelves export catalog L (not box depth)",
    ok: (() => {
      const lines = lRequest.lines.filter((l) =>
        ["L13", "L14", "L15"].includes(l.line_id),
      );
      return lines.length === 3 && lines.every((l) => l.l === 480);
    })(),
    detail: JSON.stringify(
      lRequest.lines.filter((l) => ["L13", "L14", "L15"].includes(l.line_id)),
    ),
  },
  {
    label: "L-closet panels-only has 6 back panels only",
    ok: (() => {
      const p = createLClosetPanelsOnlyScene();
      return (
        p.objects.length === 6 && p.objects.every((o) => o.type === "back_panel")
      );
    })(),
    detail: "ok",
  },
  {
    label: "L layout wall1 panels along X",
    ok: (() => {
      const panels = lScene.objects.filter(
        (o) =>
          o.type === "back_panel" &&
          o.dimensions.width === 900 &&
          o.position[0] < 2000,
      );
      return (
        panels.length === 3 &&
        panels[0].position[0] === 0 &&
        panels[1].position[0] === 900 &&
        panels[2].position[0] === 1800
      );
    })(),
    detail: "ok",
  },
  {
    label: "L shelves have no XZ overlap at same height",
    ok: (() => {
      const shelves = lScene.objects.filter((o) => o.type === "shelf");
      for (let i = 0; i < shelves.length; i++) {
        for (let j = i + 1; j < shelves.length; j++) {
          const a = shelves[i];
          const b = shelves[j];
          if (a.position[1] !== b.position[1]) continue;
          const ax2 = a.position[0] + a.dimensions.width;
          const az2 = a.position[2] + a.dimensions.depth;
          const bx2 = b.position[0] + b.dimensions.width;
          const bz2 = b.position[2] + b.dimensions.depth;
          const xO = a.position[0] < bx2 && ax2 > b.position[0];
          const zO = a.position[2] < bz2 && az2 > b.position[2];
          if (xO && zO) return false;
        }
      }
      return true;
    })(),
    detail: "ok",
  },
  {
    label: "L return panels continuous along Z at x=2700",
    ok: (() => {
      const panels = lScene.objects
        .filter(
          (o) => o.pricing.role === "back_panel" && o.position[0] === 2700,
        )
        .sort((a, b) => a.position[2] - b.position[2]);
      return (
        panels.length === 3 &&
        panels[0].dimensions.width === 800 &&
        panels[1].dimensions.width === 640 &&
        panels[2].dimensions.width === 480 &&
        panels[0].position[2] === 0 &&
        panels[1].position[2] === 800 &&
        panels[2].position[2] === 1440
      );
    })(),
    detail: "ok",
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
