"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fires once, the first time the element crosses the threshold, then
 * disconnects. Nothing on this site re-animates on scroll-back — a
 * measurement that re-measures every time you look at it is theatre.
 */
export function useInViewOnce<T extends HTMLElement>(
  threshold = 0.4,
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, inView]);

  return [ref, inView];
}
