"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { detectTier, type QualityTier } from "@/lib/quality";

export interface MotionPrefs {
  /**
   * DOM animation: reveals, staggers, timelines, the count-up. Anything
   * that starts an element hidden and animates it in.
   */
  animate: boolean;
  /**
   * Continuous 3D and pointer-driven motion: the lattice, hover depth,
   * parallax. These never hide anything and degrade to a static frame.
   */
  depth: boolean;
  /**
   * How much this machine gets.
   *
   * NOT a guess at "is this a phone". A phone gets a real scene — fewer
   * nodes, no bloom, a shallower parallax — because a portfolio that
   * goes flat on a phone is dead for most of the people who will open
   * it. `off` means the reader asked for reduced motion or the browser
   * cannot give us a context, and nothing else.
   */
  tier: QualityTier;
  /** True once the client has measured. Guards SSR/hydration mismatches. */
  ready: boolean;
}

const MotionPrefsContext = createContext<MotionPrefs>({
  animate: false,
  depth: false,
  tier: "off",
  ready: false,
});

/**
 * One question — does this person want motion — asked once, and two
 * gates derived from it, because the two kinds of motion on this site
 * carry different risk.
 *
 * Reveals hide content before showing it, so their failure mode is a
 * blank section. That failsafe lives in `useReveal`, next to the code
 * that does the hiding, rather than here: a provider cannot know
 * whether a particular reveal ever ran.
 *
 * The lattice never hides anything. It is a fixed canvas behind the
 * page that either draws or does not, so it only needs to know whether
 * motion is wanted and how much the machine can afford.
 *
 * Both start false so the server render and the first client render
 * agree: the un-animated page is the correct output, and motion is
 * added to it.
 */
export function MotionPrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<MotionPrefs>({
    animate: false,
    depth: false,
    tier: "off",
    ready: false,
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const apply = () => {
      const wants = !mq.matches;
      // Keep the pre-paint flag honest. The inline script in the
      // document head set it before React existed; if the reader
      // turns reduced motion on while the page is open, the paced
      // layout has to go with it.
      if (wants) document.documentElement.dataset.motion = "on";
      else delete document.documentElement.dataset.motion;
      setPrefs({
        animate: wants,
        depth: wants,
        tier: wants ? detectTier() : "off",
        ready: true,
      });
    };

    apply();
    mq.addEventListener("change", apply);

    // The viewport decides the starting tier, so a window dragged
    // between a laptop panel and an external display should be
    // re-measured rather than left on the tier it opened at.
    let t = 0;
    const onResize = () => {
      window.clearTimeout(t);
      t = window.setTimeout(apply, 400);
    };
    window.addEventListener("resize", onResize);

    return () => {
      mq.removeEventListener("change", apply);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(t);
    };
  }, []);

  return <MotionPrefsContext.Provider value={prefs}>{children}</MotionPrefsContext.Provider>;
}

export function useMotionPrefs(): MotionPrefs {
  return useContext(MotionPrefsContext);
}
