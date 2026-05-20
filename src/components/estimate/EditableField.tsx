"use client";

import { INPUT, INPUT_COMPACT, TEXTAREA } from "@/components/estimate/line-shared";
import type { FieldValidation } from "@/lib/line-validation";
import { useCallback, useEffect, useRef, useState } from "react";

function fieldClass(compact: boolean | undefined, validation?: FieldValidation) {
  const base = compact ? INPUT_COMPACT : INPUT;
  if (!validation || validation.valid) {
    if (validation?.warn) return `${base} border-amber-400 bg-amber-50/40`;
    return base;
  }
  return `${base} border-red-400 ring-1 ring-red-200 bg-red-50/30`;
}

function Hint({
  validation,
  compact,
}: {
  validation?: FieldValidation;
  compact?: boolean;
}) {
  if (!validation?.message) return null;
  const cls = validation.valid
    ? validation.warn
      ? "text-amber-800"
      : "text-stone-500"
    : "text-red-600";
  return (
    <span
      className={`mt-0.5 block leading-tight ${cls} ${
        compact ? "text-[9px]" : "text-[10px]"
      }`}
      role="status"
    >
      {validation.message}
    </span>
  );
}

export function EditableTextInput({
  lineId,
  value,
  onCommit,
  placeholder,
  compact,
  validate,
}: {
  lineId: string;
  value: string;
  onCommit: (v: string) => void;
  placeholder?: string;
  compact?: boolean;
  validate?: (raw: string) => FieldValidation;
}) {
  const [local, setLocal] = useState(value);
  const focusedRef = useRef(false);
  const syncKey = `${lineId}:${value}`;

  useEffect(() => {
    if (!focusedRef.current) setLocal(value);
  }, [syncKey, value]);

  const validation = validate?.(local);

  const commit = useCallback(() => {
    focusedRef.current = false;
    const v = validate?.(local);
    if (v && !v.valid) {
      setLocal(value);
      return;
    }
    onCommit(local);
  }, [local, onCommit, validate, value]);

  return (
    <div className="min-w-0">
      <input
        className={fieldClass(compact, validation)}
        placeholder={placeholder}
        title={validation?.message}
        value={local}
        onFocus={() => {
          focusedRef.current = true;
        }}
        onBlur={commit}
        onChange={(e) => setLocal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
      />
      <Hint validation={validation} compact={compact} />
    </div>
  );
}

/** Native number input: arrows/spinners edit locally; parent updates on blur only. */
export function EditableNumberInput({
  lineId,
  value,
  onCommit,
  placeholder,
  compact,
  validate,
  min,
  max,
  step = 1,
}: {
  lineId: string;
  value: number | undefined;
  onCommit: (v: number | undefined) => void;
  placeholder?: string;
  compact?: boolean;
  validate?: (raw: string) => FieldValidation;
  min?: number;
  max?: number;
  step?: number;
}) {
  const displayValue = value != null ? String(value) : "";
  const [local, setLocal] = useState(displayValue);
  const focusedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const syncKey = `${lineId}:${displayValue}`;

  useEffect(() => {
    if (!focusedRef.current) setLocal(displayValue);
  }, [syncKey, displayValue]);

  const validation = validate?.(local);

  const parseCommit = useCallback(
    (raw: string): number | undefined | null => {
      const trimmed = raw.trim();
      if (trimmed === "") return undefined;
      const n = Number(trimmed);
      if (!Number.isFinite(n)) return null;
      const v = validate?.(trimmed);
      if (v && !v.valid) return null;
      return n;
    },
    [validate],
  );

  const commit = useCallback(() => {
    focusedRef.current = false;
    const parsed = parseCommit(local);
    if (parsed === null) {
      setLocal(displayValue);
      return;
    }
    onCommit(parsed);
    setLocal(parsed != null ? String(parsed) : "");
  }, [local, onCommit, parseCommit, displayValue]);

  const bumpLocal = useCallback(
    (direction: -1 | 1) => {
      const cur =
        local.trim() === ""
          ? (value ?? (min != null ? min : 0))
          : Number(local);
      if (!Number.isFinite(cur)) return;
      const next = cur + direction * step;
      setLocal(String(next));
    },
    [local, value, min, step],
  );

  return (
    <div className="min-w-0">
      <div className="flex items-stretch gap-0.5">
        <button
          type="button"
          tabIndex={-1}
          aria-label="Decrease"
          className="shrink-0 rounded-l-md border border-stone-300 bg-stone-100 px-2 py-0 text-base font-medium leading-none text-stone-800 hover:bg-stone-200 active:bg-stone-300"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            focusedRef.current = true;
            bumpLocal(-1);
            inputRef.current?.focus();
          }}
        >
          −
        </button>
        <input
          ref={inputRef}
          type="number"
          step={step}
          min={min}
          max={max}
          className={`${fieldClass(compact, validation)} number-input-no-spin min-w-[3.25rem] flex-1 rounded-none text-center tabular-nums`}
          placeholder={placeholder}
          title={validation?.message}
          value={local}
          onFocus={() => {
            focusedRef.current = true;
          }}
          onBlur={commit}
          onChange={(e) => setLocal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label="Increase"
          className="shrink-0 rounded-r-md border border-stone-300 bg-stone-100 px-2 py-0 text-base font-medium leading-none text-stone-800 hover:bg-stone-200 active:bg-stone-300"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            focusedRef.current = true;
            bumpLocal(1);
            inputRef.current?.focus();
          }}
        >
          +
        </button>
      </div>
      <Hint validation={validation} compact={compact} />
    </div>
  );
}

export function EditableNotesInput({
  lineId,
  value,
  onCommit,
  placeholder,
  compact,
}: {
  lineId: string;
  value: string;
  onCommit: (v: string) => void;
  placeholder?: string;
  compact?: boolean;
}) {
  const [local, setLocal] = useState(value);
  const focusedRef = useRef(false);
  const syncKey = `${lineId}:${value}`;

  useEffect(() => {
    if (!focusedRef.current) setLocal(value);
  }, [syncKey, value]);

  const commit = useCallback(() => {
    focusedRef.current = false;
    onCommit(local);
  }, [local, onCommit]);

  return (
    <textarea
      rows={compact ? 2 : 3}
      className={compact ? `${TEXTAREA} min-h-[3.5rem] text-xs` : TEXTAREA}
      placeholder={placeholder}
      value={local}
      onFocus={() => {
        focusedRef.current = true;
      }}
      onBlur={commit}
      onChange={(e) => setLocal(e.target.value)}
    />
  );
}
