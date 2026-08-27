"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Grid, AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import { useMotionPrefs } from "@/components/providers/MotionPrefsProvider";

/**
 * A persistent 3D depth field behind the page, from Position onwards.
 *
 * Two receding wireframe planes — one below, one above — that the camera
 * travels along as you scroll and which lean with the pointer. It gives
 * the whole lower page a floor and a ceiling, so the flat panels in front
 * of it read as objects in a space rather than boxes on paper. This is
 * the piece that makes the depth continuous rather than per-section.
 *
 * It is deliberately cheap: two drei Grid helpers, no lights, no
 * postprocessing, no per-frame allocation, and dpr capped at 1. It sits
 * behind everything at low opacity and is pointer-events:none, so it can
 * never intercept a click or a scroll.
 *
 * Scroll and pointer are read through refs, never React state — driving
 * a render loop from state re-renders the tree every frame.
 */

function Rig({
  scroll,
  pointer,
}: {
  scroll: React.RefObject<number>;
  pointer: React.RefObject<{ x: number; y: number }>;
}) {
  const group = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;

    // Travel forward with scroll. The modulo keeps the grid endless
    // without ever moving the geometry far from the origin.
    const z = (scroll.current ?? 0) * 60;
    g.position.z = z % 8;

    const p = pointer.current ?? { x: 0, y: 0 };
    // Damped lean toward the pointer.
    camera.position.x += (p.x * 1.2 - camera.position.x) * Math.min(delta * 3, 1);
    camera.position.y += (1.6 + p.y * 0.8 - camera.position.y) * Math.min(delta * 3, 1);
    camera.lookAt(0, 0, -14);
  });

  return (
    <group ref={group}>
      <Grid
        position={[0, -3.2, -14]}
        args={[40, 80]}
        cellSize={1}
        cellThickness={0.6}
        sectionSize={5}
        sectionThickness={1}
        cellColor="#7a8484"
        sectionColor="#bf430e"
        fadeDistance={38}
        fadeStrength={2.5}
        infiniteGrid
      />
      <Grid
        position={[0, 6.4, -14]}
        rotation={[Math.PI, 0, 0]}
        args={[40, 80]}
        cellSize={1}
        cellThickness={0.5}
        sectionSize={5}
        sectionThickness={0.8}
        cellColor="#7a8484"
        sectionColor="#7a8484"
        fadeDistance={30}
        fadeStrength={3}
        infiniteGrid
      />
    </group>
  );
}

export function DepthField() {
  const { depth: animate } = useMotionPrefs();
  const scroll = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });
  const raf = useRef(0);

  // Scroll and pointer land in refs, rAF-coalesced so a fast scroll can
  // never queue more work than the frame budget allows.
  useEffect(() => {
    if (!animate) return;

    const onScroll = () => {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        scroll.current = max > 0 ? window.scrollY / max : 0;
      });
    };
    const onPointer = (e: PointerEvent) => {
      pointer.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -((e.clientY / window.innerHeight) * 2 - 1),
      };
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    onScroll();

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
    };
  }, [animate]);

  if (!animate) return null;

  return (
    <div
      aria-hidden="true"
      data-depth-field=""
      className="pointer-events-none fixed inset-0 z-0 hidden lg:block"
      style={{ opacity: 0.42 }}
    >
      {/* dpr 0.75: this is an out-of-focus backdrop at 42% opacity, so it
          renders at three-quarter resolution. Nobody can tell, and it is
          a full-screen pass competing with every other canvas on the
          page for the same GPU. */}
      <Canvas
        dpr={0.75}
        camera={{ position: [0, 1.6, 6], fov: 60 }}
        gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
      >
        <Suspense fallback={null}>
          <PerformanceMonitor />
          <Rig scroll={scroll} pointer={pointer} />
          <AdaptiveDpr />
        </Suspense>
      </Canvas>
    </div>
  );
}
