"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { GlobeStage } from "@/components/hero/GlobeStage";
import { Legend } from "@/components/primitives/Legend";
import { SweepText } from "@/components/primitives/SweepText";
import { useMotionPrefs } from "@/components/providers/MotionPrefsProvider";
import { site } from "@/data/site";
import { registry } from "@/data/registry";

/**
 * The hero, with a camera pull-back as you leave it.
 *
 * Scrolling past the hero fades and recedes it slightly rather than
 * letting it scroll away flat — the depth transition that separates the
 * opening from the survey proper. Opacity and scale only, so it stays on
 * the compositor, and the range is small enough that it never obscures
 * text a reader is still on.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { animate } = useMotionPrefs();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.965]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 40]);

  const stats = [
    { k: "Scenes", v: String(registry.scenes) },
    { k: "Readings", v: String(registry.readings) },
    { k: "Samples", v: String(registry.samples) },
    { k: "Decisions", v: String(registry.decisions) },
  ];

  return (
    <section
      ref={ref}
      id="top"
      className="relative flex min-h-[88svh] items-center pt-[76px] pb-[clamp(3rem,8vw,6rem)]"
      aria-labelledby="hero-title"
    >
      <motion.div
        className="mx-auto grid w-full max-w-[var(--content-max)] items-center gap-10 lg:grid-cols-[1.15fr_1fr]"
        style={animate ? { opacity, scale, y } : undefined}
      >
        <div>
          <Legend rule className="mb-6">
            {site.concept} · {site.role}
          </Legend>

          <SweepText id="hero-title" as="h1" className="t-hero m-0" style={{ color: "var(--ink-hi)" }}>
            {site.name}
          </SweepText>

          <p
            className="measure mt-6 mb-0 text-[clamp(1.05rem,2.2vw,1.35rem)] leading-[1.45]"
            style={{ color: "var(--ink-md)" }}
          >
            <span style={{ color: "var(--ink-hi)", fontWeight: 600 }}>{site.thesis}</span> Ground
            truth is what you measure on the ground to check what the satellite claimed from orbit.
            Every figure on this page links to the code it was measured from.
          </p>

          <dl
            className="mt-9 grid max-w-[38rem] grid-cols-2 gap-px sm:grid-cols-4"
            style={{ background: "var(--line)", border: "1px solid var(--line)" }}
          >
            {stats.map((x) => (
              <div key={x.k} className="px-3 py-2" style={{ background: "var(--bg-0)" }}>
                <dt className="t-legend mb-1" style={{ color: "var(--ink-lo)" }}>
                  {x.k}
                </dt>
                <dd className="t-mono m-0 text-[1.05rem] font-medium" style={{ color: "var(--ink-hi)" }}>
                  {x.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative order-first aspect-square w-full max-w-[520px] justify-self-center lg:order-last">
          <GlobeStage className="h-full w-full" />
          <span
            className="t-mono absolute right-0 bottom-0 text-[0.6rem] tracking-[0.08em]"
            style={{ color: "var(--ink-lo)" }}
          >
            DRAG TO ROTATE · SCROLL TO ZOOM
          </span>
        </div>
      </motion.div>
    </section>
  );
}
