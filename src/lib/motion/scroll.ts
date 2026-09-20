import {
  onFrame,
  remeasure,
  scrollFrame,
  trackOnce,
  trackRange,
  watchRect,
  type RangeMode,
  type ScrollFrame,
} from "./scrollEngine";

/**
 * SCROLL ORCHESTRATION — layer 5.
 *
 * This used to wrap anime.js's ScrollObserver. It no longer does, and
 * the reason is worth recording.
 *
 * anime's observers are correct and pleasant to use, but each one owns
 * its own thresholds, its own cached geometry and its own contribution
 * to the container's scroll handler. This page had about forty of them
 * — two per chapter, one per reveal, one per parallax — alongside a
 * separate rAF sampler in the lattice, a scroll listener in the rail
 * that called `setState` on every frame, and another in the masthead.
 * Five systems, no shared clock, and the same elements measured over
 * and over.
 *
 * Everything now goes through `scrollEngine`: one listener, one frame
 * loop, one measurement pass. These helpers are the thin layer that
 * adds the two things a caller should not have to remember.
 *
 *  1. SSR. The engine touches `window` on first subscription, so it can
 *     never run during render.
 *  2. Reduced motion. Asking for a scroll link when motion is off
 *     returns a no-op and the caller's content stays in its final
 *     state, rather than every caller writing the same guard.
 */

export type { RangeMode, ScrollFrame };
export { onFrame, remeasure, scrollFrame, watchRect };

const NOOP = () => {};

export interface RangeOptions {
  /** Skip entirely when false. Callers pass their reduced-motion flag. */
  enabled?: boolean;
}

/**
 * SYNC — progress-linked.
 *
 * The callback's playhead *is* the scroll position: scroll back and it
 * runs backwards, stop and it stops. Use for anything the reader
 * should feel they are driving.
 *
 * The callback must not read layout and must not set React state. Both
 * rules exist because this runs on every frame the element moves, and
 * both were broken somewhere on this page before the engine landed.
 */
export function linkRange(
  el: HTMLElement | null,
  mode: RangeMode,
  cb: (progress: number, frame: ScrollFrame) => void,
  opts: RangeOptions = {},
): () => void {
  if (!el || opts.enabled === false || typeof window === "undefined") return NOOP;
  return trackRange(el, mode, cb);
}

/**
 * PLAY — triggered, once.
 *
 * Fires when the element has risen `reveal` of a viewport height up
 * from the bottom edge, and never again. Use for arrivals, where a
 * reveal that re-plays every time you scroll past is theatre.
 */
export function onceInView(
  el: HTMLElement | null,
  cb: () => void,
  opts: RangeOptions & { reveal?: number } = {},
): () => void {
  if (!el || opts.enabled === false || typeof window === "undefined") return NOOP;
  return trackOnce(el, opts.reveal ?? 0.12, cb);
}
