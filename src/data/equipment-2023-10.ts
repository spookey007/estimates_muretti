/**
 * SCENIKA 10/2023 walk-in equipment (PDF file pages 32-49).
 */
import type { Finish, System } from "@/data/scenika-2023-10";
import type { PriceEntry } from "@/data/scenika-2023-10";

export type DrawerVariant = "1" | "2" | "3" | "4";
export type DrawerMaterial = "wood" | "aluminium";
export type RasterVariant = "hanging" | "rested";

/** Corner closing filler 74x74 (component D) by upright height. */
export const CORNER_FILLER_WITH_PANELS: Record<
  number,
  { dx: string; sx: string; melamine: number; lacquered: number }
> = {
  2187: { dx: "1PF11F1", sx: "1PF11F3", melamine: 154, lacquered: 179 },
  2411: { dx: "1PF11G1", sx: "1PF11G3", melamine: 154, lacquered: 179 },
  2571: { dx: "1PF11H1", sx: "1PF11I1", melamine: 154, lacquered: 179 },
  2891: { dx: "1PF11I1", sx: "1PF11I3", melamine: 158, lacquered: 183 },
};

const SHOE_WIDTHS = [483, 643, 803, 903] as const;

function shoeCode(system: System, l: number, depth: 510 | 414): string {
  const sys = system === "with_panels" ? "5" : "6";
  const wMap: Record<number, string> = {
    483: "13",
    643: "15",
    803: "16",
    903: "17",
  };
  const w = wMap[l];
  if (!w) throw new Error(`Invalid shoe rack width ${l}`);
  const d = depth === 510 ? "10" : "00";
  return `${sys}PS${w}${d}`;
}

const SHOE_PRICES: Record<string, { melamine: number; lacquered: number }> = {
  "5PS1310": { melamine: 105, lacquered: 123 },
  "5PS1510": { melamine: 121, lacquered: 141 },
  "5PS1610": { melamine: 133, lacquered: 157 },
  "5PS1710": { melamine: 140, lacquered: 166 },
  "5PS1300": { melamine: 86, lacquered: 104 },
  "5PS1500": { melamine: 96, lacquered: 116 },
  "5PS1600": { melamine: 106, lacquered: 130 },
  "5PS1700": { melamine: 111, lacquered: 137 },
  "6PS1310": { melamine: 105, lacquered: 123 },
  "6PS1510": { melamine: 121, lacquered: 141 },
  "6PS1610": { melamine: 133, lacquered: 157 },
  "6PS1710": { melamine: 140, lacquered: 166 },
  "6PS1300": { melamine: 86, lacquered: 104 },
  "6PS1500": { melamine: 96, lacquered: 116 },
  "6PS1600": { melamine: 106, lacquered: 130 },
  "6PS1700": { melamine: 111, lacquered: 137 },
};

export function shoeRackEntry(
  system: System,
  l: number,
  depth: 510 | 414,
): PriceEntry & { l: number } {
  const code = shoeCode(system, l, depth);
  const row = SHOE_PRICES[code];
  if (!row) throw new Error(`Invalid shoe rack width ${l}`);
  return { code, ...row, l };
}

export { SHOE_WIDTHS };

/** Clothes tube on shelf (0TS) — fixed catalog height 845 mm. */
export const CLOTHES_TUBE_HEIGHT = 845;

const TUBE_PRICES: Record<string, { melamine: number; lacquered: number }> = {
  "0TS1300": { melamine: 226, lacquered: 226 },
  "0TS1500": { melamine: 226, lacquered: 226 },
  "0TS1600": { melamine: 226, lacquered: 226 },
  "0TS1700": { melamine: 226, lacquered: 226 },
};

