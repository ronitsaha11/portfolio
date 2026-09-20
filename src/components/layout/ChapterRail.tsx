"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { onFrame } from "@/lib/motion";
import { useLenis } from "@/components/providers/LenisProvider";
import { useLattice } from "@/components/lattice/LatticeDirector";
import { chapters, site } from "@/data/site";

/**
 * The chapter rail.
 *
 * A real elevation profile down the left edge: each chapter's offset is
 * how much there is to read there, so the three flagship case studies
 * bulge and the short sections pull in. The shape of the page is
 * legible before you have scrolled any of it, and your position is a
 * marker travelling the line.
 *
 * It replaces a progress bar and a table of contents at once. Below
 * 1024px it collapses to a hairline progress contour under the
 * masthead, and the mobile sheet carries the list.
 *
 * WHAT MAKES IT AN INSTRUMENT RATHER THAN A DECORATION: the active
 * chapter comes from the lattice director, not from a second scroll
 * calculation of its own. There is one answer to "where am I" on this
 * page and every component asks the same object for it.
 *
 * NOTHING HERE RE-RENDERS WHILE YOU SCROLL.
 *
 * It used to. `setProgress` on every scroll frame re-rendered the rail
 * — thirty-odd SVG children and a list of buttons — sixty times a
 * second, for a dash offset and two digits. Now the engine hands over
 * a number and four attributes are written by hand. React re-renders
 * this component when the viewport resizes and when the chapter
 * changes, which is twice a minute rather than sixty times a second.
 *
 * THE ACTIVE MARKER TRAVELS. One circle, moved between stations with a
 * CSS transition rather than one circle per station switched on and
 * off: the reader should see the indicator go somewhere, because they
 * went somewhere.
 *
 * Keyboard: ⌥↑ / ⌥↓ step between chapters from anywhere. Plain arrow
 * keys are left alone, because they have to keep scrolling the page.
 */

const W = 52;
const PAD = 52;

