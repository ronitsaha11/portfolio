"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  boundaryPlane,
  groupOf,
  place,
  planEdges,
  planNodes,
  type Vec3Out,
} from "./formations";
import {
  atmosphereFragment,
  atmosphereVertex,
  boundaryFragment,
  boundaryVertex,
  edgeFragment,
  edgeVertex,
  nodeFragment,
  nodeVertex,
  signalFragment,
  signalVertex,
} from "./shaders";
import type { LatticeState } from "./state";
import type { QualityProfile } from "@/lib/quality";

/**
 * THE LATTICE — the renderer.
 *
 * Five draw calls for the whole page: a procedural backdrop, the edge
 * web, the node field, the packets travelling between stages, and the
 * gate plane where a formation has one. That is the entire scene, and
 * it is why a single canvas can carry every chapter instead of each
 * section mounting its own WebGL context.
 *
 * WHAT IS ACTUALLY MOVING, AND WHY EACH THING MOVES
 *
 *   formation   the shape the current chapter is about
 *   camera      dollies through the chapter as the reader scrolls
 *   yaw         drifts continuously, faster once the reader goes idle
 *   nodes       breathe out of phase, and lean away from the pointer
 *   light       the key follows the pointer across the scene
 *   edges       carry a wave from the upstream end to the downstream
 *   signals     ride the edges, and change where they cross the gate
 *   backdrop    two noise fields drifting at different rates
 *
 * Nothing here is decorative in the sense of being arbitrary. Every one
 * of those has a cause the reader can find: their own pointer, their
 * own scroll, the structure of the system being described, or the fact
 * that a system keeps running when nobody is looking at it.
 *
 * PER-FRAME BUDGET
 *
 * No allocation. Scratch vectors, the matrix and the colours are
 * created once and reused; positions are lerped into pre-sized
 * Float32Arrays and the buffers are marked dirty. Nothing here reads
 * the DOM and nothing calls getBoundingClientRect — scroll and pointer
 * arrive as numbers that were already measured.
 */

const NODE_RADIUS = 0.036;

const scratchA: Vec3Out = { x: 0, y: 0, z: 0 };
const scratchB: Vec3Out = { x: 0, y: 0, z: 0 };
const matrix = new THREE.Matrix4();
const position = new THREE.Vector3();
const quaternion = new THREE.Quaternion();
const scaleVec = new THREE.Vector3();
const lookTarget = new THREE.Vector3();
const lightDir = new THREE.Vector3();

/** Frame-rate independent damping. A fixed coefficient is a different
 *  animation at 60Hz and at 144Hz, and this machine runs both. */
function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

export interface LatticePalette {
  node: string;
  edge: string;
  mark: string;
  boundary: string;
  ground: string;
}

export interface LatticeSceneProps {
  state: LatticeState;
  profile: QualityProfile;
  palette: LatticePalette;
}

