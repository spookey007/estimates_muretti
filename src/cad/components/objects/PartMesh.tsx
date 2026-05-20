"use client";

import type { SceneObject } from "@/cad/types";
import { MM_PER_UNIT } from "@/cad/types";
import { ROLE_COLORS } from "@/lib/closet-schematic";
import { useSceneStore } from "@/cad/state/useSceneStore";

export function PartMesh({ object }: { object: SceneObject }) {
  const selected = useSceneStore((s) => s.selectedId === object.id);
  const { width, height, depth } = object.dimensions;
  const w = width * MM_PER_UNIT;
  const h = height * MM_PER_UNIT;
  const d = depth * MM_PER_UNIT;

  const role = object.pricing.role;
  const base =
    ROLE_COLORS[role] ??
    (object.type === "shelf"
      ? "#f59e0b"
      : object.type === "back_panel"
        ? "#d6d3d1"
        : "#57534e");

  return (
    <mesh>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial
        color={selected ? "#d97706" : base}
        metalness={object.type === "upright" || object.type === "corner_upright" ? 0.4 : 0.15}
        roughness={object.type === "back_panel" ? 0.85 : 0.5}
        transparent={object.type === "back_panel"}
        opacity={object.type === "back_panel" ? 0.92 : 1}
      />
    </mesh>
  );
}
