"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { animate, utils } from "animejs";
import { cn } from "@/lib/cn";
import { measure as measureVerb } from "@/lib/motion";
import { splitReadingValue, formatCount } from "@/lib/format";
import { useInViewOnce } from "@/hooks/useInViewOnce";
import { useMotionPrefs } from "@/components/providers/MotionPrefsProvider";
import { Sample } from "./Sample";
import type { Reading as ReadingData, Confidence } from "@/data/types";

/**
 * The signature component.
 *
 * A reading is a measured figure with a confidence interval under it.
 * It server-renders in its final, settled state — a visitor with no
 * JavaScript sees the number and its true interval. With motion on it
 * runs the MEASURE verb once on first view: the value counts up while
 * the interval sweeps inward from full width to its real width.
 *
 * THE INTERVAL IS THE HONEST PART. "measured" narrows to tight;
 * "attributed" stays visibly wide, because partial ownership of a team
 * codebase is a wider measurement than sole authorship of your own.
 * Most of the recent work on this site is attributed, and the intervals
 * say so before the prose does.
 *
 * PERFORMANCE. The Radix popover is ARMED, not mounted, on first
 * render. Twenty-odd popover roots hydrating on load cost more
 * main-thread time than every animation on the page combined; instead
 * the plain button hydrates, and the popover is constructed on the
 * first hover, focus or tap — none of which can happen before
 * hydration finishes anyway.
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
  const { animate: allowed } = useMotionPrefs();
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

  // Drop to zero only after mount, and only when motion is allowed, so
  // the SSR output and the reduced-motion render both stay final.
  useEffect(() => {
    if (allowed && !hasRun.current && !inView && parts) {
      setDisplay(`${parts.prefix}${formatCount(0, parts.decimals)}${parts.suffix}`);
      setSettled(false);
    }
  }, [allowed, inView, parts]);

  /**
   * MEASURE — count the leading number up, then settle.
   *
   * anime.js drives a plain object here rather than a DOM property,
   * because the displayed string has a prefix and a suffix ("8 / 50")
   * and only the middle is a number. Tweening the number and formatting
   * it on update is the whole reason the animation library is allowed
   * to touch React state at all.
   */
  useEffect(() => {
    if (!inView || hasRun.current || !allowed) return;
    hasRun.current = true;

    if (!parts) {
      setSettled(true);
      return;
    }

    const counter = { v: 0 };
    const anim = animate(counter, {
      v: parts.num,
      ...measureVerb(),
      onUpdate: () => {
        setDisplay(
          `${parts.prefix}${formatCount(counter.v, parts.decimals)}${parts.suffix}`,
        );
      },
      onComplete: () => {
        setDisplay(reading.value);
        setSettled(true);
      },
    });

    return () => {
      anim.revert();
      utils.set(counter, { v: parts.num });
    };
  }, [inView, allowed, parts, reading.value]);

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
          "t-mono leading-none font-medium transition-colors",
          size === "lg" ? "text-[2.3rem] md:text-[3rem]" : "text-[1.65rem]",
        )}
        style={{ color: "var(--ink-hi)", transitionDuration: "var(--d-tick)" }}
      >
        {display}
      </span>

      {/* the confidence interval */}
      <span className="relative block h-[7px] w-full min-w-[92px]" aria-hidden="true">
        <span
          className="absolute inset-x-0 bottom-0 h-px"
          style={{ background: "var(--line-strong)" }}
        />
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
    "group flex cursor-pointer flex-col items-start gap-[0.3rem] text-left",
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
