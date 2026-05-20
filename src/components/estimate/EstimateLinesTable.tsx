"use client";

import {
  EditableNotesInput,
  EditableNumberInput,
  EditableTextInput,
} from "@/components/estimate/EditableField";
import { getNumericFieldConfig } from "@/lib/dimension-limits";
import { placeholdersForRole } from "@/lib/field-placeholders";
import {
  validateHeight,
  validateLineField,
  validateQuantity,
  validateWidth,
} from "@/lib/line-validation";
import { CustomPricingDisplay } from "@/components/estimate/CustomPricingDisplay";
import {
  AccuracyBadge,
  DepthSelect,
  FinishSelect,
  RemoveLineButton,
  RoleSelect,
  useRowMeta,
  type MergedRow,
} from "@/components/estimate/line-shared";
import {
  customTableCellClass,
  getLineCustomization,
} from "@/lib/line-customization";
import { ScrollableTableShell } from "@/components/estimate/ScrollableTableShell";
import { TABLE_NATURAL_MIN_PX } from "@/components/estimate/line-shared";
import type { EstimateLineInput, Finish } from "@/lib/types";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, type RefObject } from "react";

const columnHelper = createColumnHelper<MergedRow>();

export function EstimateLinesTable({
  rows,
  onChange,
  scrollRef,
  projectFinish,
  onRemoveLine,
}: {
  rows: MergedRow[];
  onChange: (lineId: string, patch: Partial<EstimateLineInput>) => void;
  scrollRef?: RefObject<HTMLDivElement | null>;
  projectFinish: Finish;
  onRemoveLine?: (lineId: string) => void;
}) {
  const columns = useMemo(
    () => [
      columnHelper.accessor("line_id", {
        id: "line_id",
        header: "id",
        size: 64,
        cell: ({ getValue }) => (
          <span className="font-medium text-stone-900 text-xs">{getValue()}</span>
        ),
      }),
      columnHelper.accessor("role", {
        header: "role",
        size: 148,
        cell: ({ row }) => (
          <RoleSelect row={row.original} onChange={onChange} compact />
        ),
      }),
      columnHelper.accessor("quantity", {
        header: "qty",
        size: 88,
        cell: ({ row }) => {
          const hints = placeholdersForRole(row.original.role);
          const id = row.original.line_id;
          const cfg = getNumericFieldConfig(row.original.role, "quantity");
          return (
            <EditableNumberInput
              lineId={id}
              compact
              value={row.original.quantity}
              placeholder={hints.quantity ?? "1"}
              min={cfg.min}
              max={cfg.max}
              step={cfg.step}
              validate={validateQuantity}
              onCommit={(v) =>
                onChange(id, { quantity: Math.max(1, v ?? 1) })
              }
            />
          );
        },
      }),
      columnHelper.accessor("h", {
        header: "h (mm)",
        size: 100,
        cell: ({ row }) => {
          const r = row.original;
          const hints = placeholdersForRole(r.role);
          const cfg = getNumericFieldConfig(r.role, "h");
          return (
            <EditableNumberInput
              lineId={r.line_id}
              compact
              value={r.h}
              placeholder={hints.h}
              min={cfg.min}
              max={cfg.max}
              step={cfg.step}
              validate={(raw) => validateHeight(r.role, raw)}
              onCommit={(v) => onChange(r.line_id, { h: v })}
            />
          );
        },
      }),
      columnHelper.accessor("l", {
        header: "l (mm)",
        size: 100,
        cell: ({ row }) => {
          const r = row.original;
          const hints = placeholdersForRole(r.role);
          const cfg = getNumericFieldConfig(r.role, "l");
          return (
            <EditableNumberInput
              lineId={r.line_id}
              compact
              value={r.l}
              placeholder={hints.l}
              min={cfg.min}
              max={cfg.max}
              step={cfg.step}
              validate={(raw) => validateWidth(r.role, raw)}
              onCommit={(v) => onChange(r.line_id, { l: v })}
            />
          );
        },
      }),
      columnHelper.accessor("d", {
        header: "d",
        size: 88,
        cell: ({ row }) => {
          const r = row.original;
          const hints = placeholdersForRole(r.role);
          const cfg = getNumericFieldConfig(r.role, "d");
          return (
            <EditableNumberInput
              lineId={r.line_id}
              compact
              value={r.d}
              placeholder={hints.d}
              min={cfg.min}
              max={cfg.max}
              step={cfg.step}
              validate={(raw) => validateLineField(r, "d", raw)}
              onCommit={(v) => onChange(r.line_id, { d: v })}
            />
          );
        },
      }),
      columnHelper.accessor("depth_type", {
        header: "depth",
        size: 72,
        cell: ({ row }) => <DepthSelect row={row.original} onChange={onChange} compact />,
      }),
      columnHelper.display({
        id: "finish",
        header: "finish",
        size: 88,
        cell: ({ row }) => (
          <FinishSelect
            compact
            value={row.original.finish}
            projectDefault={projectFinish}
            onChange={(v) => onChange(row.original.line_id, { finish: v })}
          />
        ),
      }),
      columnHelper.accessor("side", {
        header: "side",
        size: 56,
        cell: ({ row }) => {
          const r = row.original;
          const hints = placeholdersForRole(r.role);
          return (
            <EditableTextInput
              lineId={r.line_id}
              compact
              value={r.side ?? ""}
              placeholder={hints.side ?? "dx/sx"}
              validate={(raw) => validateLineField(r, "side", raw)}
              onCommit={(v) =>
                onChange(r.line_id, {
                  side: (v as EstimateLineInput["side"]) || undefined,
                })
              }
            />
          );
        },
      }),
      columnHelper.accessor("room", {
        header: "room",
        size: 100,
        cell: ({ row }) => {
          const r = row.original;
          const hints = placeholdersForRole(r.role);
          return (
            <EditableTextInput
              lineId={r.line_id}
              compact
              value={r.room ?? ""}
              placeholder={hints.room ?? "room"}
              onCommit={(v) => onChange(r.line_id, { room: v || undefined })}
            />
          );
        },
      }),
      columnHelper.accessor("notes", {
        header: "notes",
        size: 140,
        cell: ({ row }) => {
          const r = row.original;
          const hints = placeholdersForRole(r.role);
          return (
            <EditableNotesInput
              lineId={r.line_id}
              compact
              placeholder={hints.notes}
              value={r.notes ?? ""}
              onCommit={(v) => onChange(r.line_id, { notes: v || undefined })}
            />
          );
        },
      }),
      columnHelper.display({
        id: "resolved",
        header: "resolved",
        size: 100,
        cell: ({ row }) => <ResolvedCell row={row.original} />,
      }),
      columnHelper.accessor("code", {
        header: "code",
        size: 76,
        cell: ({ getValue }) => (
          <span className="font-mono text-[10px] break-all">{getValue()}</span>
        ),
      }),
      columnHelper.accessor("unit_price", {
        header: "cat.unit",
        size: 64,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-xs">{getValue().toFixed(2)}</span>
        ),
      }),
      columnHelper.display({
        id: "cut_code",
        header: "cut",
        size: 64,
        cell: ({ row }) => {
          const c = getLineCustomization(row.original);
          return (
            <span
              className={`font-mono text-[10px] ${
                c.hasCut ? "font-semibold text-violet-900" : "text-stone-500"
              }`}
            >
              {row.original.cut_codes ?? "-"}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "cut_eur",
        header: "cut€",
        size: 56,
        cell: ({ row }) => {
          const c = getLineCustomization(row.original);
          return (
            <span
              className={`tabular-nums text-xs ${
                c.hasCut ? "font-semibold text-violet-900" : "text-stone-500"
              }`}
            >
              {row.original.cut_total != null ? row.original.cut_total.toFixed(2) : "-"}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "line_total_with_cuts",
        header: "total",
        size: 72,
        cell: ({ row }) => (
          <CustomPricingDisplay row={row.original} compact />
        ),
      }),
      columnHelper.accessor("accuracy", {
        header: "acc",
        size: 72,
        cell: ({ row }) => (
          <AccuracyBadge
            accuracy={row.original.accuracy}
            isCustom={getLineCustomization(row.original).isCustom}
          />
        ),
      }),
      columnHelper.display({
        id: "why",
        header: "why",
        size: 180,
        cell: ({ row }) => <WhyCell row={row.original} />,
      }),
      ...(onRemoveLine
        ? [
            columnHelper.display({
              id: "actions",
              header: "Action",
              size: 88,
              cell: ({ row }) => (
                <RemoveLineButton
                  compact
                  lineId={row.original.line_id}
                  onRemove={() => onRemoveLine(row.original.line_id)}
                />
              ),
            }),
          ]
        : []),
    ],
    [onChange, onRemoveLine, projectFinish],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.line_id,
  });

  const totalWidth = Math.max(
    table.getAllColumns().reduce((s, c) => s + c.getSize(), 0),
    TABLE_NATURAL_MIN_PX,
  );

  const stickyClass = (colId: string, i: number) => {
    if (colId === "line_id") {
      return "sticky left-0 z-20 bg-stone-100 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.08)]";
    }
    if (colId === "role") {
      return "sticky left-[64px] z-20 bg-stone-100 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)]";
    }
    if (i > 0 && colId === "resolved") {
      return "border-l border-stone-200";
    }
    if (colId === "actions") {
      return "sticky right-0 z-20 border-l border-stone-200 bg-stone-100 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)]";
    }
    return "";
  };

  const stickyBodyClass = (colId: string) => {
    if (colId === "line_id") {
      return "sticky left-0 z-10 bg-inherit shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)]";
    }
    if (colId === "role") {
      return "sticky left-[64px] z-10 bg-inherit shadow-[4px_0_6px_-2px_rgba(0,0,0,0.04)]";
    }
    if (colId === "actions") {
      return "sticky right-0 z-10 border-l border-stone-200 bg-inherit shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.08)]";
    }
    return "";
  };

  return (
    <ScrollableTableShell scrollRef={scrollRef} minWidth={totalWidth}>
      <table
        className="border-collapse text-left text-xs text-stone-900"
        style={{ width: totalWidth, minWidth: totalWidth }}
      >
        <thead className="sticky top-0 z-30">
          {table.getHeaderGroups().map((hg) => (
            <tr
              key={hg.id}
              className="border-b-2 border-stone-300 bg-stone-100 text-[10px] font-semibold uppercase tracking-wide text-stone-700"
            >
              {hg.headers.map((header, i) => (
                <th
                  key={header.id}
                  className={`whitespace-nowrap px-2 py-2.5 align-bottom ${stickyClass(header.column.id, i)}`}
                  style={{ minWidth: header.column.getSize() }}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-sm text-stone-500"
              >
                No lines yet — use Add items above to create your estimate.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row, rowIndex) => {
              const custom = getLineCustomization(row.original);
              return (
                <tr
                  key={row.id}
                  className={`border-t border-stone-200 align-top transition-colors hover:bg-amber-50/50 ${
                    rowIndex % 2 === 1 ? "bg-stone-50/60" : "bg-white"
                  } ${custom.isCustom ? "bg-amber-50/35" : ""}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={`px-2 py-2 align-top ${stickyBodyClass(cell.column.id)} ${
                        cell.column.id === "resolved" ? "border-l border-stone-200" : ""
                      } ${customTableCellClass(cell.column.id, row.original)}`}
                      style={{ minWidth: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </ScrollableTableShell>
  );
}

function ResolvedCell({ row }: { row: MergedRow }) {
  const { resolvedLabel } = useRowMeta(row);
  const c = getLineCustomization(row);
  return (
    <span
      className={`font-mono text-[10px] leading-snug break-words whitespace-normal ${
        c.hasSnap ? "font-medium text-orange-900" : ""
      }`}
    >
      {resolvedLabel || "-"}
    </span>
  );
}

function WhyCell({ row }: { row: MergedRow }) {
  const { snapWhy } = useRowMeta(row);
  return (
    <p className="text-[10px] leading-relaxed text-stone-600 break-words whitespace-normal min-w-[10rem]">
      {snapWhy ?? (row.accuracy === "exact" ? "Matches catalog" : "-")}
    </p>
  );
}
