"use client";

import type { EstimateResponse } from "@/lib/types";
import { useCallback, useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EstimateResponse | null>(null);

  const onEstimate = useCallback(async () => {
    if (!file) {
      setError("Choose a CSV file first");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Only CSV files are supported");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("price_list_id", "scenika-2023-10");

      const res = await fetch("/api/estimate", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setResult(data as EstimateResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [file]);

  const [pdfLoading, setPdfLoading] = useState(false);
  const [guideLoading, setGuideLoading] = useState(false);

  const downloadGuidePdf = async () => {
    setGuideLoading(true);
    setError(null);
    try {
      const { downloadColumnGuidePdf } = await import(
        "@/lib/pdf/download-column-guide-pdf"
      );
      await downloadColumnGuidePdf();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Guide PDF failed");
    } finally {
      setGuideLoading(false);
    }
  };

  const downloadPdf = async () => {
    if (!result) return;
    setPdfLoading(true);
    try {
      const { downloadEstimatePdf } = await import("@/lib/pdf/download-estimate-pdf");
      await downloadEstimatePdf(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF export failed");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <p className="text-sm font-medium uppercase tracking-wider text-amber-800">
            Muretti Estimate
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            SCENIKA pricing (CSV)
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-stone-600">
            Upload your CSV template, review the estimate, then download a PDF quote.
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium">Upload CSV</h2>
          <p className="mt-1 text-sm text-stone-500">
            Settings and item rows are read from your CSV file.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept=".csv"
              className="text-sm"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={onEstimate}
              disabled={loading || !file}
              className="rounded-lg bg-stone-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "Calculating..." : "Calculate estimate"}
            </button>
            <a
              href="/api/template"
              className="text-sm font-medium text-amber-800 underline"
            >
              CSV template
            </a>
            <button
              type="button"
              onClick={downloadGuidePdf}
              disabled={guideLoading}
              className="text-sm font-medium text-amber-900 underline disabled:opacity-50"
            >
              {guideLoading ? "Preparing guide..." : "Column guide (PDF)"}
            </button>
          </div>
          <p className="mt-4 text-xs text-stone-500">
            New to the template? Download the column guide PDF for every field, role, and
            standard SCENIKA size.
          </p>
          {error && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>
          )}
        </section>
        {result && (
          <ResultView
            result={result}
            onDownloadPdf={downloadPdf}
            pdfLoading={pdfLoading}
          />
        )}
      </main>
    </div>
  );
}

function ResultView({
  result,
  onDownloadPdf,
  pdfLoading,
}: {
  result: EstimateResponse;
  onDownloadPdf: () => void;
  pdfLoading: boolean;
}) {
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
          </p>
        </div>
        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={pdfLoading}
          className="rounded border border-stone-800 bg-stone-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pdfLoading ? "Preparing PDF…" : "Download PDF"}
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Structural" value={result.subtotals.structural} />
        <Stat label="Equipment" value={result.subtotals.equipment} />
        <Stat label="Total net (EUR)" value={result.total_net} highlight />
      </div>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-stone-50 text-stone-600">
            <tr>
              <th className="p-3">Line</th>
              <th className="p-3">Role</th>
              <th className="p-3">Resolved (mm)</th>
              <th className="p-3">Code</th>
              <th className="p-3">Unit EUR</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Total EUR</th>
              <th className="p-3">Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {result.lines.map((line) => (
              <tr key={line.line_id} className="border-t">
                <td className="p-3 font-medium">{line.line_id}</td>
                <td className="p-3">{line.role}</td>
                <td className="p-3 text-stone-600">
                  {[line.resolved_mm.h && `H${line.resolved_mm.h}`, line.resolved_mm.l && `L${line.resolved_mm.l}`]
                    .filter(Boolean)
                    .join(" ") || "-"}
                </td>
                <td className="p-3 font-mono text-xs">{line.code}</td>
                <td className="p-3">{line.unit_price.toFixed(2)}</td>
                <td className="p-3">{line.quantity}</td>
                <td className="p-3 font-medium">{line.line_total.toFixed(2)}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      line.accuracy === "exact"
                        ? "bg-green-100 text-green-800"
                        : line.accuracy === "snapped"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-stone-100"
                    }`}
                  >
                    {line.accuracy}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {result.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Warnings (sizes snapped or adjusted)</p>
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