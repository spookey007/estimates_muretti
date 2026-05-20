import type {
  DrawerMaterial,
  DrawerVariant,
  EstimateLineInput,
  EstimateRequest,
  Finish,
  LineRole,
  MeasurementBasis,
  MeasurementUnit,
  RasterVariant,
  System,
} from "@/lib/types";

/** Millimeters — X along wall, Y up, Z depth into room */
export type Vec3 = [number, number, number];

export type SceneObjectType =
  | "upright"
  | "shelf"
  | "back_panel"
  | "corner_upright"
  | "footboard";

export type SceneObject = {
  id: string;
  type: SceneObjectType;
  position: Vec3;
  rotation: Vec3;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  constraints: {
    attachedTo?: string;
    locked?: boolean;
  };
  pricing: {
    role: LineRole;
    lineId?: string;
    quantity: number;
    finish?: Finish;
    side?: EstimateLineInput["side"];
    depth_type?: "510" | "414";
    drawer_variant?: DrawerVariant;
    drawer_material?: DrawerMaterial;
    raster_variant?: RasterVariant;
    notes?: string;
    room?: string;
  };
};

export type SceneSettings = Pick<
  EstimateRequest,
  | "measurement_unit"
  | "measurement_basis"
  | "system"
  | "finish"
  | "margin_percent"
>;

export type Scene = {
  id: string;
  name: string;
  settings: SceneSettings;
  objects: SceneObject[];
  templateId?: string;
};

export const DEFAULT_SCENE_SETTINGS: SceneSettings = {
  measurement_unit: "mm",
  measurement_basis: "panel",
  system: "with_panels",
  finish: "melamine",
};

export const MM_PER_UNIT = 0.001;
