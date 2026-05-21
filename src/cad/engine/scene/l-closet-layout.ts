import {
  panelDimensionsFromCatalog,
  panelRotationForWall,
} from "@/cad/engine/geometry/panel-dimensions";
import type { SceneObject, SceneObjectType, Vec3 } from "@/cad/types";
import type { EstimateLineInput, LineRole } from "@/lib/types";

/**
 * SCENIKA standard L walk-in.
 * Panels-only: back-panel L shell. With components: panels + uprights, shelves, mirror.
 */
export const L_WALL1_BAYS_MM = [900, 900, 900] as const;
export const L_RETURN_BAYS_MM = [800, 640, 480] as const;

const UPRIGHT_W = 50;
const CLOSET_DEPTH = 510;
const UPRIGHT_SETBACK = 24;
const SHELF_THICK = 30;
const SHELF_DEPTH = 480;
const SHELF_ROW_Y = [720, 1280, 1840] as const;
/** Default Z split for fill-bay return shelves; uniform mode uses returnCornerZSplit(). */
const CORNER_SHELF_Z_SPLIT_FILL_BAY = 530;
const PANEL_BACK_Z = 18;
/**
 * L-end (return wall) shelves.
 * SCENIKA `l` = size along the wall (+Z). Into-room depth = 510 system (480 mm board in 3D).
 * Scene box: width = into room (X), depth = along wall (Z) — see shelf-dimensions.ts.
 */
export type ReturnShelfLayout = "uniform" | "fill-bay";
export const RETURN_SHELF_LAYOUT: ReturnShelfLayout = "uniform";
/** Catalog width L (mm) along the return wall — same on all three bays when uniform. */
export const RETURN_SHELF_L_MM = 480;
/** How far the shelf extends into the room (X); maps to depth_type 510 when 480. */
export const RETURN_SHELF_INTO_ROOM_MM = 480;
/** @deprecated Use RETURN_SHELF_INTO_ROOM_MM */
export const RETURN_SHELF_DEPTH_INTO_ROOM_MM = RETURN_SHELF_INTO_ROOM_MM;
/** Space left between wall-1 end shelf and return shelves (mm). Lower = longer end shelf. */
const GAP_BEFORE_RETURN_SHELF_MM = 16;

function returnShelfAlongWallMm(bay: number, line?: EstimateLineInput): number {
  const moduleMm = L_RETURN_BAYS_MM[bay];
  if (RETURN_SHELF_LAYOUT === "fill-bay") {
    return line?.l ?? moduleMm;
  }
  return RETURN_SHELF_L_MM;
}

function returnCornerZSplit(alongWallMm: number): number {
  if (RETURN_SHELF_LAYOUT === "uniform") {
    return L_RETURN_BAYS_MM[0] - alongWallMm;
  }
  return CORNER_SHELF_Z_SPLIT_FILL_BAY;
}

/**
 * Last bay on wall 1 (bay 3, x = 1800 mm) — ending shelf in 3D.
 * - "auto" = as wide as possible without hitting return shelves (~386 mm with defaults).
 * - 900 = full bay width (same as other bays; may overlap return shelves in the preview).
 */
export const WALL1_CORNER_SHELF_WIDTH_MM: number | "auto" = 900;
/** "auto" = full 480 mm depth; lower = shorter into room at the corner (e.g. 497). */
export const WALL1_CORNER_SHELF_DEPTH_MM: number | "auto" = 480;

/** In 3D these stay in the estimate only — corner is in the panel frame; mirror is not a back panel. */
const ROLES_3D_SKIP: ReadonlySet<LineRole> = new Set([
  "footboard",
  "linear_filler",
  "corner_upright",
  "mirror",
]);

export const L_WALL1_LENGTH_MM = L_WALL1_BAYS_MM.reduce((a, b) => a + b, 0);
export const L_RETURN_LENGTH_MM = L_RETURN_BAYS_MM.reduce((a, b) => a + b, 0);

function sumBefore(bays: readonly number[], index: number): number {
  return bays.slice(0, index).reduce((a, b) => a + b, 0);
}

function roleToMeshType(role: LineRole): SceneObjectType {
  switch (role) {
    case "upright":
      return "upright";
    case "corner_upright":
      return "corner_upright";
    case "back_panel":
    case "mirror":
    case "linear_filler":
      return "back_panel";
    case "footboard":
      return "footboard";
    case "shelf":
    case "shoe_rack":
    default:
      return "shelf";
  }
}

function isReturnWall(room?: string): boolean {
  const r = (room ?? "").toLowerCase();
  return r.includes("return") || r.includes("wall 2");
}

function isWall1(room?: string): boolean {
  const r = (room ?? "").toLowerCase();
  return r.includes("wall 1") || r.includes("left run");
}

function shelfCatalogWidth(panelMm: number): number {
  if (panelMm <= 500) return 483;
  if (panelMm <= 700) return 643;
  if (panelMm <= 850) return 803;
  return 903;
}

