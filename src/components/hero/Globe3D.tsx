"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
// aliased: `animate` is already the name of the motion-enabled flag from
// useMotionPrefs inside this component, and the local would shadow it
import { animate as animateValue } from "motion";
import {
  OrbitControls,
  Line,
  Html,
  Stars,
  Trail,
  Billboard,
  Outlines,
  useCursor,
  AdaptiveDpr,
  AdaptiveEvents,
  Preload,
  PerformanceMonitor,
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { useMotionPrefs } from "@/components/providers/MotionPrefsProvider";
import { subsolarPoint, formatCoord } from "@/lib/solar";
import { site } from "@/data/site";

/**
 * The hero globe: real 3D, directly interactive, assembled from library
 * components rather than hand-written effects.
 *
 *   OrbitControls   drag to rotate, wheel to zoom, inertial damping
 *   Stars           starfield, so the globe sits in space rather than on a page
 *   Line            the graticule
 *   Outlines        hover highlight on markers
 *   useCursor       pointer feedback
 *   Billboard+Html  labels that always face the camera
 *   EffectComposer  bloom and vignette
 *   PerformanceMonitor + AdaptiveDpr  quality drops before frames do
 *
 * The two markers are real measurements, not decoration: the station is
 * Jalandhar, and the subsolar point is where the sun is directly overhead
 * at this moment — which is also where the light is actually placed, so
 * the lit hemisphere is the one currently facing the sun.
 *
 * Performance: dpr is capped, the composer is dropped entirely if the
 * frame rate sags, and the whole canvas unmounts when scrolled past
 * (GlobeStage). Nothing here runs for the other 95% of the page.
 */

const R = 1;
const DEG = Math.PI / 180;

function toVec3(latDeg: number, lonDeg: number, radius = R): THREE.Vector3 {
  const lat = latDeg * DEG;
  const lon = lonDeg * DEG;
  return new THREE.Vector3(
    radius * Math.cos(lat) * Math.sin(lon),
    radius * Math.sin(lat),
    radius * Math.cos(lat) * Math.cos(lon),
  );
}

const ring = (latDeg: number, radius: number) => {
  const pts: THREE.Vector3[] = [];
  for (let lon = -180; lon <= 180; lon += 4) pts.push(toVec3(latDeg, lon, radius));
  return pts;
};

const meridian = (lonDeg: number, radius: number) => {
  const pts: THREE.Vector3[] = [];
  for (let lat = -90; lat <= 90; lat += 4) pts.push(toVec3(lat, lonDeg, radius));
  return pts;
};

function Graticule({ colour, accent }: { colour: string; accent: string }) {
  const parallels = useMemo(() => [-60, -40, -20, 20, 40, 60].map((l) => ring(l, R * 1.001)), []);
  const meridians = useMemo(
    () => [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((l) => meridian(l, R * 1.001)),
    [],
  );
  const equator = useMemo(() => ring(0, R * 1.002), []);

  return (
    <group>
      {parallels.map((pts, i) => (
        <Line key={`p${i}`} points={pts} color={colour} lineWidth={1} transparent opacity={0.45} />
      ))}
      {meridians.map((pts, i) => (
        <Line key={`m${i}`} points={pts} color={colour} lineWidth={1} transparent opacity={0.45} />
      ))}
      <Line points={equator} color={accent} lineWidth={1.8} transparent opacity={0.9} />
    </group>
  );
}

/** A hoverable, clickable point on the surface. */
function Marker({
  lat,
  lon,
  colour,
  label,
  detail,
  onSelect,
}: {
  lat: number;
  lon: number;
  colour: string;
  label: string;
  detail: string;
  onSelect: (v: THREE.Vector3) => void;
}) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const pos = useMemo(() => toVec3(lat, lon, R * 1.03), [lat, lon]);

  return (
    <group position={pos}>
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(pos);
        }}
        scale={hovered ? 1.6 : 1}
      >
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial color={colour} toneMapped={false} />
        <Outlines thickness={hovered ? 0.02 : 0} color={colour} />
      </mesh>

      <Billboard>
        <Html center distanceFactor={6} style={{ pointerEvents: "none" }}>
          <span
            className="t-mono block whitespace-nowrap text-[0.5rem] tracking-[0.1em]"
            style={{
              color: colour,
              transform: "translateY(-16px)",
              opacity: hovered ? 1 : 0.75,
            }}
          >
            {hovered ? `${label} · ${detail}` : label}
          </span>
        </Html>
      </Billboard>
    </group>
  );
}

/**
 * A satellite on a low inclined orbit, with drei's Trail drawing its
 * ground track behind it. Trail is a library component — the alternative
 * would be maintaining a ring buffer of past positions and rebuilding
 * geometry each frame by hand, which is exactly what not to write.
 */
function Satellite({ colour, active }: { colour: string; active: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    if (!active || !ref.current) return;
    t.current += delta * 0.5;
    const r = 1.45;
    const inc = 32 * DEG;
    ref.current.position.set(
      r * Math.cos(t.current),
      r * Math.sin(t.current) * Math.sin(inc),
      r * Math.sin(t.current) * Math.cos(inc),
    );
  });

  return (
    <Trail width={1.4} length={5} color={colour} attenuation={(w) => w * w} decay={1.2}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.018, 10, 10]} />
        <meshBasicMaterial color={colour} toneMapped={false} />
      </mesh>
    </Trail>
  );
}

