import type { SceneObjectType, Vec3 } from "@/cad/types";

const QUARTER_TURN = Math.PI / 2;

/** Snap Y rotation to 90° steps — closet parts align to walls. */
export function snapRotation(type: SceneObjectType, rotation: Vec3): Vec3 {
  const y = Math.round(rotation[1] / QUARTER_TURN) * QUARTER_TURN;
  if (type === "upright" || type === "corner_upright") {
    return [0, y, 0];
  }
  if (type === "shelf") {
    return [0, y, 0];
  }
  return [rotation[0], y, rotation[2]];
}

export function rotationDegreesY(rotation: Vec3): number {
  return Math.round((rotation[1] * 180) / Math.PI);
}
