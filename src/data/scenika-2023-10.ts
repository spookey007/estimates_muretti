/**
 * SCENIKA price list 10/2023  extracted from PLAY Lip_SCENIKA-completo ITA+ENG.pdf
 * Prices in EUR, excluding VAT. Melamine = "melamine", lacquered = "lacquered".
 */

export const PRICE_LIST_ID = "scenika-2023-10";
export const PRICE_LIST_LABEL = "SCENIKA 10/2023";
export const CURRENCY = "EUR";

export type Finish = "melamine" | "lacquered";
export type System = "with_panels" | "without_panels";

export interface PriceEntry {
  code: string;
  melamine: number;
  lacquered: number;
}

/** Upright aluminum  with panels (single price column in PDF) */
export const UPRIGHT_WITH_PANELS: Record<number, PriceEntry> = {
  2187: { code: "1PC11F0", melamine: 84, lacquered: 84 },
  2411: { code: "1PC11G0", melamine: 84, lacquered: 84 },
  2571: { code: "1PC11H0", melamine: 84, lacquered: 84 },
  2891: { code: "1PC11I0", melamine: 91, lacquered: 91 },
};

/** Corner upright  with panels (Dx/Sx pairs; same price both finishes in PDF) */
export const CORNER_UPRIGHT_WITH_PANELS: Record<
  number,
  { dx: string; sx: string; melamine: number; lacquered: number }
> = {
  2187: { dx: "1PA11F1", sx: "1PA11F3", melamine: 87, lacquered: 87 },
  2411: { dx: "1PA11G1", sx: "1PA11G3", melamine: 87, lacquered: 87 },
  2571: { dx: "1PA11H1", sx: "1PA11H3", melamine: 87, lacquered: 87 },
  2891: { dx: "1PA11I1", sx: "1PA11I3", melamine: 94, lacquered: 94 },
};

/** Back panel wood 18mm  with panels: H  L grid */
export const BACK_PANEL_WITH_PANELS: Array<{
  h: number;
  l: number;
  code: string;
  melamine: number;
  lacquered: number;
}> = [
  { h: 2187, l: 480, code: "1PN13F0", melamine: 123, lacquered: 178 },
  { h: 2187, l: 640, code: "1PN15F0", melamine: 143, lacquered: 207 },
  { h: 2187, l: 800, code: "1PN16F0", melamine: 162, lacquered: 235 },
  { h: 2187, l: 900, code: "1PN17F0", melamine: 174, lacquered: 252 },
  { h: 2411, l: 480, code: "1PN13G0", melamine: 132, lacquered: 191 },
  { h: 2411, l: 640, code: "1PN15G0", melamine: 154, lacquered: 223 },
  { h: 2411, l: 800, code: "1PN16G0", melamine: 174, lacquered: 252 },
  { h: 2411, l: 900, code: "1PN17G0", melamine: 187, lacquered: 271 },
  { h: 2571, l: 480, code: "1PN13H0", melamine: 136, lacquered: 197 },
  { h: 2571, l: 640, code: "1PN15H0", melamine: 159, lacquered: 231 },
  { h: 2571, l: 800, code: "1PN16H0", melamine: 180, lacquered: 261 },
  { h: 2571, l: 900, code: "1PN17H0", melamine: 194, lacquered: 281 },
  { h: 2891, l: 480, code: "1PN13I0", melamine: 147, lacquered: 213 },
  { h: 2891, l: 640, code: "1PN15I0", melamine: 173, lacquered: 251 },
  { h: 2891, l: 800, code: "1PN16I0", melamine: 196, lacquered: 284 },
  { h: 2891, l: 900, code: "1PN17I0", melamine: 212, lacquered: 307 },
];

