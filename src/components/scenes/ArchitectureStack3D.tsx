"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  RoundedBox,
  Html,
  Outlines,
  useCursor,
  AdaptiveDpr,
  AdaptiveEvents,
} from "@react-three/drei";
import * as THREE from "three";
import { useMotionPrefs } from "@/components/providers/MotionPrefsProvider";
import type { ArchitectureLayer } from "@/data/types";

/**
 * The architecture stack, as an orbitable 3D object.
 *
 * This is the one place on the site where 3D carries meaning rather than
 * atmosphere: these layers ARE a stack, a request travels down through
 * them, and depth is the thing the diagram is about. Seeing them as
 * physical slabs you can turn communicates that faster than a list can.
 *
 * Everything is a library component — RoundedBox for the slabs, Html for
 * labels, Outlines for the hover edge, useCursor for pointer feedback,
 * OrbitControls for the interaction.
 *
 * The flat button list stays in the parent: it is the keyboard and
 * screen-reader path, and it is how you select a layer precisely. The 3D
 * view is an additional way to read the same data, never the only one.
 */

const GAP = 0.42;

/**
 * Drives the stack from page scroll: the slabs spread apart and the whole
 * group yaws as the scene passes through the viewport, so the stack
 * "opens" while you read it and closes again as you leave.
 *
 * The progress value arrives as a plain ref rather than React state —
 * writing scroll position into state would re-render the whole tree every
 * frame, which is the classic way to make an R3F scene stutter.
 */
function ScrollRig({
  progress,
  children,
}: {
  progress: React.RefObject<number>;
  children: React.ReactNode;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const p = progress.current ?? 0;
    // 0 at the edges of the pass, 1 in the middle
    const open = 1 - Math.abs(p - 0.5) * 2;
    g.scale.setScalar(0.92 + open * 0.12);
    g.rotation.y = -0.35 + (p - 0.5) * 0.9;
    g.position.y = (0.5 - p) * 0.5;

    g.children.forEach((child, i) => {
      const mid = (g.children.length - 1) / 2;
      child.position.y = (mid - i) * GAP * (1 + open * 0.55);
    });
  });

  return <group ref={group}>{children}</group>;
}

function Slab({
  layer,
  index,
  total,
  active,
  onSelect,
}: {
  layer: ArchitectureLayer;
  index: number;
  total: number;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const ref = useRef<THREE.Mesh>(null);

  const colour = useMemo(() => {
    if (typeof window === "undefined") return "#8ca86a";
    const cs = getComputedStyle(document.documentElement);
    return cs.getPropertyValue(`--el-${layer.depth}`).trim() || "#8ca86a";
  }, [layer.depth]);

  const mark = useMemo(() => {
    if (typeof window === "undefined") return "#bf430e";
    return getComputedStyle(document.documentElement).getPropertyValue("--mark").trim() || "#bf430e";
  }, []);

  // Y is owned by ScrollRig, which spreads the slabs each frame.
  const lift = hovered || active ? 0.16 : 0;

  return (
    <group position={[lift * 0.6, ((total - 1) / 2 - index) * GAP, 0]}>
      <RoundedBox
        ref={ref}
        args={[2.5, 0.3, 1.5]}
        radius={0.04}
        smoothness={2}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(layer.id);
        }}
      >
        <meshStandardMaterial
          color={colour}
          roughness={0.55}
          metalness={0.15}
          transparent
          opacity={active ? 1 : 0.82}
        />
        {active || hovered ? <Outlines thickness={0.03} color={mark} /> : null}
      </RoundedBox>

      {/* Centred over the slab rather than pushed out to the right. At
          x=1.45 the longer names ran past the canvas edge and were
          clipped — "UNIT OF WO…", "GEOSPATIAL" cut in half. On the slab
          they cannot overflow whatever the name length or the yaw. */}
      <Html
        position={[0, 0.22, 0]}
        center
        distanceFactor={9}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <span
          className="t-mono block whitespace-nowrap text-[0.5rem] tracking-[0.14em]"
          style={{
            color: active ? mark : "var(--ink-hi)",
            fontWeight: active ? 700 : 500,
            textShadow: "0 1px 2px rgba(0,0,0,.35)",
          }}
        >
          {layer.name.toUpperCase()}
        </span>
      </Html>
    </group>
  );
}

export function ArchitectureStack3D({
  layers,
  activeId,
  onSelect,
  onScreen,
}: {
  layers: ArchitectureLayer[];
  activeId: string;
  onSelect: (id: string) => void;
  /** Rendering is suspended entirely while this is false. */
  onScreen: boolean;
}) {
  const { depth: animate } = useMotionPrefs();
  const holder = useRef<HTMLDivElement>(null);
  const progress = useRef(0);

  /**
   * Scroll → progress, on scroll events only.
   *
   * The first version ran its own requestAnimationFrame loop calling
   * getBoundingClientRect every frame, forever, per stack. With four
   * stacks mounted that is four forced layout reflows on every frame of
   * the page, whether or not any of them was visible — which is most of
   * why this felt unstable. Now it measures only when the page actually
   * scrolls, rAF-coalesced, and only while the stack is on screen.
   */
  useEffect(() => {
    if (!onScreen) return;
    let raf = 0;

    const measure = () => {
      raf = 0;
      const el = holder.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const span = window.innerHeight + r.height;
      progress.current = Math.min(Math.max((window.innerHeight - r.top) / span, 0), 1);
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [onScreen]);

  return (
    <div
      ref={holder}
      data-instrument=""
      style={{ width: "100%", aspectRatio: "1 / 1", maxHeight: 340 }}
      aria-hidden="true"
    >
      {/* "never" halts rendering completely for off-screen stacks. They
          stay mounted — so there is no re-mount delay coming back — but
          cost nothing while you are elsewhere on the page. Four canvases
          all set to "always" was the other half of the problem. */}
      <Canvas
        frameloop={!animate ? "demand" : onScreen ? "always" : "never"}
        dpr={[1, 1.25]}
        camera={{ position: [3.4, 1.6, 4.2], fov: 38 }}
        gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.75} />
          <directionalLight position={[4, 6, 3]} intensity={1.5} />
          <directionalLight position={[-4, -2, -3]} intensity={0.4} />

          <ScrollRig progress={progress}>
            {layers.map((layer, i) => (
              <Slab
                key={layer.id}
                layer={layer}
                index={i}
                total={layers.length}
                active={layer.id === activeId}
                onSelect={onSelect}
              />
            ))}
          </ScrollRig>

          <OrbitControls
            enablePan={false}
            enableZoom={false}
            enableDamping
            dampingFactor={0.08}
            rotateSpeed={0.45}
            minPolarAngle={Math.PI * 0.22}
            maxPolarAngle={Math.PI * 0.78}
            autoRotate={animate && onScreen}
            autoRotateSpeed={0.5}
          />

          <AdaptiveDpr pixelated />
          <AdaptiveEvents />
        </Suspense>
      </Canvas>
    </div>
  );
}
