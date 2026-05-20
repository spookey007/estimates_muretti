"use client";

import { useSceneStore } from "@/cad/state/useSceneStore";
import { useEffect } from "react";

/** M = move, R = rotate, Esc = exit gizmo then clear selection. */
export function useCadKeyboard(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "SELECT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const {
        selectedId,
        gizmoMode,
        enterMoveMode,
        enterRotateMode,
        setGizmoMode,
        clearSelection,
      } = useSceneStore.getState();

      if (e.key === "Escape") {
        if (gizmoMode) {
          setGizmoMode(null);
        } else if (selectedId) {
          clearSelection();
        }
        return;
      }

      if (!selectedId) return;

      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        enterMoveMode(selectedId);
        return;
      }
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        enterRotateMode(selectedId);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}
