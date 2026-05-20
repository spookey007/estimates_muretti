/**
 * Direct product-code lookup (doors and misc SKUs).
 * Expand from PDF pages 54-99 as needed.
 */
import type { PriceEntry } from "@/data/scenika-2023-10";

/** Codes with a single list price (both finishes). */
export const PRODUCT_BY_CODE: Record<string, PriceEntry> = {
  // Door / closing samples — add rows from PDF as you validate quotes
  LAOPBA: { code: "LAOPBA", melamine: 383, lacquered: 383 },
};

export function lookupProductCode(code: string): PriceEntry | undefined {
  const key = code.trim().toUpperCase();
  return PRODUCT_BY_CODE[key];
}
