import type { Scene, SceneObject, SceneObjectType, Vec3 } from "@/cad/types";
import { DEFAULT_SCENE_SETTINGS } from "@/cad/types";
import type { EstimateLineInput, EstimateRequest, LineRole } from "@/lib/types";
import {
  isLClosetEstimate,
  layoutLClosetLines,
} from "@/cad/engine/scene/l-closet-layout";

function roleToMeshType(role: LineRole): SceneObjectType {
  switch (role) {
    case "upright":
      return "upright";
    case "corner_upright":
      return "corner_upright";
    case "back_panel":
    case "mirror":
    case "linear_filler":
      return "back_panel";
    case "footboard":
      return "footboard";
    case "shelf":
    case "shoe_rack":
    default:
      return "shelf";
  }
}

function lineToSceneObject(line: EstimateLineInput, index: number): SceneObject {
  const h = line.h ?? 2187;
  const panelW = line.l ?? 900;
  const depth = line.depth_type === "414" ? 414 : 510;
  const meshType = roleToMeshType(line.role);
  const stagger = index * 40;

  return {
    id: `line-${line.line_id}`,
    type: meshType,
    position: [stagger, 0, stagger] as Vec3,
    rotation: [0, 0, 0],
    dimensions: {
      width: meshType === "upright" || meshType === "corner_upright" ? 50 : panelW,
      height: h,
      depth: meshType === "back_panel" ? 18 : depth,
    },
    constraints: {},
    pricing: {
      role: line.role,
      lineId: line.line_id,
      quantity: line.quantity ?? 1,
      finish: line.finish,
      side: line.side,
      depth_type: line.depth_type,
      drawer_variant: line.drawer_variant,
      drawer_material: line.drawer_material,
      raster_variant: line.raster_variant,
      notes: line.notes,
      room: line.room,
    },
  };
}

export function estimateToScene(
  request: EstimateRequest,
  options?: { showComponents?: boolean },
): Scene {
  const useLLayout = isLClosetEstimate(request.lines);
  const showComponents =
    options?.showComponents ?? (useLLayout && request.lines.length > 10);
  const objects = useLLayout
    ? layoutLClosetLines(request.lines, { showComponents })
    : request.lines.map((line, i) => lineToSceneObject(line, i));

  const templateId = useLLayout
    ? showComponents
      ? "l-closet-standard"
      : "l-closet-panels-only"
    : undefined;

  return {
    id: "imported",
    name: request.project_name || "Imported estimate",
    templateId,
    settings: {
      measurement_unit: request.measurement_unit ?? DEFAULT_SCENE_SETTINGS.measurement_unit,
      measurement_basis: request.measurement_basis ?? DEFAULT_SCENE_SETTINGS.measurement_basis,
      system: request.system ?? DEFAULT_SCENE_SETTINGS.system,
      finish: request.finish ?? DEFAULT_SCENE_SETTINGS.finish,
      margin_percent: request.margin_percent,
    },
    objects,
  };
}
