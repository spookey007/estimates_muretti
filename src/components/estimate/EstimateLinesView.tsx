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
    <div ref={containerRef} className="relative w-full min-w-0 space-y-5 sm:space-y-6">
      <TableWidthProbe tableRef={tableProbeRef} scrollRef={scrollProbeRef} />

      <div className="rounded-xl border border-[var(--border)] bg-white p-4 sm:p-5">
        <LayoutToolbar
          lineCount={rows.length}
          preference={preference}
          setPreference={setPreference}
          effectiveLayout={effectiveLayout}
          showDesigner={showDesigner}
        />
      </div>

      <AddLineToolbar request={request} onRequestChange={onRequestChange} />

      <div className="min-w-0">
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
            <p className="rounded-xl border border-[var(--border)] bg-white p-6 text-sm text-[var(--muted)]">
              Layout designer needs <strong>With panels</strong> system. Change it
              in the settings above.
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
    </div>
  );
}

function LayoutToolbar({
  lineCount,
  preference,
  setPreference,
  effectiveLayout,
  showDesigner,
}: {
  lineCount: number;
  preference: LayoutPreference;
  setPreference: (p: LayoutPreference) => void;
  effectiveLayout: "cards" | "table" | "design" | "cad";
  showDesigner: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[var(--muted)]">
        <span className="font-medium text-[var(--foreground)]">{lineCount}</span>{" "}
        lines
        <span className="mx-1.5 text-[var(--border)]">·</span>
        {effectiveLayout === "cad"
          ? "3D CAD"
          : effectiveLayout === "design"
            ? "2D layout"
            : effectiveLayout === "cards"
              ? "Cards"
              : "Table"}
      </p>
      <div className="flex shrink-0 flex-wrap gap-1.5">
        <LayoutButton active={preference === "auto"} onClick={() => setPreference("auto")}>
          Auto
        </LayoutButton>
        <LayoutButton active={preference === "cad"} onClick={() => setPreference("cad")}>
          3D
        </LayoutButton>
        {showDesigner && (
          <LayoutButton
            active={preference === "design"}
            onClick={() => setPreference("design")}
          >
            2D
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
      className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${
        active
          ? "bg-[var(--primary)] text-white"
          : "border border-[var(--border)] bg-white text-[var(--muted)] hover:bg-[#eef2f6] hover:text-[var(--foreground)]"
      }`}
    >
      {children}
    </button>
  );
}
