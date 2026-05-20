"use client";

import { SceneContent } from "@/cad/components/SceneContent";
import { useSceneStore } from "@/cad/state/useSceneStore";
import { Canvas } from "@react-three/fiber";
import { Component, type ErrorInfo, type ReactNode, Suspense } from "react";

type CanvasErrorBoundaryState = { error: Error | null };

class CanvasErrorBoundary extends Component<
  { children: ReactNode },
  CanvasErrorBoundaryState
> {
  state: CanvasErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[CAD Canvas]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-900">3D view failed to load</p>
          <p className="max-w-md text-xs text-red-700">{this.state.error.message}</p>
          <button
            type="button"
            className="mt-2 rounded-lg bg-red-800 px-3 py-1.5 text-xs text-white"
            onClick={() => this.setState({ error: null })}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function CanvasScene() {
  const cameraView = useSceneStore((s) => s.cameraView);

  return (
    <Canvas
      camera={{
        position: cameraView === "top" ? [3, 6, 3] : [4, 3.5, 5],
        fov: 50,
        near: 0.1,
        far: 200,
      }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      dpr={[1, 2]}
      style={{ width: "100%", height: "100%" }}
    >
      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>
    </Canvas>
  );
}

export function CADCanvas() {
  return (
    <div className="relative h-[min(520px,60vh)] w-full min-h-[320px] overflow-hidden rounded-lg border border-stone-200 bg-stone-200">
      <CanvasErrorBoundary>
        <CanvasScene />
      </CanvasErrorBoundary>
    </div>
  );
}
