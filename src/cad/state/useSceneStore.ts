"use client";

import { estimateToScene } from "@/cad/engine/scene/estimateToScene";
import { sceneToEstimate } from "@/cad/engine/scene/sceneToEstimate";
import { linesFingerprint } from "@/cad/hooks/use-estimate-scene-sync";
import { spawnPositionAtCorner } from "@/cad/engine/geometry/position";
import {
  applyDimensionSnaps,
  applySnapToObject,
} from "@/cad/engine/snapping/snap";
import { constrainPosition } from "@/cad/engine/geometry/position";
import { snapRotation } from "@/cad/engine/geometry/rotation";
import {
  loadPreset,
  type LegacyPresetId,
  type PresetId,
} from "@/cad/presets";
import { createLClosetPanelsOnlyRequest } from "@/cad/presets/l-closet-panels-only";
import { createLClosetScenikaRequest } from "@/cad/presets/l-closet-scenika";
import type { Scene, SceneObject, SceneObjectType, SceneSettings, Vec3 } from "@/cad/types";
import { DEFAULT_SCENE_SETTINGS } from "@/cad/types";
import { nextLineId } from "@/lib/blank-estimate";
import type { EstimateRequest } from "@/lib/types";
import { create } from "zustand";

function newObjectId(type: string) {
  return `${type}-${Date.now().toString(36)}`;
}

export type GizmoMode = "translate" | "rotate";

type SceneStore = {
  scene: Scene;
  selectedId?: string;
  gizmoMode: GizmoMode | null;
  preferredGizmoMode: GizmoMode;
  lastPushedFingerprint: string;
  cameraView: "top" | "perspective";
  transformDragging: boolean;

  select: (id?: string) => void;
  clearSelection: () => void;
  enterMoveMode: (id: string) => void;
  enterRotateMode: (id: string) => void;
  enterPreferredGizmo: (id: string) => void;
  setGizmoMode: (mode: GizmoMode | null) => void;
  importFromEstimate: (request: EstimateRequest) => void;
  setTransformDragging: (v: boolean) => void;
  setCameraView: (v: "top" | "perspective") => void;
  loadPreset: (id: PresetId | LegacyPresetId) => void;
  updateSettings: (patch: Partial<SceneSettings>) => void;
  setSceneName: (name: string) => void;

  addObject: (type: SceneObjectType) => void;
  updateObject: (id: string, patch: Partial<SceneObject>) => void;
  setObjectPosition: (id: string, position: Vec3) => void;
  setObjectRotation: (id: string, rotation: Vec3) => void;
  removeObject: (id: string) => void;

  toEstimateRequest: () => EstimateRequest;
};

function defaultObject(type: SceneObjectType, position: Vec3): SceneObject {
  const base = {
    id: newObjectId(type),
    type,
    position: constrainPosition(type, position),
    rotation: [0, 0, 0] as Vec3,
    constraints: {},
    pricing: {
      role: type === "corner_upright" ? ("corner_upright" as const) : type,
      quantity: 1,
      notes:
        type === "upright"
          ? "A Montante"
          : type === "shelf"
            ? "F Ripiano"
            : undefined,
      depth_type: type === "shelf" ? ("510" as const) : undefined,
    },
  };

  if (type === "upright" || type === "corner_upright") {
    return applyDimensionSnaps({
      ...base,
      type,
      dimensions: { width: 50, height: 2187, depth: 510 },
      pricing: { ...base.pricing, role: type },
    });
  }

  if (type === "shelf") {
    return applyDimensionSnaps({
      ...base,
      type: "shelf",
      dimensions: { width: 803, height: 30, depth: 510 },
      pricing: { ...base.pricing, role: "shelf", depth_type: "510" },
    });
  }

  if (type === "back_panel") {
    return applyDimensionSnaps({
      ...base,
      type: "back_panel",
      dimensions: { width: 900, height: 2187, depth: 18 },
      pricing: { ...base.pricing, role: "back_panel", notes: "C Schienale" },
    });
  }

  if (type === "footboard") {
    return {
      ...base,
      type: "footboard",
      dimensions: { width: 1500, height: 80, depth: 510 },
      pricing: { ...base.pricing, role: "footboard", notes: "G Pedana" },
    };
  }

  return applyDimensionSnaps({
    ...base,
    dimensions: { width: 640, height: 2187, depth: 510 },
  });
}

