/**
 * FlexyLED catalog (PDF file page 51).
 */
import type { PriceEntry } from "@/data/scenika-2023-10";

/** Shelf LED bars (0LR) — single price column. */
const SHELF_LED: Record<number, PriceEntry> = {
  483: { code: "0LR1300", melamine: 60, lacquered: 60 },
  643: { code: "0LR1500", melamine: 60, lacquered: 60 },
  803: { code: "0LR1600", melamine: 60, lacquered: 60 },
  903: { code: "0LR1700", melamine: 60, lacquered: 60 },
};

/** Drawer LED bars (0LC) — width reduced by 36 mm vs shelf. */
const DRAWER_LED: Record<number, PriceEntry> = {
  447: { code: "0LC1300", melamine: 60, lacquered: 60 },
  607: { code: "0LC1500", melamine: 60, lacquered: 60 },
  767: { code: "0LC1600", melamine: 60, lacquered: 60 },
  867: { code: "0LC1700", melamine: 60, lacquered: 60 },
};

/** Side LED for storage units (4LB) by height. */
const SIDE_LED: Record<number, PriceEntry> = {
  1189: { code: "4LB1A00", melamine: 105, lacquered: 105 },
  1509: { code: "4LB1C00", melamine: 105, lacquered: 105 },
  1829: { code: "4LB1D00", melamine: 105, lacquered: 105 },
};

export const FLEXY_POWER_100W: PriceEntry = {
  code: "0RB1100",
  melamine: 126,
  lacquered: 126,
};

export const FLEXY_CABLE: PriceEntry = {
  code: "0RB4100",
  melamine: 12,
  lacquered: 12,
};

export function flexyShelfLed(l: number): PriceEntry {
  const row = SHELF_LED[l];
  if (!row) throw new Error(`FlexyLED shelf width ${l}`);
  return row;
}

export function flexyDrawerLed(l: number): PriceEntry {
  const row = DRAWER_LED[l];
  if (!row) throw new Error(`FlexyLED drawer width ${l}`);
  return row;
}

export function flexySideLed(h: number): PriceEntry {
  const row = SIDE_LED[h];
  if (!row) throw new Error(`FlexyLED side height ${h}`);
  return row;
}

export const FLEXY_SHELF_WIDTHS = [483, 643, 803, 903];
export const FLEXY_DRAWER_WIDTHS = [447, 607, 767, 867];
export const FLEXY_SIDE_HEIGHTS = [1189, 1509, 1829];
