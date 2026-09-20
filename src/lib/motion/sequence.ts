/**
 * SEQUENCE — the elements inside one act, revealed in order, driven
 * by how far into that act the reader has come.
 *
 * The act machine decides *which* act is on screen. This decides what
 * happens inside it, and it is the difference between a panel that
 * fades in as a block and a scene that assembles: the title is
 * uncovered first, the lede follows, the status panels arrive after
 * that, the stack chips last. Nothing starts at the same moment as
 * anything else.
 *
 * IT IS A PURE FUNCTION OF PROGRESS, not a triggered animation. Scroll
 * back and the title re-covers itself, in step with the reader. There
 * is no playhead, no animation instance, no library: one number in,
 * one transform out.
 *
 * WHAT AN ELEMENT DECLARES
 *
 *   data-in="clip"      the verb — see the table below
 *   data-in-at="0.06"   when it starts, as a fraction of the act
 *
 * The verb carries meaning, the same way the reveal verbs do. A title
 * is *uncovered*, because a title is a line resolving. Metadata
 * *rises*, because it is a list. A call to action comes *out of
 * depth*, because it is the thing you are meant to reach for. Picking
 * by taste rather than by content is how a page ends up with fourteen
 * identical slide-ups.
 *
 * SPAN IS SET BY THE CALLER, AND IT SHRINKS WITH SCROLL SPEED. At
 * reading pace an element takes about a fifth of the act to arrive; on
 * a fast flick that compresses, so the text is legible almost at once
 * rather than trailing the reader down the page. That is the whole of
 * the velocity response — no extra state, no second easing curve.
 */

export type SequenceVerb = "clip" | "wipe" | "up" | "depth" | "rise";

export interface SequenceTarget {
  el: HTMLElement;
  verb: SequenceVerb;
  at: number;
  /** Last painted factor, so an unchanged element costs nothing. */
  last: number;
}

/** Smoothstep. Eases both ends without overshoot, which a scrubbed
 *  value must never do — an overshoot run backwards looks like a bug. */
function ease(k: number): number {
  if (k <= 0) return 0;
  if (k >= 1) return 1;
  return k * k * (3 - 2 * k);
}

export function collectSequence(root: HTMLElement): SequenceTarget[] {
  return Array.from(root.querySelectorAll<HTMLElement>("[data-in]")).map((el) => ({
    el,
    verb: (el.dataset.in as SequenceVerb) ?? "up",
    at: Number(el.dataset.inAt ?? 0),
    last: Number.NaN,
  }));
}

function write(t: SequenceTarget, k: number): void {
  const el = t.el;
  const inv = 1 - k;
  switch (t.verb) {
    /** A heading, uncovered left to right and arriving from the left
     *  as it goes. The displacement is small on purpose: it is there
     *  to make the mask edge read as a wipe rather than as a crop. */
    case "clip":
      el.style.clipPath = `inset(0 ${(inv * 100).toFixed(1)}% 0 0)`;
      el.style.transform = `translate3d(${(inv * -20).toFixed(1)}px, 0, 0)`;
      el.style.opacity = k < 0.02 ? "0" : "1";
      break;
    /** An eyebrow or a rule. Uncovered, and it does not move. */
    case "wipe":
      el.style.clipPath = `inset(0 ${(inv * 100).toFixed(1)}% 0 0)`;
      break;
    /** Running copy. */
    case "up":
      el.style.opacity = k.toFixed(3);
      el.style.transform = `translate3d(0, ${(inv * 22).toFixed(1)}px, 0)`;
      break;
    /** Something the reader is meant to reach for, brought forward
     *  out of the page rather than slid up the page. */
    case "depth":
      el.style.opacity = k.toFixed(3);
      el.style.transform = `translate3d(0, ${(inv * 26).toFixed(1)}px, 0) scale(${(0.955 + k * 0.045).toFixed(4)})`;
      break;
    /** Metadata. The shortest travel on the page. */
    case "rise":
    default:
      el.style.opacity = k.toFixed(3);
      el.style.transform = `translate3d(0, ${(inv * 12).toFixed(1)}px, 0)`;
      break;
  }
}

/**
 * Paint one act's sequence at `local` (0..1 through the act).
 *
 * `span` is how long each element takes to arrive, in the same units.
 * Elements outside their window are clamped, so this is safe to call
 * with any value including well past 1.
 */
export function paintSequence(targets: SequenceTarget[], local: number, span: number): void {
  const width = span > 0.02 ? span : 0.02;
  for (const t of targets) {
    const k = ease((local - t.at) / width);
    if (Math.abs(k - t.last) < 0.004) continue;
    t.last = k;
    write(t, k);
  }
}

/** Put everything back. Used on cleanup and for acts nobody is in. */
export function resetSequence(targets: SequenceTarget[], visible: boolean): void {
  for (const t of targets) {
    t.last = Number.NaN;
    if (visible) {
      t.el.style.clipPath = "";
      t.el.style.transform = "";
      t.el.style.opacity = "";
    } else {
      write(t, 0);
      t.last = 0;
    }
  }
}
