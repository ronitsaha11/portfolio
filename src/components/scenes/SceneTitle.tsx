"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Legend } from "@/components/primitives/Legend";
import { SweepText } from "@/components/primitives/SweepText";
import { useMotionPrefs } from "@/components/providers/MotionPrefsProvider";
import type { Scene } from "@/data/types";

/**
 * The scene head, with camera-style parallax.
 *
 * The title, the legend above it and the body beneath move at three
 * slightly different rates as the scene passes the viewport. That is the
 * only parallax on the site, and it exists because it does one specific
 * job: it separates a scene from the section before it, so arriving at a
 * new scene feels like a cut rather than a scroll.
 *
 * The range is deliberately small — around 40px total. Large parallax
 * fights the reader's own scrolling and is the fastest way to make a
 * page feel slippery.
 */
export function SceneTitle({ scene }: { scene: Scene }) {
  const ref = useRef<HTMLDivElement>(null);
  const { animate } = useMotionPrefs();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const legendY = useTransform(scrollYProgress, [0, 1], [22, -22]);
  const titleY = useTransform(scrollYProgress, [0, 1], [10, -10]);
  const bodyY = useTransform(scrollYProgress, [0, 1], [0, 4]);

  return (
    <div ref={ref}>
      <motion.div style={animate ? { y: legendY } : undefined}>
        <Legend rule className="mb-5">
          Scene {String(scene.sceneNumber).padStart(2, "0")} · {scene.year} · {scene.subtitle}
        </Legend>
      </motion.div>

      <motion.div style={animate ? { y: titleY } : undefined}>
        <SweepText
          as="h2"
          className="t-scene m-0"
          style={{ color: "var(--ink-hi)" }}
        >
          {scene.name}
        </SweepText>
      </motion.div>

      <motion.div style={animate ? { y: bodyY } : undefined}>
        <p className="measure mt-4 mb-0 text-[1.06rem]" style={{ color: "var(--ink-md)" }}>
          {scene.oneLiner}
        </p>

        {/* Ownership sits at the top, not in the small print. */}
        <p
          className="mt-5 mb-0 inline-block px-3 py-[0.35rem] text-[0.85rem]"
          style={{
            background:
              scene.confidence === "attributed" ? "var(--attributed-bg)" : "var(--measured-bg)",
            color: scene.confidence === "attributed" ? "var(--attributed)" : "var(--measured)",
          }}
        >
          <span className="t-legend mr-2">Ownership</span>
          {scene.ownership}
        </p>
      </motion.div>
    </div>
  );
}