/** Wood filler / back  without panels */
export const BACK_PANEL_WITHOUT_PANELS: Array<{
  h: number;
  l: number;
  code: string;
  melamine: number;
  lacquered: number;
}> = [
  { h: 960, l: 461, code: "2PN13A0", melamine: 79, lacquered: 115 },
  { h: 960, l: 621, code: "2PN15A0", melamine: 90, lacquered: 131 },
  { h: 960, l: 781, code: "2PN16A0", melamine: 99, lacquered: 144 },
  { h: 960, l: 881, code: "2PN17A0", melamine: 105, lacquered: 152 },
  { h: 1280, l: 461, code: "2PN13B0", melamine: 88, lacquered: 128 },
  { h: 1280, l: 621, code: "2PN15B0", melamine: 101, lacquered: 146 },
  { h: 1280, l: 781, code: "2PN16B0", melamine: 113, lacquered: 164 },
  { h: 1280, l: 881, code: "2PN17B0", melamine: 120, lacquered: 174 },
  { h: 2188, l: 461, code: "2PN13F0", melamine: 114, lacquered: 165 },
  { h: 2188, l: 621, code: "2PN15F0", melamine: 134, lacquered: 194 },
  { h: 2188, l: 781, code: "2PN16F0", melamine: 152, lacquered: 220 },
  { h: 2188, l: 881, code: "2PN17F0", melamine: 165, lacquered: 239 },
  { h: 2412, l: 461, code: "2PN13G0", melamine: 121, lacquered: 175 },
  { h: 2412, l: 621, code: "2PN15G0", melamine: 144, lacquered: 209 },
  { h: 2412, l: 781, code: "2PN16G0", melamine: 164, lacquered: 238 },
  { h: 2412, l: 881, code: "2PN17G0", melamine: 177, lacquered: 257 },
  { h: 2572, l: 461, code: "2PN13H0", melamine: 126, lacquered: 183 },
  { h: 2572, l: 621, code: "2PN15H0", melamine: 149, lacquered: 216 },
  { h: 2572, l: 781, code: "2PN16H0", melamine: 171, lacquered: 248 },
  { h: 2572, l: 881, code: "2PN17H0", melamine: 185, lacquered: 268 },
  { h: 2892, l: 461, code: "2PN13I0", melamine: 136, lacquered: 197 },
  { h: 2892, l: 621, code: "2PN15I0", melamine: 162, lacquered: 235 },
  { h: 2892, l: 781, code: "2PN16I0", melamine: 186, lacquered: 270 },
  { h: 2892, l: 881, code: "2PN17I0", melamine: 193, lacquered: 280 },
];

/** Linear closing filler  with panels */
export const LINEAR_FILLER_WITH_PANELS: Array<{
  h: number;
  l: number;
  code: string;
  melamine: number;
  lacquered: number;
}> = [
  { h: 2187, l: 513, code: "1PN14F0", melamine: 126, lacquered: 183 },
  { h: 2187, l: 417, code: "1PN12F0", melamine: 117, lacquered: 170 },
  { h: 2411, l: 513, code: "1PN14G0", melamine: 135, lacquered: 196 },
  { h: 2411, l: 417, code: "1PN12G0", melamine: 125, lacquered: 181 },
  { h: 2571, l: 513, code: "1PN14H0", melamine: 140, lacquered: 203 },
  { h: 2571, l: 417, code: "1PN12H0", melamine: 129, lacquered: 187 },
  { h: 2891, l: 513, code: "1PN14I0", melamine: 151, lacquered: 219 },
  { h: 2891, l: 417, code: "1PN12I0", melamine: 139, lacquered: 202 },
];

/** Mirror  with panels (H  L) */
export const MIRROR_WITH_PANELS: Array<{
  h: number;
  l: number;
  code: string;
  melamine: number;
  lacquered: number;
}> = [
  { h: 958, l: 478, code: "1SP13A0", melamine: 67, lacquered: 67 },
  { h: 958, l: 638, code: "1SP15A0", melamine: 90, lacquered: 90 },
  { h: 958, l: 798, code: "1SP16A0", melamine: 112, lacquered: 112 },
  { h: 958, l: 898, code: "1SP17A0", melamine: 129, lacquered: 129 },
  { h: 1278, l: 478, code: "1SP13B0", melamine: 90, lacquered: 90 },
  { h: 1278, l: 638, code: "1SP15B0", melamine: 120, lacquered: 120 },
  { h: 1278, l: 798, code: "1SP16B0", melamine: 150, lacquered: 150 },
  { h: 1278, l: 898, code: "1SP17B0", melamine: 172, lacquered: 172 },
  { h: 1817, l: 478, code: "1SP13F0", melamine: 168, lacquered: 168 },
  { h: 1817, l: 638, code: "1SP15F0", melamine: 225, lacquered: 225 },
  { h: 1817, l: 798, code: "1SP16F0", melamine: 268, lacquered: 268 },
  { h: 1817, l: 898, code: "1SP17F0", melamine: 300, lacquered: 300 },
];