export function LatticeScene({ state, profile, palette }: LatticeSceneProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const planeRef = useRef<THREE.Mesh>(null);
  const { camera, size, gl } = useThree();

  const count = profile.nodes;
  const signalCount = profile.signals;

  const plans = useMemo(() => planNodes(count, 12), [count]);
  const edges = useMemo(() => planEdges(plans), [plans]);

  /* ---------------- node buffers ---------------- */

  /** Live positions, damped towards the blended target each frame. */
  const live = useMemo(() => new Float32Array(count * 3), [count]);
  const settled = useRef(false);

  const nodeAttrs = useMemo(() => {
    const colours = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const groups = new Float32Array(count);
    const ranks = new Float32Array(count);

    const base = new THREE.Color(palette.node);
    const mark = new THREE.Color(palette.mark);
    const gate = new THREE.Color(palette.boundary);

    for (let i = 0; i < count; i++) {
      const plan = plans[i];
      // Three token colours and no others. The accent carries about a
      // tenth of the field and the gate colour about a twentieth, which
      // is enough to give the field structure without turning it into a
      // colour wheel — and all three come from globals.css, so the 3D
      // cannot drift from the design system.
      const r = plan?.rank ?? 0;
      const c = r > 0.93 ? mark : r > 0.87 ? gate : base;
      colours[i * 3] = c.r;
      colours[i * 3 + 1] = c.g;
      colours[i * 3 + 2] = c.b;
      seeds[i] = plan?.phase ?? 0;
      ranks[i] = r;
      groups[i] = 0;
    }
    return { colours, seeds, groups, ranks };
  }, [count, plans, palette.node, palette.mark, palette.boundary]);

  /* ---------------- edge buffers ---------------- */

  const edgeGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(edges.length * 6);
    const ts = new Float32Array(edges.length * 2);
    const seeds = new Float32Array(edges.length * 2);
    const lens = new Float32Array(edges.length * 2);
    for (let e = 0; e < edges.length; e++) {
      ts[e * 2] = 0;
      ts[e * 2 + 1] = 1;
      // One seed per edge, written to both ends, so the wave on a
      // segment is continuous rather than two half-waves meeting.
      const s = ((e * 2654435761) % 1000) / 1000;
      seeds[e * 2] = s;
      seeds[e * 2 + 1] = s;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aT", new THREE.BufferAttribute(ts, 1));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute("aLen", new THREE.BufferAttribute(lens, 1));
    return geo;
  }, [edges.length]);

  /* ---------------- signal buffers ---------------- */

  /**
   * Packets. Each one is bound to one edge for the life of the page and
   * runs it on a loop, so a signal always travels from an upstream
   * stage to the stage after it — never backwards, never between two
   * unrelated nodes.
   */
  const signals = useMemo(() => {
    const edgeOf = new Int32Array(signalCount);
    const phase = new Float32Array(signalCount);
    const speed = new Float32Array(signalCount);
    for (let i = 0; i < signalCount; i++) {
      edgeOf[i] = edges.length > 0 ? (i * 7919) % edges.length : 0;
      phase[i] = ((i * 2654435761) % 997) / 997;
      speed[i] = 0.1 + (((i * 40503) % 100) / 100) * 0.16;
    }
    return { edgeOf, phase, speed };
  }, [signalCount, edges.length]);

  const signalGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(signalCount * 3), 3),
    );
    geo.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array(signalCount * 3), 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(signalCount), 1));
    geo.setDrawRange(0, signalCount);
    return geo;
  }, [signalCount]);

  /* ---------------- materials ---------------- */

  const colours = useMemo(
    () => ({
      node: new THREE.Color(palette.node),
      edge: new THREE.Color(palette.edge),
      mark: new THREE.Color(palette.mark),
      gate: new THREE.Color(palette.boundary),
      ground: new THREE.Color(palette.ground),
    }),
    [palette],
  );

  /** Shared between all four programs, so there is one corridor and one
   *  depth ramp rather than four that can disagree. */
  const shared = useMemo(
    () => ({
      uCorridor: { value: 0.5 },
      uCorridorHalf: { value: 0.6 },
      uCorridorCentre: { value: -0.12 },
      uFogNear: { value: 16 },
      uFogFar: { value: 44 },
    }),
    [],
  );

  const nodeUniforms = useMemo(
    () => ({
      ...shared,
      uTime: { value: 0 },
      uOpacity: { value: 0.9 },
      uGlow: { value: 1 },
      uHalo: { value: profile.halo },
      uFocus: { value: -1 },
      uLight: { value: new THREE.Vector3(0.4, 0.5, 0.75).normalize() },
      uAccent: { value: colours.mark },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uAspect: { value: 1.6 },
      uPush: { value: 0.045 },
      uEnergy: { value: 0 },
      uIdle: { value: 0 },
      uEvent: { value: 99 },
    }),
    [shared, colours.mark, profile.halo],
  );

  const edgeUniforms = useMemo(
    () => ({
      ...shared,
      uTime: { value: 0 },
      uOpacity: { value: 0.3 },
      uColor: { value: colours.edge },
      uAccent: { value: colours.mark },
      uEnergy: { value: 0 },
    }),
    [shared, colours.edge, colours.mark],
  );

  const signalUniforms = useMemo(
    () => ({
      ...shared,
      uOpacity: { value: 0.85 },
      uGlow: { value: 1 },
      uScale: { value: 150 },
    }),
    [shared],
  );

  const atmosphereUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uEnergy: { value: 0 },
      uIdle: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uAspect: { value: 1.6 },
      uTint: { value: new THREE.Color(palette.node) },
      uAccent: { value: colours.mark },
      uOpacity: { value: 0.5 },
    }),
    [colours.mark, palette.node],
  );

  const boundaryUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uColor: { value: colours.gate },
    }),
    [colours.gate],
  );

  const nodeMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: nodeVertex,
        fragmentShader: nodeFragment,
        uniforms: nodeUniforms,
        transparent: true,
        depthWrite: false,
        // Additive against a near-black ground is what makes a dense
        // region read as dense: overlapping nodes brighten, which is
        // the behaviour of light and not of stacked stickers.
        blending: THREE.AdditiveBlending,
      }),
    [nodeUniforms],
  );

  const edgeMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: edgeVertex,
        fragmentShader: edgeFragment,
        uniforms: edgeUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [edgeUniforms],
  );

  const signalMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: signalVertex,
        fragmentShader: signalFragment,
        uniforms: signalUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [signalUniforms],
  );

  const atmosphereMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: atmosphereVertex,
        fragmentShader: atmosphereFragment,
        uniforms: atmosphereUniforms,
        transparent: true,
        depthWrite: false,
        depthTest: false,
      }),
    [atmosphereUniforms],
  );

  const boundaryMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: boundaryVertex,
        fragmentShader: boundaryFragment,
        uniforms: boundaryUniforms,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    [boundaryUniforms],
  );

  /** The full-screen triangle the backdrop is drawn on. */
  const atmosphereGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3),
    );
    geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));
    return geo;
  }, []);

  /* ---------------- the loop ---------------- */

  const clock = useRef(0);
  const drift = useRef(0);
  const lastFormation = useRef<string>("");
  /** Seconds since the last system event, and when the next one is due. */
  const event = useRef(99);
  const nextEvent = useRef(6);

  useFrame((_, rawDelta) => {
    const mesh = meshRef.current;
    const group = groupRef.current;
    if (!mesh || !group || !state.active) return;

    // Clamp: a backgrounded tab returns one enormous delta, which would
    // snap every node to its target in a single visible jump.
    const delta = Math.min(rawDelta, 1 / 30);
    clock.current += delta;
    const t = clock.current;

    /* ---- damped input ---- */

    state.pointerX = damp(state.pointerX, state.pointerXTarget, 3.6, delta);
    state.pointerY = damp(state.pointerY, state.pointerYTarget, 3.6, delta);
    state.idle = damp(state.idle, state.idleTarget, 0.9, delta);

    const drive = Math.max(state.pointerSpeed, state.scrollSpeed, state.tapPulse);
    // Rises fast and falls slowly: a flick should register instantly and
    // then settle, which is how a needle behaves and how a crossfade
    // does not.
    state.energy = damp(state.energy, drive, drive > state.energy ? 16 : 1.9, delta);
    state.pointerSpeed *= 0.82;
    state.tapPulse *= 0.9;
    // `scrollSpeed` is NOT decayed here. The scroll engine writes an
    // already-smoothed velocity into it on every frame of its own loop,
    // and decaying a value someone else owns is how two damped systems
    // end up beating against each other.

    /* ---- formation ---- */

    const total = count;
    const toName = state.to;
    const k = settled.current ? 1 - Math.pow(0.0018, delta) : 1;

    // The per-node group only changes when the formation does, so it is
    // written once per morph rather than once per frame per node.
    if (lastFormation.current !== toName) {
      lastFormation.current = toName;
      for (let i = 0; i < total; i++) nodeAttrs.groups[i] = groupOf(i, total, toName);
      const attr = mesh.geometry.getAttribute("aGroup");
      if (attr) attr.needsUpdate = true;
    }

    const focus = state.focusGroup;
    const scale = state.nodeScale * NODE_RADIUS * profile.halo * 2;

    for (let i = 0; i < total; i++) {
      const plan = plans[i];
      if (!plan) continue;

      place(state.from, plan, i, total, scratchA);
      place(toName, plan, i, total, scratchB);

      const b = state.blend;
      let tx = scratchA.x + (scratchB.x - scratchA.x) * b;
      let ty = scratchA.y + (scratchB.y - scratchA.y) * b;
      let tz = scratchA.z + (scratchB.z - scratchA.z) * b;

      // Ambient drift. Tiny, out of phase, and it grows as the reader
      // goes idle — the system is still doing something when they stop.
      const wob = 0.055 + state.idle * 0.09;
      tx += Math.sin(t * 0.32 + plan.phase) * wob;
      ty += Math.cos(t * 0.27 + plan.phase * 1.7) * wob;
      tz += Math.sin(t * 0.21 + plan.phase * 0.6) * wob;

      // Read-then-write rather than `+=`: with noUncheckedIndexedAccess
      // a typed-array index is `number | undefined`, and `+=` on that is
      // a type error rather than the zero it would be at runtime.
      const o = i * 3;
      const lx = live[o] ?? 0;
      const ly = live[o + 1] ?? 0;
      const lz = live[o + 2] ?? 0;
      const nx = lx + (tx - lx) * k;
      const ny = ly + (ty - ly) * k;
      const nz = lz + (tz - lz) * k;
      live[o] = nx;
      live[o + 1] = ny;
      live[o + 2] = nz;

      position.set(nx, ny, nz);
      scaleVec.set(scale, scale, scale);
      matrix.compose(position, quaternion, scaleVec);
      mesh.setMatrixAt(i, matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    settled.current = true;

    /* ---- edges ---- */

    const edgeAttr = edgeGeometry.getAttribute("position") as THREE.BufferAttribute;
    const lenAttr = edgeGeometry.getAttribute("aLen") as THREE.BufferAttribute;
    const ebuf = edgeAttr.array as Float32Array;
    const lbuf = lenAttr.array as Float32Array;
    for (let e = 0; e < edges.length; e++) {
      const edge = edges[e];
      if (!edge) continue;
      const ao = edge[0] * 3;
      const zo = edge[1] * 3;
      const w = e * 6;
      const x0 = live[ao] ?? 0;
      const y0 = live[ao + 1] ?? 0;
      const z0 = live[ao + 2] ?? 0;
      const x1 = live[zo] ?? 0;
      const y1 = live[zo + 1] ?? 0;
      const z1 = live[zo + 2] ?? 0;
      ebuf[w] = x0;
      ebuf[w + 1] = y0;
      ebuf[w + 2] = z0;
      ebuf[w + 3] = x1;
      ebuf[w + 4] = y1;
      ebuf[w + 5] = z1;
      // Length, written to both ends so the fragment shader can drop a
      // connection that has stopped being a connection.
      const len = Math.hypot(x1 - x0, y1 - y0, z1 - z0);
      lbuf[e * 2] = len;
      lbuf[e * 2 + 1] = len;
    }
    edgeAttr.needsUpdate = true;
    lenAttr.needsUpdate = true;

    /* ---- signals ---- */

    const spec = boundaryPlane(toName, state.boundaryGroup);
    const gateOn = state.boundary > 0.05 && spec !== null;

    const sPos = signalGeometry.getAttribute("position") as THREE.BufferAttribute;
    const sCol = signalGeometry.getAttribute("aColor") as THREE.BufferAttribute;
    const sSize = signalGeometry.getAttribute("aSize") as THREE.BufferAttribute;
    const pbuf = sPos.array as Float32Array;
    const cbuf = sCol.array as Float32Array;
    const zbuf = sSize.array as Float32Array;

    const activeSignals = Math.floor(signalCount * Math.min(1, state.flow));
    for (let s = 0; s < activeSignals; s++) {
      const ei = signals.edgeOf[s] ?? 0;
      const edge = edges[ei];
      if (!edge) continue;

      const u = ((signals.phase[s] ?? 0) + t * (signals.speed[s] ?? 0.1)) % 1;
      const ao = edge[0] * 3;
      const zo = edge[1] * 3;
      const ax = live[ao] ?? 0;
      const ay = live[ao + 1] ?? 0;
      const az = live[ao + 2] ?? 0;
      let px = ax + ((live[zo] ?? 0) - ax) * u;
      let py = ay + ((live[zo + 1] ?? 0) - ay) * u;
      let pz = az + ((live[zo + 2] ?? 0) - az) * u;

      // THE GATE. Where a formation has a boundary, a packet crossing
      // it is visibly changed: it snaps to a lattice for the width of
      // the membrane and comes out the other side in the gate colour.
      // This is a picture of a documented architecture — a stage that
      // rewrites what passes through it — and not a claim that anything
      // is running.
      let crossed = false;
      if (gateOn && spec) {
        const along = spec.axis === "x" ? px : py;
        const dist = along - spec.at;
        crossed = dist > 0;
        if (Math.abs(dist) < 0.5) {
          const q = 0.42;
          if (spec.axis === "x") {
            py = Math.round(py / q) * q;
            pz = Math.round(pz / q) * q;
          } else {
            px = Math.round(px / q) * q;
            pz = Math.round(pz / q) * q;
          }
        }
      }

      const o = s * 3;
      pbuf[o] = px;
      pbuf[o + 1] = py;
      pbuf[o + 2] = pz;

      const c = crossed ? colours.gate : colours.mark;
      cbuf[o] = c.r;
      cbuf[o + 1] = c.g;
      cbuf[o + 2] = c.b;

      // Brightest in the middle of its run, so a packet reads as
      // arriving and departing rather than as blinking on and off.
      zbuf[s] = 0.42 + Math.sin(u * Math.PI) * 0.78;
    }
    signalGeometry.setDrawRange(0, activeSignals);
    sPos.needsUpdate = true;
    sCol.needsUpdate = true;
    sSize.needsUpdate = true;

    /* ---- uniforms ---- */

    // Read once and used by the shaders and by the camera below.
    const aspect = size.width / Math.max(1, size.height);

    const presence = state.presence;

    nodeUniforms.uTime.value = t;
    nodeUniforms.uOpacity.value = state.nodeOpacity * presence;
    nodeUniforms.uGlow.value = state.glow * (1 + state.energy * 0.35);
    nodeUniforms.uFocus.value = focus;
    nodeUniforms.uAspect.value = aspect;
    nodeUniforms.uEnergy.value = state.energy;
    nodeUniforms.uIdle.value = state.idle;

    // The event clock. Interval jittered from the elapsed time so two
    // tabs do not pulse in lockstep, and long enough apart that it
    // reads as something happening rather than as a loop.
    event.current += delta;
    if (event.current > nextEvent.current) {
      event.current = 0;
      nextEvent.current = 8 + (t % 6);
    }
    nodeUniforms.uEvent.value = event.current;
    nodeUniforms.uPointer.value.set(state.pointerX, state.pointerY);
    nodeUniforms.uPush.value = 0.05 * profile.parallax;

    // The key light is the reader's pointer. It is the clearest cause
    // the scene has: move the mouse, and the shading on every node in
    // the field changes at once.
    lightDir.set(state.pointerX * 0.85, state.pointerY * 0.7 + 0.25, 0.85).normalize();
    nodeUniforms.uLight.value.copy(lightDir);

    edgeUniforms.uTime.value = t;
    edgeUniforms.uOpacity.value = state.edgeOpacity * presence;
    edgeUniforms.uEnergy.value = state.energy;

    signalUniforms.uOpacity.value = 0.62 * presence * Math.min(1, state.flow * 1.4);
    signalUniforms.uGlow.value = state.glow;
    signalUniforms.uScale.value = 150 * gl.getPixelRatio();

    shared.uCorridor.value = state.corridor * profile.corridorBias;
    shared.uCorridorHalf.value = state.corridorHalf;
    shared.uCorridorCentre.value = state.corridorCentre;

    atmosphereUniforms.uTime.value = t;
    atmosphereUniforms.uProgress.value = state.pageProgress;
    atmosphereUniforms.uEnergy.value = state.energy;
    atmosphereUniforms.uIdle.value = state.idle;
    atmosphereUniforms.uAspect.value = aspect;
    atmosphereUniforms.uPointer.value.set(state.pointerX, state.pointerY);
    atmosphereUniforms.uOpacity.value = 0.34 + presence * 0.3;

    boundaryUniforms.uTime.value = t;

    /* ---- the gate plane ---- */

    const plane = planeRef.current;
    if (plane) {
      plane.visible = gateOn;
      if (gateOn && spec) {
        if (spec.axis === "x") {
          plane.position.set(spec.at, 0, 0);
          plane.rotation.set(0, Math.PI / 2, 0);
        } else {
          plane.position.set(0, spec.at, 0);
          plane.rotation.set(Math.PI / 2, 0, 0);
        }
        boundaryUniforms.uOpacity.value = state.boundary * presence * 0.28;
      }
    }

    /* ---- camera ---- */

    // The chapter pose says where the camera rests; scroll progress says
    // how far through the move the reader has taken it. The reader is
    // always driving something.
    const prog = state.chapterProgress;
    const par = profile.parallax;

    // PORTRAIT COMPENSATION.
    //
    // Every camera distance in the shot list was chosen against a
    // landscape frame. A perspective camera's HORIZONTAL field of view
    // shrinks with the aspect ratio, so the same distance on a phone
    // held upright shows about a quarter of a pipeline that runs
    // nineteen world units along x — the reader gets a handful of
    // dots and no object. Backing off by the aspect ratio restores
    // roughly the same horizontal coverage. Clamped, because fully
    // compensating a 0.46 aspect would put the camera so far out that
    // the nodes become specks; a phone sees a wider slice than a
    // monitor does, not the whole thing.
    const fit = Math.min(1.62, Math.max(1, 1.5 / Math.max(0.3, aspect)));

    camera.position.set(
      state.camX + state.pointerX * 1.1 * par,
      state.camY + state.pointerY * 0.7 * par,
      (state.camZ - state.dolly * prog) * fit,
    );
    lookTarget.set(state.lookX + state.pointerX * 0.25 * par, state.lookY, 0);
    camera.lookAt(lookTarget);

    shared.uFogNear.value = camera.position.z + 2;
    shared.uFogFar.value = camera.position.z + 30;

    // Ambient yaw. Never stops, and it speeds up when the reader does
    // not: a system nobody is watching is still a system.
    drift.current += delta * (0.012 + state.idle * 0.022);
    group.rotation.y = state.spin + state.swing * prog + drift.current;
    group.position.y = Math.sin(t * 0.21) * 0.14;
  });

  return (
    <>
      {profile.atmosphere ? (
        <mesh
          geometry={atmosphereGeometry}
          material={atmosphereMaterial}
          frustumCulled={false}
          renderOrder={-1000}
        />
      ) : null}

      <group ref={groupRef}>
        <lineSegments
          geometry={edgeGeometry}
          material={edgeMaterial}
          frustumCulled={false}
          renderOrder={1}
        />

        <mesh ref={planeRef} material={boundaryMaterial} visible={false} renderOrder={2}>
          <planeGeometry args={[13, 8]} />
        </mesh>

        <instancedMesh
          ref={meshRef}
          args={[undefined, undefined, count]}
          material={nodeMaterial}
          frustumCulled={false}
          renderOrder={3}
        >
          <planeGeometry args={[1, 1]}>
            <instancedBufferAttribute attach="attributes-aColor" args={[nodeAttrs.colours, 3]} />
            <instancedBufferAttribute attach="attributes-aSeed" args={[nodeAttrs.seeds, 1]} />
            <instancedBufferAttribute attach="attributes-aGroup" args={[nodeAttrs.groups, 1]} />
            <instancedBufferAttribute attach="attributes-aRank" args={[nodeAttrs.ranks, 1]} />
          </planeGeometry>
        </instancedMesh>

        <points
          geometry={signalGeometry}
          material={signalMaterial}
          frustumCulled={false}
          renderOrder={4}
        />
      </group>
    </>
  );
}
