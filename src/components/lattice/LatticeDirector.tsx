"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { animate, createTimeline, utils } from "animejs";
import { morph, DUR, EASE, linkRange, onFrame } from "@/lib/motion";
import { installInput } from "./input";
import { createLatticeState, POSES, type LatticePose, type LatticeState } from "./state";

/**
 * THE DIRECTOR — layers 4 and 5 of the animation system.
 *
 *   browser scroll
 *     → the scroll engine, one loop for the page
 *       → two ranges per chapter
 *         → chapter timeline (anime.js)
 *           → the LatticeState object
 *             → the render loop reads it
 *
 * TWO RANGES PER CHAPTER, AND THE SPLIT IS THE WHOLE DESIGN.
 *
 * DISCRETE — the formation. A formation is a state, not a range: it
 * would be meaningless to be 40% of the way from a pipeline to a
 * constellation under manual control, and scrubbing it back and forth
 * would look like a fault. So crossing into a chapter fires one MORPH,
 * at its own speed, and it finishes.
 *
 * CONTINUOUS — how far through the chapter the reader has come, as a
 * number from 0 to 1. The playhead IS the scroll position: scroll back
 * and the camera runs backwards, stop and it stops. The scene spends
 * that number on a dolly and a yaw, so the viewpoint is moving the
 * entire time the reader is, and scrolling has a visible consequence
 * between chapter boundaries rather than only at them.
 *
 * WHICH CHAPTER IS ACTIVE IS DECIDED IN ONE PLACE, ONCE PER FRAME.
 *
 * Several chapters are inside their range at the same time — they have
 * to be, or the value would jump — so the answer cannot be "whichever
 * observer fired last". The rule is: the last chapter in document
 * order whose top has passed the middle of the viewport. One pass over
 * cached numbers, no DOM, and it is the same answer the nav, the rail
 * and the 3D all read.
 *
 * DRIVEN CHAPTERS. A pinned case study runs its own act timeline
 * against its own scroll range and owns the camera outright. The
 * director still performs its formation morph, because a cut belongs
 * to whoever notices the boundary, and then stays out of the way.
 */

interface DirectorApi {
  /** Chapters register themselves; the director owns all the ranges. */
  register: (id: string, el: HTMLElement | null, pose?: LatticePose) => void;
  /** Light the nodes belonging to a stage. -1 clears. */
  focus: (group: number) => void;
  state: LatticeState;
  /** Which chapter the reader is in. Drives the nav indicator. */
  activeId: string;
}

const noop = () => {};
const DirectorContext = createContext<DirectorApi>({
  register: noop,
  focus: noop,
  state: createLatticeState(),
  activeId: "top",
});

export function useLattice(): DirectorApi {
  return useContext(DirectorContext);
}

