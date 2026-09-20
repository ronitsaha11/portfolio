"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { animate, utils } from "animejs";
import { DUR, EASE } from "@/lib/motion";
import { useMotionPrefs } from "@/components/providers/MotionPrefsProvider";

/**
 * HOVER — a control that leans towards the pointer as it approaches.
 *
 * Applied to the two primary actions in the hero and nowhere else. The
 * effect works because it is rare: every button doing it is a fidget,
 * one pair doing it reads as the page noticing you.
 *
 * Kept deliberately small. `strength` is the maximum travel in pixels,
 * and 8 is about the point where the control still feels attached to
 * its own hit area — past roughly 14 the visible button and the thing
 * you can actually click come apart, which is a usability bug dressed
 * as polish. The element also returns to rest on leave rather than
 * being left wherever the pointer abandoned it.
 *
 * Off entirely under reduced motion and on coarse pointers, where
 * there is no hover to respond to.
 */
export function Magnetic({
  children,
  strength = 8,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const { depth } = useMotionPrefs();

  useEffect(() => {
    const el = ref.current;
    if (!el || !depth) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let raf = 0;
    let tx = 0;
    let ty = 0;

    const paint = () => {
      raf = 0;
      el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    };

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      // Normalised offset from the control's own centre, clamped so a
      // pointer far away does not produce a large lean.
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      tx = utils.clamp(dx, -1, 1) * strength;
      ty = utils.clamp(dy, -1, 1) * strength * 0.6;
      if (!raf) raf = requestAnimationFrame(paint);
    };

    const onLeave = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      animate(el, {
        translateX: 0,
        translateY: 0,
        duration: DUR.ui,
        ease: EASE.settle,
      });
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.style.transform = "";
    };
  }, [depth, strength]);

  return (
    <span ref={ref} className={className} style={{ display: "inline-flex" }}>
      {children}
    </span>
  );
}
