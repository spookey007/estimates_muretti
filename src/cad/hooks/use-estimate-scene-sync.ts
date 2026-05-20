"use client";

import { sceneToEstimate } from "@/cad/engine/scene/sceneToEstimate";
import { useSceneStore } from "@/cad/state/useSceneStore";
import type { EstimateRequest } from "@/lib/types";
import { useEffect, useRef } from "react";

export function linesFingerprint(lines: EstimateRequest["lines"]): string {
  return JSON.stringify(
    lines.map((l) => ({
      id: l.line_id,
      role: l.role,
      q: l.quantity,
      h: l.h,
      l: l.l,
      d: l.d,
      finish: l.finish,
      side: l.side,
      depth_type: l.depth_type,
      drawer_variant: l.drawer_variant,
      drawer_material: l.drawer_material,
      raster_variant: l.raster_variant,
      notes: l.notes,
    })),
  );
}

/** Merge table/CSV metadata with scene geometry (scene wins dimensions; finish from CAD or table). */
function mergeLineMetadata(
  sceneLine: EstimateRequest["lines"][number],
  input?: EstimateRequest["lines"][number],
): EstimateRequest["lines"][number] {
  if (!input) return sceneLine;
  return {
    ...input,
    ...sceneLine,
    finish: sceneLine.finish ?? input.finish,
    side: sceneLine.side ?? input.side,
    depth_type: sceneLine.depth_type ?? input.depth_type,
    drawer_variant: sceneLine.drawer_variant ?? input.drawer_variant,
    drawer_material: sceneLine.drawer_material ?? input.drawer_material,
    raster_variant: sceneLine.raster_variant ?? input.raster_variant,
    room: input.room ?? sceneLine.room,
    notes: input.notes ?? sceneLine.notes,
    product_code: input.product_code ?? sceneLine.product_code,
    mansard_cut: input.mansard_cut ?? sceneLine.mansard_cut,
  };
}

/** Keep Zustand scene aligned with estimate lines from table / CSV / 2D designer. */
export function useEstimateSceneSync(request: EstimateRequest) {
  const importFromEstimate = useSceneStore((s) => s.importFromEstimate);
  const lastPushedFingerprint = useSceneStore((s) => s.lastPushedFingerprint);
  const skipOnce = useRef(false);

  useEffect(() => {
    const fp = linesFingerprint(request.lines);
    const objectCount = useSceneStore.getState().scene.objects.length;
    if (request.lines.length === 0 && objectCount > 0) return;
    if (skipOnce.current) {
      skipOnce.current = false;
      return;
    }
    const scene = useSceneStore.getState().scene;
    const settingsChanged =
      scene.settings.finish !== request.finish ||
      scene.settings.system !== request.system ||
      scene.settings.measurement_basis !== request.measurement_basis ||
      scene.settings.measurement_unit !== request.measurement_unit;

    if (fp === lastPushedFingerprint && !settingsChanged) return;

    importFromEstimate(request);
  }, [
    request.lines,
    request.project_name,
    request.measurement_unit,
    request.measurement_basis,
    request.system,
    request.finish,
    request.margin_percent,
    importFromEstimate,
    lastPushedFingerprint,
  ]);
}

/** Call after scene pushed estimate to parent — prevents immediate re-import loop. */
export function markScenePushedToEstimate(lines: EstimateRequest["lines"]) {
  const fp = linesFingerprint(lines);
  useSceneStore.setState({ lastPushedFingerprint: fp });
}

export function pushSceneToEstimateRequest(
  request: EstimateRequest,
): EstimateRequest {
  const scene = useSceneStore.getState().scene;
  const fromScene = sceneToEstimate(scene);
  const lines = fromScene.lines.map((sceneLine) =>
    mergeLineMetadata(
      sceneLine,
      request.lines.find((l) => l.line_id === sceneLine.line_id),
    ),
  );
  const sceneIds = new Set(lines.map((l) => l.line_id));
  for (const input of request.lines) {
    if (!sceneIds.has(input.line_id)) lines.push(input);
  }
  return {
    ...fromScene,
    lines,
    project_name: request.project_name,
    measurement_unit: request.measurement_unit,
    measurement_basis: request.measurement_basis,
    system: request.system,
    finish: request.finish,
    margin_percent: request.margin_percent,
  };
}
