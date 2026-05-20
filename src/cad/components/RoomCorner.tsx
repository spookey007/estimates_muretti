"use client";

import { ROOM_CORNER_MM } from "@/cad/engine/geometry/position";
import { MM_PER_UNIT } from "@/cad/types";

/** Marks the room origin (back-left floor corner) where new parts spawn. */
export function RoomCorner() {
  const o = ROOM_CORNER_MM.map((v) => v * MM_PER_UNIT) as [number, number, number];
  const len = 0.35;

  return (
    <group position={o}>
      <mesh position={[len / 2, 0.02, 0]}>
        <boxGeometry args={[len, 0.04, 0.04]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>
      <mesh position={[0, 0.02, len / 2]}>
        <boxGeometry args={[0.04, 0.04, len]} />
        <meshStandardMaterial color="#2563eb" />
      </mesh>
      <mesh position={[0, len / 2, 0]}>
        <boxGeometry args={[0.04, len, 0.04]} />
        <meshStandardMaterial color="#16a34a" />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}
