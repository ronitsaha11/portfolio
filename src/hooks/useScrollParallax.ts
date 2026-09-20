"use client";

import { useEffect, useRef } from "react";
import { linkRange } from "@/lib/motion";
import { useMotionPrefs } from "@/components/providers/MotionPrefsProvider";

/**
 * PARALLAX — an element that travels at a different rate to the page.
 *
 * Progress-linked, not triggered: the playhead is the scroll position,
 * so the element moves exactly as far as the reader scrolls and stops
 * when they stop. Anything else here reads as lag.
 *
 * WRITTEN STRAIGHT TO STYLE, NOT TWEENED. There is no animation object
 * and no library involved: the scroll engine hands over a number and
 * this sets one transform. A tween between scroll samples is a frame
 * behind the reader's own input, and on a page with fourteen of these
 * it is also fourteen animation instances being advanced by the
 * library's own clock on every frame for no benefit at all.
 *
 * Deliberately small. `travel` is the full range in pixels and the
 * default is 56, which is perceptible at reading speed and nowhere
 * near enough to make the page feel like it is sliding. Off entirely
 * under reduced motion, where the element renders exactly where the
 * server put it.
 */
export function useScrollParallax<T extends HTMLElement>(travel = 56) {
  const ref = useRef<T>(null);
  const { depth, tier } = useMotionPrefs();

  useEffect(() => {
    const el = ref.current;
    // Skipped on the low tier. Fourteen extra tracked ranges is a real
    // cost on a phone, and the effect it buys is a numeral in a margin
    // that a phone renders inline anyway.
    if (!el || !depth || tier === "low" || tier === "off") return;

    const half = travel / 2;
    const release = linkRange(el, "cover", (p) => {
      el.style.transform = `translate3d(0, ${(half - p * travel).toFixed(2)}px, 0)`;
    });

    return () => {
      release();
      el.style.transform = "";
    };
  }, [depth, tier, travel]);

  return ref;
}
