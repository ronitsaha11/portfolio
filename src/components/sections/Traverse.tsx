"use client";

import { Depth3D } from "@/components/primitives/Depth3D";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Section } from "@/components/layout/Section";
import { StaggerGrid, StaggerCell } from "@/components/primitives/StaggerGrid";
import { ElevationBar } from "@/components/primitives/ElevationBar";
import { useMotionPrefs } from "@/components/providers/MotionPrefsProvider";
import { traverse } from "@/data/traverse";

/**
 * A traverse is a surveyed sequence of stations, each measured from the
 * last. The slope is the argument: a static page to a platform in twenty
 * months is the most persuasive fact on this site.
 *
 * The spine draws as you descend it, so the line is literally being
 * surveyed while you read — progress-linked rather than time-linked, so
 * it tracks the reader instead of running away from them.
 *
 * Structure note: the spine lives OUTSIDE the <ol>, and every child of
 * the <ol> is an <li>. Decorative spans or wrapper divs inside a list
 * break its semantics for assistive tech, which reports the wrong item
 * count or drops the list role entirely.
 */
export function Traverse() {
  const ref = useRef<HTMLDivElement>(null);
  const { animate } = useMotionPrefs();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.55"],
  });

  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <Section
      id="traverse"
      station="10"
      title="Traverse"
      lede="Dated from commit history. The elevation bands encode the step up in complexity at each station, not how much time passed."
    >
      <Depth3D side="left" text intensity={1.1}>
      <div ref={ref} className="relative">
        <span
          aria-hidden="true"
          className="absolute top-0 left-0 h-full w-[1.5px]"
          style={{ background: "var(--line)" }}
        />
        <motion.span
          aria-hidden="true"
          className="absolute top-0 left-0 h-full w-[1.5px] origin-top"
          style={{ background: "var(--mark)", scaleY: animate ? scaleY : 1 }}
        />

        <StaggerGrid as="ol" className="relative m-0 list-none p-0" stagger={0.05}>
          {traverse.map((station) => (
            <StaggerCell
              as="li"
              key={`${station.date}-${station.title}`}
              className="relative pb-7 pl-6"
              style={{ perspective: 900 }}
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
                className="mt-1 block font-[family-name:var(--font-display)] text-[1.02rem] font-bold"
                style={{ fontVariationSettings: '"wdth" 104', color: "var(--ink-hi)" }}
              >
                {station.title}
              </span>
              <p className="measure m-0 mt-1 text-[0.92rem]" style={{ color: "var(--ink-md)" }}>
                {station.detail}
              </p>
            </StaggerCell>
          ))}
        </StaggerGrid>
      </div>
      </Depth3D>
    </Section>
  );
}
