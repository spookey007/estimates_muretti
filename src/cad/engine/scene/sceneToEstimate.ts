import type { Scene, SceneObject } from "@/cad/types";
import { DEFAULT_SCENE_SETTINGS } from "@/cad/types";
import type { EstimateLineInput, EstimateRequest } from "@/lib/types";

function sceneObjectToLine(obj: SceneObject, index: number): EstimateLineInput {
  const line_id = obj.pricing.lineId ?? `L${String(index + 1).padStart(2, "0")}`;
  const { width, height, depth } = obj.dimensions;
  const role = obj.pricing.role;

  const base: EstimateLineInput = {
    line_id,
    role,
    quantity: obj.pricing.quantity,
    finish: obj.pricing.finish,
    side: obj.pricing.side,
    depth_type: obj.pricing.depth_type,
    drawer_variant: obj.pricing.drawer_variant,
    drawer_material: obj.pricing.drawer_material,
    raster_variant: obj.pricing.raster_variant,
    notes: obj.pricing.notes,
    room: obj.pricing.room,
  };

  switch (role) {
    case "upright":
    case "corner_upright":
      return { ...base, h: height || 2187 };
    case "shelf":
    case "shoe_rack":
      return {
        ...base,
        l: width,
        depth_type: obj.pricing.depth_type ?? (depth >= 414 && depth < 510 ? "414" : "510"),
      };
    case "back_panel":
    case "mirror":
    case "linear_filler":
      return { ...base, h: height || 2187, l: width };
    case "footboard":
      return { ...base, l: width };
    case "hanging_drawer":
    case "hanging_drawer_simple":
    case "hanging_raster":
    case "clothes_tube":
      return {
        ...base,
        h: height || undefined,
        l: width || undefined,
        depth_type: obj.pricing.depth_type,
      };
    default:
      return {
        ...base,
        h: height || undefined,
        l: width || undefined,
        d: depth || undefined,
      };
  }
}

export function sceneToEstimate(scene: Scene): EstimateRequest {
  const settings = { ...DEFAULT_SCENE_SETTINGS, ...scene.settings };
  const lines = scene.objects.map((o, i) => sceneObjectToLine(o, i));

  return {
    schema_version: "1.0",
    project_name: scene.name,
    price_list_id: "scenika-2023-10",
    measurement_unit: settings.measurement_unit,
    measurement_basis: settings.measurement_basis,
    system: settings.system,
    finish: settings.finish,
    margin_percent: settings.margin_percent,
    currency_display: "EUR",
    lines,
  };
}
