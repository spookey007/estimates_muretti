import type { SceneObject, SceneObjectType } from "@/cad/types";
import { constrainPosition } from "@/cad/engine/geometry/position";
import {
  shelfDepthTypeFromIntoRoom,
  shelfIntoRoomMm,
} from "@/cad/engine/geometry/shelf-dimensions";
import {
  SHELF_WIDTHS,
  UPRIGHT_HEIGHTS,
} from "@/lib/dimension-limits";

export { SHELF_WIDTHS, UPRIGHT_HEIGHTS };

export function snapShelfWidth(width: number): number {
  for (const w of SHELF_WIDTHS) {
    if (width <= w) return w;
  }
  return SHELF_WIDTHS[SHELF_WIDTHS.length - 1];
}

export function snapUprightHeight(height: number): number {
  for (const h of UPRIGHT_HEIGHTS) {
    if (height <= h) return h;
  }
  return UPRIGHT_HEIGHTS[UPRIGHT_HEIGHTS.length - 1];
}

/** Preserve custom mm; pricing engine snaps for catalog + cuts. */
export function snapDimensions(
  type: SceneObjectType,
  dims: { width: number; height: number; depth: number },
): { width: number; height: number; depth: number } {
  if (type === "upright" || type === "corner_upright") {
    return {
      width: dims.width || 50,
      height: dims.height || 2187,
      depth: dims.depth || 510,
    };
  }
  if (type === "shelf") {
    return {
      width: dims.width || 803,
      height: 30,
      depth: dims.depth === 414 ? 414 : 510,
    };
  }
  return dims;
}

export function applyDimensionSnaps(obj: SceneObject): SceneObject {
  const dimensions = snapDimensions(obj.type, obj.dimensions);
  const intoRoom =
    obj.type === "shelf" ? shelfIntoRoomMm({ ...obj, dimensions }) : 510;
  return {
    ...obj,
    dimensions,
    pricing: {
      ...obj.pricing,
      depth_type:
        obj.type === "shelf"
          ? shelfDepthTypeFromIntoRoom(intoRoom)
          : obj.pricing.depth_type,
    },
  };
}

export function applySnapToObject(obj: SceneObject): SceneObject {
  return applyDimensionSnaps({
    ...obj,
    position: constrainPosition(obj.type, obj.position),
  });
}
