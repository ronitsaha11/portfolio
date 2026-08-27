"use client";

import { motion } from "motion/react";
import { SWEEP } from "@/lib/motion";
import { useMotionPrefs } from "@/components/providers/MotionPrefsProvider";
import type { ReactNode } from "react";

/**
 * SWEEP applied to a block of text: revealed by clip, left to right,
 * like a scan line passing over it.
 *
 * Deliberately not a per-character stagger. Letters arriving one at a
 * time is the most common "premium portfolio" tell, it delays the reader
 * getting the sentence, and it has nothing to do with measurement. A
 * clip sweep reads as an instrument resolving a line — and the text stays
 * a single DOM node, so it remains selectable and screen-readable.
 *
 * TWO ELEMENTS, and the split is load-bearing:
 *
 * IntersectionObserver computes intersectionRatio from an element's
 * *visible* area, and clip-path reduces that area. Putting the clip and
 * the whileInView trigger on the SAME element deadlocks: the initial
 * `inset(0 100% 0 0)` gives it zero visible area, so the ratio is 0, so
 * an `amount` threshold above 0 is never met, so the clip is never
 * removed. The element reports isIntersecting:true and ratio:0 forever
 * and the text stays permanently invisible.
 *
 * So the outer element is observed and never clipped; the inner element
 * carries the clip. Do not merge them.
 */
const TAGS = {
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  p: motion.p,
  span: motion.span,
} as const;

type Tag = keyof typeof TAGS;

export function SweepText({
  children,
  as = "span",
  className,
  delay = 0,
  style,
  id,
}: {
  children: ReactNode;
  as?: Tag;
  className?: string;
  delay?: number;
  style?: React.CSSProperties;
  id?: string;
}) {
  const { animate } = useMotionPrefs();

  if (!animate) {
    const Plain = as;
    return (
      <Plain className={className} style={style} id={id}>
        {children}
      </Plain>
    );
  }

  const MotionTag = TAGS[as];

  return (
    <MotionTag
      id={id}
      className={className}
      style={style}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.4 }}
      transition={{ ...SWEEP.transition, delay }}
    >
      <motion.span
        style={{ display: "block", willChange: "clip-path" }}
        variants={{
          hidden: { clipPath: SWEEP.initial.clipPath },
          shown: { clipPath: SWEEP.animate.clipPath },
        }}
        transition={{ ...SWEEP.transition, delay }}
      >
        {children}
      </motion.span>
    </MotionTag>
  );
}
