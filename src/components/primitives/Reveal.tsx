"use client";

import { motion } from "motion/react";
import { SETTLE } from "@/lib/motion";
import { useMotionPrefs } from "@/components/providers/MotionPrefsProvider";
import type { ReactNode } from "react";

/**
 * SETTLE, applied once when the content first enters view.
 * With motion off this renders a plain div — no wrapper animation state,
 * no transform, nothing to reverse.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { animate } = useMotionPrefs();

  if (!animate) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={SETTLE.initial}
      whileInView={SETTLE.animate}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ ...SETTLE.transition, delay }}
    >
      {children}
    </motion.div>
  );
}
