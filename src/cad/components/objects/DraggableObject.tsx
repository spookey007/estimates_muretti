"use client";

import { PartMesh } from "@/cad/components/objects/PartMesh";
import {
  positionFromWorldCenter,
  worldCenterFromObject,
} from "@/cad/engine/geometry/position";
import { MM_PER_UNIT } from "@/cad/types";
import { useSceneStore } from "@/cad/state/useSceneStore";
import type { SceneObject } from "@/cad/types";
import { TransformControls } from "@react-three/drei";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { Group } from "three";

const CLICK_DELAY_MS = 220;

export function DraggableObject({ object }: { object: SceneObject }) {
  const groupRef = useRef<Group>(null);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [gizmoTarget, setGizmoTarget] = useState<Group | null>(null);
  const draggingLocal = useRef(false);

  const selectedId = useSceneStore((s) => s.selectedId);
  const gizmoMode = useSceneStore((s) => s.gizmoMode);
  const setObjectPosition = useSceneStore((s) => s.setObjectPosition);
  const setObjectRotation = useSceneStore((s) => s.setObjectRotation);
  const setTransformDragging = useSceneStore((s) => s.setTransformDragging);
  const transformDragging = useSceneStore((s) => s.transformDragging);

  const selected = selectedId === object.id;
  const gizmoActive = selected && gizmoMode !== null;

  const centerM = worldCenterFromObject(object).map((v) => v * MM_PER_UNIT) as [
    number,
    number,
    number,
  ];
  const [rx, ry, rz] = object.rotation;

  const setGroupRef = useCallback((node: Group | null) => {
    groupRef.current = node;
    setGizmoTarget(node);
  }, []);

  useLayoutEffect(() => {
    if (!groupRef.current || draggingLocal.current || transformDragging) return;
    groupRef.current.position.set(centerM[0], centerM[1], centerM[2]);
    groupRef.current.rotation.set(rx, ry, rz);
    groupRef.current.updateMatrixWorld();
  }, [centerM[0], centerM[1], centerM[2], rx, ry, rz, transformDragging]);

  const commitFromGroup = useCallback(() => {
    if (!groupRef.current) return;
    const mode = useSceneStore.getState().gizmoMode;
    if (mode === "rotate") {
      const r = groupRef.current.rotation;
      setObjectRotation(object.id, [r.x, r.y, r.z]);
      return;
    }
    const p = groupRef.current.position;
    const centerMm: [number, number, number] = [
      p.x / MM_PER_UNIT,
      p.y / MM_PER_UNIT,
      p.z / MM_PER_UNIT,
    ];
    const next = positionFromWorldCenter(object.type, centerMm, object.dimensions);
    setObjectPosition(object.id, next);
  }, [object, setObjectPosition, setObjectRotation]);

  const handleClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      if (clickTimer.current) clearTimeout(clickTimer.current);
      clickTimer.current = setTimeout(() => {
        useSceneStore.getState().select(object.id);
        clickTimer.current = null;
      }, CLICK_DELAY_MS);
    },
    [object.id],
  );

  const handleDoubleClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      if (clickTimer.current) {
        clearTimeout(clickTimer.current);
        clickTimer.current = null;
      }
      useSceneStore.getState().enterPreferredGizmo(object.id);
    },
    [object.id],
  );

  const canMoveY = object.type === "shelf" || gizmoMode === "rotate";

  return (
    <>
      <group
        ref={setGroupRef}
        position={centerM}
        rotation={[rx, ry, rz]}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <PartMesh object={object} />
      </group>
      {gizmoActive && gizmoTarget && gizmoMode && (
        <TransformControls
          object={gizmoTarget}
          mode={gizmoMode}
          size={0.75}
          showY={canMoveY}
          onMouseDown={() => {
            draggingLocal.current = true;
            setTransformDragging(true);
          }}
          onMouseUp={() => {
            draggingLocal.current = false;
            setTransformDragging(false);
            commitFromGroup();
          }}
        />
      )}
    </>
  );
}
