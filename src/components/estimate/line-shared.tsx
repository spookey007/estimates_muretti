"use client";

import { cutsForParent } from "@/lib/line-cuts";
import { placeholdersForRole } from "@/lib/field-placeholders";
import { explainSnap } from "@/lib/pricing-explain";
import type {
  EstimateLineInput,
  EstimateRequest,
  EstimateResponse,
  Finish,
  LineRole,
  PricedLine,
} from "@/lib/types";
import type { ReactNode } from "react";

export const ROLES: LineRole[] = [
  "upright",
  "corner_upright",
  "corner_filler",
  "back_panel",
  "linear_filler",
  "mirror",
  "shelf",
  "footboard",
  "shoe_rack",
  "clothes_tube",
  "hanging_drawer",
  "hanging_drawer_simple",
  "hanging_raster",
  "custom_panel_sqm",
  "ral_setup",
  "flexy_led_shelf",
  "flexy_led_drawer",
  "flexy_led_side",
  "flexy_power",
  "flexy_cable",
  "product_code",
];

export const INPUT =
  "box-border w-full min-h-10 max-w-full rounded-md border border-stone-200 bg-white px-3 py-2.5 text-sm leading-normal text-stone-900 shadow-sm placeholder:text-stone-400 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/25";

export const SELECT = `${INPUT} cursor-pointer pr-10 appearance-auto`;

export const TEXTAREA = `${INPUT} min-h-[5.5rem] resize-y whitespace-pre-wrap break-words py-2 leading-relaxed`;

/** Natural width the full table needs (sum of column minimums). */
/** Sum of column min widths (pricing + cut columns). */
export const TABLE_NATURAL_MIN_PX = 2208;

export const INPUT_COMPACT =
  "box-border w-full min-h-9 min-w-[4.5rem] rounded-md border border-stone-200 bg-white px-2 py-2 text-xs leading-normal text-stone-900 shadow-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/25";

export const SELECT_COMPACT = `${INPUT_COMPACT} cursor-pointer pr-8 appearance-auto`;

/** Prominent remove control for table rows and line cards. */
export function RemoveLineButton({
  lineId,
  onRemove,
  compact,
}: {
  lineId: string;
  onRemove: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      title={`Remove line ${lineId}`}
      aria-label={`Remove line ${lineId}`}
      className={
        compact
          ? "inline-flex shrink-0 items-center justify-center rounded-md border-2 border-red-400 bg-red-50 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-red-800 shadow-sm hover:border-red-500 hover:bg-red-100 active:bg-red-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-600"
          : "inline-flex shrink-0 items-center justify-center rounded-lg border-2 border-red-400 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-800 shadow-sm hover:border-red-500 hover:bg-red-100 active:bg-red-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-600"
      }
    >
      Remove
    </button>
  );
}

export type MergedRow = EstimateLineInput &
  PricedLine & {
    cut_codes?: string;
    cut_total?: number;
    line_total_with_cuts?: number;
  };

export function sumMoney(values: number[]): number {
  return values.reduce((acc, v) => acc + Math.round(v * 100), 0) / 100;
}

export function mergeRows(
  request: EstimateRequest,
  result: EstimateResponse,
): MergedRow[] {
  return result.lines
    .filter((l) => l.line_kind !== "surcharge" && l.line_kind !== "delivery")
    .map((priced) => {
      const input =
        request.lines.find((l) => l.line_id === priced.line_id) ?? priced;
      const cuts = cutsForParent(priced.line_id, result);
      const cutTotal = cuts.total;
      return {
        ...input,
        ...priced,
        cut_codes: cuts.codes || undefined,
        cut_total: cutTotal > 0 ? cutTotal : undefined,
        line_total_with_cuts:
          cutTotal > 0
            ? Math.round((priced.line_total + cutTotal) * 100) / 100
            : priced.line_total,
      };
    });
}

