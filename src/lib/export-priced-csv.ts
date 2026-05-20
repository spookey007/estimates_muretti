import { cutsForParent } from "@/lib/line-cuts";
import type { EstimateResponse } from "@/lib/types";

/** Export priced lines — product rows with cut columns (Muretti p.52). */
export function exportPricedCsv(result: EstimateResponse): string {
  const headers = [
    "line_id",
    "room",
    "role",
    "input_width_mm",
    "catalog_width_mm",
    "catalog_height_mm",
    "code",
    "description",
    "quantity",
    "finish",
    "catalog_unit_eur",
    "catalog_line_eur",
    "cut_code",
    "cut_eur",
    "line_total_eur",
    "accuracy",
    "notes",
  ];

  const escape = (v: string) => {
    if (v.includes(",") || v.includes('"') || v.includes("\n")) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };

  const productLines = result.lines.filter(
    (l) => l.line_kind !== "surcharge" && l.line_kind !== "delivery",
  );

  const rows = productLines.map((l) => {
    const cuts = cutsForParent(l.line_id, result);
    const combined = Math.round((l.line_total + cuts.total) * 100) / 100;
    return [
      l.line_id,
      l.room ?? "",
      l.role,
      l.input_mm.l != null ? String(l.input_mm.l) : "",
      l.resolved_mm.l != null ? String(l.resolved_mm.l) : "",
      l.resolved_mm.h != null ? String(l.resolved_mm.h) : "",
      l.code,
      l.description,
      String(l.quantity),
      l.finish_applied ?? "",
      l.unit_price.toFixed(2),
      l.line_total.toFixed(2),
      cuts.codes,
      cuts.total > 0 ? cuts.total.toFixed(2) : "",
      combined.toFixed(2),
      l.accuracy,
      l.notes ?? "",
    ]
      .map(escape)
      .join(",");
  });

  const delivery = result.lines.find((l) => l.line_kind === "delivery");
  if (delivery) {
    rows.push(
      [
        delivery.line_id,
        "",
        "delivery",
        "",
        "",
        "",
        delivery.code,
        delivery.description,
        "1",
        delivery.finish_applied ?? "",
        delivery.unit_price.toFixed(2),
        delivery.line_total.toFixed(2),
        "",
        "",
        delivery.line_total.toFixed(2),
        delivery.accuracy,
        "",
      ]
        .map(escape)
        .join(","),
    );
  }

  return [headers.join(","), ...rows].join("\n");
}

export function downloadPricedCsv(result: EstimateResponse, filename?: string) {
  const csv = exportPricedCsv(result);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    filename ??
    `Muretti-priced-${result.project_name.replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 30) || "estimate"}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
