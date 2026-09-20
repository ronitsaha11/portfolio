"use client";

import { useEffect, useRef, useState } from "react";
import { useLenis } from "@/components/providers/LenisProvider";
import { useLattice } from "@/components/lattice/LatticeDirector";
import { chapters, site } from "@/data/site";

/**
 * Navigation below 1024px, where the chapter rail is not shown.
 *
 * A full-height sheet rather than a hamburger drawer that slides in
 * from the side: the chapter list is fourteen items and a side drawer
 * would need its own scroll inside a scrolling page, which on a phone
 * is the fastest way to trap someone. This covers the viewport, closes
 * on Escape, on backdrop tap and on selection, restores focus to the
 * trigger, and keeps the page behind it from scrolling underneath.
 *
 * The list is a real <ol> so a screen reader gets the count and the
 * ordering, which is the point of numbering the chapters at all.
 */
export function MobileNav({ onOpenPalette }: { onOpenPalette: () => void }) {
  const { scrollTo } = useLenis();
  const { activeId } = useLattice();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    // Move focus into the sheet so the first Tab lands inside it.
    panelRef.current?.querySelector<HTMLElement>("button")?.focus();

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        className="t-legend cursor-pointer px-3 py-[0.42rem] transition-colors"
        style={{
          border: "1px solid var(--line-strong)",
          color: "var(--ink-hi)",
          transitionDuration: "var(--d-tick)",
        }}
      >
        Menu
      </button>

      {open ? (
        <div
          id="mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Chapters"
          className="fixed inset-0 z-[110] flex flex-col"
          style={{ background: "var(--bg-0)", animation: "gt-fade-in var(--d-ui) var(--e-settle)" }}
        >
          <div
            className="flex h-[60px] shrink-0 items-center justify-between px-[var(--spacing-page)]"
            style={{ borderBottom: "1px solid var(--line)" }}
          >
            <span className="t-legend" style={{ color: "var(--ink-lo)" }}>
              {site.concept}
            </span>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus();
              }}
              className="t-legend cursor-pointer px-3 py-[0.42rem]"
              style={{ border: "1px solid var(--line-strong)", color: "var(--ink-hi)" }}
            >
              Close
            </button>
          </div>

          <div ref={panelRef} className="flex-1 overflow-y-auto px-[var(--spacing-page)] py-4">
            <ol className="m-0 flex list-none flex-col p-0">
              {chapters.map((c) => {
                const current = c.id === activeId;
                return (
                  <li key={c.id} style={{ borderBottom: "1px solid var(--line-hair)" }}>
                    <button
                      type="button"
                      aria-current={current ? "true" : undefined}
                      onClick={() => {
                        setOpen(false);
                        scrollTo(`#${c.id}`);
                      }}
                      className="flex w-full cursor-pointer items-baseline gap-4 border-0 bg-transparent px-0 py-[0.85rem] text-left"
                    >
                      <span
                        className="t-mono w-[1.6rem] shrink-0 text-[0.7rem] tabular-nums"
                        style={{ color: current ? "var(--mark)" : "var(--ink-lo)" }}
                      >
                        {c.station}
                      </span>
                      <span
                        className="flex-1 font-[family-name:var(--font-display)] text-[1.05rem] font-bold"
                        style={{
                          fontVariationSettings: '"wdth" 96',
                          color: current ? "var(--mark)" : "var(--ink-hi)",
                        }}
                      >
                        {c.label}
                      </span>
                      {c.kind === "scene" ? (
                        <span className="t-legend shrink-0" style={{ color: "var(--ink-lo)" }}>
                          System
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="mt-6 flex flex-wrap gap-2 pb-8">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onOpenPalette();
                }}
                className="t-legend cursor-pointer px-3 py-[0.5rem]"
                style={{ border: "1px solid var(--line-strong)", color: "var(--ink-hi)" }}
              >
                Search
              </button>
              <a
                href={site.github}
                target="_blank"
                rel="noopener noreferrer"
                className="t-legend px-3 py-[0.5rem] no-underline"
                style={{ border: "1px solid var(--line-strong)", color: "var(--ink-hi)" }}
              >
                GitHub ↗
              </a>
              <a
                href={site.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="t-legend px-3 py-[0.5rem] no-underline"
                style={{ border: "1px solid var(--line-strong)", color: "var(--ink-hi)" }}
              >
                LinkedIn ↗
              </a>
              <a
                href={site.resume}
                target="_blank"
                rel="noopener noreferrer"
                className="t-legend px-3 py-[0.5rem] no-underline"
                style={{ border: "1px solid var(--line-strong)", color: "var(--ink-hi)" }}
              >
                Résumé ↗
              </a>
              <a
                href={`mailto:${site.email}`}
                className="t-legend px-3 py-[0.5rem] no-underline"
                style={{ border: "1px solid var(--mark)", background: "var(--mark)", color: "var(--mark-on)" }}
              >
                Email
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
