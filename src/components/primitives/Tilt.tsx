"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { animate, utils } from "animejs";
import { DUR, EASE } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { useMotionPrefs } from "@/components/providers/MotionPrefsProvider";

/**
 * HOVER — a surface that turns towards the pointer.
 *
 * Six degrees at the corners and no more. Past about eight the card
 * stops being a plate on a table and becomes a toy, and the text on it
 * starts to keystone badly enough to read as blurry — which is the
 * usual reason this effect is a mistake rather than a flourish.
 *
 * WHAT MAKES IT FEEL PHYSICAL RATHER THAN ATTACHED
 *
 *  - the rotation axis passes through the centre of the card, so the
 *    edge nearest the pointer comes *towards* you
 *  - a specular sheen tracks the pointer across the surface, which is
 *    what tells the eye the card has a plane at all
 *  - it lifts on z, so the shadow the design system already has reads
 *    as the card leaving the page
 *  - it returns to rest on leave, rather than being left wherever the
 *    pointer abandoned it
 *
 * The transform is written straight to style inside a rAF rather than
 * tweened, because a tween between pointer samples is a frame behind
 * the pointer and that lag is the whole difference. The *return* is
 * tweened, because that one is not tracking anything.
 *
 * Off under reduced motion and on coarse pointers, where there is no
 * hover to respond to and a tilt would only fire on tap.
 */
export function Tilt({
  children,
  className,
  strength = 6,
  lift = 10,
}: {
  children: ReactNode;
  className?: string;
  /** Maximum rotation at the corners, in degrees. */
  strength?: number;
  /** Translation towards the viewer, in pixels. */
  lift?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { depth } = useMotionPrefs();

  useEffect(() => {
    const el = ref.current;
    if (!el || !depth) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let raf = 0;
    let rx = 0;
    let ry = 0;
    let sheenX = 50;
    let sheenY = 50;

    const paint = () => {
      raf = 0;
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translate3d(0,0,${lift}px)`;
      el.style.setProperty("--sheen-x", `${sheenX}%`);
      el.style.setProperty("--sheen-y", `${sheenY}%`);
    };

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      ry = utils.clamp((px - 0.5) * 2, -1, 1) * strength;
      rx = utils.clamp((0.5 - py) * 2, -1, 1) * strength;
      sheenX = px * 100;
      sheenY = py * 100;
      el.style.setProperty("--sheen", "1");
      if (!raf) raf = requestAnimationFrame(paint);
    };

    const onLeave = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      el.style.setProperty("--sheen", "0");
      animate(el, {
        rotateX: 0,
        rotateY: 0,
        translateZ: 0,
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
  }, [depth, strength, lift]);

  return (
    <div ref={ref} className={cn("tilt", className)}>
      {children}
    </div>
  );
}