export function LatticeDirector({
  children,
  enabled,
}: {
  children: ReactNode;
  enabled: boolean;
}) {
  const stateRef = useRef<LatticeState>(createLatticeState());
  const [activeId, setActiveId] = useState("top");

  /** id → { el, pose }, filled by chapters as they mount. */
  const registry = useRef(new Map<string, { el: HTMLElement; pose: LatticePose }>());
  const currentPose = useRef<string>("top");

  /**
   * Bumped whenever the set of chapters changes.
   *
   * It has to be state, not a ref: the effect that builds the ranges
   * needs to re-run, and a ref in a dependency array is read at render
   * time and never notices. Every chapter registers inside the same
   * commit, so React batches these into one re-render and the range
   * set is built once rather than once per section.
   */
  const [version, setVersion] = useState(0);

  const register = useCallback((id: string, el: HTMLElement | null, pose?: LatticePose) => {
    if (!el) {
      if (registry.current.delete(id)) setVersion((v) => v + 1);
      return;
    }
    const existing = registry.current.get(id);
    if (existing?.el === el) return;
    registry.current.set(id, { el, pose: pose ?? POSES[id] ?? POSES.top! });
    setVersion((v) => v + 1);
  }, []);

  /**
   * Hovering a stage in the semantic list, or scrolling into one inside
   * a pinned case study, lights the matching nodes. Written straight in
   * rather than tweened: the shader damps the emphasis itself, and a
   * tween here would fight it.
   */
  const focus = useCallback((group: number) => {
    stateRef.current.focusGroup = group;
  }, []);

  /**
   * Apply a chapter's pose.
   *
   * The formation is a cut with a MORPH across it: the outgoing shape
   * becomes `from`, the incoming becomes `to`, and one tween carries
   * `blend` from 0 to 1. Everything else is a plain CAMERA tween —
   * unless the chapter drives itself, in which case there is nothing
   * else to do here.
   */
  const applyPose = useCallback((id: string, pose: LatticePose) => {
    const s = stateRef.current;
    if (currentPose.current === id) return;
    currentPose.current = id;
    setActiveId(id);

    if (pose.formation !== s.to) {
      // Freeze the shape currently on screen as the departure point.
      s.from = s.blend >= 0.999 ? s.to : s.from;
      s.to = pose.formation;
      s.blend = 0;
      animate(s, { blend: 1, ...morph() });
    }

    if (pose.boundaryGroup !== undefined) s.boundaryGroup = pose.boundaryGroup;
    if (pose.driven) return;

    s.chapterProgress = 0;

    // DefaultsParams is narrower than AnimationParams (its duration
    // cannot be a string), so the CAMERA verb's values are spelled out
    // here rather than spread in.
    const tl = createTimeline({ defaults: { duration: DUR.pass, ease: EASE.instr } });
    tl.add(
      s,
      {
        camX: pose.camX ?? 0,
        camY: pose.camY ?? 0,
        camZ: pose.camZ ?? s.camZ,
        lookX: pose.lookX ?? 0,
        lookY: pose.lookY ?? 0,
        spin: pose.spin ?? 0,
        dolly: pose.dolly ?? 3,
        swing: pose.swing ?? 0.2,
      },
      0,
    );
    tl.add(
      s,
      {
        nodeScale: pose.nodeScale ?? 1,
        nodeOpacity: pose.nodeOpacity ?? 0.9,
        edgeOpacity: pose.edgeOpacity ?? 0.3,
        boundary: pose.boundary ?? 0,
        presence: pose.presence ?? 0.6,
        corridor: pose.corridor ?? 0.75,
        flow: pose.flow ?? 0.5,
        glow: pose.glow ?? 1,
        duration: DUR.pass,
        ease: EASE.settle,
      },
      0,
    );
  }, []);

  /** Pointer, and the engine's scroll signals. One listener set. */
  useEffect(() => {
    if (!enabled) return;
    return installInput(stateRef.current);
  }, [enabled]);

  /**
   * Build the ranges.
   *
   * ENTER — from the chapter's top reaching the bottom of the viewport
   * to its top reaching the top. Half way through that is the moment
   * the chapter's top crosses the middle of the screen, which is when
   * it takes the lattice: the reorganisation happens while the reader
   * is arriving at the section rather than after they have read half
   * of it.
   *
   * COVER — the full travel, top entering the bottom to bottom leaving
   * the top. This is the number a plain chapter spends on its dolly.
   * A driven chapter ignores it and writes its own.
   */
  useEffect(() => {
    if (!enabled) return;

    const s = stateRef.current;
    const releases: (() => void)[] = [];
    const order: string[] = [];
    const progress = new Map<string, number>();
    let dirty = true;

    for (const [id, entry] of registry.current) {
      order.push(id);
      progress.set(id, 0);

      releases.push(
        linkRange(entry.el, "enter", (p) => {
          progress.set(id, p);
          dirty = true;
        }),
      );

      if (!entry.pose.driven) {
        releases.push(
          linkRange(entry.el, "cover", (p) => {
            if (currentPose.current === id) s.chapterProgress = p;
          }),
        );
      }
    }

    releases.push(
      onFrame(() => {
        if (!dirty) return;
        dirty = false;
        let active = order[0];
        for (const id of order) {
          if ((progress.get(id) ?? 0) >= 0.5) active = id;
        }
        if (!active || active === currentPose.current) return;
        const entry = registry.current.get(active);
        if (entry) applyPose(active, entry.pose);
      }),
    );

    return () => {
      for (const r of releases) r();
    };
  }, [enabled, applyPose, version]);

  /** Stop the loop entirely when the tab is not visible. */
  useEffect(() => {
    const onVisibility = () => {
      stateRef.current.active = document.visibilityState === "visible" && enabled;
    };
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [enabled]);

  /** Reduced motion: hold the resting pose, animate nothing. */
  useEffect(() => {
    if (enabled) return;
    utils.set(stateRef.current, {
      blend: 1,
      presence: 0.5,
      chapterProgress: 0,
      energy: 0,
      idle: 0,
    });
  }, [enabled]);

  const api = useMemo<DirectorApi>(
    () => ({ register, focus, state: stateRef.current, activeId }),
    [register, focus, activeId],
  );

  return <DirectorContext.Provider value={api}>{children}</DirectorContext.Provider>;
}
