import type { EstimateLineInput, LineRole } from "@/lib/types";

/** SCENIKA diagram letters (technical sheet). */
export type DiagramLetter = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J";

export type PaletteItem = {
  letter: DiagramLetter;
  role: LineRole;
  label: string;
  shortLabel: string;
  defaultNote: string;
};

export const PALETTE: PaletteItem[] = [
  { letter: "A", role: "upright", label: "Upright (A)", shortLabel: "A", defaultNote: "A Montante" },
  {
    letter: "B",
    role: "corner_upright",
    label: "Corner upright (B)",
    shortLabel: "B",
    defaultNote: "B Montante angolare",
  },
  { letter: "C", role: "back_panel", label: "Back panel (C)", shortLabel: "C", defaultNote: "C Schienale" },
  {
    letter: "D",
    role: "corner_filler",
    label: "Corner filler (D)",
    shortLabel: "D",
    defaultNote: "D Fascia angolare",
  },
  { letter: "E", role: "mirror", label: "Mirror (E)", shortLabel: "E", defaultNote: "E Specchio" },
  { letter: "F", role: "shelf", label: "Shelf (F)", shortLabel: "F", defaultNote: "F Ripiano" },
  { letter: "G", role: "footboard", label: "Footboard (G)", shortLabel: "G", defaultNote: "G Pedana" },
  {
    letter: "H",
    role: "hanging_drawer",
    label: "Drawer frames (H)",
    shortLabel: "H",
    defaultNote: "H Cassettiera telai",
  },
  { letter: "I", role: "hanging_raster", label: "Raster (I)", shortLabel: "I", defaultNote: "I Raster pensile" },
  {
    letter: "J",
    role: "hanging_drawer_simple",
    label: "Drawer unit (J)",
    shortLabel: "J",
    defaultNote: "J Cassettiera pensile",
  },
];

export const STANDARD_HEIGHTS = [2187, 2411, 2571, 2891] as const;

export type BaySlot = {
  id: string;
  label: string;
  widthMm: number;
  wall: "left" | "return";
  /** Floor plan rect */
  planX: number;
  planY: number;
  planW: number;
  planH: number;
  /** Front elevation slot on L diagram */
  elevX: number;
  elevY: number;
  elevW: number;
  elevH: number;
};

/** L-shaped walk-in — matches SCENIKA sheet (900×3 + 800/640/480 return). */
export const L_CLOSET_BAYS: BaySlot[] = [
  {
    id: "L1",
    label: "900",
    widthMm: 900,
    wall: "left",
    planX: 80,
    planY: 60,
    planW: 120,
    planH: 70,
    elevX: 60,
    elevY: 80,
    elevW: 130,
    elevH: 200,
  },
  {
    id: "L2",
    label: "900",
    widthMm: 900,
    wall: "left",
    planX: 210,
    planY: 60,
    planW: 120,
    planH: 70,
    elevX: 200,
    elevY: 80,
    elevW: 130,
    elevH: 200,
  },
  {
    id: "L3",
    label: "900",
    widthMm: 900,
    wall: "left",
    planX: 340,
    planY: 60,
    planW: 120,
    planH: 70,
    elevX: 340,
    elevY: 80,
    elevW: 130,
    elevH: 200,
  },
  {
    id: "R1",
    label: "800",
    widthMm: 800,
    wall: "return",
    planX: 340,
    planY: 145,
    planW: 100,
    planH: 65,
    elevX: 490,
    elevY: 80,
    elevW: 105,
    elevH: 200,
  },
  {
    id: "R2",
    label: "640",
    widthMm: 640,
    wall: "return",
    planX: 340,
    planY: 220,
    planW: 85,
    planH: 65,
    elevX: 490,
    elevY: 300,
    elevW: 85,
    elevH: 200,
  },
  {
    id: "R3",
    label: "480",
    widthMm: 480,
    wall: "return",
    planX: 340,
    planY: 295,
    planW: 70,
    planH: 65,
    elevX: 490,
    elevY: 520,
    elevW: 65,
    elevH: 200,
  },
];

export function letterFromNotes(notes?: string): DiagramLetter | undefined {
  if (!notes) return undefined;
  const m = notes.trim().match(/^([A-J])\b/i);
  return m ? (m[1].toUpperCase() as DiagramLetter) : undefined;
}

export function bayIdFromRoom(room?: string): string | undefined {
  if (!room) return undefined;
  const m = room.match(/bay[:\s]+(L\d|R\d)/i);
  return m ? m[1].toUpperCase() : undefined;
}

export function linesInBay(
  lines: EstimateLineInput[],
  bay: BaySlot,
): EstimateLineInput[] {
  return lines.filter((line) => {
    if (bayIdFromRoom(line.room) === bay.id) return true;
    const note = line.notes?.toLowerCase() ?? "";
    const room = line.room?.toLowerCase() ?? "";
    if (room.includes(bay.wall) && (note.includes(bay.label) || room.includes(bay.label)))
      return true;
    if (line.l === bay.widthMm) return true;
    if (line.role === "shelf" && line.l != null) {
      const shelfW =
        line.l <= 500 ? 483 : line.l <= 700 ? 643 : line.l <= 850 ? 803 : 903;
      const bayShelf =
        bay.widthMm <= 500 ? 483 : bay.widthMm <= 700 ? 643 : bay.widthMm <= 850 ? 803 : 903;
      return shelfW === bayShelf || Math.abs(line.l - bay.widthMm) < 80;
    }
    return false;
  });
}

export function defaultLineForPalette(
  item: PaletteItem,
  bay: BaySlot,
  lineId: string,
  defaultHeight = 2187,
): EstimateLineInput {
  const base: EstimateLineInput = {
    line_id: lineId,
    room: `${bay.wall === "left" ? "Wall 1" : "Return"} · bay ${bay.id} (${bay.label}mm)`,
    role: item.role,
    quantity: 1,
    notes: `${item.defaultNote} @ ${bay.label}mm`,
  };
  switch (item.role) {
    case "upright":
    case "corner_upright":
    case "corner_filler":
    case "linear_filler":
      return { ...base, h: defaultHeight, side: bay.wall === "left" ? "dx" : "sx" };
    case "back_panel":
    case "mirror":
      return { ...base, h: defaultHeight, l: bay.widthMm };
    case "shelf":
    case "shoe_rack":
      return { ...base, l: bay.widthMm, depth_type: "510" };
    case "footboard":
      return { ...base, l: bay.widthMm };
    case "hanging_drawer":
      return { ...base, l: bay.widthMm >= 850 ? 903 : 803, drawer_variant: "3" };
    case "hanging_drawer_simple":
      return {
        ...base,
        h: 222,
        l: bay.widthMm >= 850 ? 903 : 803,
        drawer_material: "wood",
      };
    case "hanging_raster":
      return {
        ...base,
        h: 414,
        l: bay.widthMm >= 850 ? 903 : 483,
        raster_variant: "rested",
        depth_type: "510",
      };
    default:
      return base;
  }
}

export const ROLE_COLORS: Record<string, string> = {
  upright: "#57534e",
  corner_upright: "#44403c",
  corner_filler: "#a8a29e",
  back_panel: "#d6d3d1",
  linear_filler: "#e7e5e4",
  mirror: "#60a5fa",
  shelf: "#f59e0b",
  footboard: "#84cc16",
  shoe_rack: "#f97316",
  clothes_tube: "#a3e635",
  hanging_drawer: "#a78bfa",
  hanging_drawer_simple: "#8b5cf6",
  hanging_raster: "#fb7185",
};
