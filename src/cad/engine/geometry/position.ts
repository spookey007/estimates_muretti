import type { SceneObject, SceneObjectType, Vec3 } from "@/cad/types";

/** Back-left floor corner of the room (mm). New parts spawn here. */
export const ROOM_CORNER_MM: Vec3 = [0, 0, 0];

/** Small offset so multiple new parts at the corner remain visible before you drag them. */
export function spawnPositionAtCorner(
  type: SceneObjectType,
  existingCount: number,
): Vec3 {
  const [ox, oy, oz] = ROOM_CORNER_MM;
  const stagger = existingCount * 70;
  if (type === "upright" || type === "corner_upright") {
    return [ox + stagger, oy, oz + stagger];
  }
  if (type === "shelf") {
    return [ox + 100 + stagger, oy + 1200, oz + 255 + stagger];
  }
  return [ox + stagger, oy, oz + stagger];
}

export function worldCenterFromObject(obj: SceneObject): Vec3 {
  const { width, height, depth } = obj.dimensions;
  const [x, y, z] = obj.position;
  return [x + width / 2, y + height / 2, z + depth / 2];
}

export function positionFromWorldCenter(
  type: SceneObjectType,
  centerMm: Vec3,
  dimensions: { width: number; height: number; depth: number },
): Vec3 {
  const { width, height, depth } = dimensions;
  let x = centerMm[0] - width / 2;
  let y = centerMm[1] - height / 2;
  let z = centerMm[2] - depth / 2;
  return constrainPosition(type, [x, y, z]);
}

/** Free placement while designing — no grid snap; floor + room bounds only. */
export function constrainPosition(type: SceneObjectType, pos: Vec3): Vec3 {
  const [x, y, z] = pos;
  const minX = 0;
  const minZ = 0;

  if (type === "upright" || type === "corner_upright") {
    return [Math.max(minX, x), 0, Math.max(minZ, z)];
  }

  if (type === "shelf") {
    return [Math.max(minX, x), Math.max(0, y), Math.max(minZ, z)];
  }

  return [Math.max(minX, x), Math.max(0, y), Math.max(minZ, z)];
}
