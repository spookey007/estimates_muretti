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
import { useMemo, type ReactNode } from "react";

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

function useRowMeta(row: MergedRow) {
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

  return { snapWhy, resolvedLabel };
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
    <section className="mt-6 space-y-5 sm:mt-8 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold break-words sm:text-xl">
            {result.project_name}
          </h2>
          <p className="mt-1 text-xs text-stone-600 sm:text-sm">
            <span className="block sm:inline">{result.price_list_label}</span>
            <span className="hidden sm:inline"> | </span>
            <span className="block sm:inline">{result.finish}</span>
            <span className="hidden sm:inline"> | </span>
            <span className="block sm:inline">{result.system}</span>
            <span className="hidden sm:inline"> | </span>
            <span className="block sm:inline">
              confidence:{" "}
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
            </span>
            <span className="mt-1 block text-amber-800 sm:ml-2 sm:mt-0 sm:inline">
              (live updates)
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={pdfLoading}
          className="w-full shrink-0 rounded-lg border border-stone-800 bg-stone-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60 sm:w-auto"
        >
          {pdfLoading ? "Preparing PDF..." : "Download PDF"}
        </button>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-3 sm:p-4">
        <h3 className="text-sm font-medium text-stone-800">Project settings</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Project name">
            <input
              className="mt-1 w-full rounded border border-stone-200 px-2 py-2 text-sm"
              value={request.project_name}
              onChange={(e) => updateSettings({ project_name: e.target.value })}
            />
          </Field>
          <Field label="System">
            <select
              className="mt-1 w-full rounded border border-stone-200 px-2 py-2 text-sm"
              value={request.system}
              onChange={(e) =>
                updateSettings({ system: e.target.value as System })
              }
            >
              <option value="with_panels">with_panels</option>
              <option value="without_panels">without_panels</option>
            </select>
          </Field>
          <Field label="Finish">
            <select
              className="mt-1 w-full rounded border border-stone-200 px-2 py-2 text-sm"
              value={request.finish}
              onChange={(e) =>
                updateSettings({ finish: e.target.value as Finish })
              }
            >
              <option value="melamine">melamine</option>
              <option value="lacquered">lacquered</option>
            </select>
          </Field>
          <Field label="Measurement basis">
            <select
              className="mt-1 w-full rounded border border-stone-200 px-2 py-2 text-sm"
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
          </Field>
        </div>
      </div>

      <CalculationGuide />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <Stat label="Structural" value={result.subtotals.structural} />
        <Stat label="Equipment" value={result.subtotals.equipment} />
        <Stat label="Total net (EUR)" value={result.total_net} highlight />
      </div>

      {/* Mobile / tablet: card list */}
      <div className="space-y-3 lg:hidden">
        <p className="text-xs text-stone-500">
          {rows.length} lines - tap fields to edit
        </p>
        {rows.map((row) => (
          <LineCard key={row.line_id} row={row} onChange={updateLine} />
        ))}
      </div>

      {/* Desktop: scrollable table */}
      <div className="hidden lg:block">
        <p className="mb-2 text-xs text-stone-500">
          Scroll horizontally if needed. {rows.length} lines.
        </p>
        <div className="relative rounded-xl border bg-white">
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[1200px] text-left text-sm">
              <thead className="bg-stone-50 text-xs text-stone-600">
                <tr>
                  <th className="sticky left-0 z-10 bg-stone-50 p-2 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                    line_id
                  </th>
                  <th className="p-2">room</th>
                  <th className="p-2">role</th>
                  <th className="p-2">qty</th>
                  <th className="p-2">height_mm</th>
                  <th className="p-2">width_mm</th>
                  <th className="p-2">depth_mm</th>
                  <th className="p-2">side</th>
                  <th className="p-2">depth_type</th>
                  <th className="p-2">notes</th>
                  <th className="border-l border-stone-200 p-2">resolved</th>
                  <th className="p-2">code</th>
                  <th className="p-2">unit</th>
                  <th className="p-2">total</th>
                  <th className="p-2">accuracy</th>
                  <th className="min-w-[12rem] p-2">why</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <LineTableRow key={row.line_id} row={row} onChange={updateLine} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {result.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 sm:p-4">
          <p className="font-medium">Catalog adjustments</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {result.warnings.map((w, i) => (
              <li key={i} className="break-words">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs leading-relaxed text-stone-500">{result.disclaimer}</p>
    </section>
  );
}

function LineCard({
  row,
  onChange,
}: {
  row: MergedRow;
  onChange: (lineId: string, patch: Partial<EstimateLineInput>) => void;
}) {
  const { snapWhy, resolvedLabel } = useRowMeta(row);

  return (
    <article className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-stone-100 pb-3">
        <div>
          <span className="font-semibold text-stone-900">{row.line_id}</span>
          {row.room && (
            <span className="ml-2 text-xs text-stone-500">{row.room}</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AccuracyBadge accuracy={row.accuracy} />
          <span className="text-sm font-semibold tabular-nums">
            {row.line_total.toFixed(2)} EUR
          </span>
        </div>
      </div>

      <div className="mt-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-stone-400">
          CSV input
        </p>
        <LineFields row={row} onChange={onChange} layout="card" />
      </div>

      <div className="mt-4 rounded-lg bg-stone-50 p-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-stone-400">
          SCENIKA result
        </p>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs sm:grid-cols-3">
          <div>
            <dt className="text-stone-500">resolved</dt>
            <dd className="font-mono font-medium">{resolvedLabel || "-"}</dd>
          </div>
          <div>
            <dt className="text-stone-500">code</dt>
            <dd className="font-mono font-medium">{row.code}</dd>
          </div>
          <div>
            <dt className="text-stone-500">unit EUR</dt>
            <dd className="tabular-nums">{row.unit_price.toFixed(2)}</dd>
          </div>
          <div className="col-span-2 sm:col-span-3">
            <dt className="text-stone-500">why</dt>
            <dd className="mt-0.5 text-stone-700">
              {snapWhy ?? (row.accuracy === "exact" ? "Matches catalog" : "-")}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

function LineTableRow({
  row,
  onChange,
}: {
  row: MergedRow;
  onChange: (lineId: string, patch: Partial<EstimateLineInput>) => void;
}) {
  const { snapWhy, resolvedLabel } = useRowMeta(row);

  return (
    <tr className="border-t align-top hover:bg-stone-50/50">
      <td className="sticky left-0 z-[1] bg-white p-2 font-medium shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
        {row.line_id}
      </td>
      <td className="p-1">
        <CellInput
          value={row.room ?? ""}
          onChange={(v) => onChange(row.line_id, { room: v || undefined })}
        />
      </td>
      <td className="p-1">
        <RoleSelect row={row} onChange={onChange} />
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
      <LineFields row={row} onChange={onChange} layout="table-rest" />
      <td className="border-l border-stone-100 p-2 font-mono text-xs">
        {resolvedLabel || "-"}
      </td>
      <td className="p-2 font-mono text-xs">{row.code}</td>
      <td className="p-2 tabular-nums">{row.unit_price.toFixed(2)}</td>
      <td className="p-2 font-medium tabular-nums">{row.line_total.toFixed(2)}</td>
      <td className="p-2">
        <AccuracyBadge accuracy={row.accuracy} />
      </td>
      <td className="max-w-[14rem] p-2 text-xs text-stone-600">
        {snapWhy ?? (row.accuracy === "exact" ? "Matches catalog" : "-")}
      </td>
    </tr>
  );
}

function LineFields({
  row,
  onChange,
  layout,
}: {
  row: MergedRow;
  onChange: (lineId: string, patch: Partial<EstimateLineInput>) => void;
  layout: "card" | "table-rest";
}) {
  const fields = (
    <>
      {layout === "card" && (
        <Field label="role">
          <RoleSelect row={row} onChange={onChange} />
        </Field>
      )}
      <Field label="quantity">
        <CellInput
          type="number"
          value={String(row.quantity)}
          onChange={(v) =>
            onChange(row.line_id, { quantity: Math.max(1, Number(v) || 1) })
          }
        />
      </Field>
      <Field label="height_mm">
        <CellInput
          type="number"
          value={row.h != null ? String(row.h) : ""}
          onChange={(v) =>
            onChange(row.line_id, { h: v === "" ? undefined : Number(v) })
          }
        />
      </Field>
      <Field label="width_mm">
        <CellInput
          type="number"
          value={row.l != null ? String(row.l) : ""}
          onChange={(v) =>
            onChange(row.line_id, { l: v === "" ? undefined : Number(v) })
          }
        />
      </Field>
      <Field label="depth_mm">
        <CellInput
          type="number"
          value={row.d != null ? String(row.d) : ""}
          onChange={(v) =>
            onChange(row.line_id, { d: v === "" ? undefined : Number(v) })
          }
        />
      </Field>
      <Field label="side">
        <CellInput
          value={row.side ?? ""}
          onChange={(v) =>
            onChange(row.line_id, {
              side: (v as EstimateLineInput["side"]) || undefined,
            })
          }
        />
      </Field>
      <Field label="depth_type">
        <DepthSelect row={row} onChange={onChange} />
      </Field>
      <Field label="notes" className={layout === "card" ? "col-span-2" : undefined}>
        <CellInput
          value={row.notes ?? ""}
          onChange={(v) => onChange(row.line_id, { notes: v || undefined })}
        />
      </Field>
    </>
  );

  if (layout === "card") {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{fields}</div>
    );
  }

  return (
    <>
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
        <DepthSelect row={row} onChange={onChange} />
      </td>
      <td className="p-1">
        <CellInput
          value={row.notes ?? ""}
          onChange={(v) => onChange(row.line_id, { notes: v || undefined })}
        />
      </td>
    </>
  );
}

function RoleSelect({
  row,
  onChange,
}: {
  row: MergedRow;
  onChange: (lineId: string, patch: Partial<EstimateLineInput>) => void;
}) {
  return (
    <select
      className="w-full min-w-0 rounded border border-stone-200 px-1.5 py-1.5 text-xs sm:text-sm"
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
  );
}

function DepthSelect({
  row,
  onChange,
}: {
  row: MergedRow;
  onChange: (lineId: string, patch: Partial<EstimateLineInput>) => void;
}) {
  return (
    <select
      className="w-full min-w-0 rounded border border-stone-200 px-1.5 py-1.5 text-xs"
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
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-xs text-stone-500 ${className ?? ""}`}>
      <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
      <div className="mt-0.5">{children}</div>
    </label>
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
      className="w-full min-w-0 rounded border border-stone-200 px-2 py-1.5 text-xs sm:text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function CalculationGuide() {
  return (
    <details className="rounded-xl border border-blue-100 bg-blue-50/80 p-3 text-sm text-blue-950 sm:p-4">
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
      <p className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">
        {value.toFixed(2)}
      </p>
    </div>
  );
}
