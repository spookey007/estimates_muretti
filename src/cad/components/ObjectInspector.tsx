"use client";

import {
  EditableNumberInput,
  EditableTextInput,
} from "@/components/estimate/EditableField";
import { FinishSelect, RemoveLineButton } from "@/components/estimate/line-shared";
import { CustomPricingDisplay } from "@/components/estimate/CustomPricingDisplay";
import {
  isReturnWallPanel,
  panelCatalogLengthMm,
  panelDimensionsFromCatalog,
  panelRotationForWall,
} from "@/cad/engine/geometry/panel-dimensions";
import {
  isReturnWallShelf,
  shelfCatalogLMm,
  shelfDimensionsFromCatalog,
  shelfIntoRoomMm,
} from "@/cad/engine/geometry/shelf-dimensions";
import { rotationDegreesY, snapRotation } from "@/cad/engine/geometry/rotation";
import { getLineCustomization } from "@/lib/line-customization";
import { useSceneStore } from "@/cad/state/useSceneStore";
import { getNumericFieldConfig } from "@/lib/dimension-limits";
import { SHELF_WIDTHS, UPRIGHT_HEIGHTS } from "@/lib/line-validation";
import { placeholdersForRole } from "@/lib/field-placeholders";
import {
  validateDepth,
  validateHeight,
  validateQuantity,
  validateWidth,
} from "@/lib/line-validation";
import type { MergedRow } from "@/components/estimate/line-shared";

