"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "motion/react";
import { useMotionPrefs } from "@/components/providers/MotionPrefsProvider";
import type { ReactNode } from "react";

/**
 * The single 3D scroll primitive for the page.
 *
 * WHY THIS REPLACES FOUR COMPONENTS
 *
 * PerspectiveRise, DollyZ, ScrollZoom and StaggerCell each established
 * their own `perspective`, and they were being nested inside one another.
 * CSS 3D does not compose that way: `perspective` creates a new flattening
 * context, so a rotateX on an inner element is projected into its parent's
 * plane rather than into the page's camera. Four nested perspectives meant
 * the innermost transforms — the ones doing the visible work — were being
 * squashed flat. Every value animated correctly and almost none of the
 * depth survived to the screen.
 *
 * So: ONE perspective, declared here on the outer element, and a single
 * transform on the inner one. Anything that needs to sit inside this and
 * still read as 3D must inherit `preserve-3d`, never open a new context.
 *
 * The whole pass through the viewport is mapped, not just the entry:
 *   p=0    far back, yawed and pitched away
 *   p=0.5  square on, at reading position
 *   p=1    continuing forward and past
 *
 * `text` softens every value, because the same depth that looks good on a
 * panel makes a paragraph keystone badly enough to be unpleasant to read.
 */
export function Depth3D({
  children,
  className,
  side = "left",
  intensity = 1,
  text = false,
  origin = "center",
}: {
  children: ReactNode;
  className?: string;
  side?: "left" | "right" | "none";
  /** Scales every axis. 1 is the page default; 1.4 for hero panels. */
  intensity?: number;
  /** Softer values for prose. */
  text?: boolean;
  origin?: "center" | "bottom";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { depth: animate } = useMotionPrefs();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const smooth = useSpring(scrollYProgress, {
    stiffness: 78,
    damping: 22,
    restDelta: 0.001,
  });

  const k = intensity * (text ? 0.55 : 1);
  const sign = side === "right" ? 1 : side === "left" ? -1 : 0;

  const z = useTransform(smooth, [0, 0.5, 1], [-620 * k, 0, 240 * k]);
  const rotateY = useTransform(smooth, [0, 0.5, 1], [sign * 24 * k, 0, sign * -9 * k]);
  const rotateX = useTransform(smooth, [0, 0.5, 1], [22 * k, 0, -8 * k]);
  const rotateZ = useTransform(smooth, [0, 0.5, 1], [sign * 3 * k, 0, sign * -1.5 * k]);
  const x = useTransform(smooth, [0, 0.5, 1], [sign * 56 * k, 0, 0]);
  const scale = useTransform(smooth, [0, 0.5, 1], [0.8, 1, 1.08]);
  const opacity = useTransform(smooth, [0, 0.3, 0.8, 1], [0.1, 1, 1, 0.35]);

  return (
    <div
      className={className}
      style={{
        perspective: 1100,
        perspectiveOrigin:
          side === "left" ? "15% 50%" : side === "right" ? "85% 50%" : "50% 50%",
      }}
    >
      <motion.div
        ref={ref}
        style={
          animate
            ? {
                z,
                rotateX,
                rotateY,
                rotateZ,
                x,
                scale,
                opacity,
                transformOrigin: origin === "bottom" ? "center bottom" : "center center",
                transformStyle: "preserve-3d",
                willChange: "transform, opacity",
              }
            : undefined
        }
      >
        {children}
      </motion.div>
    </div>
  );
}