/** Shelves th.30  width steps; depth 510 vs 414 */
export function shelfEntry(
  system: System,
  l: number,
  depth: 510 | 414,
): PriceEntry & { l: number } {
  const prefix = system === "with_panels" ? "1RL" : "2RL";
  const map510: Record<number, [string, number, number]> = {
    483: [`${prefix}1310`, 73, 91],
    643: [`${prefix}1510`, 77, 97],
    803: [`${prefix}1610`, 85, 109],
    903: [`${prefix}1710`, 88, 114],
  };
  const map414: Record<number, [string, number, number]> = {
    483: [`${prefix}1300`, 73, 91],
    643: [`${prefix}1500`, 77, 97],
    803: [`${prefix}1600`, 85, 109],
    903: [`${prefix}1700`, 88, 114],
  };
  const m = depth === 510 ? map510 : map414;
  const row = m[l];
  if (!row) throw new Error(`Invalid shelf width ${l}`);
  return { code: row[0], melamine: row[1], lacquered: row[2], l };
}

/** Footboard length bands */
export const FOOTBOARD_BANDS: Array<{
  min: number;
  max: number;
  withPanels: PriceEntry;
  withoutPanels: PriceEntry;
}> = [
  {
    min: 100,
    max: 1000,
    withPanels: { code: "1PE1110", melamine: 152, lacquered: 179 },
    withoutPanels: { code: "2PE1110", melamine: 152, lacquered: 179 },
  },
  {
    min: 1001,
    max: 1800,
    withPanels: { code: "1PE1210", melamine: 209, lacquered: 248 },
    withoutPanels: { code: "2PE1210", melamine: 209, lacquered: 248 },
  },
  {
    min: 1801,
    max: 3000,
    withPanels: { code: "1PE1310", melamine: 296, lacquered: 351 },
    withoutPanels: { code: "2PE1310", melamine: 296, lacquered: 351 },
  },
];

export const SURCHARGES: Record<string, { label: string; price: number }> = {
  TAALMO: { label: "Height cut — upright", price: 20 },
  TAALAN: { label: "Cut — corner closing filler", price: 20 },
  TAALFL: { label: "Width cut — linear closing filler", price: 20 },
  TAALSC: { label: "Width cut — linear closing filler (alt.)", price: 27 },
  TAAMSC: { label: "Mansard cut — back panel", price: 70 },
  TALASC: { label: "Width cut — back panel", price: 44 },
  TALARI: { label: "Width cut — shelf", price: 29 },
  TALATU: { label: "Cut — clothes tube", price: 15 },
  TAPRPE: { label: "Cut — footboard", price: 72 },
};

export const DELIVERY_MIN_NET_EUR = 300;
export const DELIVERY_SURCHARGE_EUR = 32;

export const RULES = {
  heightsWithPanels: [2187, 2411, 2571, 2891],
  heightsWithoutPanels: [960, 1280, 2188, 2412, 2572, 2892],
  widthsWithPanels: [480, 640, 800, 900],
  widthsWithoutPanels: [461, 621, 781, 881],
  widthsLinearFiller: [417, 513],
  widthsShelf: [483, 643, 803, 903],
  widthsMirror: [478, 638, 798, 898],
  heightsMirror: [958, 1278, 1817],
  openingToleranceMm: 10,
  /** Finished compartment → panel width for shelves (+3 mm). */
  shelfProtrusionMm: 3,
  /** Bracket / panel basis offset (reserved for future rules). */
  panelBracketMm: 8,
  feetHeightMm: 11,
};