/** Smoothed through the chapter points, so the profile reads as terrain. */
function buildPath(points: { x: number; y: number }[]): string {
  const first = points[0];
  if (!first || points.length < 2) return "";

  let d = `M ${first.x} ${first.y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p = points[i];
    const n = points[i + 1];
    if (!p || !n) continue;
    const midY = (p.y + n.y) / 2;
    d += ` C ${p.x} ${midY}, ${n.x} ${midY}, ${n.x} ${n.y}`;
  }
  return d;
}

export function ChapterRail() {
  const { scrollTo } = useLenis();
  const { activeId } = useLattice();
  const [height, setHeight] = useState(760);
  const pathRef = useRef<SVGPathElement>(null);
  const [len, setLen] = useState(0);

  /** Written every frame, read by nothing else. */
  const fillRef = useRef<SVGPathElement>(null);
  const markerRef = useRef<SVGCircleElement>(null);
  const percentRef = useRef<HTMLSpanElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const usable = height - PAD * 2;
  const points = chapters.map((c, i) => ({
    x: 12 + c.relief * 26,
    y: PAD + (i / (chapters.length - 1)) * usable,
  }));
  const d = buildPath(points);
  const activeIndex = chapters.findIndex((c) => c.id === activeId);

  useEffect(() => {
    const p = pathRef.current;
    if (p) setLen(p.getTotalLength());
  }, [d]);

  useEffect(() => {
    const onResize = () => setHeight(window.innerHeight);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /**
   * The one subscription. Four writes, no React, no layout reads —
   * the engine measured the document once and hands over a fraction.
   */
  useEffect(() => {
    if (len <= 0) return;
    let last = -1;

    return onFrame((frame) => {
      const p = frame.progress;
      if (Math.abs(p - last) < 0.0004) return;
      last = p;

      const fill = fillRef.current;
      if (fill) fill.style.strokeDashoffset = String(len * (1 - p));

      const marker = markerRef.current;
      if (marker) marker.setAttribute("cy", String(PAD + p * usable));

      const percent = percentRef.current;
      if (percent) percent.textContent = `${Math.round(p * 100)}`.padStart(2, "0");

      const bar = barRef.current;
      if (bar) bar.style.transform = `scaleX(${p.toFixed(4)})`;
    });
  }, [len, usable]);

  /** The station counter changes on chapter boundaries, not on frames. */
  useEffect(() => {
    const el = countRef.current;
    if (!el) return;
    const i = activeIndex < 0 ? 0 : activeIndex;
    el.textContent = `${String(i + 1).padStart(2, "0")} / ${String(chapters.length).padStart(2, "0")}`;
  }, [activeIndex]);

  const step = useCallback(
    (dir: 1 | -1) => {
      const i = activeIndex < 0 ? 0 : activeIndex;
      const next = chapters[Math.min(Math.max(i + dir, 0), chapters.length - 1)];
      if (next) scrollTo(`#${next.id}`);
    },
    [activeIndex, scrollTo],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        step(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  const active = points[Math.max(activeIndex, 0)] ?? points[0];

  return (
    <>
      <nav
        aria-label="Chapters"
        className="fixed top-0 left-0 z-40 hidden h-screen lg:block"
        style={{ width: W, borderRight: "1px solid var(--line)", background: "var(--bg-0)" }}
        data-instrument=""
      >
        <span
          className="t-mono absolute top-3 left-1/2 -translate-x-1/2 text-[0.55rem] tracking-[0.1em]"
          style={{ color: "var(--ink-lo)", writingMode: "vertical-rl" }}
        >
          {site.lat}N
        </span>

        <svg
          width={W}
          height={height}
          viewBox={`0 0 ${W} ${height}`}
          className="absolute inset-0"
          aria-hidden="true"
        >
          <path ref={pathRef} d={d} fill="none" stroke="var(--line-strong)" strokeWidth="1" />
          {len > 0 ? (
            <path
              ref={fillRef}
              d={d}
              fill="none"
              stroke="var(--mark)"
              strokeWidth="1.5"
              strokeDasharray={len}
              strokeDashoffset={len}
            />
          ) : null}

          {points.map((p, i) => {
            const c = chapters[i];
            if (!c) return null;
            const passed = i <= activeIndex;
            const isScene = c.kind === "scene";
            return (
              <line
                key={c.id}
                x1={p.x - (isScene ? 6 : 4)}
                y1={p.y}
                x2={p.x + (isScene ? 6 : 4)}
                y2={p.y}
                stroke={passed ? "var(--mark)" : "var(--line-strong)"}
                strokeWidth={isScene ? 1.4 : 1}
                style={{ transition: "stroke var(--d-ui) var(--e-settle)" }}
              />
            );
          })}

          {/* The station indicator: one circle that travels to the
              chapter you entered, rather than a set that blink. */}
          {active ? (
            <circle
              cx={active.x}
              cy={active.y}
              r="3.4"
              fill="var(--mark)"
              style={{
                transition: "cx var(--d-pass) var(--e-instr), cy var(--d-pass) var(--e-instr)",
              }}
            />
          ) : null}

          {/* The reader's exact position, which is not the same thing
              as the chapter they are in. */}
          <circle ref={markerRef} cx="26" cy={PAD} r="2" fill="var(--mark)" opacity="0.45" />
        </svg>

        {/* Real hit targets over the drawn chapters. */}
        <ol className="relative m-0 h-full list-none p-0">
          {points.map((p, i) => {
            const c = chapters[i];
            if (!c) return null;
            return (
              <li
                key={c.id}
                className="group absolute left-0"
                style={{ top: p.y - 16, width: W, height: 32 }}
              >
                <button
                  type="button"
                  onClick={() => scrollTo(`#${c.id}`)}
                  aria-current={c.id === activeId ? "true" : undefined}
                  className="h-full w-full cursor-pointer border-0 bg-transparent p-0"
                >
                  <span className="sr-only">
                    Chapter {c.station}: {c.label}
                  </span>
                </button>

                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-[calc(100%+8px)] -translate-y-1/2 whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                  style={{ transitionDuration: "var(--d-tick)" }}
                >
                  <span
                    className="t-legend px-2 py-1"
                    style={{
                      background: "var(--bg-3)",
                      border: "1px solid var(--line)",
                      color: "var(--ink-hi)",
                      boxShadow: "var(--lift-2)",
                    }}
                  >
                    {c.station} · {c.label}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>

        <span
          aria-hidden="true"
          className="t-mono absolute bottom-3 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[0.55rem] tracking-[0.1em] tabular-nums"
        >
          <span ref={countRef} style={{ color: "var(--ink-lo)", writingMode: "vertical-rl" }}>
            01 / {String(chapters.length).padStart(2, "0")}
          </span>
          <span style={{ color: "var(--mark)", writingMode: "vertical-rl" }}>
            <span ref={percentRef}>00</span>%
          </span>
        </span>
      </nav>

      <div
        aria-hidden="true"
        className="fixed top-[60px] left-0 z-40 h-[2px] w-full lg:hidden"
        style={{ background: "var(--line)" }}
      >
        <div
          ref={barRef}
          className="h-full origin-left"
          style={{ background: "var(--mark)", transform: "scaleX(0)" }}
        />
      </div>
    </>
  );
}
