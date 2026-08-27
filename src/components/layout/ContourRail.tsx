"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLenis } from "@/components/providers/LenisProvider";
import { sections, site } from "@/data/site";

/**
 * The contour rail.
 *
 * A real elevation profile down the left edge: the contour's offset at
 * each station is how much there is to read there, so the deep case
 * studies bulge and the short sections pull in. Your scroll position is a
 * marker tick travelling the line, and the traversed portion is drawn in
 * marker orange while the rest stays hairline — so the shape of the page
 * is legible before you have scrolled it.
 *
 * It replaces both a progress bar and a nav. Below 1024px it collapses to
 * a horizontal progress contour under the nav bar.
 *
 * Keyboard: ⌥↑ / ⌥↓ jump between stations from anywhere on the page.
 */

const W = 44;
const PAD = 40;

/** Catmull-Rom-ish smoothing through the station points. */
function buildPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  const first = points[0];
  if (!first) return "";

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

export function ContourRail() {
  const { scrollTo } = useLenis();
  const [progress, setProgress] = useState(0);
  const firstId: string = sections[0].id;
  const [active, setActive] = useState<string>(firstId);
  const [height, setHeight] = useState(720);
  const frame = useRef(0);
  const pathRef = useRef<SVGPathElement>(null);
  const [len, setLen] = useState(0);

  const usable = height - PAD * 2;
  const points = sections.map((s, i) => ({
    x: 10 + s.relief * 22,
    y: PAD + (i / (sections.length - 1)) * usable,
  }));
  const d = buildPath(points);

  useEffect(() => {
    const p = pathRef.current;
    if (p) setLen(p.getTotalLength());
  }, [d]);

  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(window.scrollY / max, 1) : 0);

        const line = window.innerHeight * 0.4;
        let current: string = firstId;
        for (const s of sections) {
          const el = document.getElementById(s.id);
          if (el && el.getBoundingClientRect().top <= line) current = s.id;
        }
        setActive(current);
      });
    };

    const onResize = () => {
      setHeight(window.innerHeight);
      onScroll();
    };

    onResize();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [firstId]);

  const step = useCallback(
    (dir: 1 | -1) => {
      const i = sections.findIndex((s) => s.id === active);
      const next = sections[Math.min(Math.max(i + dir, 0), sections.length - 1)];
      if (next) scrollTo(`#${next.id}`);
    },
    [active, scrollTo],
  );

  // ⌥↑ / ⌥↓ — station stepping without stealing plain arrow keys, which
  // must keep scrolling the page normally.
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

  const activeIndex = sections.findIndex((s) => s.id === active);
  const markerY = PAD + progress * usable;
  const markerX = 10 + (sections[activeIndex]?.relief ?? 0.4) * 22;

  return (
    <>
      <nav
        aria-label="Survey stations"
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
          {/* the full profile, hairline */}
          <path ref={pathRef} d={d} fill="none" stroke="var(--line-strong)" strokeWidth="1" />
          {/* the traversed portion, drawn by scroll */}
          {len > 0 ? (
            <path
              d={d}
              fill="none"
              stroke="var(--mark)"
              strokeWidth="1.5"
              strokeDasharray={len}
              strokeDashoffset={len * (1 - progress)}
              style={{ transition: "stroke-dashoffset var(--d-tick) linear" }}
            />
          ) : null}

          {/* station ticks */}
          {points.map((p, i) => {
            const s = sections[i];
            if (!s) return null;
            const passed = i <= activeIndex;
            return (
              <g key={s.id}>
                <line
                  x1={p.x - 5}
                  y1={p.y}
                  x2={p.x + 5}
                  y2={p.y}
                  stroke={passed ? "var(--mark)" : "var(--line-strong)"}
                  strokeWidth="1"
                />
                {s.id === active ? (
                  <circle cx={p.x} cy={p.y} r="3" fill="var(--mark)" />
                ) : null}
              </g>
            );
          })}

          {/* the travelling marker */}
          <circle cx={markerX} cy={markerY} r="2" fill="var(--mark)" opacity="0.5" />
        </svg>

        {/* real hit targets over the drawn stations */}
        <ol className="relative m-0 h-full list-none p-0">
          {points.map((p, i) => {
            const s = sections[i];
            if (!s) return null;
            return (
              <li
                key={s.id}
                className="group absolute left-0"
                style={{ top: p.y - 16, width: W, height: 32 }}
              >
                <button
                  type="button"
                  onClick={() => scrollTo(`#${s.id}`)}
                  aria-current={s.id === active ? "true" : undefined}
                  className="h-full w-full cursor-pointer border-0 bg-transparent p-0"
                >
                  <span className="sr-only">
                    Station {s.station}: {s.label}
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
                    {s.station} · {s.label}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>

        <span
          className="t-mono absolute bottom-3 left-1/2 -translate-x-1/2 text-[0.55rem] tracking-[0.1em] tabular-nums"
          style={{ color: "var(--mark)", writingMode: "vertical-rl" }}
        >
          {(progress * 100).toFixed(0).padStart(2, "0")}%
        </span>
      </nav>

      <div
        aria-hidden="true"
        className="fixed top-[52px] left-0 z-40 h-[3px] w-full lg:hidden"
        style={{ background: "var(--line)" }}
      >
        <div
          className="h-full origin-left"
          style={{
            background: "var(--mark)",
            transform: `scaleX(${progress})`,
            transitionProperty: "transform",
            transitionDuration: "var(--d-tick)",
          }}
        />
      </div>
    </>
  );
}
