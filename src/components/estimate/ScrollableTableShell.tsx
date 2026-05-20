"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
  type RefObject,
} from "react";

export function ScrollableTableShell({
  children,
  scrollRef,
  minWidth,
}: {
  children: ReactNode;
  scrollRef?: RefObject<HTMLDivElement | null>;
  minWidth: number;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      innerRef.current = el;
      if (scrollRef) {
        (scrollRef as MutableRefObject<HTMLDivElement | null>).current = el;
      }
    },
    [scrollRef],
  );

  const updateShadows = useCallback(() => {
    const el = innerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    updateShadows();
    el.addEventListener("scroll", updateShadows, { passive: true });
    const ro = new ResizeObserver(updateShadows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateShadows);
      ro.disconnect();
    };
  }, [updateShadows, minWidth]);

  return (
    <div className="relative w-full min-w-0">
      {canScrollLeft && (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-30 w-8 bg-gradient-to-r from-white to-transparent"
          aria-hidden
        />
      )}
      {canScrollRight && (
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-30 w-10 bg-gradient-to-l from-white to-transparent"
          aria-hidden
        />
      )}
      <p className="mb-2 flex flex-wrap items-center gap-2 text-xs text-stone-500">
        <span className="rounded bg-stone-100 px-2 py-0.5 font-medium text-stone-700">
          Table {minWidth}px
        </span>
        Scroll horizontally — all columns visible, first column pinned
      </p>
      <div
        ref={setRef}
        className="w-full min-w-0 overflow-x-auto overflow-y-visible overscroll-x-contain rounded-xl border border-stone-200 bg-white shadow-sm [-webkit-overflow-scrolling:touch]"
      >
        {children}
      </div>
    </div>
  );
}
