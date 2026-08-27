"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";

/**
 * Day pass / night pass.
 *
 * TWO states, not three. The earlier version cycled system → light →
 * dark → system, and on a machine whose OS is dark, "system" and "dark"
 * render identically — so one press in three visibly did nothing. That
 * is indistinguishable from a broken toggle, and it is why this
 * sometimes appeared not to change. The OS preference still decides the
 * starting pass on a first visit; after that the choice is explicit.
 */
export type Pass = "light" | "dark";

interface ThemeApi {
  pass: Pass;
  resolved: Pass;
  cycle: () => void;
}

const KEY = "gt-pass";
const ThemeContext = createContext<ThemeApi>({
  pass: "light",
  resolved: "light",
  cycle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pass, setPass] = useState<Pass>("light");

  // Initial pass: a stored choice if there is one, otherwise the OS.
  useEffect(() => {
    let initial: Pass | null = null;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw === "light" || raw === "dark") initial = raw;
    } catch {
      /* private mode or blocked storage */
    }
    if (!initial) {
      initial = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    setPass(initial);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", pass);
  }, [pass]);

  /**
   * PASS — the terminator crossing the page.
   *
   * View Transitions capture a "before" frame, run the callback, then
   * capture an "after" frame. The callback must therefore update the DOM
   * SYNCHRONOUSLY. A bare setState does not: React batches it, so the
   * browser captured two identical frames, animated nothing, and the
   * theme changed a tick later with no sweep — sometimes, depending on
   * whether React happened to flush in time. flushSync is what makes the
   * DOM change inside the callback rather than after it.
   */
  const cycle = useCallback(() => {
    const next: Pass = pass === "dark" ? "light" : "dark";

    const apply = () => {
      flushSync(() => setPass(next));
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* the choice still applies for this page view */
      }
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> };
    };

    if (reduced || typeof doc.startViewTransition !== "function") {
      apply();
      return;
    }

    const transition = doc.startViewTransition(apply);
    transition.ready
      .then(() => {
        document.documentElement.animate(
          { clipPath: ["inset(0 100% 0 0)", "inset(0 0 0 0)"] },
          {
            duration: 900,
            easing: "cubic-bezier(0.65, 0, 0.35, 1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      })
      .catch(() => {
        /* interrupted; the theme has still applied */
      });
  }, [pass]);

  return (
    <ThemeContext.Provider value={{ pass, resolved: pass, cycle }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeApi {
  return useContext(ThemeContext);
}
