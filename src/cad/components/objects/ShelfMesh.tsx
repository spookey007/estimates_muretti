"use client";

import type { SceneObject } from "@/cad/types";
import { MM_PER_UNIT } from "@/cad/types";
import { useSceneStore } from "@/cad/state/useSceneStore";

export function ShelfMesh({ object }: { object: SceneObject }) {
  const selected = useSceneStore((s) => s.selectedId === object.id);
  const { width, height, depth } = object.dimensions;
  const w = width * MM_PER_UNIT;
  const h = height * MM_PER_UNIT;
  const d = depth * MM_PER_UNIT;

  return (
    <mesh>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial
        color={selected ? "#f59e0b" : "#fbbf24"}
        roughness={0.7}
      />
    </mesh>
  );
}