/** Shelf span along the bay — never wider than the module (avoids bay-to-bay collision). */
function shelfSpanInBay(moduleMm: number): number {
  return Math.min(shelfCatalogWidth(moduleMm), moduleMm);
}

function shelfSlotsForLine(line: EstimateLineInput): { bay: number; row: number }[] {
  const id = line.line_id;
  const qty = Math.max(1, line.quantity ?? 1);
  const onReturn = isReturnWall(line.room);

  if (onReturn) {
    // One shelf per return bay in 3D (estimate qty still applies for pricing).
    if (id === "L13") return [{ bay: 0, row: 1 }];
    if (id === "L14") return [{ bay: 1, row: 1 }];
    if (id === "L15") return [{ bay: 2, row: 1 }];
    return [{ bay: 0, row: 1 }];
  }

  if (id === "L10") return [{ bay: 0, row: 2 }, { bay: 1, row: 2 }];
  if (id === "L11") return [{ bay: 0, row: 1 }, { bay: 1, row: 1 }];
  if (id === "L12") return [{ bay: 2, row: 1 }, { bay: 2, row: 2 }];
  const slots: { bay: number; row: number }[] = [];
  for (let i = 0; i < qty; i++) {
    slots.push({ bay: i % L_WALL1_BAYS_MM.length, row: 1 + (i % 3) });
  }
  return slots;
}

type LayoutState = {
  wall1PanelIndex: number;
  returnPanelIndex: number;
  wall1UprightIndex: number;
};

function makeObject(
  line: EstimateLineInput,
  suffix: string,
  type: SceneObjectType,
  position: Vec3,
  rotation: Vec3,
  dimensions: { width: number; height: number; depth: number },
): SceneObject {
  return {
    id: `line-${line.line_id}${suffix}`,
    type,
    position,
    rotation,
    dimensions,
    constraints: {},
    pricing: {
      role: line.role,
      lineId: line.line_id,
      quantity: 1,
      finish: line.finish,
      side: line.side,
      depth_type: line.depth_type,
      drawer_variant: line.drawer_variant,
      drawer_material: line.drawer_material,
      raster_variant: line.raster_variant,
      notes: line.notes,
      room: line.room,
    },
  };
}

function layoutWall1Panel(line: EstimateLineInput, bay: number, h: number): SceneObject {
  const catalogL = line.l ?? L_WALL1_BAYS_MM[bay] ?? 900;
  return makeObject(
    line,
    `-p${bay}`,
    "back_panel",
    [sumBefore(L_WALL1_BAYS_MM, bay), 0, 0],
    panelRotationForWall(false),
    panelDimensionsFromCatalog(catalogL, h, false),
  );
}

function layoutReturnPanel(
  line: EstimateLineInput,
  bay: number,
  h: number,
  moduleMm: number,
): SceneObject {
  const catalogL = line.l ?? moduleMm;
  return makeObject(
    line,
    `-p${bay}`,
    "back_panel",
    [L_WALL1_LENGTH_MM, 0, sumBefore(L_RETURN_BAYS_MM, bay)],
    panelRotationForWall(true),
    panelDimensionsFromCatalog(catalogL, h, true),
  );
}

function layoutWall1Upright(line: EstimateLineInput, index: number, h: number): SceneObject {
  return makeObject(
    line,
    `-u${index}`,
    "upright",
    [index * 900, 0, UPRIGHT_SETBACK],
    [0, 0, 0],
    { width: UPRIGHT_W, height: h, depth: CLOSET_DEPTH },
  );
}

function wall1ShelfZFront(): number {
  return PANEL_BACK_Z + (CLOSET_DEPTH - SHELF_DEPTH) / 2;
}

function layoutWall1Shelf(line: EstimateLineInput, bay: number, row: number): SceneObject {
  const moduleMm = L_WALL1_BAYS_MM[bay];
  const bayStart = sumBefore(L_WALL1_BAYS_MM, bay);
  let shelfW = shelfSpanInBay(moduleMm);
  const x = bayStart + (moduleMm - shelfW) / 2;
  const y = SHELF_ROW_Y[Math.min(row - 1, 2)] ?? 1280;
  const z = wall1ShelfZFront();
  const isCornerBay = bay === L_WALL1_BAYS_MM.length - 1;
  const cornerZSplit = returnCornerZSplit(returnShelfAlongWallMm(0));
  let depth = isCornerBay
    ? Math.max(200, cornerZSplit - z)
    : SHELF_DEPTH;
  if (isCornerBay) {
    const maxEndX =
      L_WALL1_LENGTH_MM -
      PANEL_BACK_Z -
      RETURN_SHELF_INTO_ROOM_MM -
      GAP_BEFORE_RETURN_SHELF_MM;
    const autoWidth = Math.max(200, maxEndX - x);
    const autoDepth = Math.min(SHELF_DEPTH, cornerZSplit - z);
    shelfW =
      WALL1_CORNER_SHELF_WIDTH_MM === "auto"
        ? Math.min(shelfW, autoWidth)
        : WALL1_CORNER_SHELF_WIDTH_MM;
    const requestedDepth =
      WALL1_CORNER_SHELF_DEPTH_MM === "auto"
        ? autoDepth
        : WALL1_CORNER_SHELF_DEPTH_MM;
    depth = Math.min(requestedDepth, autoDepth);
  }
  return makeObject(
    line,
    `-s${bay}-r${row}`,
    "shelf",
    [x, y, z],
    [0, 0, 0],
    { width: shelfW, height: SHELF_THICK, depth },
  );
}

