"use client";

import {
  EditableNotesInput,
  EditableNumberInput,
  EditableTextInput,
} from "@/components/estimate/EditableField";
import { CustomPricingDisplay } from "@/components/estimate/CustomPricingDisplay";
import {
  AccuracyBadge,
  DepthSelect,
  Field,
  FinishSelect,
  RemoveLineButton,
  RoleSelect,
  useRowMeta,
  type MergedRow,
} from "@/components/estimate/line-shared";
import { getLineCustomization } from "@/lib/line-customization";
import { getNumericFieldConfig } from "@/lib/dimension-limits";
import { placeholdersForRole } from "@/lib/field-placeholders";
import {
  validateDepth,
  validateHeight,
  validateLineField,
  validateQuantity,
  validateWidth,
} from "@/lib/line-validation";
import type { EstimateLineInput, Finish } from "@/lib/types";

export function EstimateLineCard({
  row,
  projectFinish,
  onChange,
  onRemove,
}: {
  row: MergedRow;
  projectFinish: Finish;
  onChange: (lineId: string, patch: Partial<EstimateLineInput>) => void;
  onRemove?: (lineId: string) => void;
}) {
  const { snapWhy, resolvedLabel } = useRowMeta(row);
  const hints = placeholdersForRole(row.role);
  const id = row.line_id;
  const custom = getLineCustomization(row);

  return (
    <article
      className={`w-full min-w-0 overflow-hidden rounded-xl border shadow-sm ${
        custom.isCustom
          ? "border-amber-300/80 bg-gradient-to-b from-amber-50/40 to-white"
          : "border-stone-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 bg-stone-50/60 px-4 py-3">
        <div className="min-w-0 flex-1">
          <span className="font-semibold text-stone-900">{id}</span>
          {row.room ? (
            <p className="mt-0.5 text-xs leading-snug text-stone-500 break-words">
              {row.room}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <AccuracyBadge accuracy={row.accuracy} isCustom={custom.isCustom} />
          <CustomPricingDisplay row={row} compact />
          {onRemove ? (
            <RemoveLineButton lineId={id} onRemove={() => onRemove(id)} />
          ) : null}
        </div>
      </div>

      <div className="space-y-4 p-4">
        <section>
          <h4 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Line input
          </h4>
          <div className="flex flex-col gap-4">
            <Field label="role" full>
              <RoleSelect row={row} onChange={onChange} />
            </Field>
            <Field label="finish" full>
              <FinishSelect
                value={row.finish}
                projectDefault={projectFinish}
                onChange={(v) => onChange(id, { finish: v })}
              />
            </Field>
            <Field label="room" full>
              <EditableTextInput
                lineId={id}
                placeholder={hints.room}
                value={row.room ?? ""}
                onCommit={(v) => onChange(id, { room: v || undefined })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="quantity">
                <EditableNumberInput
                  lineId={id}
                  placeholder={hints.quantity ?? "1"}
                  value={row.quantity}
                  min={1}
                  max={99}
                  validate={validateQuantity}
                  onCommit={(v) =>
                    onChange(id, { quantity: Math.max(1, v ?? 1) })
                  }
                />
              </Field>
              <Field label="height_mm">
                <EditableNumberInput
                  lineId={id}
                  placeholder={hints.h}
                  value={row.h}
                  {...getNumericFieldConfig(row.role, "h")}
                  validate={(raw) => validateHeight(row.role, raw)}
                  onCommit={(v) => onChange(id, { h: v })}
                />
              </Field>
              <Field label="width_mm">
                <EditableNumberInput
                  lineId={id}
                  placeholder={hints.l}
                  value={row.l}
                  {...getNumericFieldConfig(row.role, "l")}
                  validate={(raw) => validateWidth(row.role, raw)}
                  onCommit={(v) => onChange(id, { l: v })}
                />
              </Field>
              <Field label="depth_mm">
                <EditableNumberInput
                  lineId={id}
                  placeholder={hints.d}
                  value={row.d}
                  {...getNumericFieldConfig(row.role, "d")}
                  validate={(raw) => validateDepth(row.role, raw)}
                  onCommit={(v) => onChange(id, { d: v })}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="side">
                <EditableTextInput
                  lineId={id}
                  placeholder={hints.side ?? "dx / sx"}
                  value={row.side ?? ""}
                  validate={(raw) => validateLineField(row, "side", raw)}
                  onCommit={(v) =>
                    onChange(id, {
                      side: (v as EstimateLineInput["side"]) || undefined,
                    })
                  }
                />
              </Field>
              <Field label="depth_type">
                <DepthSelect row={row} onChange={onChange} />
              </Field>
            </div>
            <Field label="notes" full>
              <EditableNotesInput
                lineId={id}
                placeholder={hints.notes}
                value={row.notes ?? ""}
                onCommit={(v) => onChange(id, { notes: v || undefined })}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-lg bg-stone-50 p-4">
          <h4 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            SCENIKA result
          </h4>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div className="min-w-0">
              <dt className="text-xs text-stone-500">resolved</dt>
              <dd className="mt-0.5 font-mono text-sm font-medium break-all">
                {resolvedLabel || "-"}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-stone-500">code</dt>
              <dd className="mt-0.5 font-mono text-sm font-medium break-all">
                {row.code}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500">finish</dt>
              <dd className="mt-0.5 text-sm">{row.finish_applied ?? projectFinish}</dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500">unit x qty</dt>
              <dd className="mt-0.5 tabular-nums">
                {row.unit_price.toFixed(2)} x {row.quantity}
              </dd>
            </div>
            <div className="col-span-2 sm:col-span-4">
              <dt className="text-xs text-stone-500">Pricing</dt>
              <dd className="mt-1">
                <CustomPricingDisplay row={row} />
              </dd>
            </div>
          </dl>
          <p className="mt-3 border-t border-stone-200 pt-3 text-xs leading-relaxed text-stone-600 break-words">
            {snapWhy ?? (row.accuracy === "exact" ? "Matches catalog" : "-")}
          </p>
        </section>
      </div>
    </article>
  );
}
