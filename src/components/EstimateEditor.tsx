"use client";

import { explainSnap } from "@/lib/pricing-explain";
import type {
  EstimateLineInput,
  EstimateRequest,
  EstimateResponse,
  Finish,
  LineRole,
  MeasurementBasis,
  PricedLine,
  System,
} from "@/lib/types";
import { useMemo } from "react";

const ROLES: LineRole[] = [
  "upright",
  "corner_upright",
  "back_panel",
  "linear_filler",
  "mirror",
  "shelf",
  "footboard",
];

type MergedRow = EstimateLineInput & PricedLine;

function mergeRows(request: EstimateRequest, result: EstimateResponse): MergedRow[] {
  return result.lines.map((priced) => {
    const input =
      request.lines.find((l) => l.line_id === priced.line_id) ?? priced;
    return { ...input, ...priced };
  });
}

export function EstimateEditor({
  request,
  onRequestChange,
  result,
  onDownloadPdf,
  pdfLoading,
}: {
  request: EstimateRequest;
  onRequestChange: (next: EstimateRequest) => void;
  result: EstimateResponse;
  onDownloadPdf: () => void;
  pdfLoading: boolean;
}) {
  const rows = useMemo(() => mergeRows(request, result), [request, result]);

  const updateSettings = (patch: Partial<EstimateRequest>) => {
    onRequestChange({ ...request, ...patch });
  };

  const updateLine = (lineId: string, patch: Partial<EstimateLineInput>) => {
    onRequestChange({
      ...request,
      lines: request.lines.map((l) =>
        l.line_id === lineId ? { ...l, ...patch } : l,
      ),
    });
  };

  return (
    <section className="mt-8 space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{result.project_name}</h2>
          <p className="text-sm text-stone-600">
            {result.price_list_label} | {result.finish} | {result.system} | confidence:{" "}
            <span
              className={
                result.overall_confidence === "high"
                  ? "text-green-700"
                  : result.overall_confidence === "medium"
                    ? "text-amber-700"
                    : "text-red-700"
              }
            >
              {result.overall_confidence}
            </span>
            <span className="ml-2 text-amber-800">(updates as you edit)</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={pdfLoading}
          className="rounded border border-stone-800 bg-stone-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pdfLoading ? "Preparing PDF..." : "Download PDF"}
        </button>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <h3 className="text-sm font-medium text-stone-800">Project settings</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-xs text-stone-500">
            Project name
            <input
              className="mt-1 w-full rounded border border-stone-200 px-2 py-1.5 text-sm"
              value={request.project_name}
              onChange={(e) => updateSettings({ project_name: e.target.value })}
            />
          </label>
          <label className="block text-xs text-stone-500">
            System
            <select
              className="mt-1 w-full rounded border border-stone-200 px-2 py-1.5 text-sm"
              value={request.system}
              onChange={(e) =>
                updateSettings({ system: e.target.value as System })
              }
            >
              <option value="with_panels">with_panels</option>
              <option value="without_panels">without_panels</option>
            </select>
          </label>
          <label className="block text-xs text-stone-500">
            Finish
            <select
              className="mt-1 w-full rounded border border-stone-200 px-2 py-1.5 text-sm"
              value={request.finish}
              onChange={(e) =>
                updateSettings({ finish: e.target.value as Finish })
              }
            >
              <option value="melamine">melamine</option>
              <option value="lacquered">lacquered</option>
            </select>
          </label>
          <label className="block text-xs text-stone-500">
            Measurement basis
            <select
              className="mt-1 w-full rounded border border-stone-200 px-2 py-1.5 text-sm"
              value={request.measurement_basis}
              onChange={(e) =>
                updateSettings({
                  measurement_basis: e.target.value as MeasurementBasis,
                })
              }
            >
              <option value="finished">finished</option>
              <option value="panel">panel</option>
              <option value="opening">opening</option>
            </select>
          </label>
        </div>
      </div>

      <CalculationGuide />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Structural" value={result.subtotals.structural} />
        <Stat label="Equipment" value={result.subtotals.equipment} />
        <Stat label="Total net (EUR)" value={result.total_net} highlight />
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[1400px] text-left text-sm">
          <thead className="bg-stone-50 text-xs text-stone-600">
            <tr>
              <th className="p-2" colSpan={10}>
                CSV input (editable)
              </th>
              <th className="border-l border-stone-200 p-2" colSpan={6}>
                SCENIKA result
              </th>
            </tr>
            <tr>
              <th className="p-2">line_id</th>
              <th className="p-2">room</th>
              <th className="p-2">role</th>
              <th className="p-2">quantity</th>
              <th className="p-2">height_mm</th>
              <th className="p-2">width_mm</th>
              <th className="p-2">depth_mm</th>
              <th className="p-2">side</th>
              <th className="p-2">depth_type</th>
              <th className="p-2">notes</th>
              <th className="border-l border-stone-200 p-2">resolved (mm)</th>
              <th className="p-2">code</th>
              <th className="p-2">unit EUR</th>
              <th className="p-2">total EUR</th>
              <th className="p-2">accuracy</th>
              <th className="p-2">why</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <LineRow key={row.line_id} row={row} onChange={updateLine} />
            ))}
          </tbody>
        </table>
      </div>

      {result.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Catalog adjustments</p>
          <ul className="mt-2 list-disc pl-5">
            {result.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs text-stone-500">{result.disclaimer}</p>
    </section>
  );
}

