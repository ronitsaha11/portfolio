"use client";

import { useEffect, useRef, useState } from "react";
import { animate, utils } from "animejs";
import { DUR, EASE, onFrame } from "@/lib/motion";
import { useMotionPrefs } from "@/components/providers/MotionPrefsProvider";
import { useLenis } from "@/components/providers/LenisProvider";
import { useLattice } from "@/components/lattice/LatticeDirector";
import { CommandPalette } from "./CommandPalette";
import { MobileNav } from "./MobileNav";
import { chapterById, site } from "@/data/site";

/**
 * The masthead.
 *
 * Transparent over the hero, then elevated once the reader has left it
 * — the change is a real signal (you are no longer at the top) rather
 * than an effect, and it is the only thing that happens on scroll up
 * here. No hide-on-scroll-down: a nav that disappears when you are
 * looking for it is the most common way this pattern goes wrong.
 *
 * The current chapter is named in the bar on desktop. That comes from
 * the lattice director, which already knows which chapter owns the
 * scene, so the label and the 3D can never disagree about where you
 * are.
 */
export function SiteNav() {
  const { scrollTo } = useLenis();
  const { activeId } = useLattice();
  const { animate: allowed } = useMotionPrefs();
  const [elevated, setElevated] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const readout = useRef<HTMLSpanElement>(null);

  /**
   * One boolean, from the page's only scroll loop.
   *
   * This had its own listener and its own rAF. `setElevated` with an
   * unchanged value is free — React bails out — so the cost was never
   * the re-render; it was a third scroll subscriber measuring the same
   * position two other systems had already measured that frame.
   */
  useEffect(() => {
    return onFrame((frame) => {
      setElevated(frame.y > frame.viewport * 0.6);
    });
  }, []);

  /**
   * The indicator moves rather than swapping.
   *
   * Changing the text in place is a fact appearing out of nowhere;
   * sliding the old station out and the new one in says the reader
   * moved, which is what actually happened. It is one element and one
   * tween, keyed on the chapter the lattice director reports — so the
   * label, the 3D and the rail cannot disagree about where you are.
   */
  useEffect(() => {
    const el = readout.current;
    if (!el || !allowed) return;
    const anim = animate(el, {
      translateY: [8, 0],
      opacity: [0, 1],
      duration: DUR.ui,
      ease: EASE.settle,
    });
    return () => {
      anim.revert();
      utils.set(el, { translateY: 0, opacity: 1 });
    };
  }, [activeId, allowed]);

  const chapter = chapterById(activeId);

  return (
    <>
      <header
        className="fixed top-0 right-0 left-0 z-50 lg:left-[var(--spacing-rail)]"
        style={{
          background: elevated
            ? "color-mix(in srgb, var(--bg-0) 86%, transparent)"
            : "transparent",
          borderBottom: `1px solid ${elevated ? "var(--line)" : "transparent"}`,
          backdropFilter: elevated ? "blur(10px)" : "none",
          transitionProperty: "background-color, border-color, backdrop-filter",
          transitionDuration: "var(--d-ui)",
          transitionTimingFunction: "var(--e-settle)",
        }}
      >
        <div className="mx-auto flex h-[60px] max-w-[var(--content-max)] items-center justify-between gap-4 px-[var(--spacing-page)]">
          <div className="flex min-w-0 items-baseline gap-3">
            <button
              type="button"
              onClick={() => scrollTo("#top")}
              className="shrink-0 cursor-pointer border-0 bg-transparent p-0 text-left"
            >
              <span
                className="font-[family-name:var(--font-display)] text-[0.98rem] font-extrabold tracking-[-0.015em]"
                style={{ fontVariationSettings: '"wdth" 90', color: "var(--ink-hi)" }}
              >
                {site.name}
              </span>
              <span className="sr-only"> — back to the top</span>
            </button>

            {/* Where you are. Appears only once the hero is behind you,
                because at the top the answer is obvious. */}
            <span
              ref={readout}
              key={activeId}
              aria-hidden="true"
              className="t-legend hidden min-w-0 items-baseline gap-2 md:flex"
              style={{
                color: "var(--ink-lo)",
                opacity: elevated && chapter ? 1 : 0,
                transition: "opacity var(--d-ui) var(--e-settle)",
              }}
            >
              <span style={{ color: "var(--mark)" }}>{chapter?.station ?? ""}</span>
              <span className="truncate">{chapter?.label ?? ""}</span>
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="t-legend hidden cursor-pointer items-center gap-2 px-3 py-[0.42rem] transition-colors sm:flex"
              style={{
                border: "1px solid var(--line-strong)",
                color: "var(--ink-md)",
                transitionDuration: "var(--d-tick)",
              }}
            >
              Go to
              <kbd
                aria-hidden="true"
                className="t-mono text-[0.6rem]"
                style={{ color: "var(--ink-lo)" }}
              >
                ⌘K
              </kbd>
            </button>

            <a
              href={site.resume}
              target="_blank"
              rel="noopener noreferrer"
              className="rule-in t-legend hidden px-3 py-[0.42rem] no-underline transition-colors md:block"
              style={{ color: "var(--ink-md)", transitionDuration: "var(--d-tick)" }}
            >
              Résumé
            </a>

            <a
              href={site.github}
              target="_blank"
              rel="noopener noreferrer"
              className="rule-in t-legend hidden px-3 py-[0.42rem] no-underline transition-colors lg:block"
              style={{ color: "var(--ink-md)", transitionDuration: "var(--d-tick)" }}
            >
              GitHub
            </a>

            <button
              type="button"
              onClick={() => scrollTo("#contact")}
              className="rule-in t-legend hidden cursor-pointer border-0 bg-transparent px-3 py-2 transition-colors lg:block"
              style={{ color: "var(--ink-md)", transitionDuration: "var(--d-tick)" }}
            >
              Contact
            </button>

            <MobileNav onOpenPalette={() => setPaletteOpen(true)} />
          </div>
        </div>
      </header>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  );
}
