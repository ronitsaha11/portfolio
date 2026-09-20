"use client";

import { useReveal } from "@/hooks/useReveal";
import { STAGGER } from "@/lib/motion";
import type { ComponentType, ElementType, ReactNode } from "react";

/** See the note in Reveal.tsx — the same polymorphic-tag widening. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PolymorphicTag = ComponentType<any>;

/**
 * A container whose children arrive in reading order.
 *
 * The stagger is applied by selector rather than by cloning children,
 * so the container imposes nothing on what goes inside it: a grid of
 * panels, a list of links and a table of rows all use the same
 * component and the same delay curve. Mark each child `data-cell`.
 *
 * `depth` swaps the plain rise for a rise plus a small scale, used
 * where the children are surfaces rather than text.
 */
export function Stagger({
  children,
  className,
  step = STAGGER.tight,
  depth = false,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  step?: number;
  depth?: boolean;
  as?: ElementType;
}) {
  const ref = useReveal<HTMLDivElement>({
    variant: depth ? "depth" : "up",
    selector: "[data-cell]",
    stagger: step,
  });
  const Tag = as as PolymorphicTag;

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
