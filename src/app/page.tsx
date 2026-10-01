"use client";

import { AuthBar } from "@/components/AuthBar";
import { EstimateEditor } from "@/components/EstimateEditor";
import {
  BLANK_TEMPLATES,
  TemplatePicker,
} from "@/components/estimate/TemplatePicker";
import { DesignPdfImport } from "@/components/import/DesignPdfImport";
import { MurettiLogo } from "@/components/MurettiLogo";
import { createBlankRequest } from "@/lib/blank-estimate";
import { buildEstimate } from "@/lib/engine/price";
import { parseCsvRequest } from "@/lib/parsers/parse-request";
import type { EstimateRequest, EstimateResponse } from "@/lib/types";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";

type NavTab = "blank" | "csv" | "pdf" | "help" | "workspace";

const panelMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState<EstimateRequest | null>(null);
  const [navTab, setNavTab] = useState<NavTab>("blank");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [guideLoading, setGuideLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [transitionLabel, setTransitionLabel] = useState("Preparing estimate…");
  const [blankTemplateId, setBlankTemplateId] = useState("scenika-2023-10");

  const result = useMemo<EstimateResponse | null>(() => {
    if (!request) return null;
    try {
      return buildEstimate(request);
    } catch {
      return null;
    }
  }, [request]);

  const hasEstimate = Boolean(request && result);

  const openWorkspace = useCallback(
    async (next: EstimateRequest, label: string) => {
      setError(null);
      setTransitionLabel(label);
      setTransitioning(true);
      await sleep(700);
      setRequest(next);
      setNavTab("workspace");
      setTransitioning(false);
    },
    [],
  );

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
      setLoading(false);
      await openWorkspace(parsed, "Loading CSV and calculating prices…");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setLoading(false);
    }
  }, [file, openWorkspace]);

  const startBlank = useCallback(async () => {
    const tpl = BLANK_TEMPLATES.find((t) => t.id === blankTemplateId);
    if (!tpl?.available || !tpl.priceListId) {
      setError("Choose an available template to continue.");
      return;
    }
    setFile(null);
    setError(null);
    await openWorkspace(
      createBlankRequest({ price_list_id: tpl.priceListId }),
      `Creating blank ${tpl.name} estimate…`,
    );
  }, [blankTemplateId, openWorkspace]);

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

  const sidebarItems: {
    id: NavTab;
    title: string;
    subtitle: string;
    hidden?: boolean;
  }[] = [
    { id: "blank", title: "Blank", subtitle: "Start empty" },
    { id: "csv", title: "CSV", subtitle: "Upload file" },
    { id: "pdf", title: "PDF (AI)", subtitle: "Import design" },
    { id: "help", title: "Help", subtitle: "Templates" },
    {
      id: "workspace",
      title: "Workspace",
      subtitle: hasEstimate
        ? request?.project_name?.trim() || "Open estimate"
        : "After you start",
      hidden: !hasEstimate && !transitioning,
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[min(100%,1920px)] items-center gap-4 px-3 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <MurettiLogo priority />
          </div>
          <AuthBar />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[min(100%,1920px)] min-w-0 px-3 py-4 sm:px-6 sm:py-6">
        <section className="panel overflow-visible">
          <div className="grid gap-0 lg:grid-cols-[200px_minmax(0,1fr)]">
            <aside className="border-b border-[var(--border)] bg-[#eef2f6]/80 lg:border-b-0 lg:border-r">
              <nav
                className="flex gap-1 overflow-x-auto p-2 lg:sticky lg:top-[3.25rem] lg:max-h-[calc(100vh-3.25rem)] lg:flex-col lg:overflow-y-auto"
                aria-label="Estimate methods"
              >
                {sidebarItems
                  .filter((item) => !item.hidden)
                  .map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={navTab === item.id}
                      className="tab-btn min-w-[7.5rem] shrink-0 lg:min-w-0"
                      onClick={() => {
                        setNavTab(item.id);
                        setError(null);
                      }}
                    >
                      <span className="block">{item.title}</span>
                      <span className="mt-0.5 block text-xs font-normal opacity-80">
                        {item.subtitle}
                      </span>
                    </button>
                  ))}
              </nav>
            </aside>

            <div className="relative min-w-0 max-w-full overflow-x-hidden p-4 sm:p-6 lg:p-7">
              <AnimatePresence mode="wait">
                {transitioning ? (
                  <motion.div
                    key="loader"
                    className="flex min-h-[18rem] flex-col items-center justify-center gap-4 text-center"
                    {...panelMotion}
                  >
                    <div
                      className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#d5dde6] border-t-[var(--primary)]"
                      aria-hidden
                    />
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">
                        {transitionLabel}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        Your estimate will appear in this panel.
                      </p>
                    </div>
                  </motion.div>
                ) : navTab === "workspace" && request && result ? (
                  <motion.div
                    key="workspace"
                    className="w-full min-w-0 max-w-full"
                    {...panelMotion}
                  >
                    <EstimateEditor
                      request={request}
                      onRequestChange={setRequest}
                      result={result}
                      onDownloadPdf={downloadPdf}
                      pdfLoading={pdfLoading}
                      embedded
                    />
                  </motion.div>
                ) : navTab === "workspace" && request && !result ? (
                  <motion.div key="workspace-error" {...panelMotion}>
                    <p className="rounded-lg border border-red-200 bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]">
                      Could not price this estimate. Check settings and line
                      dimensions.
                    </p>
                  </motion.div>
                ) : navTab === "blank" ? (
                  <motion.div
                    key="blank"
                    className="mx-auto max-w-2xl space-y-6"
                    {...panelMotion}
                  >
                    <div className="space-y-2">
                      <h2 className="text-base font-semibold">Blank estimate</h2>
                      <p className="text-sm leading-relaxed text-[var(--muted)]">
                        Pick a price-list template first, then create an empty
                        project you can fill line by line.
                      </p>
                    </div>

                    <TemplatePicker
                      selectedId={blankTemplateId}
                      onSelect={(id) => {
                        const tpl = BLANK_TEMPLATES.find((t) => t.id === id);
                        if (!tpl?.available) return;
                        setBlankTemplateId(id);
                        setError(null);
                      }}
                    />

                    <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-[var(--muted)]">
                        Selected:{" "}
                        <strong className="text-[var(--foreground)]">
                          {BLANK_TEMPLATES.find((t) => t.id === blankTemplateId)
                            ?.name ?? "—"}
                        </strong>
                      </p>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={startBlank}
                        disabled={transitioning}
                      >
                        Start blank estimate
                      </button>
                    </div>
                  </motion.div>
                ) : navTab === "csv" ? (
                  <motion.div
                    key="csv"
                    className="mx-auto max-w-xl space-y-6"
                    {...panelMotion}
                  >
                    <div className="space-y-2">
                      <h2 className="text-base font-semibold">Upload CSV</h2>
                      <p className="text-sm leading-relaxed text-[var(--muted)]">
                        Load a filled template. Pricing runs in the browser.
                      </p>
                    </div>
                    <label className="block space-y-2">
                      <span className="field-label">CSV file</span>
                      <input
                        type="file"
                        accept=".csv"
                        className="field-control file:mr-3 file:rounded-md file:border-0 file:bg-[#eef2f6] file:px-3 file:py-1.5 file:text-sm file:font-medium"
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    {file ? (
                      <p className="text-xs text-[var(--muted)]">
                        Selected: <strong>{file.name}</strong>
                      </p>
                    ) : null}
                    <div className="pt-1">
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={onEstimate}
                        disabled={loading || transitioning || !file}
                      >
                        {loading ? "Reading file…" : "Load CSV & calculate"}
                      </button>
                    </div>
                  </motion.div>
                ) : navTab === "pdf" ? (
                  <motion.div
                    key="pdf"
                    className="w-full min-w-0"
                    {...panelMotion}
                  >
                    <DesignPdfImport
                      onImported={async (req) => {
                        setFile(null);
                        await openWorkspace(
                          req,
                          "Importing design and building estimate…",
                        );
                      }}
                      onError={(msg) => setError(msg)}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="help"
                    className="mx-auto max-w-2xl space-y-5"
                    {...panelMotion}
                  >
                    <div>
                      <h2 className="text-base font-semibold">Templates & help</h2>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        Download references before quoting.
                      </p>
                    </div>
                    <ul className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)] bg-white">
                      <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium">CSV template</p>
                          <p className="text-xs text-[var(--muted)]">
                            Empty spreadsheet with all columns
                          </p>
                        </div>
                        <a
                          href="/api/template"
                          className="btn-secondary py-2 text-xs"
                        >
                          Download
                        </a>
                      </li>
                      <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium">L-closet sample</p>
                          <p className="text-xs text-[var(--muted)]">
                            Full example CSV
                          </p>
                        </div>
                        <a
                          href="/muretti-estimate-sample-L-closet.csv"
                          className="btn-secondary py-2 text-xs"
                        >
                          Download
                        </a>
                      </li>
                      <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium">Column guide</p>
                          <p className="text-xs text-[var(--muted)]">
                            Field explanations (PDF)
                          </p>
                        </div>
                        <button
                          type="button"
                          className="btn-secondary py-2 text-xs"
                          onClick={downloadGuidePdf}
                          disabled={guideLoading}
                        >
                          {guideLoading ? "Preparing…" : "Download"}
                        </button>
                      </li>
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>

              {error ? (
                <p
                  className="mt-4 rounded-lg border border-red-200 bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)] break-words"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
