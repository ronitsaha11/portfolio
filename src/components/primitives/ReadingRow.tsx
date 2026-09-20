"use client";

import { Reading } from "./Reading";
import { useReveal } from "@/hooks/useReveal";
import { STAGGER } from "@/lib/motion";
import { cn } from "@/lib/cn";
import type { Reading as ReadingData } from "@/data/types";

/**
 * A group of readings that resolve in sequence rather than all at once.
 *
 * An instrument samples one figure at a time. Four numbers counting up
 * in perfect unison reads as an animation; four resolving in sequence
 * reads as a measurement being taken. The stagger is 70ms — enough to
 * perceive as an order, short enough that the whole row settles inside
 * half a second and never becomes something to wait for.
 */
export function ReadingRow({
  readings,
  className,
}: {
  readings: ReadingData[];
  className?: string;
}) {
  // SCALE rather than a rise: a measured figure settling is a needle
  // coming to rest, and it should not arrive the same way a paragraph
  // does. See the verb table in lib/motion/verbs.ts.
  const ref = useReveal<HTMLDivElement>({
    variant: "scale",
    selector: "[data-reading]",
    stagger: STAGGER.normal,
  });

  return (
    <div ref={ref} className={cn("flex flex-wrap gap-x-12 gap-y-9", className)}>
      {readings.map((r) => (
        <div key={r.id} data-reading="">
          <Reading reading={r} />
        </div>
      ))}
    </div>
  );
}
