"use client";

import { useEffect, useRef } from "react";
import { utils } from "animejs";
import { Chapter } from "@/components/layout/Chapter";
import { Stagger } from "@/components/primitives/Stagger";
import { ElevationBar } from "@/components/primitives/ElevationBar";
import { linkRange, watchRect } from "@/lib/motion";
import { useMotionPrefs } from "@/components/providers/MotionPrefsProvider";
import { traverse } from "@/data/traverse";

/**
 * A traverse is a surveyed sequence of stations, each measured from the
 * last. The slope is the argument: a static HTML page to a Rust
 * analysis engine in twenty-two months is the most persuasive fact on
 * this site, and it is the one that needs no adjectives.
 *
 * The spine draws as you descend it — the one genuinely progress-linked
 * animation in the DOM, as opposed to the triggered reveals everywhere
 * else. It is linked rather than triggered because the line is
 * measuring the reader's own position, so it has to track them exactly:
 * stop scrolling and it stops, scroll back and it retreats.
 *
 * Structure note: the spine lives OUTSIDE the <ol>, and every child of
 * the <ol> is an <li>. A decorative span inside a list breaks its
 * semantics, and assistive tech then reports the wrong item count or
 * drops the list role entirely.
 */
export function Traverse() {
  const ref = useRef<HTMLDivElement>(null);
  const { animate: allowed } = useMotionPrefs();

  useEffect(() => {
    const root = ref.current;
    if (!root || !allowed) return;
    const spine = root.querySelector<HTMLElement>("[data-spine]");
    if (!spine) return;

    utils.set(spine, { scaleY: 0 });

    // The list's own height, cached by the engine and refreshed on
    // resize, so the two thresholds below are exact rather than a
    // guess at how tall a traverse happens to be. Nothing in the
    // callback reads layout.
    const box = watchRect(root);

    const release = linkRange(root, "cover", (p, frame) => {
      const h = box.rect.height;
      const vh = frame.viewport;
      const total = h + vh;
      // Starts when the first station is 85% up the viewport, finishes
      // when the last one has reached the middle — so the line is
      // drawn by the reader and is full before they leave the section.
      const a = (0.15 * vh) / total;
      const b = (h + 0.45 * vh) / total;
      const k = Math.min(1, Math.max(0, (p - a) / Math.max(0.0001, b - a)));
      spine.style.transform = `scaleY(${k.toFixed(4)})`;
    });

    return () => {
      release();
      box.release();
      utils.set(spine, { scaleY: 1 });
    };
  }, [allowed]);

  return (
    <Chapter
      id="traverse"
      station="13"
      title="Traverse"
      lede="Dated from commit history. The elevation bands encode the step up in complexity at each station, not how much time passed between them."
    >
      <div ref={ref} className="relative">
        <span
          aria-hidden="true"
          className="absolute top-0 left-0 h-full w-[1.5px]"
          style={{ background: "var(--line)" }}
        />
        <span
          data-spine=""
          aria-hidden="true"
          className="absolute top-0 left-0 h-full w-[1.5px] origin-top"
          style={{ background: "var(--mark)" }}
        />

        <Stagger as="ol" className="relative m-0 list-none p-0">
          {traverse.map((station) => (
            <li
              key={`${station.date}-${station.title}`}
              data-cell=""
              className="relative pb-8 pl-7"
            >
              <span
                aria-hidden="true"
                className="absolute top-[0.55rem] left-[-5px] block h-2 w-2"
                style={{
                  background: `var(--el-${station.depth})`,
                  boxShadow: "0 0 0 3px var(--bg-0)",
                }}
              />
              <span className="flex flex-wrap items-baseline gap-x-3">
                <span className="t-legend" style={{ color: "var(--ink-lo)" }}>
                  {station.date}
                </span>
                <ElevationBar
                  depth={station.depth}
                  orientation="horizontal"
                  className="max-w-[52px]"
                />
              </span>
              <span
                className="mt-1 block font-[family-name:var(--font-display)] text-[1.08rem] font-bold"
                style={{ fontVariationSettings: '"wdth" 100', color: "var(--ink-hi)" }}
              >
                {station.title}
              </span>
              <p className="measure m-0 mt-1 text-[0.93rem]" style={{ color: "var(--ink-md)" }}>
                {station.detail}
              </p>
            </li>
          ))}
        </Stagger>
      </div>
    </Chapter>
  );
}