export function clothesTubeEntry(l: number): PriceEntry & { l: number } {
  const wMap: Record<number, string> = {
    483: "13",
    643: "15",
    803: "16",
    903: "17",
  };
  const w = wMap[l];
  if (!w) throw new Error(`Invalid clothes tube width ${l}`);
  const code = `0TS${w}00`;
  const row = TUBE_PRICES[code];
  if (!row) throw new Error(`Invalid clothes tube width ${l}`);
  return { code, ...row, l };
}

export const CLOTHES_TUBE_WIDTHS = [483, 643, 803, 903];

/** Hanging drawer with pull-out frames (H) at H 222. */
const DRAWER_H: Record<string, { melamine: number; lacquered: number }> = {
  "5C11630": { melamine: 357, lacquered: 428 },
  "5C11730": { melamine: 372, lacquered: 447 },
  "5C21630": { melamine: 557, lacquered: 640 },
  "5C21730": { melamine: 579, lacquered: 666 },
  "5C31630": { melamine: 437, lacquered: 496 },
  "5C31730": { melamine: 458, lacquered: 521 },
  "5C41630": { melamine: 637, lacquered: 708 },
  "5C41730": { melamine: 665, lacquered: 740 },
  "6C11630": { melamine: 357, lacquered: 428 },
  "6C11730": { melamine: 372, lacquered: 447 },
  "6C21630": { melamine: 557, lacquered: 640 },
  "6C21730": { melamine: 579, lacquered: 666 },
  "6C31630": { melamine: 437, lacquered: 496 },
  "6C31730": { melamine: 458, lacquered: 521 },
  "6C41630": { melamine: 637, lacquered: 708 },
  "6C41730": { melamine: 665, lacquered: 740 },
};

export function hangingDrawerEntry(
  system: System,
  variant: DrawerVariant,
  l: number,
): PriceEntry & { l: number } {
  const sys = system === "with_panels" ? "5" : "6";
  const w = l === 803 ? "16" : "17";
  const code = `${sys}C${variant}${w}30`;
  const row = DRAWER_H[code];
  if (!row) throw new Error(`Invalid hanging drawer code ${code}`);
  return { code, ...row, l };
}

export const HANGING_DRAWER_WIDTHS = [803, 903];

/** Hanging drawer unit (J) — wood (CL) or aluminium (CV). */
function simpleDrawerCode(
  system: System,
  material: DrawerMaterial,
  h: number,
  l: number,
): string {
  const sys = system === "with_panels" ? "5" : "6";
  const mat = material === "wood" ? "CL" : "CV";
  const widthCode: Record<number, string> = {
    483: "13",
    643: "15",
    803: "16",
    903: "17",
  };
  const hSuffix = h === 222 ? "30" : "70";
  const w = widthCode[l];
  if (!w) throw new Error(`Invalid drawer width ${l}`);
  return `${sys}${mat}${w}${hSuffix}`;
}

const DRAWER_J: Record<string, { melamine: number; lacquered: number }> = {
  "5CL1330": { melamine: 174, lacquered: 257 },
  "5CL1530": { melamine: 195, lacquered: 289 },
  "5CL1630": { melamine: 214, lacquered: 321 },
  "5CL1730": { melamine: 226, lacquered: 338 },
  "5CV1330": { melamine: 265, lacquered: 317 },
  "5CV1530": { melamine: 294, lacquered: 354 },
  "5CV1630": { melamine: 316, lacquered: 386 },
  "5CV1730": { melamine: 330, lacquered: 404 },
  "5CL1370": { melamine: 244, lacquered: 368 },
  "5CL1570": { melamine: 273, lacquered: 411 },
  "5CL1670": { melamine: 313, lacquered: 467 },
  "5CL1770": { melamine: 329, lacquered: 489 },
  "5CV1370": { melamine: 426, lacquered: 488 },
  "5CV1570": { melamine: 471, lacquered: 541 },
  "5CV1670": { melamine: 517, lacquered: 597 },
  "5CV1770": { melamine: 537, lacquered: 621 },
  "6CL1330": { melamine: 174, lacquered: 257 },
  "6CL1530": { melamine: 195, lacquered: 289 },
  "6CL1630": { melamine: 214, lacquered: 321 },
  "6CL1730": { melamine: 226, lacquered: 338 },
  "6CV1330": { melamine: 265, lacquered: 317 },
  "6CV1530": { melamine: 294, lacquered: 354 },
  "6CV1630": { melamine: 316, lacquered: 386 },
  "6CV1730": { melamine: 330, lacquered: 404 },
};

