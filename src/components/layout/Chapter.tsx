"use client";

import { useLatticeChapter } from "@/components/lattice/useLatticeChapter";
import { useScrollParallax } from "@/hooks/useScrollParallax";
import { RevealText } from "@/components/primitives/Reveal";
import { POSES, type LatticePose } from "@/components/lattice/state";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

/**
 * One chapter of the page.
 *
 * It does two jobs and they are deliberately the same component: it
 * renders the section heading with its station numeral, and it
 * registers the section with the lattice director so the 3D behind the
 * page reorganises when the reader arrives. Splitting those apart
 * produced exactly one bug twice — a section that looked right and
 * left the scene on the previous chapter's formation — so they are
 * bound together and cannot drift.
 *
 * The station numeral is set in the margin at display size on wide
 * viewports and inline on narrow ones. It is the only purely
 * typographic flourish on the page, and it earns its place by being
 * the thing that makes the page feel like a document with chapters
 * rather than a stack of sections.
 */
export function Chapter({
  id,
  station: stationLabel,
  title,
  lede,
  children,
  className,
  pose,
  full = false,
  headingLevel = 2,
}: {
  id: string;
  station: string;
  title: string;
  lede?: ReactNode;
  children: ReactNode;
  className?: string;
  pose?: LatticePose;
  full?: boolean;
  headingLevel?: 2 | 3;
}) {
  const ref = useLatticeChapter<HTMLElement>(id, pose ?? POSES[id]);
  // The numeral travels against the page. It is the one element on the
  // site allowed to disagree with the scroll, which is what makes the
  // margin read as a separate plane from the column.
  const station = useScrollParallax<HTMLSpanElement>(64);
  const Heading: "h2" | "h3" = headingLevel === 3 ? "h3" : "h2";

  return (
    <section
      ref={ref}
      id={id}
      className={cn("scroll-mt-[84px] pt-[var(--spacing-chapter)]", className)}
      aria-labelledby={`${id}-title`}
    >
      <div data-column="" className={cn(full ? "w-full" : "mx-auto max-w-[var(--content-max)]")}>
        <div className="mb-8 grid gap-x-8 gap-y-3 md:grid-cols-[auto_1fr] md:items-baseline">
          <span ref={station} aria-hidden="true" className="t-station block">
            {stationLabel}
          </span>

          <div className="min-w-0">
            <div
              className="flex items-baseline gap-4 pb-3"
              style={{ borderBottom: "1.5px solid var(--ink-hi)" }}
            >
              <RevealText as={Heading} id={`${id}-title`} className="t-chapter m-0 flex-1">
                {title}
              </RevealText>
            </div>

            {lede ? <p className="t-lede measure mt-5 mb-0">{lede}</p> : null}
          </div>
        </div>

        {children}
      </div>
    </section>
  );
}
