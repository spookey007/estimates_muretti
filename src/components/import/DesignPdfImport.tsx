"use client";

import { apiFetch } from "@/lib/client/api-fetch";
import { DESIGN_PDF_SYSTEM_PROMPT_SUMMARY } from "@/lib/import/design-pdf-prompt";
import type { EstimateRequest, EstimateResponse } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

type ImportApiResponse = {
  request: EstimateRequest;
  estimate: EstimateResponse;
  warnings: string[];
  import_notes?: string;
  closets: { room: string; lineCount: number }[];
  model: string;
  provider?: string;
  provider_label?: string;
  usage?: { input_tokens: number; output_tokens: number };
};

export function DesignPdfImport({
  onImported,
  onError,
}: {
  onImported: (request: EstimateRequest, meta: ImportApiResponse) => void;
  onError: (message: string | null) => void;
}) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [userPrompt, setUserPrompt] = useState("");
  const [projectName, setProjectName] = useState("");
  const [measurementUnit, setMeasurementUnit] = useState<"mm" | "cm" | "in">("mm");
  const [measurementBasis, setMeasurementBasis] = useState<
    "finished" | "panel" | "opening"
  >("finished");
  const [system, setSystem] = useState<"with_panels" | "without_panels">(
    "with_panels",
  );
  const [finish, setFinish] = useState<"melamine" | "lacquered">("melamine");
  const [loading, setLoading] = useState(false);
  const [lastMeta, setLastMeta] = useState<ImportApiResponse | null>(null);
  const [aiConfigLabel, setAiConfigLabel] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/api/import-design-pdf")
      .then((r) => r.json())
      .then((data: { provider_label?: string; api_key_set?: boolean }) => {
        if (data.provider_label) setAiConfigLabel(data.provider_label);
        if (data.api_key_set === false) {
          onError("ANTHROPIC_API_KEY is not set in web/.env");
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load config once on mount
  }, []);

  const runImport = useCallback(async () => {
    if (!pdfFile) {
      onError("Choose a design PDF first");
      return;
    }
    setLoading(true);
    onError(null);
    setLastMeta(null);
    try {
      const form = new FormData();
      form.append("file", pdfFile);
      form.append("prompt", userPrompt);
      if (projectName.trim()) form.append("project_name", projectName.trim());
      form.append("measurement_unit", measurementUnit);
      form.append("measurement_basis", measurementBasis);
      form.append("system", system);
      form.append("finish", finish);

      const res = await apiFetch("/api/import-design-pdf", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.request) {
          onImported(data.request, data as ImportApiResponse);
        }
        throw new Error(data.error ?? `Import failed (${res.status})`);
      }
      const meta = data as ImportApiResponse;
      setLastMeta(meta);
      onImported(meta.request, meta);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }, [
    pdfFile,
    userPrompt,
    projectName,
    measurementUnit,
    measurementBasis,
    system,
    finish,
    onImported,
    onError,
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <h2 className="text-base font-semibold">Import from design PDF</h2>
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          Upload a customer closet PDF. AI extracts lines into the estimate —
          review before quoting.
        </p>
      </div>

      <label className="block space-y-2">
        <span className="field-label">Design PDF</span>
        <input
          type="file"
          accept=".pdf,application/pdf"
          className="field-control file:mr-3 file:rounded-md file:border-0 file:bg-[#eef2f6] file:px-3 file:py-1.5 file:text-sm file:font-medium"
          onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
        />
      </label>

      <label className="block space-y-2">
        <span className="field-label">Notes for AI (optional)</span>
        <textarea
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          rows={3}
          className="field-control min-h-[5rem] resize-y"
          placeholder="e.g. Ignore master bath; dimensions are opening sizes"
        />
      </label>

      <details className="rounded-xl border border-[var(--border)] bg-[#f8fafc] px-4 py-3">
        <summary className="cursor-pointer select-none text-sm font-medium text-[var(--foreground)]">
          Project defaults & AI options
        </summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="field-label">Project name (optional)</span>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="field-control"
              placeholder="Auto from PDF if empty"
            />
          </label>
          <label className="block">
            <span className="field-label">Output units</span>
            <select
              value={measurementUnit}
              onChange={(e) =>
                setMeasurementUnit(e.target.value as "mm" | "cm" | "in")
              }
              className="field-control"
            >
              <option value="mm">mm (recommended)</option>
              <option value="cm">cm</option>
              <option value="in">in</option>
            </select>
          </label>
          <label className="block">
            <span className="field-label">Measurement basis</span>
            <select
              value={measurementBasis}
              onChange={(e) =>
                setMeasurementBasis(
                  e.target.value as "finished" | "panel" | "opening",
                )
              }
              className="field-control"
            >
              <option value="finished">Finished size</option>
              <option value="panel">Panel size</option>
              <option value="opening">Opening size</option>
            </select>
          </label>
          <label className="block">
            <span className="field-label">System</span>
            <select
              value={system}
              onChange={(e) =>
                setSystem(e.target.value as "with_panels" | "without_panels")
              }
              className="field-control"
            >
              <option value="with_panels">With panels</option>
              <option value="without_panels">Without panels</option>
            </select>
          </label>
          <label className="block">
            <span className="field-label">Finish</span>
            <select
              value={finish}
              onChange={(e) =>
                setFinish(e.target.value as "melamine" | "lacquered")
              }
              className="field-control"
            >
              <option value="melamine">Melamine</option>
              <option value="lacquered">Lacquered</option>
            </select>
          </label>
        </div>
        <details className="mt-3 border-t border-[var(--border)] pt-3">
          <summary className="cursor-pointer select-none text-xs font-medium text-[var(--muted)]">
            Fixed system instructions (read-only)
          </summary>
          <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
            {DESIGN_PDF_SYSTEM_PROMPT_SUMMARY}
          </p>
        </details>
      </details>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          onClick={runImport}
          disabled={loading || !pdfFile}
          className="btn-accent"
        >
          {loading ? "Analyzing PDF…" : "Import with AI"}
        </button>
        <p className="text-xs text-[var(--muted)]">
          {aiConfigLabel ? (
            <>Model: {aiConfigLabel}</>
          ) : (
            <>Loading AI config…</>
          )}
        </p>
      </div>

      {lastMeta && (
        <div className="rounded-xl border border-[var(--border)] bg-[#f8fafc] p-4 text-sm text-[var(--foreground)]">
          <p>
            Imported <strong>{lastMeta.request.lines.length}</strong> lines from{" "}
            <strong>{lastMeta.closets.length}</strong> closet
            {lastMeta.closets.length === 1 ? "" : "s"}
            {lastMeta.usage && (
              <span className="text-[var(--muted)]">
                {" "}
                ({lastMeta.usage.input_tokens + lastMeta.usage.output_tokens}{" "}
                tokens)
              </span>
            )}
          </p>
          <ul className="mt-3 list-disc pl-5 text-xs text-[var(--muted)]">
            {lastMeta.closets.map((c) => (
              <li key={c.room}>
                {c.room} — {c.lineCount} raw lines
              </li>
            ))}
          </ul>
          {lastMeta.warnings.length > 0 && (
            <ul className="mt-3 list-disc pl-5 text-xs text-[var(--warn)]">
              {lastMeta.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
