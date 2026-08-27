/**
 * The five motion verbs (Phase 2 §07).
 * A component imports a verb; it never writes a duration.
 * Seconds, to match Motion's convention. The CSS mirror of these lives
 * in globals.css as --d-* / --e-* and is what reduced-motion zeroes.
 */

export const EASE = {
  /** decisive arrival — the default */
  settle: [0.16, 1, 0.3, 1],
  /** position swaps, day/night pass */
  swap: [0.65, 0, 0.35, 1],
  /** instrument movement: slow start, hard stop */
  instr: [0.4, 0, 0.1, 1],
} as const;

export const DUR = {
  /** micro-feedback: hover, focus, toggle. below the animation threshold. */
  tick: 0.1,
  /** standard UI arrival: panels, cards, popovers */
  ui: 0.34,
  /** a value resolving — the count-up */
  measure: 0.62,
  /** an interval narrowing, a diagram drawing, the rail filling */
  sweep: 0.85,
  /** scene transitions and the terminator. used ~6 times on the site. */
  pass: 1.1,
} as const;

/**
 * Reveal travel distance.
 *
 * The first pass used 14px, which is genuinely below the threshold at
 * which a reader notices something arrived — the reveal read as "nothing
 * is happening" rather than as restraint. 30px is still short of theatre
 * but is unambiguously perceptible at normal scroll speed.
 */
export const RISE = 30;

/** MEASURE — a figure settling into place. */
export const MEASURE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: DUR.measure, ease: EASE.instr },
} as const;

/** SETTLE — standard content entry: a rise, no bounce. */
export const SETTLE = {
  initial: { opacity: 0, y: RISE },
  animate: { opacity: 1, y: 0 },
  transition: { duration: DUR.ui * 1.9, ease: EASE.settle },
} as const;

/** SWEEP — reveal by clip, left to right, like a scan line. */
export const SWEEP = {
  initial: { clipPath: "inset(0 100% 0 0)" },
  animate: { clipPath: "inset(0 0% 0 0)" },
  transition: { duration: DUR.sweep, ease: EASE.instr },
} as const;

/** PASS — the heavy transition. Scenes only. */
export const PASS = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: DUR.pass, ease: EASE.swap },
} as const;

/** Stagger container for lists of readings or stations. */
export const STAGGER = {
  animate: { transition: { staggerChildren: 0.09 } },
} as const;
