import type { SceneObject } from "@/cad/types";
import { L_WALL1_LENGTH_MM } from "@/cad/engine/scene/l-closet-layout";

const PANEL_THICKNESS_MM = 18;

/** Catalog panel width (L) — the long edge, not 18 mm thickness. */
export function panelCatalogLengthMm(dimensions: {
  width: number;
  depth: number;
}): number {
  return Math.max(dimensions.width, dimensions.depth);
}

export function panelThicknessMm(dimensions: {
  width: number;
  depth: number;
}): number {
  return Math.min(dimensions.width, dimensions.depth);
}

/** Return-wall panels run along +Z at the end of wall 1. */
export function isReturnWallPanel(object: SceneObject): boolean {
  const ry = Math.abs((object.rotation[1] ?? 0) % Math.PI);
  if (ry > 0.1) return true;
  return object.position[0] >= L_WALL1_LENGTH_MM - 1;
}

export function panelDimensionsFromCatalog(
  catalogL: number,
  height: number,
  onReturnWall: boolean,
): { width: number; height: number; depth: number } {
  if (onReturnWall) {
    return { width: catalogL, height, depth: PANEL_THICKNESS_MM };
  }
  return { width: catalogL, height, depth: PANEL_THICKNESS_MM };
}

export function panelRotationForWall(onReturnWall: boolean): [number, number, number] {
  return onReturnWall ? [0, Math.PI / 2, 0] : [0, 0, 0];
}
