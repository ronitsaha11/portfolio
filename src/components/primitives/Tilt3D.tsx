"use client";

import Tilt from "react-parallax-tilt";
import { useMotionPrefs } from "@/components/providers/MotionPrefsProvider";
import type { ReactNode } from "react";

/**
 * Pointer-driven 3D tilt, from react-parallax-tilt.
 *
 * The whole point of using the library rather than tracking pointer
 * position by hand is that it already solves the parts that are easy to
 * get wrong: pointer-leave reset, touch handling, gyroscope opt-out, and
 * throttled updates on a transform-only path.
 *
 * Angles are kept small (8°). A card that swings 25° under the cursor
 * reads as a demo; 8° reads as the surface having depth, and — more
 * practically — keeps the text on it legible while it moves, which is
 * the whole reason these panels exist.
 *
 * Disabled entirely under reduced motion and on coarse pointers, where
 * there is no hover to respond to.
 */
export function Tilt3D({
  children,
  className,
  angle = 8,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  angle?: number;
  glare?: boolean;
}) {
  const { depth: animate } = useMotionPrefs();

  if (!animate) return <div className={className}>{children}</div>;

  return (
    <Tilt
      className={className}
      tiltMaxAngleX={angle}
      tiltMaxAngleY={angle}
      perspective={1200}
      scale={1.015}
      transitionSpeed={900}
      glareEnable={glare}
      glareMaxOpacity={0.12}
      glareColor="#ffffff"
      glarePosition="all"
      glareBorderRadius="0px"
      tiltEnable
      trackOnWindow={false}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </Tilt>
  );
}