export function ObjectInspector({
  row,
  projectFinish,
}: {
  row?: MergedRow;
  projectFinish: "melamine" | "lacquered";
}) {
  const selectedId = useSceneStore((s) => s.selectedId);
  const object = useSceneStore((s) =>
    s.scene.objects.find((o) => o.id === s.selectedId),
  );
  const updateObject = useSceneStore((s) => s.updateObject);
  const enterMoveMode = useSceneStore((s) => s.enterMoveMode);
  const enterRotateMode = useSceneStore((s) => s.enterRotateMode);
  const removeObject = useSceneStore((s) => s.removeObject);
  const clearSelection = useSceneStore((s) => s.clearSelection);

  if (!object) {
    return (
      <p className="text-xs leading-relaxed text-stone-500">
        <strong>Single click</strong> a part to select it here.{" "}
        <strong>Double click</strong> (or Move in the toolbar) to drag it. Use{" "}
        <strong>Rotate</strong> or <kbd className="rounded bg-stone-100 px-1">R</kbd>{" "}
        for 90° turns. Sizes snap to SCENIKA catalog steps in the fields below.
      </p>
    );
  }

  const hints = placeholdersForRole(object.pricing.role);
  const onReturnShelf =
    object.type === "shelf" && isReturnWallShelf(object);
  const id = object.id;
  const custom = row ? getLineCustomization(row) : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase text-stone-600">
          {object.type}
        </span>
        {row && <CustomPricingDisplay row={row} compact />}
      </div>

      {row?.code && (
        <p className="rounded bg-stone-100 px-2 py-1 font-mono text-[10px] text-stone-700">
          {row.code} · {row.unit_price.toFixed(2)} × {row.quantity}
        </p>
      )}

      {row && custom?.isCustom && (
        <CustomPricingDisplay row={row} />
      )}

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => enterMoveMode(id)}
          className="rounded-md bg-stone-100 px-2 py-1 text-[10px] font-medium hover:bg-stone-200"
        >
          Move
        </button>
        <button
          type="button"
          onClick={() => enterRotateMode(id)}
          className="rounded-md bg-stone-100 px-2 py-1 text-[10px] font-medium hover:bg-stone-200"
        >
          Rotate
        </button>
        <button
          type="button"
          onClick={() =>
            updateObject(id, {
              rotation: snapRotation(object.type, [
                0,
                object.rotation[1] + Math.PI / 2,
                0,
              ]),
            })
          }
          className="rounded-md border border-stone-200 px-2 py-1 text-[10px] hover:bg-stone-50"
        >
          +90°
        </button>
        <span className="self-center text-[10px] text-stone-500">
          Y {rotationDegreesY(object.rotation)}°
        </span>
      </div>

      <label className="block text-[10px] font-bold uppercase text-stone-500">
        Finish
        <div className="mt-1">
          <FinishSelect
            value={object.pricing.finish}
            projectDefault={projectFinish}
            onChange={(v) =>
              updateObject(id, { pricing: { ...object.pricing, finish: v } })
            }
          />
        </div>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="text-[10px] font-bold uppercase text-stone-500">
          {object.pricing.role === "back_panel"
            ? "Panel width L (mm)"
            : onReturnShelf
              ? "Width L along wall (mm)"
              : "Width (mm)"}
          <div className="mt-1">
            <EditableNumberInput
              lineId={`${id}-w`}
              compact
              value={
                object.pricing.role === "back_panel"
                  ? panelCatalogLengthMm(object.dimensions)
                  : onReturnShelf
                    ? shelfCatalogLMm(object)
                    : object.dimensions.width
              }
              placeholder={hints.l ?? `e.g. ${SHELF_WIDTHS.join(", ")}`}
              {...getNumericFieldConfig(object.pricing.role, "l")}
              validate={(raw) => validateWidth(object.pricing.role, raw)}
              onCommit={(v) => {
                if (v == null) return;
                if (object.pricing.role === "back_panel") {
                  const onReturn = isReturnWallPanel(object);
                  updateObject(id, {
                    dimensions: panelDimensionsFromCatalog(
                      v,
                      object.dimensions.height,
                      onReturn,
                    ),
                    rotation: panelRotationForWall(onReturn),
                  });
                  return;
                }
                if (onReturnShelf) {
                  updateObject(id, {
                    dimensions: shelfDimensionsFromCatalog(
                      v,
                      shelfIntoRoomMm(object),
                      true,
                    ),
                  });
                  return;
                }
                updateObject(id, {
                  dimensions: { ...object.dimensions, width: v },
                });
              }}
            />
          </div>
        </label>
        <label className="text-[10px] font-bold uppercase text-stone-500">
          Height (mm)
          <div className="mt-1">
            <EditableNumberInput
              lineId={`${id}-h`}
              compact
              value={object.dimensions.height}
              placeholder={hints.h ?? UPRIGHT_HEIGHTS.join(", ")}
              {...getNumericFieldConfig(object.pricing.role, "h")}
              validate={(raw) => validateHeight(object.pricing.role, raw)}
              onCommit={(v) => {
                if (v == null) return;
                updateObject(id, {
                  dimensions: { ...object.dimensions, height: v },
                });
              }}
            />
          </div>
        </label>
        <label className="text-[10px] font-bold uppercase text-stone-500">
          {onReturnShelf ? "Depth into room (mm)" : "Depth (mm)"}
          <div className="mt-1">
            <EditableNumberInput
              lineId={`${id}-d`}
              compact
              value={
                onReturnShelf
                  ? shelfIntoRoomMm(object)
                  : object.dimensions.depth
              }
              placeholder="510 or 414"
              {...getNumericFieldConfig(object.pricing.role, "d")}
              validate={(raw) => validateDepth(object.pricing.role, raw)}
              onCommit={(v) => {
                if (v == null) return;
                if (onReturnShelf) {
                  updateObject(id, {
                    dimensions: shelfDimensionsFromCatalog(
                      shelfCatalogLMm(object),
                      v,
                      true,
                    ),
                    pricing: {
                      ...object.pricing,
                      depth_type: v === 414 ? "414" : "510",
                    },
                  });
                  return;
                }
                updateObject(id, {
                  dimensions: { ...object.dimensions, depth: v },
                  pricing: {
                    ...object.pricing,
                    depth_type: v === 414 ? "414" : "510",
                  },
                });
              }}
            />
          </div>
        </label>
        <label className="text-[10px] font-bold uppercase text-stone-500">
          Qty
          <div className="mt-1">
            <EditableNumberInput
              lineId={`${id}-q`}
              compact
              value={object.pricing.quantity}
              min={1}
              max={99}
              validate={validateQuantity}
              onCommit={(v) =>
                updateObject(id, {
                  pricing: { ...object.pricing, quantity: Math.max(1, v ?? 1) },
                })
              }
            />
          </div>
        </label>
      </div>

      <label className="block text-[10px] font-bold uppercase text-stone-500">
        Notes
        <div className="mt-1">
          <EditableTextInput
            lineId={`${id}-notes`}
            compact
            value={object.pricing.notes ?? ""}
            placeholder={hints.notes}
            onCommit={(v) =>
              updateObject(id, {
                pricing: { ...object.pricing, notes: v || undefined },
              })
            }
          />
        </div>
      </label>

      <p className="text-[10px] text-stone-500">
        Position: {object.position.map((n) => Math.round(n)).join(", ")} mm
      </p>

      <RemoveLineButton
        lineId={id}
        onRemove={() => {
          removeObject(id);
          clearSelection();
        }}
      />
    </div>
  );
}
