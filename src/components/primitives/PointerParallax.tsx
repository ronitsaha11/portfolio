"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useMotionPrefs } from "@/components/providers/MotionPrefsProvider";
import type { ReactNode } from "react";

/**
 * Whole-section parallax: the block leans toward the pointer, so moving
 * the mouse across the page turns the content rather than just the card
 * under the cursor. Tilt3D handles the object you are pointing at; this
 * handles the room it sits in.
 *
 * Pointer position goes into MotionValues, never React state — a state
 * update per pointermove would re-render the section on every mouse
 * event. useSpring damps it so the lean trails the cursor instead of
 * snapping to it.
 *
 * Listens on the window rather than the element: the effect should
 * respond to where you are on the page, not require you to be over the
 * section. Disabled on coarse pointers, where there is no cursor.
 */
export function PointerParallax({
  children,
  className,
  strength = 6,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const { depth: animate } = useMotionPrefs();
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  const sx = useSpring(px, { stiffness: 60, damping: 20 });
  const sy = useSpring(py, { stiffness: 60, damping: 20 });

  const rotateY = useTransform(sx, [-1, 1], [-strength, strength]);
  const rotateX = useTransform(sy, [-1, 1], [strength * 0.7, -strength * 0.7]);

  useEffect(() => {
    if (!animate) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const onMove = (e: PointerEvent) => {
      px.set((e.clientX / window.innerWidth) * 2 - 1);
      py.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [animate, px, py]);

  if (!animate) return <div className={className}>{children}</div>;

  return (
    <div className={className} style={{ perspective: 1600 }}>
      <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}>
        {children}
      </motion.div>
    </div>
  );
}
