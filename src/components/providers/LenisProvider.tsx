"use client";

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import Lenis from "lenis";
import { useMotionPrefs } from "./MotionPrefsProvider";

type ScrollTarget = string | HTMLElement;

interface LenisApi {
  scrollTo: (target: ScrollTarget) => void;
  /** The live instance, so scroll-linked code can sync to it. Null when
   *  reduced motion has disabled smooth scrolling entirely. */
  getLenis: () => Lenis | null;
}

const LenisContext = createContext<LenisApi>({
  getLenis: () => null,
  scrollTo: (target) => {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    el?.scrollIntoView();
  },
});

/**
 * Owns the scroll position. 1:1 wheel ratio — no hijacking, no snapping.
 * Disabled outright under reduced motion, where native scrolling takes over.
 */
export function LenisProvider({ children }: { children: ReactNode }) {
  const { animate } = useMotionPrefs();
  const lenisRef = useRef<Lenis | null>(null);

  /**
   * Start at the top.
   *
   * This is one continuous narrative, and reveals fire once. Browser
   * scroll restoration drops a returning visitor into the middle of it,
   * where everything above has already been marked seen and will never
   * play — which reads as "the animations are broken" rather than "the
   * browser remembered my position".
   */
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!animate) return;

    // anchors stay false: Lenis's built-in anchor handler never calls
    // preventDefault, so it would race our own nav/rail scrollTo calls.
    const lenis = new Lenis({ lerp: 0.1, anchors: false });
    lenisRef.current = lenis;

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [animate]);

  const api: LenisApi = {
    getLenis: () => lenisRef.current,
    scrollTo: (target) => {
      const lenis = lenisRef.current;
      if (!lenis) {
        const el = typeof target === "string" ? document.querySelector(target) : target;
        el?.scrollIntoView();
        return;
      }
      // Re-sync to the real position first. Lenis resolves element targets
      // against its own believed scroll position and ignores native changes
      // while animating, so a stale belief sends every later jump wrong.
      lenis.scrollTo(window.scrollY, { immediate: true, force: true });
      lenis.scrollTo(target, { duration: 0.9, force: true });
    },
  };

  return <LenisContext.Provider value={api}>{children}</LenisContext.Provider>;
}

export function useLenis(): LenisApi {
  return useContext(LenisContext);
}
