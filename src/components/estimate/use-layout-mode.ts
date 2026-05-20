"use client";

import { TABLE_NATURAL_MIN_PX } from "@/components/estimate/line-shared";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

export type LayoutPreference = "auto" | "cards" | "table" | "design" | "cad";
export type EffectiveLayout = "cards" | "table" | "design" | "cad";

export function useLayoutMode(liveScrollRef?: RefObject<HTMLDivElement | null>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollProbeRef = useRef<HTMLDivElement>(null);
  const tableProbeRef = useRef<HTMLTableElement>(null);

  const [preference, setPreference] = useState<LayoutPreference>("auto");
  const [viewportNarrow, setViewportNarrow] = useState(false);
  const [tableOverflows, setTableOverflows] = useState(false);
  const [contentClipped, setContentClipped] = useState(false);

  const measure = useCallback(() => {
    const container = containerRef.current;
    const scrollProbe = scrollProbeRef.current;
    const table = tableProbeRef.current;

    if (!container) return;

    const available = container.clientWidth;

    let naturalWidth = TABLE_NATURAL_MIN_PX;
    if (table) {
      naturalWidth = Math.max(table.scrollWidth, table.getBoundingClientRect().width);
    }

    const widthOverflow = naturalWidth > available + 4;
    setTableOverflows(widthOverflow);
    setViewportNarrow(available < 768);

    let clipped = false;
    if (scrollProbe) {
      const inputs = scrollProbe.querySelectorAll("select, input, textarea");
      inputs.forEach((el) => {
        const node = el as HTMLElement;
        if (node.scrollWidth > node.clientWidth + 2) clipped = true;
      });
    }

    const live = liveScrollRef?.current;
    if (live && live.scrollWidth > live.clientWidth + 4) {
      setTableOverflows(true);
    }

    setContentClipped(clipped);
  }, [liveScrollRef]);

  useEffect(() => {
    measure();
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => measure());
    ro.observe(container);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  /** Auto: table on wide screens; cards when narrow or fields would clip. */
  const needsCards = contentClipped || viewportNarrow;

  const effectiveLayout: EffectiveLayout =
    preference === "auto"
      ? needsCards
        ? "cards"
        : "table"
      : preference === "design"
        ? "design"
        : preference === "cad"
          ? "cad"
          : preference;

  return {
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
  };
}
