"use client";

import { useSceneStore } from "@/cad/state/useSceneStore";

export function CADInteractionHelp() {
  const gizmoMode = useSceneStore((s) => s.gizmoMode);
  const preferredGizmoMode = useSceneStore((s) => s.preferredGizmoMode);
  const selectedId = useSceneStore((s) => s.selectedId);

  return (
    <div className="pointer-events-none absolute bottom-3 left-3 right-3 max-w-md rounded-lg border border-stone-200/90 bg-white/90 px-3 py-2 text-[10px] leading-relaxed text-stone-600 shadow-sm backdrop-blur-sm sm:right-auto">
      <p className="font-semibold text-stone-800">3D controls</p>
      <ul className="mt-1 list-inside list-disc space-y-0.5">
        <li>
          <strong>Click</strong> part → inspector (stays selected while you orbit)
        </li>
        <li>
          <strong>Double-click</strong> →{" "}
          {preferredGizmoMode === "rotate" ? "rotate" : "move"} gizmo
        </li>
        <li>
          Pick <strong>Move</strong> or <strong>Rotate</strong> first — double-click uses
          that mode
        </li>
        <li>
          <kbd className="rounded bg-stone-100 px-1">M</kbd> /{" "}
          <kbd className="rounded bg-stone-100 px-1">R</kbd> ·{" "}
          <kbd className="rounded bg-stone-100 px-1">Esc</kbd> exit gizmo ·{" "}
          <kbd className="rounded bg-stone-100 px-1">Esc</kbd> again clear selection
        </li>
        <li>Table, cards, and 2D layout stay synced with this scene</li>
      </ul>
      {selectedId && !gizmoMode && (
        <p className="mt-1.5 text-amber-800">
          Tip: orbit the view freely — selection is kept until you clear it or pick
          another part.
        </p>
      )}
      {gizmoMode === "rotate" && (
        <p className="mt-1.5 text-amber-800">Drag rotation rings — Y snaps to 90°.</p>
      )}
    </div>
  );
}
