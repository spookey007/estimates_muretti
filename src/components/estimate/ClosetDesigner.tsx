"use client";

import {
  EditableNumberInput,
  EditableTextInput,
} from "@/components/estimate/EditableField";
import {
  DepthSelect,
  FinishSelect,
  RemoveLineButton,
  RoleSelect,
  type MergedRow,
} from "@/components/estimate/line-shared";
import {
  defaultLineForPalette,
  L_CLOSET_BAYS,
  letterFromNotes,
  linesInBay,
  PALETTE,
  ROLE_COLORS,
  STANDARD_HEIGHTS,
  type BaySlot,
  type PaletteItem,
} from "@/lib/closet-schematic";
import { getNumericFieldConfig } from "@/lib/dimension-limits";
import { placeholdersForRole } from "@/lib/field-placeholders";
import {
  validateDepth,
  validateHeight,
  validateLineField,
  validateQuantity,
  validateWidth,
} from "@/lib/line-validation";
import type { EstimateLineInput, EstimateRequest, Finish } from "@/lib/types";
import { useCallback, useMemo, useState } from "react";

export function ClosetDesigner({
  request,
  rows,
  onAddLine,
  onChange,
  onRemoveLine,
  projectFinish,
  selectedLineId,
  onSelectLine,
}: {
  request: EstimateRequest;
  rows: MergedRow[];
  onAddLine: (line: EstimateLineInput) => void;
  onChange: (lineId: string, patch: Partial<EstimateLineInput>) => void;
  onRemoveLine: (lineId: string) => void;
  projectFinish: Finish;
  selectedLineId?: string;
  onSelectLine: (lineId: string | undefined) => void;
}) {
  const [activePalette, setActivePalette] = useState<PaletteItem | null>(null);
  const [dragItem, setDragItem] = useState<PaletteItem | null>(null);
  const [hoverBay, setHoverBay] = useState<string | null>(null);
  const [projectHeight, setProjectHeight] = useState<number>(2187);

  const nextId = useCallback(() => {
    const nums = request.lines
      .map((l) => /^L(\d+)$/i.exec(l.line_id)?.[1])
      .filter(Boolean)
      .map((n) => Number(n));
    const n = nums.length ? Math.max(...nums) + 1 : 1;
    return `L${String(n).padStart(2, "0")}`;
  }, [request.lines]);

  const placeInBay = useCallback(
    (bay: BaySlot, item: PaletteItem) => {
      onAddLine(defaultLineForPalette(item, bay, nextId(), projectHeight));
      setActivePalette(null);
      setDragItem(null);
      setHoverBay(null);
    },
    [onAddLine, nextId, projectHeight],
  );

  const onBayClick = useCallback(
    (bay: BaySlot) => {
      const item = activePalette ?? dragItem;
      if (item) placeInBay(bay, item);
    },
    [activePalette, dragItem, placeInBay],
  );

  const bayContents = useMemo(() => {
    const map = new Map<string, EstimateLineInput[]>();
    for (const bay of L_CLOSET_BAYS) {
      map.set(bay.id, linesInBay(request.lines, bay));
    }
    return map;
  }, [request.lines]);

  const selectedRow = rows.find((r) => r.line_id === selectedLineId);
  const selectedInput = request.lines.find((l) => l.line_id === selectedLineId);

  return (
    <div className="rounded-xl border border-stone-200 bg-gradient-to-b from-stone-50 to-white shadow-sm">
      <div className="border-b border-stone-200 px-4 py-3 sm:px-5">
        <h3 className="text-base font-semibold text-stone-900">Walk-in closet designer</h3>
        <p className="mt-1 text-xs leading-relaxed text-stone-600">
          <strong>1.</strong> Pick a part (A–J) from the palette.{" "}
          <strong>2.</strong> Click a bay on the diagram (or drag onto it).{" "}
          <strong>3.</strong> Set sizes in the panel on the right — same fields as the CSV.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-0 lg:grid-cols-[200px_1fr_280px]">
        {/* Palette */}
        <aside className="border-b border-stone-200 p-3 lg:border-b-0 lg:border-r">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Components
          </p>
          <ul className="space-y-1">
            {PALETTE.map((item) => {
              const active = activePalette?.letter === item.letter;
              return (
                <li key={item.letter}>
                  <button
                    type="button"
                    draggable
                    onDragStart={() => {
                      setDragItem(item);
                      setActivePalette(item);
                    }}
                    onDragEnd={() => setDragItem(null)}
                    onClick={() =>
                      setActivePalette(active ? null : item)
                    }
                    className={`flex w-full items-center gap-2 rounded-lg border px-2 py-2 text-left text-xs transition-colors ${
                      active
                        ? "border-amber-500 bg-amber-50 ring-2 ring-amber-200"
                        : "border-stone-200 bg-white hover:border-stone-300"
                    }`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-stone-800 text-[11px] font-bold text-white">
                      {item.letter}
                    </span>
                    <span className="font-medium text-stone-800">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 rounded-lg bg-stone-100 p-2.5 text-[10px] text-stone-600">
            <label className="font-semibold text-stone-700">Upright height (A, B)</label>
            <select
              className="mt-1 w-full rounded border border-stone-300 bg-white px-2 py-1 text-xs"
              value={projectHeight}
              onChange={(e) => setProjectHeight(Number(e.target.value))}
            >
              {STANDARD_HEIGHTS.map((h) => (
                <option key={h} value={h}>
                  {h} mm
                </option>
              ))}
            </select>
          </div>
          {activePalette && (
            <p className="mt-3 rounded-md bg-amber-100 px-2 py-1.5 text-[10px] font-medium text-amber-950">
              Click a highlighted bay to place <strong>{activePalette.letter}</strong>
            </p>
          )}
        </aside>

        {/* Diagram */}
        <div className="overflow-x-auto p-3 sm:p-4">
          <svg
            viewBox="0 0 720 480"
            className="mx-auto w-full min-w-[520px] max-w-3xl"
            role="img"
            aria-label="L-shaped SCENIKA closet diagram"
          >
            <defs>
              <linearGradient id="wallFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fafaf9" />
                <stop offset="100%" stopColor="#f5f5f4" />
              </linearGradient>
            </defs>

            <text x="360" y="22" textAnchor="middle" className="fill-stone-700 text-[12px] font-semibold">
              Front elevation + floor plan (mm)
            </text>

            {/* Height scale */}
            <g className="fill-stone-500 text-[9px]">
              <line x1="28" y1="50" x2="28" y2="400" stroke="#a8a29e" strokeWidth="1" />
              {STANDARD_HEIGHTS.map((h, i) => (
                <text key={h} x="8" y={90 + i * 72}>
                  {h}
                </text>
              ))}
              <text x="4" y="430" className="text-[8px]">
                H mm
              </text>
            </g>

            {/* L elevation frame */}
            <path
              d="M 55 45 L 55 420 L 480 420 L 480 45 Z"
              fill="none"
              stroke="#78716c"
              strokeWidth="1.5"
            />
            <path
              d="M 480 45 L 600 45 L 600 420 L 480 420"
              fill="none"
              stroke="#78716c"
              strokeWidth="1.5"
            />

            {/* Upright posts */}
            {[55, 195, 335, 480].map((x) => (
              <rect
                key={x}
                x={x - 3}
                y={45}
                width={6}
                height={375}
                fill="#44403c"
                opacity={0.2}
              />
            ))}

            {L_CLOSET_BAYS.map((bay) => {
              const items = bayContents.get(bay.id) ?? [];
              const isHover = hoverBay === bay.id;
              const canPlace = !!(activePalette || dragItem);
              return (
                <g key={bay.id}>
                  <rect
                    x={bay.elevX}
                    y={bay.elevY}
                    width={bay.elevW}
                    height={bay.elevH}
                    rx={3}
                    fill={isHover ? "#fffbeb" : canPlace ? "#fff7ed" : "url(#wallFill)"}
                    stroke={isHover ? "#d97706" : canPlace ? "#fdba74" : "#d6d3d1"}
                    strokeWidth={isHover ? 2 : 1}
                    className="cursor-pointer"
                    onClick={() => onBayClick(bay)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setHoverBay(bay.id);
                    }}
                    onDragLeave={() => setHoverBay(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragItem) placeInBay(bay, dragItem);
                    }}
                  />
                  <text
                    x={bay.elevX + bay.elevW / 2}
                    y={bay.elevY + 16}
                    textAnchor="middle"
                    className="fill-stone-800 text-[11px] font-bold pointer-events-none"
                  >
                    {bay.label}
                  </text>
                  <text
                    x={bay.elevX + bay.elevW / 2}
                    y={bay.elevY + bay.elevH - 10}
                    textAnchor="middle"
                    className="fill-stone-400 text-[8px] pointer-events-none"
                  >
                    {bay.wall === "left" ? "Wall 1" : "Return"} · {bay.id}
                  </text>
                  {items.map((line, i) => {
                    const letter = letterFromNotes(line.notes) ?? "?";
                    const fill = ROLE_COLORS[line.role] ?? "#d6d3d1";
                    const selected = line.line_id === selectedLineId;
                    const cx = bay.elevX + 18 + (i % 4) * 24;
                    const cy = bay.elevY + 50 + Math.floor(i / 4) * 28;
                    return (
                      <g
                        key={line.line_id}
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectLine(line.line_id);
                        }}
                      >
                        <rect
                          x={cx - 12}
                          y={cy - 10}
                          width={24}
                          height={20}
                          rx={2}
                          fill={fill}
                          stroke={selected ? "#1c1917" : "#78716c"}
                          strokeWidth={selected ? 2 : 1}
                        />
                        <text
                          x={cx}
                          y={cy + 4}
                          textAnchor="middle"
                          className="fill-stone-900 text-[9px] font-bold pointer-events-none"
                        >
                          {letter}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {/* Floor plan */}
            <text x="120" y="455" className="fill-stone-600 text-[10px] font-medium">
              Floor plan (top)
            </text>
            <rect
              x="70"
              y="350"
              width="200"
              height="12"
              fill="#57534e"
              opacity={0.15}
              transform="rotate(0)"
            />
            {L_CLOSET_BAYS.map((bay) => {
              const isHover = hoverBay === bay.id;
              return (
                <rect
                  key={`plan-${bay.id}`}
                  x={bay.planX}
                  y={bay.planY}
                  width={bay.planW}
                  height={bay.planH}
                  fill={isHover ? "#fde68a" : "#e7e5e4"}
                  stroke={isHover ? "#d97706" : "#a8a29e"}
                  strokeWidth={1}
                  className="cursor-pointer"
                  onClick={() => onBayClick(bay)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setHoverBay(bay.id);
                  }}
                  onDragLeave={() => setHoverBay(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragItem) placeInBay(bay, dragItem);
                  }}
                />
              );
            })}
            <text x="200" y="52" className="fill-stone-400 text-[8px]">
              8 mm posts between 900 mm bays
            </text>
          </svg>
        </div>

        {/* Properties */}
        <aside className="border-t border-stone-200 p-3 lg:border-t-0 lg:border-l lg:p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Size &amp; details
          </p>
          {selectedRow && selectedInput ? (
            <LinePropertiesPanel
              row={selectedRow}
              projectFinish={projectFinish}
              onChange={onChange}
              onRemove={() => {
                onRemoveLine(selectedRow.line_id);
                onSelectLine(undefined);
              }}
            />
          ) : (
            <p className="text-xs leading-relaxed text-stone-500">
              Select a part on the diagram, or add one with the palette then click a bay.
            </p>
          )}

          {request.lines.length > 0 && (
            <div className="mt-4 border-t border-stone-100 pt-3">
              <p className="mb-2 text-[10px] font-bold uppercase text-stone-500">
                All lines ({request.lines.length})
              </p>
              <ul className="max-h-40 space-y-0.5 overflow-y-auto text-xs">
                {request.lines.map((l) => (
                  <li key={l.line_id}>
                    <button
                      type="button"
                      onClick={() => onSelectLine(l.line_id)}
                      className={`w-full rounded px-2 py-1 text-left hover:bg-stone-100 ${
                        l.line_id === selectedLineId ? "bg-amber-50 font-medium" : ""
                      }`}
                    >
                      <span className="font-mono">{l.line_id}</span>{" "}
                      {letterFromNotes(l.notes) ?? "·"} {l.role}
                      {l.l != null ? ` · ${l.l}mm` : ""}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function LinePropertiesPanel({
  row,
  projectFinish,
  onChange,
  onRemove,
}: {
  row: MergedRow;
  projectFinish: Finish;
  onChange: (lineId: string, patch: Partial<EstimateLineInput>) => void;
  onRemove: () => void;
}) {
  const hints = placeholdersForRole(row.role);
  const id = row.line_id;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-sm font-semibold">{id}</span>
        <span className="text-sm font-bold tabular-nums">
          {(row.line_total_with_cuts ?? row.line_total).toFixed(2)} EUR
        </span>
      </div>

      <label className="block text-[10px] font-bold uppercase text-stone-500">
        Role
        <div className="mt-1">
          <RoleSelect row={row} onChange={onChange} />
        </div>
      </label>

      <label className="block text-[10px] font-bold uppercase text-stone-500">
        Finish
        <div className="mt-1">
          <FinishSelect
            value={row.finish}
            projectDefault={projectFinish}
            onChange={(v) => onChange(id, { finish: v })}
          />
        </div>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="text-[10px] font-bold uppercase text-stone-500">
          Qty
          <div className="mt-1">
            <EditableNumberInput
              lineId={id}
              compact
              value={row.quantity}
              placeholder={hints.quantity ?? "1"}
              min={1}
              max={99}
              validate={validateQuantity}
              onCommit={(v) =>
                onChange(id, { quantity: Math.max(1, v ?? 1) })
              }
            />
          </div>
        </label>
        <label className="text-[10px] font-bold uppercase text-stone-500">
          Height
          <div className="mt-1">
            <EditableNumberInput
              lineId={id}
              compact
              value={row.h}
              placeholder={hints.h}
              {...getNumericFieldConfig(row.role, "h")}
              validate={(raw) => validateHeight(row.role, raw)}
              onCommit={(v) => onChange(id, { h: v })}
            />
          </div>
        </label>
        <label className="text-[10px] font-bold uppercase text-stone-500">
          Width
          <div className="mt-1">
            <EditableNumberInput
              lineId={id}
              compact
              value={row.l}
              placeholder={hints.l}
              {...getNumericFieldConfig(row.role, "l")}
              validate={(raw) => validateWidth(row.role, raw)}
              onCommit={(v) => onChange(id, { l: v })}
            />
          </div>
        </label>
        <label className="text-[10px] font-bold uppercase text-stone-500">
          Depth
          <div className="mt-1">
            <EditableNumberInput
              lineId={id}
              compact
              value={row.d}
              placeholder={hints.d}
              {...getNumericFieldConfig(row.role, "d")}
              validate={(raw) => validateDepth(row.role, raw)}
              onCommit={(v) => onChange(id, { d: v })}
            />
          </div>
        </label>
      </div>

      <label className="block text-[10px] font-bold uppercase text-stone-500">
        Shelf depth
        <div className="mt-1">
          <DepthSelect row={row} onChange={onChange} />
        </div>
      </label>

      <label className="block text-[10px] font-bold uppercase text-stone-500">
        Side
        <div className="mt-1">
          <EditableTextInput
            lineId={id}
            compact
            value={row.side ?? ""}
            placeholder={hints.side ?? "dx / sx"}
            validate={(raw) => validateLineField(row, "side", raw)}
            onCommit={(v) =>
              onChange(id, {
                side: (v as EstimateLineInput["side"]) || undefined,
              })
            }
          />
        </div>
      </label>

      <label className="block text-[10px] font-bold uppercase text-stone-500">
        Room / bay
        <div className="mt-1">
          <EditableTextInput
            lineId={id}
            compact
            value={row.room ?? ""}
            placeholder={hints.room}
            onCommit={(v) => onChange(id, { room: v || undefined })}
          />
        </div>
      </label>

      {row.code && (
        <p className="rounded bg-stone-100 px-2 py-1.5 font-mono text-[10px] text-stone-700">
          {row.code} · {row.unit_price.toFixed(2)} EUR × {row.quantity}
        </p>
      )}

      <RemoveLineButton lineId={row.line_id} onRemove={onRemove} />
    </div>
  );
}
