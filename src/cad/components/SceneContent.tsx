"use client";

import { DraggableObject } from "@/cad/components/objects/DraggableObject";
import { RoomCorner } from "@/cad/components/RoomCorner";
import { useSceneStore } from "@/cad/state/useSceneStore";
import { Grid, OrbitControls } from "@react-three/drei";

export function SceneContent() {
  const objects = useSceneStore((s) => s.scene.objects);
  const cameraView = useSceneStore((s) => s.cameraView);
  const transformDragging = useSceneStore((s) => s.transformDragging);
  const gizmoMode = useSceneStore((s) => s.gizmoMode);

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
        target={[1.4, 1.1, 1.2]}
        minDistance={2}
        maxDistance={35}
        maxPolarAngle={cameraView === "top" ? Math.PI / 2.2 : Math.PI / 2.05}
        minPolarAngle={0.15}
      />
    </>
  );
}
