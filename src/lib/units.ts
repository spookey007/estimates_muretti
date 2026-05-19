import type { MeasurementUnit } from "./types";

export function toMm(value: number, unit: MeasurementUnit): number {
  switch (unit) {
    case "mm":
      return value;
    case "cm":
      return value * 10;
    case "in":
      return value * 25.4;
    default:
      return value;
  }
}

export function snapUp(value: number, ladder: number[]): number {
  const sorted = [...ladder].sort((a, b) => a - b);
  for (const step of sorted) {
    if (value <= step) return step;
  }
  return sorted[sorted.length - 1];
}

export function snapUpHeight(value: number, ladder: number[]): number {
  const sorted = [...ladder].sort((a, b) => a - b);
  for (const step of sorted) {
    if (value <= step) return step;
  }
  return sorted[sorted.length - 1];
}

export function formatMm(mm: number, unit: MeasurementUnit): string {
  if (unit === "in") return `${(mm / 25.4).toFixed(2)} in`;
  if (unit === "cm") return `${(mm / 10).toFixed(1)} cm`;
  return `${Math.round(mm)} mm`;
}
