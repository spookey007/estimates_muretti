"use client";

import { CADCanvas } from "@/cad/components/CADCanvas";
import { CADInteractionHelp } from "@/cad/components/CADInteractionHelp";
import { CADTransformToolbar } from "@/cad/components/CADTransformToolbar";
import { ObjectInspector } from "@/cad/components/ObjectInspector";
import {
  markScenePushedToEstimate,
  pushSceneToEstimateRequest,
} from "@/cad/hooks/use-estimate-scene-sync";
import { useCadKeyboard } from "@/cad/hooks/use-cad-keyboard";
import { useSceneStore } from "@/cad/state/useSceneStore";
import type { PresetId } from "@/cad/presets";
import { mergeRows } from "@/components/estimate/line-shared";
import type { EstimateRequest, EstimateResponse } from "@/lib/types";
import { useEffect, useMemo, useRef } from "react";

export function CADEditor({
  request,
  result,
  onRequestChange,
}: {
  request: EstimateRequest;
  result: EstimateResponse;
  onRequestChange: (next: EstimateRequest) => void;
}) {
  const scene = useSceneStore((s) => s.scene);
  const loadPreset = useSceneStore((s) => s.loadPreset);
  const addObject = useSceneStore((s) => s.addObject);
  const setCameraView = useSceneStore((s) => s.setCameraView);
  const cameraView = useSceneStore((s) => s.cameraView);
  const selectedId = useSceneStore((s) => s.selectedId);
  const clearSelection = useSceneStore((s) => s.clearSelection);

  useCadKeyboard(true);

  const initDone = useRef(false);
  const onRequestChangeRef = useRef(onRequestChange);
  onRequestChangeRef.current = onRequestChange;

  const sceneObjectsKey = useMemo(
    () =>
      JSON.stringify(
        scene.objects.map((o) => ({
          id: o.id,
          t: o.type,
          p: o.position,
          r: o.rotation,
          d: o.dimensions,
          pr: o.pricing,
        })),
      ),
    [scene.objects],
  );

  const settingsKey = JSON.stringify(scene.settings);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    if (request.lines.length === 0 && scene.objects.length === 0) {
      loadPreset("l-closet-scenika");
      const merged = pushSceneToEstimateRequest(request);
      markScenePushedToEstimate(merged.lines);
      onRequestChangeRef.current(merged);
    }
  }, [request, scene.objects.length, loadPreset]);

  useEffect(() => {
    if (scene.objects.length === 0 && request.lines.length > 0) {
      return;
    }

    const merged = pushSceneToEstimateRequest(request);
    markScenePushedToEstimate(merged.lines);
    onRequestChangeRef.current(merged);
  }, [
    sceneObjectsKey,
    settingsKey,
    request.project_name,
    request.measurement_unit,
    request.measurement_basis,
    request.system,
    request.finish,
    request.margin_percent,
  ]);

  const rows = useMemo(() => mergeRows(request, result), [request, result]);
  const selectedRow = rows.find((r) => {
    const obj = scene.objects.find((o) => o.id === selectedId);
    return obj?.pricing.lineId === r.line_id;
  });

  const handleLoadPreset = (id: PresetId) => {
    loadPreset(id);
    const merged = pushSceneToEstimateRequest(request);
    markScenePushedToEstimate(merged.lines);
    onRequestChangeRef.current(merged);
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-gradient-to-b from-stone-50 to-white shadow-sm">
      <div className="border-b border-stone-200 px-4 py-3 sm:px-5">
        <h3 className="text-base font-semibold text-stone-900">3D closet CAD</h3>
        <p className="mt-1 text-xs text-stone-600">
          L-shaped SCENIKA sample loads by default. Click to inspect · double-click to
          move/rotate (uses Move/Rotate mode) · scroll to orbit without losing
          selection.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-stone-100 px-3 py-2">
        <button
          type="button"
          onClick={() => addObject("upright")}
          className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium hover:border-amber-400"
        >
          + Upright (A)
        </button>
        <button
          type="button"
          onClick={() => addObject("shelf")}
          className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium hover:border-amber-400"
        >
          + Shelf (F)
        </button>
        <button
          type="button"
          onClick={() => addObject("back_panel")}
          className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium hover:border-amber-400"
        >
          + Panel (C)
        </button>
        <select
          className="rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs"
          defaultValue=""
          onChange={(e) => {
            const v = e.target.value as PresetId | "";
            if (v) {
              handleLoadPreset(v);
              e.target.value = "";
            }
          }}
        >
          <option value="">Load preset…</option>
          <option value="l-closet-scenika">L-closet SCENIKA sample</option>
          <option value="starter-run">Starter: 2 uprights + shelf</option>
          <option value="empty">Empty scene</option>
        </select>
        <button
          type="button"
          onClick={() => setCameraView(cameraView === "top" ? "perspective" : "top")}
          className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium"
        >
          {cameraView === "top" ? "Perspective" : "Top view"}
        </button>
        {selectedId && (
          <button
            type="button"
            onClick={() => clearSelection()}
            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-600"
          >
            Clear selection
          </button>
        )}
        <span className="ml-auto text-xs text-stone-500">
          {scene.objects.length} parts · {request.lines.length} priced lines
        </span>
      </div>

      <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1fr_260px]">
        <div className="space-y-2 p-3 sm:p-4">
          <CADTransformToolbar />
          <div className="relative">
            <CADCanvas />
            <CADInteractionHelp />
          </div>
        </div>
        <aside className="border-t border-stone-200 p-4 lg:border-t-0 lg:border-l">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Inspector
          </p>
          <ObjectInspector row={selectedRow} projectFinish={request.finish} />
        </aside>
      </div>
    </div>
  );
}
