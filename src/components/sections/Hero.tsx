"use client";

import { useEffect, useRef } from "react";
import { createTimeline, stagger, utils } from "animejs";
import { useLatticeChapter } from "@/components/lattice/useLatticeChapter";
import { POSES } from "@/components/lattice/state";
import { Magnetic } from "@/components/primitives/Magnetic";
import { LinkButton } from "@/components/primitives/Button";
import { useLenis } from "@/components/providers/LenisProvider";
import { useMotionPrefs } from "@/components/providers/MotionPrefsProvider";
import { DUR, EASE, STAGGER, onFrame } from "@/lib/motion";
import { site } from "@/data/site";
import { registry } from "@/data/registry";

/**
 * The first five seconds.
 *
 * In order, and the order is the whole design: name, what he is, what
 * he builds, then four actions. Nothing else. A visitor who reads only
 * this block and leaves should still be able to say who this is and
 * what he does, and a recruiter should reach GitHub or the résumé
 * without scrolling.
 *
 * THERE IS NO INTRO SEQUENCE. The previous build opened with a
 * full-screen boot overlay that held the page for about a second and a
 * half before any content was reachable. It was the most distinctive
 * thing on the site and it was also a gate in front of the content,
 * which is the wrong trade on a page whose audience is scanning. The
 * instrument character now lives in the readout below the actions,
 * which animates in place and delays nothing.
 *
 * The 3D is behind this, not inside it: one shared canvas mounted at
 * the page level. This section only says which formation it wants.
 */
