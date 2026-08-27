"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { site } from "@/data/site";

/**
 * Mount policy for the WebGL globe.
 *
 * three.js is by far the heaviest thing on this page, so it is loaded
 * only in the browser and only once the hero is actually on screen —
 * and it is torn down again when you scroll past, which releases the
 * WebGL context rather than leaving it alive for the rest of the page.
 *
 * The placeholder holds the exact same box, so nothing shifts when the
 * canvas arrives or leaves (CLS stays at zero).
 */
const Globe3D = dynamic(() => import("./Globe3D").then((m) => m.Globe3D), {
  ssr: false,
});

export function GlobeStage({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    let reported = false;
    const io = new IntersectionObserver(
      (entries) => {
        reported = true;
        for (const e of entries) setVisible(e.isIntersecting);
      },
      { rootMargin: "200px" },
    );
    io.observe(el);

    // If the observer never reports, mount anyway rather than leaving a
    // permanently empty hero. Better to pay for WebGL than to show a hole.
    const timer = window.setTimeout(() => {
      if (!reported) setVisible(true);
    }, 1500);

    return () => {
      window.clearTimeout(timer);
      io.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {visible ? (
        <Globe3D className="h-full w-full" />
      ) : (
        <div
          aria-hidden="true"
          className="h-full w-full"
          style={{
            border: "1px solid var(--line)",
            borderRadius: "50%",
            opacity: 0.35,
          }}
        />
      )}
      <span className="sr-only">
        Interactive globe. Drag to rotate, scroll to zoom. Marked at {site.location}, lit from the
        sun&apos;s current position.
      </span>
    </div>
  );
}
