"use client";

import { rotationDegreesY } from "@/cad/engine/geometry/rotation";
import { useSceneStore } from "@/cad/state/useSceneStore";

export function CADTransformToolbar() {
  const selectedId = useSceneStore((s) => s.selectedId);
  const gizmoMode = useSceneStore((s) => s.gizmoMode);
  const object = useSceneStore((s) =>
    s.scene.objects.find((o) => o.id === s.selectedId),
  );
  const enterMoveMode = useSceneStore((s) => s.enterMoveMode);
  const enterRotateMode = useSceneStore((s) => s.enterRotateMode);
  const setGizmoMode = useSceneStore((s) => s.setGizmoMode);
  const preferredGizmoMode = useSceneStore((s) => s.preferredGizmoMode);

  if (!selectedId || !object) return null;

  const rotY = rotationDegreesY(object.rotation);

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-stone-200 bg-white/95 px-2 py-1.5 shadow-sm backdrop-blur-sm">
      <span className="mr-1 max-w-[120px] truncate text-[10px] font-medium text-stone-600">
        {object.type}
      </span>
      <button
        type="button"
        title="Move (M) — double-click uses this mode"
        onClick={() => enterMoveMode(selectedId)}
        className={`rounded-md px-2.5 py-1 text-xs font-medium ${
          gizmoMode === "translate"
            ? "bg-amber-600 text-white"
            : "bg-stone-100 text-stone-800 hover:bg-stone-200"
        }`}
      >
        Move
      </button>
      <button
        type="button"
        title="Rotate (R) — double-click uses this mode · 90° snap"
        onClick={() => enterRotateMode(selectedId)}
        className={`rounded-md px-2.5 py-1 text-xs font-medium ${
          gizmoMode === "rotate"
            ? "bg-amber-600 text-white"
            : "bg-stone-100 text-stone-800 hover:bg-stone-200"
        }`}
      >
        Rotate
      </button>
      {gizmoMode && (
        <button
          type="button"
          title="Done (Esc)"
          onClick={() => setGizmoMode(null)}
          className="rounded-md border border-stone-200 px-2 py-1 text-xs text-stone-600 hover:bg-stone-50"
        >
          Done
        </button>
      )}
      <span className="ml-auto text-[10px] text-stone-500">
        Dbl-click: {preferredGizmoMode === "rotate" ? "Rotate" : "Move"} · {rotY}° Y
      </span>
    </div>
  );
}
