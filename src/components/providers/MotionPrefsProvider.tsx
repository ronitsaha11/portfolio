"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface MotionPrefs {
  /**
   * Gates REVEALS — anything that starts hidden and is uncovered by a
   * whileInView callback. Requires IntersectionObserver to actually
   * deliver, because if it does not, the content never reappears.
   */
  animate: boolean;
  /**
   * Gates CONTINUOUS 3D — scroll-driven depth, pointer parallax, tilt.
   * These read scroll and pointer position directly and never hide
   * anything, so they only need the user to want motion at all.
   */
  depth: boolean;
}

const MotionPrefsContext = createContext<MotionPrefs>({ animate: false, depth: false });

/**
 * Two gates, not one — and the split matters.
 *
 * Reveals are dangerous: they start an element at opacity 0 or clipped,
 * and rely on an IntersectionObserver callback to uncover it. If the
 * observer never delivers, the page renders permanently blank. So they
 * stay behind a probe that proves observers are running.
 *
 * Continuous 3D is not dangerous in that way. Depth3D, Tilt3D and
 * PointerParallax read scroll and pointer position, never hide their
 * content, and degrade to a static transform if nothing ever moves.
 * Gating them behind the same probe was a mistake: a failed probe was
 * switching off every scroll and zoom effect on the page along with the
 * reveals, for no safety benefit at all.
 *
 * `depth` therefore asks only one question — does this person want
 * motion — and answers it from prefers-reduced-motion.
 */
export function MotionPrefsProvider({ children }: { children: ReactNode }) {
  const [animate, setAnimate] = useState(false);
  const [depth, setDepth] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Continuous 3D: enable as soon as we know motion is wanted.
    const applyDepth = () => setDepth(!mq.matches);
    applyDepth();
    mq.addEventListener("change", applyDepth);

    let cancelled = false;
    let ioWorks = false;
    let io: IntersectionObserver | null = null;
    let probe: HTMLDivElement | null = null;
    let timer = 0;

    if (typeof IntersectionObserver !== "undefined") {
      probe = document.createElement("div");
      probe.setAttribute("aria-hidden", "true");
      probe.style.cssText =
        "position:fixed;top:50%;left:0;width:1px;height:1px;pointer-events:none;opacity:0";
      document.body.appendChild(probe);

      io = new IntersectionObserver(() => {
        ioWorks = true;
        if (!cancelled) setAnimate(!mq.matches);
      });
      io.observe(probe);

      timer = window.setTimeout(() => {
        if (!ioWorks && !cancelled) setAnimate(false);
      }, 1200);
    }

    const applyAnimate = () => {
      if (ioWorks && !cancelled) setAnimate(!mq.matches);
    };
    mq.addEventListener("change", applyAnimate);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      io?.disconnect();
      probe?.remove();
      mq.removeEventListener("change", applyDepth);
      mq.removeEventListener("change", applyAnimate);
    };
  }, []);

  return (
    <MotionPrefsContext.Provider value={{ animate, depth }}>{children}</MotionPrefsContext.Provider>
  );
}

export function useMotionPrefs(): MotionPrefs {
  return useContext(MotionPrefsContext);
}
