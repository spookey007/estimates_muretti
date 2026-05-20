"use client";

import dynamic from "next/dynamic";
import { AddLineToolbar } from "@/components/estimate/AddLineToolbar";
import { ClosetDesigner } from "@/components/estimate/ClosetDesigner";

const CADEditor = dynamic(
  () => import("@/cad/components/CADEditor").then((m) => m.CADEditor),
  { ssr: false, loading: () => <p className="p-8 text-sm text-stone-500">Loading 3D CAD…</p> },
);
import { EstimateLineCard } from "@/components/estimate/EstimateLineCard";
import { EstimateLinesTable } from "@/components/estimate/EstimateLinesTable";
import { mergeRows } from "@/components/estimate/line-shared";
import { TableWidthProbe } from "@/components/estimate/TableWidthProbe";
import {
  useLayoutMode,
  type LayoutPreference,
} from "@/components/estimate/use-layout-mode";
import type { EstimateLineInput, EstimateRequest, EstimateResponse } from "@/lib/types";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export function EstimateLinesView({
  request,
  result,
  onChange,
  onAddLine,
  onRequestChange,
}: {
  request: EstimateRequest;
  result: EstimateResponse;
  onChange: (lineId: string, patch: Partial<EstimateLineInput>) => void;
  onAddLine: (line: EstimateLineInput) => void;
  onRequestChange: (next: EstimateRequest) => void;
}) {
  const rows = useMemo(() => mergeRows(request, result), [request, result]);
  const liveScrollRef = useRef<HTMLDivElement>(null);
  const [selectedLineId, setSelectedLineId] = useState<string | undefined>();

  const {
    containerRef,
    scrollProbeRef,
    tableProbeRef,
    preference,
    setPreference,
    effectiveLayout,
    tableOverflows,
    contentClipped,
    needsCards,
    viewportNarrow,
    measure,
  } = useLayoutMode(liveScrollRef);

  useEffect(() => {
    measure();
  }, [rows, effectiveLayout, measure]);

  useEffect(() => {
    const el = liveScrollRef.current;
    if (!el || effectiveLayout !== "table") return;

    const checkLive = () => {
      if (el.scrollWidth > el.clientWidth + 4) measure();
    };
    const ro = new ResizeObserver(checkLive);
    ro.observe(el);
    checkLive();
    return () => ro.disconnect();
  }, [effectiveLayout, measure, rows.length]);

  const showDesigner = request.system === "with_panels";

  const removeLine = (lineId: string) => {
    onRequestChange({
      ...request,
      lines: request.lines.filter((l) => l.line_id !== lineId),
    });
    if (selectedLineId === lineId) setSelectedLineId(undefined);
  };

  return (
    <div ref={containerRef} className="relative w-full min-w-0 space-y-4">
      <TableWidthProbe tableRef={tableProbeRef} scrollRef={scrollProbeRef} />

      <LayoutToolbar
        lineCount={rows.length}
        preference={preference}
        setPreference={setPreference}
        effectiveLayout={effectiveLayout}
        tableOverflows={tableOverflows}
        contentClipped={contentClipped}
        needsCards={needsCards}
        viewportNarrow={viewportNarrow}
        showDesigner={showDesigner}
      />

      <AddLineToolbar request={request} onRequestChange={onRequestChange} />

      {effectiveLayout === "cad" ? (
        <CADEditor
          request={request}
          result={result}
          onRequestChange={onRequestChange}
        />
      ) : effectiveLayout === "design" ? (
        showDesigner ? (
          <ClosetDesigner
            request={request}
            rows={rows}
            onAddLine={onAddLine}
            onChange={onChange}
            onRemoveLine={removeLine}
            projectFinish={request.finish}
            selectedLineId={selectedLineId}
            onSelectLine={setSelectedLineId}
          />
        ) : (
          <p className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-600">
            Layout designer needs <strong>with_panels</strong> system (walk-in with
            aluminum uprights). Change it in Project settings above.
          </p>
        )
      ) : effectiveLayout === "cards" ? (
        <div className="estimate-lines-cards grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {rows.map((row) => (
            <EstimateLineCard
              key={row.line_id}
              row={row}
              projectFinish={request.finish}
              onChange={onChange}
              onRemove={removeLine}
            />
          ))}
        </div>
      ) : (
        <EstimateLinesTable
          rows={rows}
          onChange={onChange}
          scrollRef={liveScrollRef}
          projectFinish={request.finish}
          onRemoveLine={removeLine}
        />
      )}
    </div>
  );
}

function LayoutToolbar({
  lineCount,
  preference,
  setPreference,
  effectiveLayout,
  tableOverflows,
  contentClipped,
  needsCards,
  viewportNarrow,
  showDesigner,
}: {
  lineCount: number;
  preference: LayoutPreference;
  setPreference: (p: LayoutPreference) => void;
  effectiveLayout: "cards" | "table" | "design" | "cad";
  tableOverflows: boolean;
  contentClipped: boolean;
  needsCards: boolean;
  viewportNarrow: boolean;
  showDesigner: boolean;
}) {
  const autoReason = needsCards
    ? viewportNarrow
      ? "Narrow screen — card view"
      : contentClipped
        ? "Fields clipped — card view"
        : "Card view"
    : "Table view";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-stone-800">
          {lineCount} lines ·{" "}
          <span className="text-stone-600">
            {effectiveLayout === "cad"
              ? "3D CAD"
              : effectiveLayout === "design"
                ? "Closet designer"
                : effectiveLayout === "cards"
                  ? "Card view"
                  : "Table view"}
          </span>
        </p>
        {preference === "auto" && effectiveLayout !== "design" && (
          <p className="mt-0.5 text-xs text-stone-500">{autoReason}</p>
        )}
        {effectiveLayout === "cad" && (
          <p className="mt-0.5 text-xs text-stone-500">
            3D, table, cards, and 2D designer share the same lines and pricing.
          </p>
        )}
        {(effectiveLayout === "table" || effectiveLayout === "cards") && (
          <p className="mt-0.5 text-xs text-stone-500">
            <span className="inline-block rounded bg-orange-100 px-1 text-orange-900">
              orange
            </span>{" "}
            custom size ·{" "}
            <span className="inline-block rounded bg-violet-100 px-1 text-violet-900">
              violet
            </span>{" "}
            cut € · total shows catalog + cut
          </p>
        )}
        {effectiveLayout === "design" && (
          <p className="mt-0.5 text-xs text-stone-500">
            Pick A–J, click a bay, then set sizes in the right panel.
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <LayoutButton active={preference === "auto"} onClick={() => setPreference("auto")}>
          Auto
        </LayoutButton>
        <LayoutButton active={preference === "cad"} onClick={() => setPreference("cad")}>
          3D CAD
        </LayoutButton>
        {showDesigner && (
          <LayoutButton
            active={preference === "design"}
            onClick={() => setPreference("design")}
          >
            2D Layout
          </LayoutButton>
        )}
        <LayoutButton active={preference === "table"} onClick={() => setPreference("table")}>
          Table
        </LayoutButton>
        <LayoutButton active={preference === "cards"} onClick={() => setPreference("cards")}>
          Cards
        </LayoutButton>
      </div>
    </div>
  );
}

function LayoutButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-xs font-medium sm:text-sm ${
        active
          ? "bg-stone-900 text-white"
          : "border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
      }`}
    >
      {children}
    </button>
  );
}
