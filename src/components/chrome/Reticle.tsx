"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionPrefs } from "@/components/providers/MotionPrefsProvider";

/**
 * The instrument reticle.
 *
 * The native cursor is never hidden — hiding it is the single most common
 * way a "premium" site becomes annoying, and the brief's own rule is that
 * nothing may reduce usability. Instead the cursor gains a companion: a
 * marker crosshair with a live readout that appears ONLY over surfaces
 * marked data-instrument (the globe, architecture diagrams, the rail).
 *
 * Text does not get a reticle. Instrument surfaces do.
 *
 * Disabled entirely for reduced motion, and for coarse pointers where
 * there is no cursor to accompany.
 */
export function Reticle() {
  const { animate } = useMotionPrefs();
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const frame = useRef(0);
  const pos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!animate) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const paint = () => {
      const el = ref.current;
      if (el) el.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
      const out = readoutRef.current;
      if (out) {
        out.textContent = `${Math.round(pos.current.x)} ${Math.round(pos.current.y)}`;
      }
    };

    const onMove = (e: PointerEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      const over = (e.target as Element | null)?.closest?.("[data-instrument]");
      setActive(Boolean(over));

      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(paint);
    };

    const onLeave = () => setActive(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [animate]);

  if (!animate) return null;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[100] hidden lg:block"
      style={{
        opacity: active ? 1 : 0,
        transition: "opacity var(--d-tick) linear",
        willChange: "transform",
      }}
    >
      <svg width="44" height="44" viewBox="0 0 44 44" style={{ marginLeft: -22, marginTop: -22 }}>
        <path d="M22 6v9M22 29v9M6 22h9M29 22h9" stroke="var(--mark)" strokeWidth="1" />
        <circle cx="22" cy="22" r="7" fill="none" stroke="var(--mark)" strokeWidth="1" opacity="0.55" />
      </svg>
      <span
        ref={readoutRef}
        className="t-mono absolute top-[24px] left-[24px] whitespace-nowrap text-[0.6rem] tracking-[0.08em]"
        style={{ color: "var(--mark)" }}
      />
    </div>
  );
}
