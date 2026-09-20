"use client";

import { useEffect, useRef } from "react";
import { animate, utils, type JSAnimation } from "animejs";
import { onceInView, REVEAL_FROM, REVEAL_TO, revealVerb, type RevealVerb } from "@/lib/motion";
import { useMotionPrefs } from "@/components/providers/MotionPrefsProvider";

export type RevealVariant = RevealVerb;

export interface RevealOptions {
  /**
   * Which reveal verb. Six of them, and the choice carries meaning —
   * see the verb table in `lib/motion/verbs.ts`. Defaults to `up`,
   * which is the running-copy case.
   */
  variant?: RevealVerb;
  /** Animate descendants matching this selector instead of the element. */
  selector?: string;
  /** Stagger between those descendants, ms. */
  stagger?: number;
  delay?: number;
  /** How far up the viewport the element must come, 0..1. */
  reveal?: number;
}

/**
 * ENTER / REVEAL, once, when the element first crosses the threshold.
 *
 * THE RULE THIS OBEYS
 *
 * The server renders every element in its FINAL state. This hook is the
 * only thing that ever hides one, it does so after mount, and it only
 * does so when it is about to animate it back. A visitor with no
 * JavaScript, or with reduced motion on, gets the finished page — not a
 * page waiting for a callback that may never come.
 *
 * THE FAILSAFE
 *
 * Hiding content and relying on a scroll trigger to restore it is the
 * one genuinely dangerous pattern in a site like this: if the trigger
 * never fires, the section is blank forever and the page looks broken
 * rather than austere. So every reveal arms a timer, and if the
 * animation has not begun by the time it expires the hook puts the
 * content back itself and gives up on the effect. Losing an animation
 * is free. Losing a paragraph is not.
 *
 * WHAT THIS IS *NOT* FOR
 *
 * Arrival, and only arrival. The flagship case studies are driven by
 * continuous scroll progress through their own pinned range, not by a
 * threshold crossing — "element enters viewport, fade in" is exactly
 * the pattern the scroll rebuild was meant to move past. This hook
 * stays for the editorial sections, where a single well-judged
 * arrival is the right amount of motion and a scrubbed timeline would
 * be noise.
 */
export function useReveal<T extends HTMLElement>(options: RevealOptions = {}) {
  const {
    variant = "up",
    selector,
    stagger: step,
    delay = 0,
    reveal: threshold = 0.12,
  } = options;
  const ref = useRef<T>(null);
  const { animate: allowed } = useMotionPrefs();

  useEffect(() => {
    const el = ref.current;
    if (!el || !allowed) return;

    const targets: HTMLElement[] = selector
      ? Array.from(el.querySelectorAll<HTMLElement>(selector))
      : [el];
    if (targets.length === 0) return;

    utils.set(targets, REVEAL_FROM[variant]);

    let began = false;
    let animation: JSAnimation | null = null;

    const release = onceInView(
      el,
      () => {
        animation = animate(targets, {
          ...revealVerb(variant, delay, step),
          onBegin: () => {
            began = true;
          },
        });
      },
      { reveal: threshold },
    );

    // If nothing has started by now, the trigger is not going to
    // deliver. Put the content back rather than leaving a hole.
    const failsafe = window.setTimeout(() => {
      if (began) return;
      animation?.revert();
      utils.set(targets, REVEAL_TO[variant]);
    }, 2500);

    return () => {
      window.clearTimeout(failsafe);
      release();
      animation?.revert();
      utils.set(targets, REVEAL_TO[variant]);
    };
  }, [allowed, variant, selector, step, delay, threshold]);

  return ref;
}
