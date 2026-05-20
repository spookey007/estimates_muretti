"use client";

import { EditableTextInput } from "@/components/estimate/EditableField";
import { EstimateLinesView } from "@/components/estimate/EstimateLinesView";
import { INPUT, SELECT, sumMoney } from "@/components/estimate/line-shared";
import type {
  EstimateLineInput,
  EstimateRequest,
  EstimateResponse,
  Finish,
  MeasurementBasis,
  MeasurementUnit,
  System,
} from "@/lib/types";
import { downloadPricedCsv } from "@/lib/export-priced-csv";
import { useEstimateSceneSync } from "@/cad/hooks/use-estimate-scene-sync";
import { useMemo, type ReactNode } from "react";

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
  const totalsCheck = useMemo(() => {
    const lineTotals = result.lines.map((l) => l.line_total);
    const linesSum = sumMoney(lineTotals);
    const subSum = sumMoney([
      result.subtotals.structural ?? 0,
      result.subtotals.equipment ?? 0,
      result.subtotals.customization ?? 0,
      result.subtotals.led ?? 0,
      result.subtotals.delivery ?? 0,
      result.subtotals.unresolved ?? 0,
    ]);
    const ok =
      Math.abs(linesSum - subSum) < 0.01 &&
      Math.abs(linesSum - result.total_net) < 0.01;
    return { linesSum, subSum, ok, lineCount: result.lines.length };
  }, [result]);

  useEstimateSceneSync(request);

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
    <section className="mt-6 w-full min-w-0 space-y-5 sm:mt-8 sm:space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold break-words sm:text-xl">
            {result.project_name}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-stone-600 sm:text-sm">
            {result.price_list_label} &middot; {result.finish} &middot; {result.system}
            <br className="sm:hidden" />
            <span className="hidden sm:inline"> &middot; </span>
            confidence{" "}
            <span
              className={
                result.overall_confidence === "high"
                  ? "font-medium text-green-700"
                  : result.overall_confidence === "medium"
                    ? "font-medium text-amber-700"
                    : "font-medium text-red-700"
              }
            >
              {result.overall_confidence}
            </span>
            <span className="text-amber-800"> (live)</span>
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row lg:w-auto">
          <button
            type="button"
            onClick={() => downloadPricedCsv(result)}
            className="w-full rounded-lg border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-900 lg:w-auto"
          >
            Export priced CSV
          </button>
          <button
            type="button"
            onClick={onDownloadPdf}
            disabled={pdfLoading}
            className="w-full rounded-lg border border-stone-800 bg-stone-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-60 lg:w-auto"
          >
            {pdfLoading ? "Preparing PDF..." : "Download PDF"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-stone-800">Project settings</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Project name">
            <EditableTextInput
              lineId="project-name"
              value={request.project_name}
              placeholder="e.g. Master bedroom closet"
              onCommit={(v) => updateSettings({ project_name: v })}
            />
          </Field>
          <Field label="System">
            <select
              className={SELECT}
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
              className={SELECT}
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
              className={SELECT}
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
          <Field label="Units">
            <select
              className={SELECT}
              value={request.measurement_unit}
              onChange={(e) =>
                updateSettings({
                  measurement_unit: e.target.value as MeasurementUnit,
                })
              }
            >
              <option value="mm">mm</option>
              <option value="cm">cm</option>
              <option value="in">in</option>
            </select>
          </Field>
        </div>
      </div>

      <CalculationGuide />

      <TotalsBar result={result} check={totalsCheck} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <Stat label="Structural (EUR)" value={result.subtotals.structural ?? 0} />
        <Stat label="Equipment (EUR)" value={result.subtotals.equipment ?? 0} />
        <Stat label="Total net (EUR)" value={result.total_net} highlight />
      </div>

      <p className="text-xs text-stone-500">
        Default finish: <strong>{request.finish}</strong>. Set per line in the{" "}
        <strong>finish</strong> column — blank uses project default.
      </p>

      <EstimateLinesView
        request={request}
        result={result}
        onChange={updateLine}
        onRequestChange={onRequestChange}
        onAddLine={(line) =>
          onRequestChange({
            ...request,
            lines: [...request.lines, line],
          })
        }
      />

      {result.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
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

function TotalsBar({
  result,
  check,
}: {
  result: EstimateResponse;
  check: {
    linesSum: number;
    subSum: number;
    ok: boolean;
    lineCount: number;
  };
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-xs text-stone-700 sm:text-sm">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span>
          <strong>{check.lineCount}</strong> lines
        </span>
        <span className="tabular-nums">
          Sum of lines: <strong>{check.linesSum.toFixed(2)}</strong> EUR
        </span>
        <span className="tabular-nums">
          Structural + equipment: <strong>{check.subSum.toFixed(2)}</strong> EUR
        </span>
        <span className="tabular-nums">
          Total net: <strong>{result.total_net.toFixed(2)}</strong> EUR
        </span>
        {check.ok ? (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-800">
            totals match
          </span>
        ) : (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-800">
            totals mismatch
          </span>
        )}
      </div>
      <p className="mt-1 text-[11px] text-stone-500 sm:text-xs">
        Each line = unit price x quantity. Subtotals sum to total net.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-medium text-stone-500">{label}</span>
      {children}
    </label>
  );
}

function CalculationGuide() {
  return (
    <details className="rounded-xl border border-blue-100 bg-blue-50/80 p-4 text-sm text-blue-950">
      <summary className="cursor-pointer font-medium select-none">
        How pricing works (for client demo)
      </summary>
      <div className="mt-3 space-y-2 text-xs leading-relaxed sm:text-sm">
        <p>
          Prices from <strong>SCENIKA 10/2023</strong>. Unit price x quantity per line.
        </p>
        <p>
          <strong>Shelves (Muretti):</strong> stock widths 483 / 643 / 803 / 903 mm only.
          Customer width 650 mm → order <strong>803</strong> mm, charge 803 mm catalog price
          + cut code from PDF p.52 (e.g. TALARI 29 EUR) in the <strong>cut_eur</strong> column.
        </p>
        <p>
          Cuts apply when requested size (after basis rules) is not exactly a catalog size.
        </p>
      </div>
    </details>
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
      className={`rounded-xl border p-4 sm:p-5 ${
        highlight ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white"
      }`}
    >
      <p className="text-xs opacity-80 sm:text-sm">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">
        {value.toFixed(2)}
      </p>
    </div>
  );
}
