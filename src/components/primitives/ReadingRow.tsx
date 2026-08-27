"use client";

import { motion } from "motion/react";
import { Reading } from "./Reading";
import { DUR, EASE, RISE } from "@/lib/motion";
import { useMotionPrefs } from "@/components/providers/MotionPrefsProvider";
import { cn } from "@/lib/cn";
import type { Reading as ReadingData } from "@/data/types";

/**
 * A group of readings that resolve in sequence rather than all at once.
 *
 * An instrument samples one figure at a time; four numbers counting up in
 * perfect unison reads as an animation, four resolving in sequence reads
 * as a measurement being taken. The stagger is 90ms — enough to perceive
 * as an order, short enough that the whole row settles inside half a
 * second and never becomes something to wait for.
 */
export function ReadingRow({
  readings,
  className,
}: {
  readings: ReadingData[];
  className?: string;
}) {
  const { animate } = useMotionPrefs();

  return (
    <motion.div
      className={cn("flex flex-wrap gap-x-10 gap-y-8", className)}
      initial={animate ? "hidden" : false}
      whileInView="shown"
      viewport={{ once: true, amount: 0.3 }}
      variants={{ shown: { transition: { staggerChildren: 0.09 } } }}
    >
      {readings.map((r) => (
        <motion.div
          key={r.id}
          variants={{
            hidden: { opacity: 0, y: RISE },
            shown: { opacity: 1, y: 0, transition: { duration: DUR.ui, ease: EASE.settle } },
          }}
        >
          <Reading reading={r} />
        </motion.div>
      ))}
    </motion.div>
  );
}
