"use client";

import { AuthBar } from "@/components/AuthBar";
import { EstimateEditor } from "@/components/EstimateEditor";
import { DesignPdfImport } from "@/components/import/DesignPdfImport";
import { createBlankRequest } from "@/lib/blank-estimate";
import { buildEstimate } from "@/lib/engine/price";
import { parseCsvRequest } from "@/lib/parsers/parse-request";
import type { EstimateRequest, EstimateResponse } from "@/lib/types";
import { useCallback, useMemo, useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState<EstimateRequest | null>(null);

  const result = useMemo<EstimateResponse | null>(() => {
    if (!request) return null;
    try {
      return buildEstimate(request);
    } catch {
      return null;
    }
  }, [request]);

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
    try {
      const text = await file.text();
      const parsed = parseCsvRequest(text, { price_list_id: "scenika-2023-10" });
      setRequest(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [file]);

  const startBlank = useCallback(() => {
    setError(null);
    setFile(null);
    setRequest(createBlankRequest());
  }, []);

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
        <div className="mx-auto flex max-w-[min(100%,1920px)] flex-wrap items-start gap-4 px-4 py-6 sm:px-6 sm:py-8">
          <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-amber-800 sm:text-sm">
            Muretti Estimate
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            SCENIKA pricing
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-stone-600">
            Upload a CSV, import a customer design PDF with AI, or start a blank
            estimate and add shelves, panels, and other parts — same fields as the
            template.
          </p>
          </div>
          <AuthBar />
        </div>
      </header>
      <main className="mx-auto w-full max-w-[min(100%,1920px)] min-w-0 px-4 py-6 sm:px-6 sm:py-10">
        <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-medium">Get started</h2>
          <p className="mt-1 text-sm text-stone-500">
            Load an existing CSV or build line by line without a file.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:mt-6">
            <input
              type="file"
              accept=".csv"
              className="w-full max-w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-stone-100 file:px-3 file:py-2 file:text-sm file:font-medium"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <button
                type="button"
                onClick={onEstimate}
                disabled={loading || !file}
                className="w-full rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50 sm:w-auto"
              >
                {loading ? "Loading..." : "Load CSV & calculate"}
              </button>
              <button
                type="button"
                onClick={startBlank}
                className="w-full rounded-lg border border-amber-400 bg-amber-50 px-5 py-2.5 text-sm font-medium text-amber-950 hover:bg-amber-100 sm:w-auto"
              >
                Start blank estimate
              </button>
              <a
                href="/api/template"
                className="text-center text-sm font-medium text-amber-800 underline sm:text-left"
              >
                CSV template
              </a>
              <a
                href="/muretti-estimate-sample-L-closet.csv"
                className="text-center text-sm font-medium text-amber-800 underline sm:text-left"
              >
                Full L-closet sample
              </a>
              <button
                type="button"
                onClick={downloadGuidePdf}
                disabled={guideLoading}
                className="text-center text-sm font-medium text-amber-900 underline disabled:opacity-50 sm:text-left"
              >
                {guideLoading ? "Preparing guide..." : "Column guide (PDF)"}
              </button>
            </div>
          </div>
          <p className="mt-4 text-xs text-stone-500">
            Per-line <strong>finish</strong> overrides the project default when set.
            Shelf widths like 650 mm snap to 803 mm catalog stock plus cut surcharge
            (TALARI).
          </p>
          {error && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 break-words">
              {error}
            </p>
          )}

          <DesignPdfImport
            onImported={(req) => {
              setError(null);
              setFile(null);
              setRequest(req);
            }}
            onError={(msg) => setError(msg)}
          />
        </section>
        {request && result && (
          <EstimateEditor
            request={request}
            onRequestChange={setRequest}
            result={result}
            onDownloadPdf={downloadPdf}
            pdfLoading={pdfLoading}
          />
        )}
        {request && !result && (
          <p className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-800">
            Could not price this estimate. Check settings and line dimensions.
          </p>
        )}
      </main>
    </div>
  );
}
