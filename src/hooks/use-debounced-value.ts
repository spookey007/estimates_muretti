import { useEffect, useState } from "react";

/** Debounce value updates (e.g. re-price without re-rendering inputs every keystroke). */
export function useDebouncedValue<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState(value);

  // First transition from “no estimate” → request: update immediately so the UI
  // does not flash “Could not price” while the debounce timer runs.
  useEffect(() => {
    if (value != null && debounced == null) {
      setDebounced(value);
    }
  }, [value, debounced]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}
