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
    <div className="mt-6 rounded-xl border border-violet-200 bg-violet-50/50 p-4 sm:p-6">
      <h2 className="text-lg font-medium text-stone-900">
        Import from design PDF (AI)
      </h2>
      <p className="mt-1 text-sm text-stone-600">
        Upload a customer closet PDF. Claude extracts shelves, panels, uprights,
        and other lines into the estimate table — review before quoting.
      </p>

      <div className="mt-4 rounded-lg border border-violet-100 bg-white/80 p-3">
        <p className="text-xs font-medium text-stone-500">
          System instructions (fixed, not editable)
        </p>
        <p className="mt-1 text-sm leading-relaxed text-stone-700">
          {DESIGN_PDF_SYSTEM_PROMPT_SUMMARY}
        </p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="text-xs font-medium text-stone-500">Design PDF</span>
          <input
            type="file"
            accept=".pdf,application/pdf"
            className="mt-1 w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-2"
            onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-xs font-medium text-stone-500">
            Your notes (optional)
          </span>
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
            placeholder="e.g. Ignore master bath; dimensions are opening sizes; add margin 10%"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-stone-500">
            Project name (optional)
          </span>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
            placeholder="Auto from PDF if empty"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-stone-500">Output units</span>
          <select
            value={measurementUnit}
            onChange={(e) =>
              setMeasurementUnit(e.target.value as "mm" | "cm" | "in")
            }
            className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
          >
            <option value="mm">mm (recommended)</option>
            <option value="cm">cm</option>
            <option value="in">in</option>
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-stone-500">Measurement basis</span>
          <select
            value={measurementBasis}
            onChange={(e) =>
              setMeasurementBasis(
                e.target.value as "finished" | "panel" | "opening",
              )
            }
            className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
          >
            <option value="finished">finished</option>
            <option value="panel">panel</option>
            <option value="opening">opening</option>
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-stone-500">System</span>
          <select
            value={system}
            onChange={(e) =>
              setSystem(e.target.value as "with_panels" | "without_panels")
            }
            className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
          >
            <option value="with_panels">with_panels</option>
            <option value="without_panels">without_panels</option>
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-stone-500">Finish</span>
          <select
            value={finish}
            onChange={(e) => setFinish(e.target.value as "melamine" | "lacquered")}
            className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
          >
            <option value="melamine">melamine</option>
            <option value="lacquered">lacquered</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={runImport}
          disabled={loading || !pdfFile}
          className="rounded-lg bg-violet-700 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Analyzing PDF…" : "Import with AI"}
        </button>
        <p className="text-xs text-stone-500">
          {aiConfigLabel ? (
            <>
              Configured in <code className="text-violet-900">.env</code>:{" "}
              <code className="text-violet-900">{aiConfigLabel}</code>
            </>
          ) : (
            <>Loading AI config from server…</>
          )}
        </p>
      </div>

      {lastMeta && (
        <div className="mt-4 rounded-lg border border-violet-100 bg-white p-3 text-sm text-stone-700">
          <p>
            Imported <strong>{lastMeta.request.lines.length}</strong> lines from{" "}
            <strong>{lastMeta.closets.length}</strong> closet
            {lastMeta.closets.length === 1 ? "" : "s"} using{" "}
            <strong>{lastMeta.model}</strong>
            {lastMeta.usage && (
              <span className="text-stone-500">
                {" "}
                ({lastMeta.usage.input_tokens + lastMeta.usage.output_tokens}{" "}
                tokens)
              </span>
            )}
          </p>
          <ul className="mt-2 list-disc pl-5 text-xs text-stone-600">
            {lastMeta.closets.map((c) => (
              <li key={c.room}>
                {c.room} — {c.lineCount} raw lines
              </li>
            ))}
          </ul>
          {lastMeta.warnings.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-xs text-amber-800">
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
