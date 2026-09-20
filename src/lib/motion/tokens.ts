import { cubicBezier } from "animejs";

/**
 * MOTION TOKENS — layer 1 of the animation system.
 *
 *   tokens  →  verbs  →  component animations  →  scene timelines  →  scroll
 *
 * Nothing below this layer exists: no component writes a duration and no
 * component writes an easing curve. Both are named, and the names are
 * the same five the CSS mirror in globals.css uses, so a transition
 * written in CSS and a tween written in JavaScript move identically.
 *
 * Durations are milliseconds because that is what anime.js takes. The
 * CSS side carries the same numbers with a `ms` unit.
 */

export const DUR = {
  /** Micro-feedback: hover, focus, toggle. Below the animation threshold. */
  tick: 100,
  /** Standard UI arrival: panels, cards, popovers. */
  ui: 340,
  /** A value resolving — the count-up. */
  measure: 620,
  /** An interval narrowing, a diagram drawing, a rail filling. */
  sweep: 850,
  /** Chapter transitions. Used about six times on the site. */
  pass: 1100,
  /** The lattice reorganising between two formations. */
  morph: 1400,
} as const;

export const EASE = {
  /** Decisive arrival — the default. */
  settle: cubicBezier(0.16, 1, 0.3, 1),
  /** Position swaps, the day/night pass. */
  swap: cubicBezier(0.65, 0, 0.35, 1),
  /** Instrument movement: slow start, hard stop. */
  instr: cubicBezier(0.4, 0, 0.1, 1),
  /** Scroll-linked work, where any curve fights the reader's own input. */
  linear: "linear",
} as const;

/**
 * Reveal travel distance, in pixels.
 *
 * 14px was genuinely below the threshold at which a reader notices
 * something arrived — the reveal read as "nothing is happening" rather
 * than as restraint. 30px is short of theatre but unambiguously
 * perceptible at normal scroll speed.
 */
export const RISE = 30;

/** Stagger between siblings. Perceptible as an order, gone inside 500ms. */
export const STAGGER = { tight: 40, normal: 70, loose: 110 } as const;
