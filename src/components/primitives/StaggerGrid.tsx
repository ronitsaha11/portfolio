"use client";

import { motion } from "motion/react";
import { DUR, EASE, RISE } from "@/lib/motion";
import { useMotionPrefs } from "@/components/providers/MotionPrefsProvider";
import { cn } from "@/lib/cn";
import type { CSSProperties, ReactNode } from "react";

/**
 * A grid whose children arrive in reading order rather than all at once.
 *
 * Cells enter in 3D: pushed back on Z and pitched on rotateX, so a grid
 * assembles with depth instead of sliding up flat. Transform and opacity
 * only, both composited, so a twelve-cell grid costs no layout and no
 * paint.
 *
 * The container sets `perspective`, because a 3D transform on a child is
 * only 3D relative to a perspective ancestor — without it the rotateX
 * silently flattens into a vertical squash, which reads as a bug rather
 * than as depth.
 */
export function StaggerGrid({
  children,
  className,
  stagger = 0.06,
  as = "div",
  flat = false,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  as?: "div" | "ul" | "ol";
  /** Opt out of the 3D entry where depth would fight the layout. */
  flat?: boolean;
}) {
  const { animate } = useMotionPrefs();
  const Tag = as === "ul" ? motion.ul : as === "ol" ? motion.ol : motion.div;

  if (!animate) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  return (
    <Tag
      className={cn(className)}
      style={flat ? undefined : { perspective: 1100 }}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.15 }}
      variants={{ shown: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </Tag>
  );
}

/** One cell. Must be a direct child of StaggerGrid to inherit the stagger. */
export function StaggerCell({
  children,
  className,
  as = "div",
  style,
  flat = false,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li";
  style?: CSSProperties;
  flat?: boolean;
}) {
  const { animate } = useMotionPrefs();
  const Tag = as === "li" ? motion.li : motion.div;

  if (!animate) {
    const Plain = as;
    return (
      <Plain className={className} style={style}>
        {children}
      </Plain>
    );
  }

  return (
    <Tag
      className={className}
      style={{ ...style, transformStyle: "preserve-3d" }}
      variants={{
        hidden: flat ? { opacity: 0, y: RISE } : { opacity: 0, y: RISE, z: -140, rotateX: 14 },
        shown: {
          opacity: 1,
          y: 0,
          z: 0,
          rotateX: 0,
          transition: { duration: DUR.ui * 1.6, ease: EASE.settle },
        },
      }}
    >
      {children}
    </Tag>
  );
}