function LineRow({
  row,
  onChange,
}: {
  row: MergedRow;
  onChange: (lineId: string, patch: Partial<EstimateLineInput>) => void;
}) {
  const snapWhy =
    explainSnap(row.role, "width", row.input_mm.l, row.resolved_mm.l) ??
    explainSnap(row.role, "height", row.input_mm.h, row.resolved_mm.h);

  const shelfDepth =
    row.depth_type === "414" || row.depth_type === "510"
      ? Number(row.depth_type)
      : row.d === 414 || row.d === 510
        ? row.d
        : 510;

  const resolvedLabel = [
    row.resolved_mm.h != null && `H${row.resolved_mm.h}`,
    row.resolved_mm.l != null && `L${row.resolved_mm.l}`,
    row.role === "shelf" && `D${shelfDepth}`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <tr className="border-t align-top">
      <td className="p-2 font-medium text-stone-800">{row.line_id}</td>
      <td className="p-1">
        <CellInput
          value={row.room ?? ""}
          onChange={(v) => onChange(row.line_id, { room: v || undefined })}
        />
      </td>
      <td className="p-1">
        <select
          className="w-full min-w-[7rem] rounded border border-stone-200 px-1 py-1 text-xs"
          value={row.role}
          onChange={(e) =>
            onChange(row.line_id, { role: e.target.value as LineRole })
          }
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </td>
      <td className="p-1">
        <CellInput
          type="number"
          value={String(row.quantity)}
          onChange={(v) =>
            onChange(row.line_id, { quantity: Math.max(1, Number(v) || 1) })
          }
        />
      </td>
      <td className="p-1">
        <CellInput
          type="number"
          value={row.h != null ? String(row.h) : ""}
          onChange={(v) =>
            onChange(row.line_id, { h: v === "" ? undefined : Number(v) })
          }
        />
      </td>
      <td className="p-1">
        <CellInput
          type="number"
          value={row.l != null ? String(row.l) : ""}
          onChange={(v) =>
            onChange(row.line_id, { l: v === "" ? undefined : Number(v) })
          }
        />
      </td>
      <td className="p-1">
        <CellInput
          type="number"
          value={row.d != null ? String(row.d) : ""}
          onChange={(v) =>
            onChange(row.line_id, { d: v === "" ? undefined : Number(v) })
          }
        />
      </td>
      <td className="p-1">
        <CellInput
          value={row.side ?? ""}
          onChange={(v) =>
            onChange(row.line_id, {
              side: (v as EstimateLineInput["side"]) || undefined,
            })
          }
        />
      </td>
      <td className="p-1">
        <select
          className="w-full rounded border border-stone-200 px-1 py-1 text-xs"
          value={row.depth_type ?? ""}
          onChange={(e) =>
            onChange(row.line_id, {
              depth_type:
                e.target.value === "414" || e.target.value === "510"
                  ? e.target.value
                  : undefined,
            })
          }
        >
          <option value="">-</option>
          <option value="510">510</option>
          <option value="414">414</option>
        </select>
      </td>
      <td className="p-1">
        <CellInput
          value={row.notes ?? ""}
          onChange={(v) => onChange(row.line_id, { notes: v || undefined })}
        />
      </td>
      <td className="border-l border-stone-100 p-2 font-mono text-xs text-stone-700">
        {resolvedLabel || "-"}
      </td>
      <td className="p-2 font-mono text-xs">{row.code}</td>
      <td className="p-2">{row.unit_price.toFixed(2)}</td>
      <td className="p-2 font-medium">{row.line_total.toFixed(2)}</td>
      <td className="p-2">
        <AccuracyBadge accuracy={row.accuracy} />
      </td>
      <td className="max-w-[14rem] p-2 text-xs text-stone-600">
        {snapWhy ?? (row.accuracy === "exact" ? "Matches catalog" : "-")}
      </td>
    </tr>
  );
}

