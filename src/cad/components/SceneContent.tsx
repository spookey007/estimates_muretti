"use client";

import { LShapeFloorOutline } from "@/cad/components/LShapeFloorOutline";
import { DraggableObject } from "@/cad/components/objects/DraggableObject";
import { RoomCorner } from "@/cad/components/RoomCorner";
import { lClosetSceneCenterMm } from "@/cad/engine/scene/l-closet-layout";
import { useSceneStore } from "@/cad/state/useSceneStore";
import { MM_PER_UNIT } from "@/cad/types";
import { Grid, OrbitControls } from "@react-three/drei";

export function SceneContent() {
  const objects = useSceneStore((s) => s.scene.objects);
  const templateId = useSceneStore((s) => s.scene.templateId);
  const cameraView = useSceneStore((s) => s.cameraView);
  const transformDragging = useSceneStore((s) => s.transformDragging);
  const gizmoMode = useSceneStore((s) => s.gizmoMode);

  const isLCloset =
    templateId?.startsWith("l-closet") ||
    objects.length >= 6;
  const [cx, cy, cz] = lClosetSceneCenterMm().map((v) => v * MM_PER_UNIT) as [
    number,
    number,
    number,
  ];
  const orbitTarget: [number, number, number] = isLCloset ? [cx, cy, cz] : [1.4, 1.1, 1.2];

  return (
    <>
      <color attach="background" args={["#e7e5e4"]} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[8, 14, 6]} intensity={1} castShadow={false} />
      <Grid
        infiniteGrid
        cellSize={0.5}
        sectionSize={2}
        fadeDistance={30}
        cellColor="#d6d3d1"
        sectionColor="#a8a29e"
        position={[0, 0, 0]}
      />
      <RoomCorner />
      {isLCloset && <LShapeFloorOutline />}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#fafaf9" />
      </mesh>
      {objects.map((o) => (
        <DraggableObject key={o.id} object={o} />
      ))}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.1}
        enabled={!transformDragging}
        target={orbitTarget}
        minDistance={2}
        maxDistance={35}
        maxPolarAngle={cameraView === "top" ? Math.PI / 2.2 : Math.PI / 2.05}
        minPolarAngle={0.15}
      />
    </>
  );
}
