"use client";

import { EditableTextInput } from "@/components/estimate/EditableField";
import { EstimateLinesView } from "@/components/estimate/EstimateLinesView";
import { SELECT, sumMoney } from "@/components/estimate/line-shared";
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
  embedded = false,
}: {
  request: EstimateRequest;
  onRequestChange: (next: EstimateRequest) => void;
  result: EstimateResponse;
  onDownloadPdf: () => void;
  pdfLoading: boolean;
  embedded?: boolean;
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
    <section
      className={`w-full min-w-0 max-w-full space-y-6 overflow-x-hidden sm:space-y-7 ${
        embedded ? "mt-0" : "mt-5 sm:mt-6"
      }`}
    >
      <div className="space-y-4 rounded-xl border border-[var(--border)] bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <label className="block min-w-0 flex-1 space-y-1.5">
            <span className="field-label">Project name</span>
            <EditableTextInput
              lineId="project-name"
              value={request.project_name}
              placeholder="e.g. Master bedroom closet"
              onCommit={(v) => updateSettings({ project_name: v })}
            />
          </label>
          <div className="flex shrink-0 flex-wrap gap-2 pb-0.5">
            <button
              type="button"
              onClick={() => downloadPricedCsv(result)}
              className="btn-secondary py-2 text-xs sm:text-sm"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={onDownloadPdf}
              disabled={pdfLoading}
              className="btn-primary py-2 text-xs sm:text-sm"
            >
              {pdfLoading ? "Preparing…" : "Download PDF"}
            </button>
          </div>
        </div>

        <div className="border-t border-[var(--border)] pt-4">
          <p className="field-label mb-3">Settings</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5 sm:gap-4">
            <Field label="System">
              <select
                className={SELECT}
                value={request.system}
                onChange={(e) =>
                  updateSettings({ system: e.target.value as System })
                }
              >
                <option value="with_panels">With panels</option>
                <option value="without_panels">Without panels</option>
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
                <option value="melamine">Melamine</option>
                <option value="lacquered">Lacquered</option>
              </select>
            </Field>
            <Field label="Basis">
              <select
                className={SELECT}
                value={request.measurement_basis}
                onChange={(e) =>
                  updateSettings({
                    measurement_basis: e.target.value as MeasurementBasis,
                  })
                }
              >
                <option value="finished">Finished</option>
                <option value="panel">Panel</option>
                <option value="opening">Opening</option>
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
            <div className="col-span-2 flex items-end sm:col-span-4 lg:col-span-1">
              <div className="w-full rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-3 py-2.5 text-white">
                <p className="text-[10px] uppercase tracking-wide text-white/75">
                  Total net
                </p>
                <p className="text-lg font-semibold tabular-nums">
                  {result.total_net.toFixed(2)}{" "}
                  <span className="text-sm font-medium">EUR</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-[var(--muted)]">
          {totalsCheck.lineCount} lines · structural{" "}
          {(result.subtotals.structural ?? 0).toFixed(2)} · equipment{" "}
          {(result.subtotals.equipment ?? 0).toFixed(2)}
          {!totalsCheck.ok ? (
            <span className="ml-2 font-medium text-[var(--danger)]">
              Totals mismatch
            </span>
          ) : null}
        </p>
      </div>

      <div className="space-y-5">
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
      </div>

      {result.warnings.length > 0 && (
        <details className="rounded-xl border border-[#f0d9a0] bg-[var(--warn-soft)] p-4 text-sm text-[var(--warn)]">
          <summary className="cursor-pointer font-medium select-none">
            Catalog notes ({result.warnings.length})
          </summary>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-xs">
            {result.warnings.map((w, i) => (
              <li key={i} className="break-words">
                {w}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}
