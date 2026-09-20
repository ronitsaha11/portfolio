import { onFrame, watchRect } from "@/lib/motion";
import type { LatticeState } from "./state";

/**
 * THE INPUT FIELD.
 *
 * Four continuous signals the reader produces without meaning to —
 * where the pointer is, how fast it is moving, how fast the page is
 * scrolling, and how long since either happened — written into the
 * lattice state as plain numbers.
 *
 * WHY THIS IS NOT A REACT HOOK PER CONSUMER
 *
 * Pointer position at 120Hz through React state re-renders the tree on
 * every mouse move. These are the highest-frequency values on the page
 * and they have exactly one consumer, the render loop, so they are
 * written straight into the same mutable object the render loop already
 * reads. One listener set for the whole document, installed once.
 *
 * WHY THE VALUES ARE TARGETS, NOT POSITIONS
 *
 * Nothing here smooths. The frame loop does the smoothing, because only
 * the frame loop knows how long the frame was — a lerp with a fixed
 * coefficient is a different animation at 60Hz and at 144Hz, and this
 * machine runs both depending on what else is open.
 *
 * WHAT USED TO BE HERE AND IS NOT ANY MORE
 *
 * This module had its own `requestAnimationFrame` sampler reading
 * `scrollY` and `documentElement.scrollHeight`. The scroll engine now
 * owns both, so scroll velocity, page progress and the idle clock
 * arrive here already measured, and the reading column arrives as a
 * cached rect that is refreshed on resize rather than polled.
 */

const IDLE_AFTER = 3200;

export function installInput(state: LatticeState): () => void {
  let lastX = 0;
  let lastY = 0;
  let lastMove = 0;

  const onPointerMove = (e: PointerEvent) => {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    const nx = (e.clientX / w) * 2 - 1;
    const ny = -((e.clientY / h) * 2 - 1);

    const now = performance.now();
    const dt = Math.max(16, now - lastMove);
    // Screen widths per second, clamped: a pointer thrown across three
    // monitors should not produce a value three times larger than one
    // thrown across this one.
    const speed = Math.min(1, (Math.hypot(nx - lastX, ny - lastY) / dt) * 900);

    state.pointerXTarget = nx;
    state.pointerYTarget = ny;
    state.pointerSpeed = Math.max(state.pointerSpeed, speed);

    lastX = nx;
    lastY = ny;
    lastMove = now;
  };

  /**
   * A coarse pointer has no hover, so the touch point stands in for it
   * only while the finger is down, and it releases back to centre.
   */
  const onPointerDown = (e: PointerEvent) => {
    onPointerMove(e);
    state.tapPulse = 1;
  };

  const onPointerLeave = () => {
    state.pointerXTarget = 0;
    state.pointerYTarget = 0;
  };

  /**
   * THE READING COLUMN, in normalised device coordinates.
   *
   * Measured from the DOM rather than guessed from the aspect ratio:
   * the chapter rail pushes the column right on wide screens and it
   * fills the frame on a phone. The lattice thins inside this band and
   * runs at full strength outside it, which is what lets the scene be
   * bright at all without eating the contrast of the text in front of
   * it.
   *
   * A pinned case study overrides this while it owns the viewport,
   * because its narrative column is narrower and hard left. Ownership
   * is a field on the state rather than a race between two writers.
   */
  const column = document.querySelector<HTMLElement>("[data-column]");
  const watch = column ? watchRect(column) : null;

  const release = onFrame((frame) => {
    state.scrollSpeed = frame.velocity;
    state.pageProgress = frame.progress;
    state.idleTarget = frame.sinceInput > IDLE_AFTER ? 1 : 0;

    if (state.corridorOwner === null && watch) {
      const w = window.innerWidth || 1;
      const left = (watch.rect.left / w) * 2 - 1;
      const right = (watch.rect.right / w) * 2 - 1;
      state.corridorCentre = (left + right) / 2;
      // A little wider than the column itself: a node just outside the
      // measure still sits next to a descender.
      state.corridorHalf = Math.min(1.1, Math.abs(right - left) / 2 + 0.08);
    }
  });

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  document.addEventListener("pointerleave", onPointerLeave);

  return () => {
    release();
    watch?.release();
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerdown", onPointerDown);
    document.removeEventListener("pointerleave", onPointerLeave);
  };
}