export function hangingDrawerSimpleEntry(
  system: System,
  material: DrawerMaterial,
  h: number,
  l: number,
): PriceEntry & { l: number; h: number } {
  const code = simpleDrawerCode(system, material, h, l);
  const row = DRAWER_J[code];
  if (!row) throw new Error(`Invalid simple drawer ${code}`);
  return { code, ...row, l, h };
}

export const SIMPLE_DRAWER_HEIGHTS = [222, 414];
export const SIMPLE_DRAWER_WIDTHS = [483, 643, 803, 903];

/** Raster / cubby (I). */
const RASTER_H606: Record<string, { melamine: number; lacquered: number }> = {
  "1R11310": { melamine: 181, lacquered: 257 },
  "1R11510": { melamine: 241, lacquered: 350 },
  "1R11610": { melamine: 292, lacquered: 421 },
  "1R11710": { melamine: 303, lacquered: 438 },
  "1R11300": { melamine: 181, lacquered: 257 },
  "1R11500": { melamine: 241, lacquered: 350 },
  "1R11600": { melamine: 292, lacquered: 421 },
  "1R11700": { melamine: 303, lacquered: 438 },
  "2R11310": { melamine: 181, lacquered: 257 },
  "2R11510": { melamine: 241, lacquered: 350 },
  "2R11610": { melamine: 292, lacquered: 421 },
  "2R11710": { melamine: 303, lacquered: 438 },
};

const RASTER_RESTED: Record<string, { melamine: number; lacquered: number }> = {
  "3CV2370": { melamine: 383, lacquered: 443 },
  "3CV2570": { melamine: 428, lacquered: 496 },
  "3CV2670": { melamine: 458, lacquered: 536 },
  "3CV2770": { melamine: 478, lacquered: 560 },
  "3CV4380": { melamine: 547, lacquered: 619 },
  "3CV4580": { melamine: 606, lacquered: 686 },
  "3CV4680": { melamine: 645, lacquered: 735 },
  "3CV4780": { melamine: 670, lacquered: 764 },
};

function rasterWidthDigit(l: number): string {
  const m: Record<number, string> = { 483: "3", 643: "5", 803: "6", 903: "7" };
  const c = m[l];
  if (!c) throw new Error(`Invalid raster width ${l}`);
  return c;
}

export function hangingRasterEntry(
  system: System,
  variant: RasterVariant,
  h: number,
  l: number,
  depth: 510 | 414,
): PriceEntry & { h: number; l: number } {
  if (variant === "hanging" && h === 606) {
    const sys = system === "with_panels" ? "1" : "2";
    const w = String(l).slice(1);
    const d = depth === 510 ? "10" : "00";
    const code = `${sys}R1${w}${d}`;
    const row = RASTER_H606[code];
    if (!row) throw new Error(`Invalid raster ${code}`);
    return { code, ...row, h, l };
  }
  if (variant === "rested" && (h === 414 || h === 606)) {
    const hp = h === 414 ? "2" : "4";
    const suffix = h === 414 ? "70" : "80";
    const code = `3CV${hp}${rasterWidthDigit(l)}${suffix}`;
    const row = RASTER_RESTED[code];
    if (!row) throw new Error(`Invalid raster ${code}`);
    return { code, ...row, h, l };
  }
  throw new Error(`Unsupported raster H${h} variant ${variant}`);
}

export const RASTER_HEIGHTS = { hanging: [606], rested: [414, 606] };