function layoutReturnShelf(line: EstimateLineInput, bay: number, row: number): SceneObject {
  const moduleMm = L_RETURN_BAYS_MM[bay];
  const bayStart = sumBefore(L_RETURN_BAYS_MM, bay);
  const bayEnd = bayStart + moduleMm;
  const intoRoom = RETURN_SHELF_INTO_ROOM_MM;
  const alongWall = returnShelfAlongWallMm(bay, line);
  const zSplit = returnCornerZSplit(returnShelfAlongWallMm(0));
  const x = L_WALL1_LENGTH_MM - PANEL_BACK_Z - intoRoom;
  const y = SHELF_ROW_Y[Math.min(row - 1, 2)] ?? 1280;
  const isCornerBay = bay === 0;
  const runStart = isCornerBay ? zSplit : bayStart;
  const runEnd = bayEnd;
  const baySpan = runEnd - runStart;

  let depthAlongWall: number;
  let z: number;
  if (RETURN_SHELF_LAYOUT === "fill-bay") {
    z = runStart;
    depthAlongWall = baySpan;
  } else {
    depthAlongWall = Math.min(alongWall, baySpan);
    z = runStart + (baySpan - depthAlongWall) / 2;
  }

  return makeObject(
    line,
    `-s${bay}-r${row}`,
    "shelf",
    [x, y, z],
    [0, 0, 0],
    { width: intoRoom, height: SHELF_THICK, depth: depthAlongWall },
  );
}

function layoutBackPanelLine(line: EstimateLineInput, state: LayoutState): SceneObject[] {
  const h = line.h ?? 2187;
  const panelW = line.l ?? 900;
  const qty = Math.max(1, line.quantity ?? 1);
  const onReturn = isReturnWall(line.room);
  const onWall1 = isWall1(line.room);
  const out: SceneObject[] = [];

  if (onReturn) {
    for (let i = 0; i < qty; i++) {
      const bay = state.returnPanelIndex++;
      out.push(layoutReturnPanel(line, bay, h, L_RETURN_BAYS_MM[bay] ?? panelW));
    }
  } else if (onWall1) {
    for (let i = 0; i < qty; i++) {
      const bay = state.wall1PanelIndex++;
      out.push(layoutWall1Panel(line, bay, h));
    }
  }

  return out;
}

function layoutComponentLine(
  line: EstimateLineInput,
  state: LayoutState,
): SceneObject[] {
  if (ROLES_3D_SKIP.has(line.role)) return [];

  const h = line.h ?? 2187;
  const panelW = line.l ?? 900;
  const qty = Math.max(1, line.quantity ?? 1);
  const onReturn = isReturnWall(line.room);
  const out: SceneObject[] = [];

  switch (line.role) {
    case "upright": {
      for (let i = 0; i < qty && state.wall1UprightIndex < 3; i++) {
        out.push(layoutWall1Upright(line, state.wall1UprightIndex++, h));
      }
      break;
    }
    case "shelf":
    case "shoe_rack": {
      for (const { bay, row } of shelfSlotsForLine(line)) {
        out.push(
          onReturn
            ? layoutReturnShelf(line, bay, row)
            : layoutWall1Shelf(line, bay, row),
        );
      }
      break;
    }
    default:
      break;
  }

  return out;
}

export function isLClosetEstimate(lines: EstimateLineInput[]): boolean {
  const hasWall1 = lines.some((l) => isWall1(l.room));
  const hasReturn = lines.some((l) => isReturnWall(l.room));
  const panelCount = lines.filter((l) => l.role === "back_panel").length;
  return (hasWall1 && hasReturn) || panelCount >= 4;
}

export function layoutLClosetLines(
  lines: EstimateLineInput[],
  options?: { showComponents?: boolean },
): SceneObject[] {
  const showComponents = options?.showComponents ?? false;
  const state: LayoutState = {
    wall1PanelIndex: 0,
    returnPanelIndex: 0,
    wall1UprightIndex: 0,
  };
  const objects: SceneObject[] = [];

  for (const line of lines) {
    if (line.role === "back_panel") {
      objects.push(...layoutBackPanelLine(line, state));
      continue;
    }
    if (showComponents) {
      objects.push(...layoutComponentLine(line, state));
    }
  }

  return objects;
}

export function lClosetSceneCenterMm(): Vec3 {
  return [L_WALL1_LENGTH_MM / 2, 1090, L_RETURN_LENGTH_MM / 2];
}
