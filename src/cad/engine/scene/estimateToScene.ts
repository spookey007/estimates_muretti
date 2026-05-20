import type { Scene, SceneObject, SceneObjectType, Vec3 } from "@/cad/types";
import { DEFAULT_SCENE_SETTINGS } from "@/cad/types";
import type { EstimateLineInput, EstimateRequest, LineRole } from "@/lib/types";

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

function isReturnWall(room?: string): boolean {
  return (room ?? "").toLowerCase().includes("return") || (room ?? "").includes("Wall 2");
}

function lineToSceneObject(
  line: EstimateLineInput,
  layout: {
    wallUprightX: number;
    wallBayIndex: number;
    returnPanelZ: number;
    returnShelfIndex: number;
    wallShelfRow: number;
  },
): SceneObject {
  const h = line.h ?? 2187;
  const panelW = line.l ?? 900;
  const depth = line.depth_type === "414" ? 414 : 510;
  const meshType = roleToMeshType(line.role);
  const onReturn = isReturnWall(line.room);

  let position: Vec3 = [0, 0, 0];
  let rotation: Vec3 = [0, 0, 0];
  let dimensions = { width: 50, height: h, depth };

  switch (line.role) {
    case "upright": {
      position = [layout.wallUprightX, 0, 0];
      dimensions = { width: 50, height: h, depth: 510 };
      layout.wallUprightX += 900 * Math.max(1, line.quantity ?? 1);
      break;
    }
    case "corner_upright": {
      position = line.side === "sx" ? [2680, 0, 480] : [2680, 0, 0];
      dimensions = { width: 50, height: h, depth: 510 };
      break;
    }
    case "back_panel":
    case "mirror":
    case "linear_filler": {
      if (onReturn) {
        const pw = panelW;
        position = [2720, 0, layout.returnPanelZ];
        rotation = [0, Math.PI / 2, 0];
        dimensions = {
          width: pw,
          height: line.role === "mirror" ? h : h,
          depth: line.role === "mirror" ? 20 : 18,
        };
        layout.returnPanelZ += pw + 40;
      } else {
        const bay = layout.wallBayIndex;
        position = [bay * 900 + 25, 0, 8];
        dimensions = { width: panelW, height: h, depth: 18 };
        layout.wallBayIndex += 1;
      }
      break;
    }
    case "footboard": {
      position = [0, 0, 520];
      dimensions = { width: panelW, height: 80, depth: 510 };
      break;
    }
    case "shelf":
    case "shoe_rack": {
      const shelfW = Math.min(panelW, 903);
      const row = onReturn ? layout.returnShelfIndex++ : layout.wallShelfRow++;
      const y = 550 + (row % 3) * 520;
      if (onReturn) {
        const z = 400 + row * 220;
        position = [2400, y, z];
        rotation = [0, Math.PI / 2, 0];
        dimensions = { width: shelfW, height: 30, depth: 510 };
      } else {
        const bay = Math.floor(row / 2) % 3;
        position = [bay * 900 + 50, y, 255];
        dimensions = { width: shelfW, height: 30, depth: 510 };
      }
      break;
    }
    default: {
      position = [layout.wallUprightX, 400, 255];
      dimensions = { width: panelW, height: h, depth: 510 };
    }
  }

  return {
    id: `line-${line.line_id}`,
    type: meshType,
    position,
    rotation,
    dimensions,
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

export function estimateToScene(request: EstimateRequest): Scene {
  const layout = {
    wallUprightX: 0,
    wallBayIndex: 0,
    returnPanelZ: 0,
    returnShelfIndex: 0,
    wallShelfRow: 0,
  };

  const objects = request.lines.map((line) => lineToSceneObject(line, layout));

  return {
    id: "imported",
    name: request.project_name || "Imported estimate",
    templateId: request.lines.length > 10 ? "l-closet-scenika" : undefined,
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
