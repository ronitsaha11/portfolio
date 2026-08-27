"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useMotionPrefs } from "@/components/providers/MotionPrefsProvider";

/**
 * Mount policy for the background depth field.
 *
 * Importing DepthField directly from the page pulled three.js and drei
 * into the first-load bundle and took it from 218 kB to 460 kB — the
 * whole point of the hero globe's dynamic import, undone by one static
 * import on a background decoration. So it loads on the client only,
 * after first paint, and only once motion is confirmed live.
 *
 * It is also desktop-only: a full-screen WebGL layer behind a long page
 * is not a trade worth making on a phone, where it costs battery and
 * memory for an effect that is barely visible at that size.
 */
const DepthField = dynamic(() => import("./DepthField").then((m) => m.DepthField), {
  ssr: false,
});

export function DepthFieldMount() {
  const { depth: animate } = useMotionPrefs();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!animate) return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;

    // Wait for the page to settle before pulling a ~250 kB chunk.
    const id = window.setTimeout(() => setReady(true), 600);
    return () => window.clearTimeout(id);
  }, [animate]);

  if (!ready) return null;
  return <DepthField />;
}
