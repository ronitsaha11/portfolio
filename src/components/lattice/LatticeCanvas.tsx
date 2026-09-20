"use client";

import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { LatticeScene, type LatticePalette } from "./LatticeScene";
import { useLattice } from "./LatticeDirector";
import { useMotionPrefs } from "@/components/providers/MotionPrefsProvider";
import { PROFILES, pinnedTier, stepDown, stepUp, type QualityTier } from "@/lib/quality";

/**
 * The one canvas.
 *
 * Fixed behind the page, `pointer-events: none`, `aria-hidden`. There
 * is exactly one WebGL context on this site, it is created once, and
 * every chapter uses it. The build before this one mounted a canvas per
 * architecture diagram plus one for the hero plus one for the
 * background — five contexts competing for the same GPU, four of them
 * usually off screen.
 *
 * ADAPTIVE QUALITY, WITH HYSTERESIS
 *
 * The starting tier is a guess from the viewport and two weak platform
 * hints. The frame monitor is what actually decides: sustained low
 * frames step the tier down, a sustained healthy stretch lets it step
 * back up, and after two changes of direction it stops moving
 * altogether and keeps the lower tier.
 *
 * That last rule is the important one. A scene that keeps re-measuring
 * oscillates, and the oscillation is far more visible than the quality
 * difference it is chasing — a bloom pass appearing and disappearing
 * every few seconds is worse than never having had it.
 */

function readPalette(): LatticePalette {
  if (typeof window === "undefined") {
    return {
      node: "#8e9a9a",
      edge: "#596466",
      mark: "#ff6b33",
      boundary: "#3fbfa6",
      ground: "#0b0e0f",
    };
  }
  const cs = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) =>
    cs.getPropertyValue(name).trim() || fallback;
  return {
    node: v("--lattice-node", "#8e9a9a"),
    edge: v("--lattice-edge", "#596466"),
    mark: v("--mark", "#ff6b33"),
    boundary: v("--measured", "#3fbfa6"),
    ground: v("--bg-0", "#0b0e0f"),
  };
}

/** Split so the post-processing bundle only loads on the tier that uses it. */
const LatticeEffects = lazy(() => import("./LatticeEffects"));

export function LatticeCanvas() {
  const { depth, tier: startTier } = useMotionPrefs();
  const { state } = useLattice();

  const [tier, setTier] = useState<QualityTier>(startTier);
  /** Direction changes so far. Two, and the tier is frozen. */
  const flips = useRef(0);
  const lastDir = useRef(0);
  const frozen = useRef(false);
  /**
   * Nothing is measured until the scene has warmed up.
   *
   * The first two seconds are shader compilation, buffer upload, React
   * hydration and whatever the page was still doing when the canvas
   * arrived. Measured there, every machine looks slow: the first build
   * of this monitor took a 138fps laptop down two tiers before a single
   * steady frame had been drawn. A frame budget is only meaningful once
   * the frames are representative.
   */
  const warm = useRef(false);
  /** A deliberate `?lattice=` override. Nothing may move off it. */
  const pinned = useRef(false);

  useEffect(() => {
    setTier(startTier);
    flips.current = 0;
    lastDir.current = 0;
    // A pinned tier is a pinned tier. The frame monitor does not get to
    // second-guess a deliberate `?lattice=` override.
    pinned.current = pinnedTier() !== null;
    frozen.current = pinned.current;
    warm.current = false;
    const t = window.setTimeout(() => {
      warm.current = true;
    }, 2600);
    return () => window.clearTimeout(t);
  }, [startTier]);

  const shift = useCallback((dir: 1 | -1) => {
    if (frozen.current || !warm.current) return;
    if (lastDir.current !== 0 && lastDir.current !== dir) {
      flips.current += 1;
      if (flips.current >= 2) {
        frozen.current = true;
        // Freeze on the safe side of whichever way we were going.
        if (dir === 1) return;
      }
    }
    lastDir.current = dir;
    setTier((t) => (dir === -1 ? stepDown(t) : stepUp(t)));
  }, []);

  const profile = PROFILES[tier];

  /**
   * Read once. There is one palette and it cannot change at runtime, so
   * the colours are resolved when the canvas mounts rather than
   * watched. The tokens are still the source: hard-coding these here
   * would give the 3D a second palette free to drift from the CSS.
   */
  const palette = useMemo(readPalette, []);

  useEffect(() => {
    state.active = depth;
  }, [depth, state]);

  if (!depth || tier === "off") return null;

  return (
    <div
      aria-hidden="true"
      data-lattice=""
      data-tier={tier}
      className="pointer-events-none fixed inset-0 z-0"
    >
      <Canvas
        dpr={[1, profile.dpr]}
        camera={{ position: [0, 0, 20], fov: 42, near: 0.1, far: 120 }}
        gl={{
          antialias: false,
          alpha: true,
          // The scene is additive against a dark ground, so the
          // renderer must not tone-map it back down — a value above 1
          // is exactly what the bloom threshold is looking for.
          powerPreference: profile.tier === "high" ? "high-performance" : "low-power",
          stencil: false,
          depth: true,
        }}
        onCreated={({ gl }) => {
          gl.setClearAlpha(0);
        }}
      >
        <PerformanceMonitor
          // Explicit bounds rather than the refresh-rate default: on a
          // 144Hz panel the default treats 80fps as a failure, which it
          // is not for a backdrop.
          bounds={(refreshRate) => (refreshRate > 90 ? [50, 95] : [45, 58])}
          ms={280}
          iterations={8}
          onDecline={() => shift(-1)}
          onIncline={() => shift(1)}
          flipflops={2}
          onFallback={() => {
            if (!warm.current || pinned.current) return;
            frozen.current = true;
            setTier("low");
          }}
        />

        <LatticeScene state={state} profile={profile} palette={palette} />

        {profile.bloom ? (
          <Suspense fallback={null}>
            <LatticeEffects />
          </Suspense>
        ) : null}
      </Canvas>
    </div>
  );
}
