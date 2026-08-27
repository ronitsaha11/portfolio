"use client";

import { useEffect, useRef, useState } from "react";
import { useLenis } from "@/components/providers/LenisProvider";
import { sections } from "@/data/site";

/**
 * Station navigation below 1024px, where the contour rail collapses to a
 * bare progress bar and leaves no way to jump.
 *
 * A disclosure sheet rather than a slide-out drawer: it is shorter to
 * open, needs no overlay, and cannot strand a visitor behind a scrim.
 * Escape closes it, focus returns to the trigger, and the list is a real
 * <ol> so a screen reader gets the count and the ordering.
 */
export function StationSheet() {
  const { scrollTo } = useLenis();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div className="relative lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="station-sheet"
        className="t-legend cursor-pointer px-3 py-[0.4rem] transition-colors"
        style={{
          border: "1px solid var(--line-strong)",
          color: "var(--ink-hi)",
          transitionDuration: "var(--d-tick)",
        }}
      >
        Stations
      </button>

      {open ? (
        <div
          ref={panelRef}
          id="station-sheet"
          className="absolute top-[calc(100%+8px)] right-0 z-50 w-[min(280px,calc(100vw-2rem))]"
          style={{
            background: "var(--bg-3)",
            border: "1px solid var(--line)",
            boxShadow: "var(--lift-3)",
            animation: "gt-pop-in var(--d-ui) var(--e-settle)",
          }}
        >
          <ol className="m-0 flex list-none flex-col p-0">
            {sections.map((s) => (
              <li key={s.id} style={{ borderBottom: "1px solid var(--line)" }}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    scrollTo(`#${s.id}`);
                  }}
                  className="flex w-full cursor-pointer items-baseline gap-3 border-0 bg-transparent px-4 py-3 text-left"
                >
                  <span className="t-mono text-[0.68rem]" style={{ color: "var(--mark)" }}>
                    {s.station}
                  </span>
                  <span className="text-[0.88rem]" style={{ color: "var(--ink-hi)" }}>
                    {s.label}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
