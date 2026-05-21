function envInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

/** Max PDF upload size for AI import (default 20 MB). */
export function getMaxPdfBytes(): number {
  const mb = envInt("IMPORT_PDF_MAX_MB", 20);
  return mb * 1024 * 1024;
}