export function useRowMeta(row: MergedRow) {
  const snapWhy =
    explainSnap(row.role, "width", row.input_mm.l, row.resolved_mm.l) ??
    explainSnap(row.role, "height", row.input_mm.h, row.resolved_mm.h);

  const shelfDepth =
    row.depth_type === "414" || row.depth_type === "510"
      ? Number(row.depth_type)
      : row.d === 414 || row.d === 510
        ? row.d
        : 510;

  const resolvedLabel = [
    row.resolved_mm.h != null && `H${row.resolved_mm.h}`,
    row.resolved_mm.l != null && `L${row.resolved_mm.l}`,
    row.role === "shelf" && `D${shelfDepth}`,
  ]
    .filter(Boolean)
    .join(" ");

  return { snapWhy, resolvedLabel };
}

export function RoleSelect({
  row,
  onChange,
  compact,
}: {
  row: MergedRow;
  onChange: (lineId: string, patch: Partial<EstimateLineInput>) => void;
  compact?: boolean;
}) {
  return (
    <select
      className={compact ? SELECT_COMPACT : SELECT}
      value={row.role}
      onChange={(e) =>
        onChange(row.line_id, { role: e.target.value as LineRole })
      }
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  );
}

export function DepthSelect({
  row,
  onChange,
  compact,
}: {
  row: MergedRow;
  onChange: (lineId: string, patch: Partial<EstimateLineInput>) => void;
  compact?: boolean;
}) {
  const ph = placeholdersForRole(row.role).depth_type;
  return (
    <select
      className={compact ? SELECT_COMPACT : SELECT}
      value={row.depth_type ?? ""}
      title={ph}
      onChange={(e) =>
        onChange(row.line_id, {
          depth_type:
            e.target.value === "414" || e.target.value === "510"
              ? e.target.value
              : undefined,
        })
      }
    >
      <option value="">{ph ? `(${ph})` : "(none)"}</option>
      <option value="510">510</option>
      <option value="414">414</option>
    </select>
  );
}

export function NotesInput({
  value,
  onChange,
  compact,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
  placeholder?: string;
}) {
  return (
    <textarea
      rows={compact ? 2 : 3}
      className={compact ? `${TEXTAREA} min-h-[3.5rem] text-xs` : TEXTAREA}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "Optional notes"}
    />
  );
}

export function CellInput({
  value,
  onChange,
  type = "text",
  placeholder,
  compact,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "number";
  placeholder?: string;
  compact?: boolean;
}) {
  return (
    <input
      type={type}
      className={compact ? INPUT_COMPACT : INPUT}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function FinishSelect({
  value,
  projectDefault,
  onChange,
  compact,
}: {
  value?: Finish;
  projectDefault: Finish;
  onChange: (v: Finish | undefined) => void;
  compact?: boolean;
}) {
  const cls = compact ? SELECT_COMPACT : SELECT;
  return (
    <select
      className={cls}
      value={value ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === "" ? undefined : (v as Finish));
      }}
      title={value ? `Line finish: ${value}` : `Uses project default: ${projectDefault}`}
    >
      <option value="">({projectDefault})</option>
      <option value="melamine">melamine</option>
      <option value="lacquered">lacquered</option>
    </select>
  );
}

export function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`block min-w-0 ${full ? "w-full" : ""}`}>
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-stone-500">
        {label}
      </span>
      {children}
    </label>
  );
}

export function AccuracyBadge({
  accuracy,
  isCustom,
}: {
  accuracy: PricedLine["accuracy"];
  isCustom?: boolean;
}) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
        accuracy === "exact" && !isCustom
          ? "bg-green-100 text-green-800"
          : accuracy === "snapped"
            ? "bg-amber-100 text-amber-900 ring-1 ring-amber-300/60"
            : accuracy === "estimated"
              ? "bg-orange-100 text-orange-950 ring-1 ring-orange-300/60"
              : accuracy === "manual_review"
                ? "bg-red-100 text-red-900"
                : "bg-violet-100 text-violet-900"
      }`}
      title={isCustom ? "Custom or adjusted pricing" : undefined}
    >
      {isCustom && accuracy === "exact" ? "custom" : accuracy}
    </span>
  );
}
