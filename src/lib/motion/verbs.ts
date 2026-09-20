import { stagger, type AnimationParams } from "animejs";
import { DUR, EASE, RISE } from "./tokens";

/**
 * ANIMATION VERBS — layer 2.
 *
 * A component picks a verb; it never writes a duration and never
 * writes an easing curve. The point is not brevity. It is that "how
 * does a thing arrive on this site" has a small number of answers,
 * they live in one file, and a new section cannot quietly invent
 * another one.
 *
 *   REVEAL     something already present is uncovered — six of these
 *   TRANSFORM  something present changes shape or value
 *   MORPH      one arrangement becomes another
 *
 * Everything that used to be here as ENTER, EXIT, PARALLAX, CAMERA and
 * HOVER has gone, and it is worth saying why rather than leaving a
 * gap. Those five were all the same shape — a small transform over a
 * token duration — and the components that used them now either pick a
 * REVEAL verb or write the transform directly from the scroll engine,
 * which is a frame ahead of anything a tween can be when it is
 * tracking the reader's own input. A verb that wraps two lines of
 * `style.transform` is indirection, not vocabulary.
 *
 * Every verb returns anime.js parameters rather than running anything,
 * so a caller composes them into a timeline instead of firing a dozen
 * unrelated animations at the same targets.
 */

/* ============================================================
   REVEAL VERBS — six of them, and choosing between them is the
   job.

   The complaint that produced these was precise: "random fade-ins,
   random slide-ups, generic scroll animations". The cure is not
   fewer reveals, it is reveals that carry information. A headline
   is uncovered because a headline is a line being resolved; a
   module path slides out of depth because it is a thing behind
   the surface being brought forward; a metric scales up because a
   figure resolving is a needle settling. Same tokens, different
   meaning — and the meaning is chosen from the content hierarchy,
   not by taste.

   Each verb is a triple: the state a target is put into before it
   plays, the state to restore if it never does, and the tween.
   They are declared together so they cannot disagree, which is the
   bug that leaves a paragraph permanently invisible.
   ============================================================ */

export type RevealVerb = "up" | "clip" | "fade" | "depth" | "scale" | "split";

/** The state the hook sets before the reveal runs. */
export const REVEAL_FROM: Record<RevealVerb, Record<string, string | number>> = {
  /** Supporting copy, list items, anything in running order. */
  up: { opacity: 0, translateY: RISE },
  /** A headline, uncovered left to right like a scan line. */
  clip: { clipPath: "inset(0 100% 0 0)" },
  /** Legends and captions — present, and not worth moving. */
  fade: { opacity: 0 },
  /** Architecture labels and module paths: forward out of the page. */
  depth: { opacity: 0, translateY: RISE * 1.5, scale: 0.955 },
  /** A measured figure resolving. */
  scale: { opacity: 0, scale: 0.9 },
  /** A rule or a band opening from its own centre. */
  split: { clipPath: "inset(0 50% 0 50%)" },
};

/** The state the hook restores if the reveal never runs. */
export const REVEAL_TO: Record<RevealVerb, Record<string, string | number>> = {
  up: { opacity: 1, translateY: 0 },
  clip: { clipPath: "inset(0 0% 0 0)" },
  fade: { opacity: 1 },
  depth: { opacity: 1, translateY: 0, scale: 1 },
  scale: { opacity: 1, scale: 1 },
  split: { clipPath: "inset(0 0% 0 0)" },
};

/**
 * The tween for a verb.
 *
 * `step` staggers siblings when the hook was given a selector. The
 * durations differ by verb on purpose: a clip sweep is an instrument
 * resolving a line and wants the long instrument curve; a fade wants
 * to be over before it is noticed.
 *
 * DELIBERATELY NOT A PER-CHARACTER STAGGER, anywhere. Letters arriving
 * one at a time is the most common premium-portfolio tell, it delays
 * the reader getting the sentence, and it has nothing to do with
 * measurement. `clip` keeps the text as one DOM node, so it stays
 * selectable, copyable and read as a single sentence.
 */
export function revealVerb(verb: RevealVerb, delay = 0, step?: number): AnimationParams {
  const delayValue = step === undefined ? delay : stagger(step, { start: delay });

  switch (verb) {
    case "clip":
      return {
        clipPath: ["inset(0 100% 0 0)", "inset(0 0% 0 0)"],
        duration: DUR.sweep,
        ease: EASE.instr,
        delay: delayValue,
      };
    case "split":
      return {
        clipPath: ["inset(0 50% 0 50%)", "inset(0 0% 0 0)"],
        duration: DUR.sweep,
        ease: EASE.instr,
        delay: delayValue,
      };
    case "fade":
      return { opacity: [0, 1], duration: DUR.ui * 1.4, ease: EASE.settle, delay: delayValue };
    case "depth":
      return {
        opacity: [0, 1],
        translateY: [RISE * 1.5, 0],
        scale: [0.955, 1],
        duration: DUR.ui * 2.1,
        ease: EASE.settle,
        delay: delayValue,
      };
    case "scale":
      return {
        opacity: [0, 1],
        scale: [0.9, 1],
        duration: DUR.measure,
        ease: EASE.settle,
        delay: delayValue,
      };
    case "up":
    default:
      return {
        opacity: [0, 1],
        translateY: [RISE, 0],
        duration: DUR.ui * 1.9,
        ease: EASE.settle,
        delay: delayValue,
      };
  }
}

/** TRANSFORM — a figure resolving to its measured value. */
export function measure(): AnimationParams {
  return { duration: DUR.measure, ease: "outCubic" };
}

/**
 * MORPH — one arrangement becoming another.
 *
 * Used only by the lattice, on the scalar that blends two formations.
 * Slow, because a reorganisation the reader cannot follow is a cut.
 */
export function morph(): AnimationParams {
  return { duration: DUR.morph, ease: EASE.swap };
}
