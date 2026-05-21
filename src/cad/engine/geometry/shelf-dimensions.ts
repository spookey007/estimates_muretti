import type { SceneObject } from "@/cad/types";
import { L_WALL1_LENGTH_MM } from "@/cad/engine/scene/l-closet-layout";

/** Return-wall shelves sit at the end of wall 1 (+X). */
export function isReturnWallShelf(object: SceneObject): boolean {
  if (object.type !== "shelf") return false;
  return object.position[0] >= L_WALL1_LENGTH_MM - 600;
}

/** SCENIKA shelf width L (mm) — along the wall run. */
export function shelfCatalogLMm(object: SceneObject): number {
  const { width, depth } = object.dimensions;
  return isReturnWallShelf(object) ? depth : width;
}

/** Closet depth into the room (510 / 414) — perpendicular to the wall. */
export function shelfIntoRoomMm(object: SceneObject): number {
  const { width, depth } = object.dimensions;
  return isReturnWallShelf(object) ? width : depth;
}

export function shelfDepthTypeFromIntoRoom(intoRoomMm: number): "414" | "510" {
  return intoRoomMm === 414 ? "414" : "510";
}

/** Map catalog L + into-room depth to scene box axes (no rotation). */
export function shelfDimensionsFromCatalog(
  catalogL: number,
  intoRoomMm: number,
  onReturnWall: boolean,
): { width: number; height: number; depth: number } {
  const height = 30;
  if (onReturnWall) {
    return { width: intoRoomMm, height, depth: catalogL };
  }
  return { width: catalogL, height, depth: intoRoomMm };
}