export function Hero() {
  const chapterRef = useLatticeChapter<HTMLElement>("top", POSES.top);
  const { animate: allowed } = useMotionPrefs();
  const { scrollTo } = useLenis();
  const rootRef = useRef<HTMLDivElement>(null);
  /** When the arrival timeline began, so the scroll pass can wait. */
  const startedAt = useRef(0);

  /**
   * The one timeline that is not scroll-linked.
   *
   * The hero is already on screen at load, so linking it to scroll
   * would mean it never plays. It runs once, fast — the whole sequence
   * is under a second — and every element is in its final state in the
   * server output, so this only ever makes a page that already works
   * arrive more deliberately.
   */
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !allowed) return;

    const eyebrow = root.querySelector("[data-hero-eyebrow]");
    const words = Array.from(root.querySelectorAll<HTMLElement>("[data-hero-word]"));
    const role = root.querySelector("[data-hero-role]");
    const body = root.querySelector("[data-hero-body]");
    const actions = utils.$("[data-hero-action]");
    const rule = root.querySelector("[data-hero-rule]");
    const readouts = utils.$("[data-hero-readout]");

    const all = [eyebrow, role, body, rule, ...words, ...actions, ...readouts].filter(
      Boolean,
    ) as HTMLElement[];
    if (all.length === 0) return;

    utils.set(all, { opacity: 0 });
    // The name arrives word by word out of its own mask, which is the
    // one place on the site a per-part reveal is right: two words, no
    // delay worth measuring, and the mask edge is the same instrument
    // line the rest of the page sweeps with.
    utils.set(words, { translateY: "110%" });
    utils.set([eyebrow, role, body].filter(Boolean) as HTMLElement[], { translateY: 18 });
    utils.set(actions, { translateY: 14 });
    utils.set(readouts, { translateY: 8 });
    if (rule) utils.set(rule, { scaleX: 0 });

    let done = false;
    startedAt.current = performance.now();
    const tl = createTimeline({ defaults: { ease: EASE.settle } });

    if (eyebrow) tl.add(eyebrow, { opacity: 1, translateY: 0, duration: DUR.ui }, 0);
    if (words.length) {
      tl.add(
        words,
        {
          opacity: 1,
          translateY: "0%",
          duration: DUR.sweep,
          ease: EASE.instr,
          delay: stagger(90),
        },
        80,
      );
    }
    if (role) tl.add(role, { opacity: 1, translateY: 0, duration: DUR.ui }, 380);
    if (rule) {
      tl.add(
        rule,
        { opacity: 1, scaleX: 1, duration: DUR.sweep, ease: EASE.instr },
        420,
      );
    }
    if (body) tl.add(body, { opacity: 1, translateY: 0, duration: DUR.ui * 1.4 }, 480);
    if (actions.length) {
      tl.add(
        actions,
        { opacity: 1, translateY: 0, duration: DUR.ui, delay: stagger(STAGGER.tight) },
        620,
      );
    }
    if (readouts.length) {
      tl.add(
        readouts,
        { opacity: 1, translateY: 0, duration: DUR.ui, delay: stagger(STAGGER.tight) },
        740,
      );
    }
    tl.then(() => {
      done = true;
    });

    // Same failsafe as every other reveal on this site: if the timeline
    // has not finished by the time this fires, put the content back.
    const guard = window.setTimeout(() => {
      if (done) return;
      tl.revert();
      utils.set(all, { opacity: 1, translateY: 0, scaleX: 1 });
    }, 3000);

    return () => {
      window.clearTimeout(guard);
      tl.revert();
      utils.set(all, { opacity: 1, translateY: 0, scaleX: 1 });
    };
  }, [allowed]);

  /**
   * THE HERO LEAVES AT FOUR DIFFERENT RATES.
   *
   * The eyebrow goes first and fastest, the name drifts slowly, the
   * body follows, the readout barely moves. Four planes, and what the
   * reader perceives is depth rather than four animations: the page
   * is receding away from them rather than sliding under them.
   *
   * Driven from `frame.y` directly rather than from a tracked range,
   * because the hero is the top of the document and its position is
   * the scroll position — no measurement needed, and none taken. It
   * stops writing entirely once the hero is off screen.
   */
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !allowed) return;

    const planes: [HTMLElement | null, number, number][] = [
      [root.querySelector("[data-hero-eyebrow]"), 96, 2.1],
      [root.querySelector("[data-hero-role]"), 66, 1.3],
      [root.querySelector("[data-hero-body]"), 30, 1],
      [root.querySelector("[data-hero-readouts]"), 12, 0.8],
    ];

    let last = -1;
    let settled = false;

    return onFrame((frame) => {
      // The arrival timeline owns these elements for its first second.
      // Taking them over mid-tween would fight it.
      if (!settled) {
        if (frame.time < startedAt.current + DUR.ui * 4) return;
        settled = true;
      }

      const k = Math.min(1, frame.y / (frame.viewport * 0.85));
      if (Math.abs(k - last) < 0.002) return;
      const wasOff = last >= 1;
      last = k;
      if (k >= 1 && wasOff) return;

      for (const [el, travel, fade] of planes) {
        if (!el) continue;
        el.style.transform = `translate3d(0, ${(-k * travel).toFixed(1)}px, 0)`;
        el.style.opacity = Math.max(0, 1 - k * fade).toFixed(3);
      }
    });
  }, [allowed]);

  const readouts = [
    { k: "Systems", v: String(registry.scenes) },
    { k: "Readings", v: String(registry.readings) },
    { k: "Ground samples", v: String(registry.samples) },
    { k: "Languages", v: String(registry.languages) },
  ];

  return (
    <section
      ref={chapterRef}
      id="top"
      className="relative flex min-h-[92svh] items-center pt-[110px] pb-[clamp(3rem,8vw,7rem)]"
      aria-labelledby="hero-title"
    >
      <div ref={rootRef} data-column="" className="mx-auto w-full max-w-[var(--content-max)]">
        <p
          data-hero-eyebrow=""
          className="t-legend m-0 flex flex-wrap items-center gap-x-3 gap-y-1"
          style={{ color: "var(--mark)" }}
        >
          {site.concept}
          <span aria-hidden="true" style={{ color: "var(--line-strong)" }}>
            /
          </span>
          <span style={{ color: "var(--ink-lo)" }}>{site.location}</span>
          <span aria-hidden="true" style={{ color: "var(--line-strong)" }}>
            /
          </span>
          <span style={{ color: "var(--ink-lo)" }}>{site.availability}</span>
        </p>

        {/* One h1, and it is the name. Each word sits in its own mask
            so it can rise out of the line rather than fading in place;
            the text is still two ordinary words in one heading, so it
            is selected, copied and announced exactly as before. */}
        <h1
          id="hero-title"
          className="t-display mt-5 mb-0"
          style={{ color: "var(--ink-hi)" }}
        >
          {site.name.split(" ").map((word, i) => (
            <span key={word}>
              {i > 0 ? " " : null}
              <span
                className="inline-block overflow-hidden align-bottom"
                style={{ paddingBottom: "0.1em", marginBottom: "-0.1em" }}
              >
                <span data-hero-word="" className="inline-block">
                  {word}
                </span>
              </span>
            </span>
          ))}
        </h1>

        <p
          data-hero-role=""
          className="t-section mt-4 mb-0"
          style={{ color: "var(--ink-md)", fontVariationSettings: '"wdth" 112' }}
        >
          {site.role}
        </p>

        <span
          data-hero-rule=""
          aria-hidden="true"
          className="mt-7 block h-px w-full origin-left"
          style={{ background: "var(--line-strong)" }}
        />

        <p
          data-hero-body=""
          className="measure mt-7 mb-0 text-[clamp(1rem,1.8vw,1.18rem)] leading-[1.55]"
          style={{ color: "var(--ink-md)" }}
        >
          <span style={{ color: "var(--ink-hi)", fontWeight: 600 }}>{site.thesis}</span>{" "}
          {site.positioning}
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <span data-hero-action="">
            <Magnetic>
              <button
                type="button"
                onClick={() => scrollTo("#systems")}
                className="inline-flex cursor-pointer items-center gap-2 border px-[1.3rem] py-[0.78rem] font-[family-name:var(--font-display)] text-[0.84rem] font-semibold transition-colors"
                style={{
                  fontVariationSettings: '"wdth" 112',
                  background: "var(--mark)",
                  borderColor: "var(--mark)",
                  color: "var(--mark-on)",
                  transitionDuration: "var(--d-tick)",
                }}
              >
                View the systems
                <span aria-hidden="true">↓</span>
              </button>
            </Magnetic>
          </span>

          <span data-hero-action="">
            <Magnetic>
              <LinkButton href={site.github} rank="ghost">
                GitHub
              </LinkButton>
            </Magnetic>
          </span>

          <span data-hero-action="">
            <LinkButton href={site.resume} rank="ghost">
              Résumé
            </LinkButton>
          </span>

          <span data-hero-action="">
            <LinkButton href={`mailto:${site.email}`} rank="quiet">
              {site.email}
            </LinkButton>
          </span>
        </div>

        {/* The readout. Every figure is derived from the data layer, so
            it cannot drift from what the page actually contains. */}
        <dl
          data-hero-readouts=""
          className="mt-12 grid max-w-[46rem] grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4"
          style={{ borderTop: "1px solid var(--line)", paddingTop: "1.1rem" }}
        >
          {readouts.map((x) => (
            <div key={x.k} data-hero-readout="">
              <dt className="t-legend mb-1" style={{ color: "var(--ink-lo)" }}>
                {x.k}
              </dt>
              <dd
                className="t-mono m-0 text-[1.15rem] font-medium"
                style={{ color: "var(--ink-hi)" }}
              >
                {x.v}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