export const useSceneStore = create<SceneStore>((set, get) => ({
  scene: loadPreset("empty"),
  selectedId: undefined,
  gizmoMode: null,
  preferredGizmoMode: "translate",
  lastPushedFingerprint: "",
  cameraView: "perspective",
  transformDragging: false,

  select: (id) =>
    set((s) => {
      if (id === undefined) {
        return {
          selectedId: undefined,
          gizmoMode: null,
          transformDragging: false,
        };
      }
      if (id === s.selectedId) {
        return { selectedId: id };
      }
      return {
        selectedId: id,
        gizmoMode: null,
        transformDragging: false,
      };
    }),

  clearSelection: () =>
    set({
      selectedId: undefined,
      gizmoMode: null,
      transformDragging: false,
    }),

  enterMoveMode: (id) =>
    set({
      selectedId: id,
      gizmoMode: "translate",
      preferredGizmoMode: "translate",
    }),

  enterRotateMode: (id) =>
    set({
      selectedId: id,
      gizmoMode: "rotate",
      preferredGizmoMode: "rotate",
    }),

  enterPreferredGizmo: (id) => {
    const { preferredGizmoMode } = get();
    if (preferredGizmoMode === "rotate") {
      get().enterRotateMode(id);
    } else {
      get().enterMoveMode(id);
    }
  },

  setGizmoMode: (gizmoMode) => set({ gizmoMode }),

  importFromEstimate: (request) =>
    set({
      scene: estimateToScene(request, {
        showComponents: request.lines.length > 10,
      }),
      selectedId: undefined,
      gizmoMode: null,
      transformDragging: false,
      lastPushedFingerprint: linesFingerprint(request.lines),
    }),

  setTransformDragging: (transformDragging) => set({ transformDragging }),

  setCameraView: (cameraView) => set({ cameraView }),

  loadPreset: (id) => {
    const scene = loadPreset(id);
    const request =
      id === "l-closet-standard" ||
      id === "l-closet-with-components" ||
      id === "l-closet-scenika"
        ? createLClosetScenikaRequest()
        : id === "l-closet-panels-only"
          ? createLClosetPanelsOnlyRequest()
          : sceneToEstimate(scene);
    set({
      scene,
      selectedId: undefined,
      gizmoMode: null,
      transformDragging: false,
      lastPushedFingerprint: linesFingerprint(request.lines),
    });
  },

  updateSettings: (patch) =>
    set((s) => ({
      scene: {
        ...s.scene,
        settings: { ...s.scene.settings, ...patch },
      },
    })),

  setSceneName: (name) =>
    set((s) => ({
      scene: { ...s.scene, name },
    })),

  addObject: (type) => {
    const { scene } = get();
    const position = spawnPositionAtCorner(type, scene.objects.length);
    const obj = defaultObject(type, position);
    const existingLines = sceneToEstimate(scene).lines;
    const line_id = nextLineId(existingLines);
    const withLine: SceneObject = {
      ...obj,
      pricing: { ...obj.pricing, lineId: line_id },
    };
    set({
      scene: {
        ...scene,
        objects: [...scene.objects, withLine],
      },
      selectedId: withLine.id,
    });
  },

  updateObject: (id, patch) =>
    set((s) => ({
      scene: {
        ...s.scene,
        objects: s.scene.objects.map((o) => {
          if (o.id !== id) return o;
          const merged = {
            ...o,
            ...patch,
            dimensions: { ...o.dimensions, ...patch.dimensions },
            pricing: { ...o.pricing, ...patch.pricing },
            position: patch.position ?? o.position,
          };
          const positioned = patch.position
            ? {
                ...merged,
                position: constrainPosition(merged.type, merged.position),
              }
            : merged;
          return patch.dimensions ? applyDimensionSnaps(positioned) : positioned;
        }),
      },
    })),

  setObjectPosition: (id, position) => {
    const obj = get().scene.objects.find((o) => o.id === id);
    if (!obj) return;
    get().updateObject(id, {
      position: constrainPosition(obj.type, position),
    });
  },

  setObjectRotation: (id, rotation) => {
    const obj = get().scene.objects.find((o) => o.id === id);
    if (!obj) return;
    get().updateObject(id, {
      rotation: snapRotation(obj.type, rotation),
    });
  },

  removeObject: (id) =>
    set((s) => ({
      scene: {
        ...s.scene,
        objects: s.scene.objects.filter((o) => o.id !== id),
      },
      selectedId: s.selectedId === id ? undefined : s.selectedId,
      gizmoMode: s.selectedId === id ? null : s.gizmoMode,
      transformDragging: false,
    })),

  toEstimateRequest: () => sceneToEstimate(get().scene),
}));
