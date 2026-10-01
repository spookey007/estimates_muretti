"use client";

export type PriceListTemplateId = "scenika-2023-10";

export type TemplateOption = {
  id: string;
  name: string;
  description: string;
  available: boolean;
  priceListId?: PriceListTemplateId;
};

export const BLANK_TEMPLATES: TemplateOption[] = [
  {
    id: "scenika-2023-10",
    name: "SCENIKA",
    description: "SCENIKA price list 10/2023 — shelves, panels, uprights, equipment",
    available: true,
    priceListId: "scenika-2023-10",
  },
  {
    id: "flexy-soon",
    name: "Flexy LED",
    description: "Dedicated Flexy lighting catalog",
    available: false,
  },
  {
    id: "custom-panels-soon",
    name: "Custom panels",
    description: "Custom panel / lacquer add-ons catalog",
    available: false,
  },
  {
    id: "equipment-soon",
    name: "Equipment pack",
    description: "Standalone accessories & hardware pack",
    available: false,
  },
];

export function TemplatePicker({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="field-label mb-0">Choose a price-list template</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {BLANK_TEMPLATES.map((tpl) => {
          const selected = selectedId === tpl.id;
          return (
            <label
              key={tpl.id}
              className={`relative flex cursor-pointer flex-col gap-1.5 rounded-xl border p-4 transition ${
                !tpl.available
                  ? "cursor-not-allowed border-[var(--border)] bg-[#f8fafc] opacity-70"
                  : selected
                    ? "border-[var(--primary)] bg-[#eef4fa] shadow-sm"
                    : "border-[var(--border)] bg-white hover:border-[#b8c5d4] hover:bg-[#f8fafc]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  {tpl.name}
                </span>
                {tpl.available ? (
                  <input
                    type="radio"
                    name="blank-template"
                    className="mt-0.5"
                    checked={selected}
                    onChange={() => onSelect(tpl.id)}
                  />
                ) : (
                  <span className="rounded-md bg-[#e8edf3] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Coming soon
                  </span>
                )}
              </div>
              <span className="text-xs leading-relaxed text-[var(--muted)]">
                {tpl.description}
              </span>
              {tpl.available && selected ? (
                <span className="text-[11px] font-medium text-[var(--primary)]">
                  Selected · ready to use
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