function CellInput({
  value,
  onChange,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "number";
}) {
  return (
    <input
      type={type}
      className="w-full min-w-[3.5rem] rounded border border-stone-200 px-1.5 py-1 text-xs"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function CalculationGuide() {
  return (
    <details className="rounded-xl border border-blue-100 bg-blue-50/80 p-4 text-sm text-blue-950">
      <summary className="cursor-pointer font-medium">
        How pricing works (for client demo)
      </summary>
      <div className="mt-3 space-y-3 text-xs leading-relaxed">
        <p>
          Prices and product codes come from the{" "}
          <strong>SCENIKA 10/2023</strong> price list (Play s.r.l.). Each line is
          matched to a catalog code; unit price is taken from that row in the list.
        </p>
        <p>
          <strong>Why L10 shelf shows snapped L903 when you entered 900:</strong>{" "}
          Back panels and shelves use different standard widths in the PDF.
          Panels: 480, 640, 800, <strong>900</strong> mm. Shelves: 483, 643, 803,{" "}
          <strong>903</strong> mm (+3 mm vs the bay). The engine picks the smallest
          catalog size greater than or equal to your input (snap up). So 900 becomes
          903, code <strong>1RL1710</strong>, 88.00 EUR (melamine, depth 510).
        </p>
        <p>
          <strong>Exact match:</strong> enter <strong>903</strong> in{" "}
          <code className="rounded bg-white px-1">width_mm</code> for a shelf on a
          900 mm bay - accuracy turns green exact.
        </p>
        <p>
          <strong>Depth 510:</strong> use column{" "}
          <code className="rounded bg-white px-1">depth_type</code> (510 or 414) or
          put 510 in <code className="rounded bg-white px-1">depth_mm</code> - both
          work for shelves.
        </p>
        <p className="text-stone-600">
          Cuts to non-catalog sizes are surcharges in the PDF (e.g. TALARI shelf width
          cut 29 EUR) - not auto-added in this tool yet.
        </p>
      </div>
    </details>
  );
}

function AccuracyBadge({ accuracy }: { accuracy: PricedLine["accuracy"] }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs ${
        accuracy === "exact"
          ? "bg-green-100 text-green-800"
          : accuracy === "snapped"
            ? "bg-amber-100 text-amber-800"
            : "bg-stone-100"
      }`}
    >
      {accuracy}
    </span>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${highlight ? "border-stone-900 bg-stone-900 text-white" : "bg-white"}`}
    >
      <p className="text-sm opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value.toFixed(2)}</p>
    </div>
  );
}
