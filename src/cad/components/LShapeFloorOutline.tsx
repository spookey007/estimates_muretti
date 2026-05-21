"use client";

import {
  L_RETURN_LENGTH_MM,
  L_WALL1_LENGTH_MM,
} from "@/cad/engine/scene/l-closet-layout";
import { MM_PER_UNIT } from "@/cad/types";

/** Floor plan guide — L footprint matching SCENIKA bays. */
export function LShapeFloorOutline() {
  const w1 = L_WALL1_LENGTH_MM * MM_PER_UNIT;
  const ret = L_RETURN_LENGTH_MM * MM_PER_UNIT;
  const t = 0.012;

  return (
    <group position={[0, 0.002, 0]}>
      <mesh position={[w1 / 2, 0, t / 2]}>
        <boxGeometry args={[w1, t, t]} />
        <meshStandardMaterial color="#78716c" />
      </mesh>
      <mesh position={[w1 - t / 2, 0, ret / 2]}>
        <boxGeometry args={[t, t, ret]} />
        <meshStandardMaterial color="#78716c" />
      </mesh>
    </group>
  );
}
