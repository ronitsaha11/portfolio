"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { cn } from "@/lib/cn";
import { DUR } from "@/lib/motion";
import { splitReadingValue, formatCount } from "@/lib/format";
import { useInViewOnce } from "@/hooks/useInViewOnce";
import { useMotionPrefs } from "@/components/providers/MotionPrefsProvider";
import { Sample } from "./Sample";
import type { Reading as ReadingData, Confidence } from "@/data/types";

/**
 * The signature component.
 *
 * A reading is a measured figure with a confidence interval under it.
 * Server-renders in its final, settled state — a visitor with no JS sees
 * the number and its true interval. With motion enabled it runs the
 * MEASURE lifecycle once on first view: the value counts up while the
 * interval sweeps inward from full width to its real width.
 *
 * The interval width is the honest part. "measured" narrows to tight,
 * "attributed" stays visibly wide, because partial ownership of a team
 * codebase is a wider measurement than sole authorship of your own.
 *
 * Performance: the Radix popover is ARMED, not mounted, on first render.
 * Nineteen popover roots hydrating on load cost more main-thread time
 * than every animation on the page combined; instead the plain button
 * hydrates, and the popover is constructed on the first hover, focus or
 * tap — none of which can happen before hydration finishes anyway.
 */

const intervalByConfidence: Record<Confidence, { left: string; right: string }> = {
  measured: { left: "38%", right: "38%" },
  attributed: { left: "8%", right: "8%" },
  archived: { left: "22%", right: "22%" },
};

const borderByConfidence: Record<Confidence, string> = {
  measured: "var(--measured)",
  attributed: "var(--attributed)",
  archived: "var(--archived)",
};

export function Reading({
  reading,
  size = "md",
  className,
}: {
  reading: ReadingData;
  size?: "md" | "lg";
  className?: string;
}) {
  const { animate } = useMotionPrefs();
  const [ref, inView] = useInViewOnce<HTMLSpanElement>(0.4);

  const parts = useMemo(() => splitReadingValue(reading.value), [reading.value]);
  const [display, setDisplay] = useState(reading.value);
  const [settled, setSettled] = useState(true);
  const hasRun = useRef(false);

  /** Popover construction is deferred until the reading is touched. */
  const [armed, setArmed] = useState(false);
  const [open, setOpen] = useState(false);
  const restoreFocus = useRef(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Arm only after mount, and only when motion is allowed — SSR output
  // and the reduced-motion render both stay in the final state.
  useEffect(() => {
    if (animate && !hasRun.current && !inView && parts) {
      setDisplay(`${parts.prefix}${formatCount(0, parts.decimals)}${parts.suffix}`);
      setSettled(false);
    }
  }, [animate, inView, parts]);

  // MEASURE: count the leading number up, then settle.
  useEffect(() => {
    if (!inView || hasRun.current || !animate) return;
    hasRun.current = true;

    if (!parts) {
      setSettled(true);
      return;
    }

    const start = performance.now();
    const ms = DUR.measure * 1000;
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min((now - start) / ms, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(`${parts.prefix}${formatCount(parts.num * eased, parts.decimals)}${parts.suffix}`);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setDisplay(reading.value);
        setSettled(true);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, animate, parts, reading.value]);

  // Arming swaps a plain <button> for a Popover.Trigger, which remounts
  // the node. If we armed from the keyboard, put focus back.
  useEffect(() => {
    if (armed && restoreFocus.current) {
      restoreFocus.current = false;
      buttonRef.current?.focus();
    }
  }, [armed]);

  const target = intervalByConfidence[reading.confidence];
  const edge = borderByConfidence[reading.confidence];

  const body = (
    <>
      <span
        ref={ref}
        className={cn(
          "t-mono font-semibold leading-none transition-colors",
          size === "lg" ? "text-[2.1rem] md:text-[2.6rem]" : "text-[1.6rem]",
        )}
        style={{ color: "var(--ink-hi)", transitionDuration: "var(--d-tick)" }}
      >
        {display}
      </span>

      {/* the confidence interval */}
      <span className="relative block h-[7px] w-full min-w-[88px]" aria-hidden="true">
        <span className="absolute inset-x-0 bottom-0 h-px" style={{ background: "var(--line-strong)" }} />
        <span
          className="absolute bottom-0 h-[7px]"
          style={{
            left: settled ? target.left : "50%",
            right: settled ? target.right : "50%",
            borderLeft: `1.5px solid ${edge}`,
            borderRight: `1.5px solid ${edge}`,
            borderBottom: `1.5px solid ${edge}`,
            transitionProperty: "left, right",
            transitionDuration: "var(--d-sweep)",
            transitionTimingFunction: "var(--e-instr)",
          }}
        />
      </span>

      <span
        className="t-legend flex items-center gap-1 transition-colors group-hover:text-[var(--mark)]"
        style={{ color: "var(--ink-lo)", transitionDuration: "var(--d-tick)" }}
      >
        {reading.label}
        <span
          aria-hidden="true"
          className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          style={{ color: "var(--mark)", transitionDuration: "var(--d-tick)" }}
        >
          ⌕
        </span>
      </span>

      <span className="sr-only">
        {reading.value} — {reading.label}. Confidence: {reading.confidence}. View ground sample.
      </span>
    </>
  );

  const buttonClass = cn(
    "group flex cursor-pointer flex-col items-start gap-[0.28rem] text-left",
    className,
  );

  if (!armed) {
    return (
      <button
        ref={buttonRef}
        type="button"
        className={buttonClass}
        onPointerEnter={() => setArmed(true)}
        onFocus={() => {
          restoreFocus.current = true;
          setArmed(true);
        }}
        onClick={() => {
          setArmed(true);
          setOpen(true);
        }}
      >
        {body}
      </button>
    );
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button ref={buttonRef} type="button" className={buttonClass}>
          {body}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side="top"
          align="start"
          sideOffset={10}
          collisionPadding={16}
          avoidCollisions
          aria-label={`Ground sample for ${reading.label}`}
          className="z-[60] outline-none"
          style={{ animation: "gt-pop-in var(--d-ui) var(--e-settle)" }}
        >
          <Sample reading={reading} />
          <Popover.Arrow style={{ fill: "var(--bg-3)" }} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