function Scene({
  spin,
  onSelect,
}: {
  spin: boolean;
  onSelect: (v: THREE.Vector3) => void;
}) {
  const { line, mark, ink, measured } = useMemo(() => {
    if (typeof window === "undefined")
      return { line: "#4b5355", mark: "#bf430e", ink: "#14181a", measured: "#0b5f5c" };
    const cs = getComputedStyle(document.documentElement);
    return {
      line: cs.getPropertyValue("--ink-md").trim() || "#4b5355",
      mark: cs.getPropertyValue("--mark").trim() || "#bf430e",
      ink: cs.getPropertyValue("--ink-hi").trim() || "#14181a",
      measured: cs.getPropertyValue("--measured").trim() || "#0b5f5c",
    };
  }, []);

  const sun = useMemo(() => subsolarPoint(new Date()), []);
  const sunDir = useMemo(() => toVec3(sun.lat, sun.lon, 6), [sun]);

  return (
    <>
      <directionalLight position={sunDir} intensity={2.6} />
      <ambientLight intensity={0.4} />

      {/* Stars come from drei — a starfield, not a hand-rolled particle system. */}
      <Stars radius={40} depth={30} count={1200} factor={3} saturation={0} fade speed={spin ? 0.4 : 0} />

      <mesh>
        <sphereGeometry args={[R, 64, 64]} />
        <meshStandardMaterial color={ink} roughness={0.95} metalness={0.05} />
      </mesh>

      <mesh>
        <sphereGeometry args={[R * 1.004, 24, 18]} />
        <meshBasicMaterial color={line} wireframe transparent opacity={0.16} />
      </mesh>

      <Graticule colour={line} accent={mark} />
      <Satellite colour={measured} active={spin} />

      <Marker
        lat={Number(site.lat)}
        lon={Number(site.lon)}
        colour={mark}
        label="STATION"
        detail={`${site.lat}N ${site.lon}E`}
        onSelect={onSelect}
      />
      <Marker
        lat={sun.lat}
        lon={sun.lon}
        colour={measured}
        label="SUBSOLAR"
        detail={formatCoord(sun)}
        onSelect={onSelect}
      />
    </>
  );
}

export function Globe3D({ className }: { className?: string }) {
  const { depth: animate } = useMotionPrefs();
  const [engaged, setEngaged] = useState(false);
  const [rich, setRich] = useState(true);
  const holder = useRef<HTMLDivElement>(null);
  const controls = useRef<React.ComponentRef<typeof OrbitControls> | null>(null);

  /**
   * Zoom is opt-in. A WebGL canvas that grabs the wheel sits directly in
   * the path of someone scrolling the page, and stealing that gesture is
   * the fastest way to make a site feel broken.
   */
  useEffect(() => {
    if (!engaged) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEngaged(false);
    };
    const onWheel = (e: WheelEvent) => e.stopPropagation();
    const el = holder.current;
    window.addEventListener("keydown", onKey);
    el?.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("keydown", onKey);
      el?.removeEventListener("wheel", onWheel);
    };
  }, [engaged]);

  /**
   * Clicking a marker flies the camera to it: the globe turns so that
   * point faces you, and the camera dollies in at the same time.
   *
   * Motion's imperative `animate()` drives all three values — it is the
   * same library already animating the page, applied to numbers instead
   * of DOM, rather than a hand-written rAF interpolation loop.
   */
  const flyTo = (v: THREE.Vector3) => {
    const c = controls.current;
    if (!c) return;

    const target = new THREE.Spherical().setFromVector3(v.clone().normalize());
    const from = {
      az: c.getAzimuthalAngle(),
      pol: c.getPolarAngle(),
      dist: c.getDistance(),
    };

    // Take the short way round rather than unwinding the long way.
    let dAz = target.theta - from.az;
    while (dAz > Math.PI) dAz -= Math.PI * 2;
    while (dAz < -Math.PI) dAz += Math.PI * 2;

    const state = { ...from };
    animateValue(state, { az: from.az + dAz, pol: target.phi, dist: 2.1 }, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: () => {
        c.setAzimuthalAngle(state.az);
        c.setPolarAngle(state.pol);
        // OrbitControls has no distance setter, so move the camera along
        // its own view vector, which is what a dolly actually is.
        const cam = c.object;
        const dir = cam.position.clone().sub(c.target).normalize();
        cam.position.copy(c.target).add(dir.multiplyScalar(state.dist));
        c.update();
      },
    });
  };

  return (
    <div
      ref={holder}
      className={className}
      data-instrument=""
      onPointerDown={() => setEngaged(true)}
      onPointerLeave={() => setEngaged(false)}
      style={{ position: "relative" }}
    >
      <span
        className="t-legend pointer-events-none absolute top-0 left-0 z-10"
        style={{ color: engaged ? "var(--mark)" : "var(--ink-lo)" }}
      >
        {engaged ? "Zoom active · Esc to release" : "Click to zoom · drag to rotate"}
      </span>

      <Canvas
        frameloop={animate ? "always" : "demand"}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.6, 3.1], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        style={{ width: "100%", height: "100%" }}
      >
        <Suspense fallback={null}>
          {/* Drops the composer before it drops frames. */}
          <PerformanceMonitor onDecline={() => setRich(false)} />

          <Scene spin={animate} onSelect={flyTo} />

          <OrbitControls
            ref={controls}
            enablePan={false}
            enableZoom={engaged}
            zoomSpeed={0.6}
            minDistance={1.5}
            maxDistance={6}
            enableDamping
            dampingFactor={0.06}
            rotateSpeed={0.5}
            autoRotate={animate && !engaged}
            autoRotateSpeed={0.35}
            makeDefault
          />

          {rich && animate ? (
            <EffectComposer enableNormalPass={false}>
              <Bloom intensity={0.6} luminanceThreshold={0.35} luminanceSmoothing={0.9} mipmapBlur />
              <Vignette eskil={false} offset={0.25} darkness={0.6} />
            </EffectComposer>
          ) : (
            <></>
          )}

          <AdaptiveDpr pixelated />
          <AdaptiveEvents />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
