"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { animate } from "animejs";
import {
  DUR,
  EASE,
  actLocal,
  collectSequence,
  linkRange,
  onFrame,
  paintSequence,
  planActs,
  rangeToScrollY,
  remeasure,
  resetSequence,
  resolveAct,
  watchRect,
} from "@/lib/motion";
import { useLattice } from "@/components/lattice/LatticeDirector";
import { useLatticeChapter } from "@/components/lattice/useLatticeChapter";
import { scenePose } from "@/components/lattice/scenePose";
import { buildActTimeline, SCRUB, stepToGroup } from "@/components/lattice/sceneShots";
import { useMotionPrefs } from "@/components/providers/MotionPrefsProvider";
import { useLenis } from "@/components/providers/LenisProvider";
import { Legend } from "@/components/primitives/Legend";
import { Stagger } from "@/components/primitives/Stagger";
import { DecisionRecordItem } from "./DecisionRecordItem";
import { ActBody, systemRungs } from "./SceneActs";
import { scenes } from "@/data/scenes";
import type { Scene } from "@/data/types";

/**
 * ONE CASE STUDY, AS A PINNED JOURNEY.
 *
 *   browser scroll
 *     → the scroll engine's `pin` range for this section
 *       → one number, 0..1
 *         ├─ the act machine   → which paragraph is on screen
 *         ├─ the act timeline  → where the camera is
 *         ├─ the step cursor   → which node band is lit
 *         └─ the readout       → "04 / 07 · Architecture"
 *
 * There is ONE number and there are no second clocks. That is the
 * whole answer to "the 3D reacts but the DOM does not feel connected
 * to the scroll": they are not two systems being kept in sync, they
 * are two consumers of the same scalar.
 *
 * THE SCROLL IS NOT HIJACKED.
 *
 * This is a tall section with a `position: sticky` child. The wheel,
 * the trackpad, the scrollbar, Page Down, Home, End, a screen reader's
 * virtual cursor and a touch flick all behave exactly as they do
 * anywhere else, because nothing here calls `preventDefault` and
 * nothing snaps. The section is simply long, and what it shows depends
 * on how far into it you are. The one place scroll position is written
 * is when keyboard focus lands in an act that is not on screen, and
 * that is a correction, not a lock.
 *
 * WHY AN OFF-SCREEN ACT IS TRANSPARENT AND NOT HIDDEN.
 *
 * `visibility: hidden` and `display: none` both remove content from
 * the accessibility tree, and an act removed from the accessibility
 * tree cannot be reached by a virtual cursor at all — a screen-reader
 * user would get the first act of each case study and nothing else.
 * So an act that is not on screen is `opacity: 0` and nothing more.
 * Everything stays in the tree, a screen reader reads the whole case
 * study in order, and the focus handler at the bottom of this file
 * keeps the visible page in step when the cursor moves.
 *
 * THE PINNED LAYOUT IS A CSS DECISION, NOT A REACT ONE.
 *
 * `html[data-motion="on"]` is set by a four-line script in the
 * document head, before the first paint, when the reader has not
 * asked for reduced motion. Everything below — the tall track, the
 * sticky frame, the stacked act panels — hangs off that one
 * attribute.
 *
 * It matters that React is not involved. The first version of this
 * flipped a `mode` state after hydration and rendered a different
 * component tree per mode; that rebuilt and re-laid-out every case
 * study on the page one frame after it had already built them, and it
 * cost 1.9 seconds of total blocking time and 5.2 seconds of style
 * and layout under Lighthouse's throttling. Deciding in CSS before
 * the first paint costs nothing, and it also means the layout is
 * correct with JavaScript disabled entirely: no attribute, no pin,
 * and the case study is an ordinary document.
 *
 * INSIDE AN ACT, NOTHING STARTS AT THE SAME MOMENT.
 *
 * The act machine says which act is on screen. `lib/motion/sequence`
 * says what happens inside it: the eyebrow is uncovered, the name is
 * uncovered behind it, the one-liner follows, the metadata rises
 * last. Each element declares `data-in` and `data-in-at`, and this
 * file turns act progress into their transforms — a pure function of
 * the scroll position, so scrolling back re-covers the title in step
 * with the reader.
 *
 * How long each element takes SHRINKS WITH SCROLL SPEED. At reading
 * pace an element takes a fifth of the act to arrive; on a flick that
 * compresses to well under a tenth, so the text has caught up by the
 * time the reader stops rather than trailing them down the page. That
 * is the whole velocity response, and it costs one multiply.
 *
 * THE FIRST ACT DOES NOT WAIT FOR THE PIN.
 *
 * Pin progress is clamped to 0 until the section reaches the top of
 * the viewport, so a project header driven by it alone would sit
 * blank for a whole screen while the section rises into view. The
 * opening act is driven by the section ENTERING instead, and the two
 * meet exactly where the pin begins.
 *
 * THE HANDOVER.
 *
 * When the reader crosses from one system into the next, the outgoing
 * scene's camera is wherever its resolution act left it and the
 * incoming scene's timeline starts at its own intro. Seeking straight
 * there is a cut. So the incoming stage snapshots the rig at the
 * moment it takes over and blends out of it across one PASS — which
 * is also exactly how long the formation morph takes, so the camera
 * settles into the new system while the lattice is still becoming it.
 * You move from one system into another rather than watching one fade
 * into the other.
 */

/** How far outside its own span an act extends while entering or leaving. */
const PAD = 0.06;
const IN_END = 0.12;
const OUT_START = 0.88;
/** Travel of an act panel as it enters and leaves, in pixels. */
const ACT_RISE = 26;
/** How long one element takes to arrive, as a fraction of its act. */
const SEQ_SPAN = 0.2;
/** How much of that a full-speed flick removes. */
const SEQ_RUSH = 0.13;
/**
 * Where in the section's approach the opening act starts arriving.
 * 0.45 is the section top at roughly mid-viewport; 1 is the pin.
 */
const ENTRY_FROM = 0.45;

const RIG = [
  "camX",
  "camY",
  "camZ",
  "lookX",
  "lookY",
  "spin",
  "nodeScale",
  "edgeOpacity",
  "presence",
  "corridor",
  "flow",
  "glow",
  "boundary",
] as const;

export function SceneStage({ scene }: { scene: Scene }) {
  const chapterId = `scene-${scene.slug}`;
  const plan = useMemo(() => planActs(scene), [scene]);
  const pose = useMemo(() => scenePose(scene), [scene]);

  const { state: lattice, activeId } = useLattice();
  const { depth } = useMotionPrefs();
  const { getLenis } = useLenis();

  const registerChapter = useLatticeChapter<HTMLElement>(chapterId, pose);
  const sectionRef = useRef<HTMLElement | null>(null);
  const setSection = useCallback(
    (el: HTMLElement | null) => {
      sectionRef.current = el;
      registerChapter(el);
    },
    [registerChapter],
  );

  const colRef = useRef<HTMLDivElement>(null);
  const actsRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const hudLabelRef = useRef<HTMLSpanElement>(null);
  const hudPctRef = useRef<HTMLSpanElement>(null);

  /** Whether this scene currently owns the lattice. */
  const activeRef = useRef(false);
  /** Blend weight for the handover from the previous scene, 1 → 0. */
  const hand = useRef({ v: 0 });
  const snap = useRef<Record<string, number>>({});

  /** Take the handover snapshot at the instant this scene takes over. */
  useEffect(() => {
    const isActive = activeId === chapterId;
    if (isActive && !activeRef.current && depth) {
      for (const k of RIG) snap.current[k] = lattice[k];
      hand.current.v = 1;
      animate(hand.current, { v: 0, duration: DUR.pass, ease: EASE.swap });
    }
    activeRef.current = isActive;
  }, [activeId, chapterId, depth, lattice]);

  /* ---------------- the one subscription ---------------- */

  useEffect(() => {
    const section = sectionRef.current;
    const actsRoot = actsRef.current;
    if (!section || !actsRoot || !depth) return;
    remeasure();

    const acts = plan.acts;
    const actEls = Array.from(actsRoot.querySelectorAll<HTMLElement>("[data-act]"));
    const items = actEls.map((el) => Array.from(el.querySelectorAll<HTMLElement>("[data-item]")));
    const slots = actEls.map((el) => Array.from(el.querySelectorAll<HTMLElement>("[data-slot]")));
    const seqs = actEls.map((el) => collectSequence(el));
    const timeline = buildActTimeline(lattice, scene, plan);
    const column = colRef.current ? watchRect(colRef.current) : null;
    const bar = barRef.current;
    const label = labelRef.current;
    const count = countRef.current;
    const hudLabel = hudLabelRef.current;
    const hudPct = hudPctRef.current;
    const formation = scene.signature.formation;

    let p = 0;
    /** The section's approach, 0..1, used only by the opening act. */
    let entry = 0;
    let velocity = 0;
    let painted = Number.NaN;
    let lastAct = -1;
    let lastStep = -1;
    let lastPct = -1;
    // Starts false because the next few lines put every act into
     // exactly that state, so the first frame has nothing to undo.
    const visible = actEls.map(() => false);
    const clickable = actEls.map(() => false);

    /**
     * THE STARTING STATE, WRITTEN BEFORE THE FIRST LAYOUT.
     *
     * Everything marked `data-in` has to start hidden or the first
     * sight of an act is the finished article. This writes that state
     * inline, here, in the effect — and WHERE it is written turns out
     * to matter far more than what it writes.
     *
     * Two alternatives were built and measured against this one, both
     * of which deferred the inline writes to the first animation
     * frame: one primed only the opening act, the other put the
     * starting state in CSS behind a `data-seq` attribute. Both cost
     * the same thing and both were four times worse — total blocking
     * time 4.3s against 1.1s, Style & Layout 6.2s against 3.1s,
     * reproducibly, across seven runs each.
     *
     * The reason is that a style write before the first layout is
     * free, and the same write after it invalidates forty-two act
     * subtrees and buys a second full layout pass. Doing it here also
     * makes the first frame free: the values it would write are
     * already there, and a style set to the value it already has is
     * not an invalidation.
     *
     * Initial state belongs before the first layout. Always.
     */
    for (const seq of seqs) resetSequence(seq, false);

    /**
     * Paint the acts.
     *
     * At most three panels are touched: the one leaving, the one
     * arriving, and the one holding. Everything else was hidden on a
     * previous frame and is skipped by the `visible` flags, so a
     * seven-act case study costs three transform writes per frame and
     * not seven.
     */
    const paint = () => {
      for (let i = 0; i < actEls.length; i++) {
        const el = actEls[i];
        const a = acts[i];
        if (!el || !a) continue;

        const rel = actLocal(p, a);
        if (rel <= -PAD || rel >= 1 + PAD) {
          if (visible[i]) {
            visible[i] = false;
            el.style.opacity = "0";
            el.style.pointerEvents = "none";
            clickable[i] = false;
            const gone = seqs[i];
            // Put its contents back to the start, so re-entering the
            // act plays the sequence again rather than showing it
            // already finished.
            if (gone) resetSequence(gone, false);
            // `will-change` is set and cleared rather than declared in
            // CSS. Six scenes times seven acts is forty-two elements,
            // and forty-two permanent compositing layers costs more
            // GPU memory than the three that are ever moving save in
            // paint time.
            el.style.willChange = "";
          }
          continue;
        }

        // THE FIRST AND LAST ACTS DO NOT FADE AT THEIR OUTER EDGE.
        //
        // Progress is clamped to [0, 1] by the range, so while the
        // section is still rising into the viewport it sits at exactly
        // 0 and while it is leaving it sits at exactly 1. An opening
        // act that crossfades against that clamp is stuck a third
        // visible for a whole screen of scrolling, which reads as a
        // section that failed to load rather than as one arriving.
        const isFirst = i === 0;
        const isLast = i === actEls.length - 1;

        let k: number;
        if (rel < IN_END) k = isFirst ? 1 : (rel + PAD) / (IN_END + PAD);
        else if (rel > OUT_START) k = isLast ? 1 : 1 - (rel - OUT_START) / (1 + PAD - OUT_START);
        else k = 1;
        if (k < 0) k = 0;
        else if (k > 1) k = 1;

        // Enters from below and leaves upward, plus a slow drift while
        // it is held — the reader's own scroll keeps moving the text a
        // little even during the part of the act where nothing changes.
        const held = rel < 0 ? 0 : rel > 1 ? 1 : rel;
        const rise = (1 - k) * ACT_RISE * (rel < 0.5 ? 1 : -1) + (0.5 - held) * 9;

        if (!visible[i]) {
          visible[i] = true;
          el.style.willChange = "transform, opacity";
        }
        el.style.opacity = k.toFixed(3);
        el.style.transform = `translate3d(0, ${rise.toFixed(2)}px, 0) scale(${(0.99 + k * 0.01).toFixed(4)})`;

        // Two panels overlap for a few viewport-percent during the
        // handover. The one on its way out must not keep taking
        // clicks, so pointer events follow whichever is more than
        // half opaque — written only when the answer changes.
        const hit = k > 0.5;
        if (clickable[i] !== hit) {
          clickable[i] = hit;
          el.style.pointerEvents = hit ? "auto" : "none";
        }

        // What is happening INSIDE this act. Only panels that are on
        // screen are sequenced; the rest were reset to their starting
        // state and are not touched again until they come back.
        const seq = seqs[i];
        if (seq && seq.length) {
          const local =
            i === 0
              ? Math.max(rel, (entry - ENTRY_FROM) / (1 - ENTRY_FROM))
              : rel;
          paintSequence(seq, local, SEQ_SPAN - SEQ_RUSH * velocity);
        }
      }

      if (bar) bar.style.transform = `scaleX(${p.toFixed(4)})`;

      const pct = Math.round(p * 100);
      if (hudPct && pct !== lastPct) {
        lastPct = pct;
        hudPct.textContent = `${String(pct).padStart(2, "0")}%`;
      }

      const cursor = resolveAct(plan, p);

      if (cursor.index !== lastAct) {
        // Clear the act we left, so its items do not stay marked.
        const prev = items[lastAct];
        if (prev) for (const el of prev) el.removeAttribute("data-state");
        const prevSlots = slots[lastAct];
        if (prevSlots) for (const el of prevSlots) el.removeAttribute("data-state");

        lastAct = cursor.index;
        lastStep = -1;
        if (label) {
          label.textContent = cursor.act.label;
          animate(label, { opacity: [0, 1], translateY: [6, 0], duration: DUR.ui, ease: EASE.settle });
        }
        if (count) {
          count.textContent = `${String(cursor.index + 1).padStart(2, "0")} / ${String(acts.length).padStart(2, "0")}`;
        }
      }

      if (cursor.step !== lastStep) {
        lastStep = cursor.step;
        // The instrument reading: which part of the system the walk
        // is on. Blank outside the acts that walk one, because a
        // readout that shows a stale value is worse than an empty
        // one.
        if (hudLabel) {
          const walking = cursor.act.id === "system" || cursor.act.id === "architecture";
          const rung = items[cursor.index]?.[cursor.step];
          hudLabel.textContent = walking
            ? (rung?.querySelector<HTMLElement>(".act-rung-label")?.textContent ?? "")
            : "";
        }
        const group = items[cursor.index];
        if (group) {
          for (let j = 0; j < group.length; j++) {
            const el = group[j];
            if (!el) continue;
            el.dataset.state = j < cursor.step ? "past" : j === cursor.step ? "current" : "future";
          }
        }
        const slotGroup = slots[cursor.index];
        if (slotGroup) {
          for (let j = 0; j < slotGroup.length; j++) {
            const el = slotGroup[j];
            if (!el) continue;
            if (j === cursor.step) el.dataset.state = "current";
            else el.removeAttribute("data-state");
          }
        }
      }
    };

    const release = linkRange(section, "pin", (next) => {
      p = next;
    });

    // The approach. Only the opening act reads it, and only so the
    // project header is already assembling while the section rises
    // into the frame rather than snapping on at the pin.
    const releaseEntry = linkRange(section, "enter", (next) => {
      entry = next;
    });

    const releaseFrame = onFrame((frame) => {
      velocity = frame.velocity;
      // `entry` and the velocity-scaled span both move without `p`
      // moving, so the paint gate is not `p` alone.
      if (p !== painted || (entry > 0 && entry < 1) || velocity > 0.01) {
        painted = p;
        paint();
      }

      if (!activeRef.current) return;

      // THE CAMERA. One seek, and anime does the interpolation, the
      // easing and the ordering across every act boundary.
      timeline.seek(p * SCRUB);

      const h = hand.current.v;
      if (h > 0.001) {
        for (const key of RIG) {
          const to = snap.current[key];
          if (to === undefined) continue;
          lattice[key] = lattice[key] + (to - lattice[key]) * h;
        }
      }

      lattice.chapterProgress = p;

      // The stage walk lights the matching band of the lattice. The
      // DOM highlight and the 3D highlight are the same index; they
      // cannot disagree because there is only one of them.
      const cursor = resolveAct(plan, p);
      if (cursor.act.id === "system" || cursor.act.id === "architecture") {
        lattice.focusGroup = stepToGroup(cursor.step, cursor.act.steps, formation);
      } else if (lattice.focusGroup !== -1) {
        lattice.focusGroup = -1;
      }

      // The corridor follows the narrative column while this scene owns
      // the viewport: it is narrower and hard left here, so the lattice
      // should thin in a different band than it does under the
      // editorial sections.
      if (p > 0 && p < 1) {
        lattice.corridorOwner = scene.slug;
        if (column) {
          const w = window.innerWidth || 1;
          const left = (column.rect.left / w) * 2 - 1;
          const right = (column.rect.right / w) * 2 - 1;
          lattice.corridorCentre = (left + right) / 2;
          lattice.corridorHalf = Math.min(1.1, Math.abs(right - left) / 2 + 0.08);
        }
      } else if (lattice.corridorOwner === scene.slug) {
        lattice.corridorOwner = null;
      }
    });

    /**
     * Keyboard focus is allowed to move the page.
     *
     * Tabbing forward out of the last link in the current act lands in
     * an act that is off screen. Marking those `inert` would stop the
     * focus ring escaping but would also make every link in every
     * later act unreachable by keyboard, which is worse than the
     * problem. Instead the page follows the focus: land in an act and
     * the scroll position jumps to it, so the act is on screen by the
     * time the focus ring is painted.
     */
    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      const actEl = target?.closest<HTMLElement>("[data-act]");
      if (!actEl) return;
      const i = actEls.indexOf(actEl);
      const a = acts[i];
      if (!a || (p >= a.from && p <= a.to)) return;
      const y = rangeToScrollY(section, "pin", (a.from + a.to) / 2);
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
      else window.scrollTo(0, y);
    };
    section.addEventListener("focusin", onFocusIn);

    /**
     * THE FAILSAFE, same rule as every reveal on this site.
     *
     * Setup hides the contents of every act so the sequence can play.
     * If no frame has painted by the time this fires, the engine is
     * not going to deliver and the case study would sit blank. Losing
     * the choreography is free; losing the text is not.
     */
    const failsafe = window.setTimeout(() => {
      if (!Number.isNaN(painted)) return;
      for (const seq of seqs) resetSequence(seq, true);
      for (const el of actEls) el.style.opacity = "";
    }, 2500);

    return () => {
      window.clearTimeout(failsafe);
      section.removeEventListener("focusin", onFocusIn);
      release();
      releaseEntry();
      releaseFrame();
      column?.release();
      timeline.revert();
      if (lattice.corridorOwner === scene.slug) lattice.corridorOwner = null;
      for (const el of actEls) {
        el.style.opacity = "";
        el.style.transform = "";
        el.style.pointerEvents = "";
        el.style.willChange = "";
      }
      for (const group of items) for (const el of group) el.removeAttribute("data-state");
      for (const group of slots) for (const el of group) el.removeAttribute("data-state");
      for (const seq of seqs) resetSequence(seq, true);
    };
  }, [depth, plan, scene, lattice, getLenis]);

  /* ---------------- markup ---------------- */

  const index = scenes.findIndex((s) => s.slug === scene.slug);
  const prev = index > 0 ? scenes[index - 1] : undefined;
  const next = index < scenes.length - 1 ? scenes[index + 1] : undefined;
  const rungCount = systemRungs(scene).length;

  return (
    <>
      <section
        ref={setSection}
        id={chapterId}
        data-scene-track=""
        data-tier={scene.tier}
        className="scene-track"
        style={{ ["--beats" as string]: plan.beats }}
        aria-labelledby={`${chapterId}-title`}
      >
        <div className="scene-pin">
          <div ref={colRef} data-column="" className="scene-col">
            {/* Chrome. Everything in here is repeated by the acts
                themselves, so it is hidden from assistive technology
                rather than read twice. */}
            <header className="scene-head" aria-hidden="true">
              <span className="scene-head-row">
                <span className="t-mono scene-number">
                  {String(scene.sceneNumber).padStart(2, "0")}
                </span>
                <span className="scene-name">{scene.name}</span>
                <span className="scene-readout">
                  <span ref={labelRef} className="t-legend scene-act-label">
                    {plan.acts[0]?.label}
                  </span>
                  <span ref={countRef} className="t-mono scene-act-count">
                    01 / {String(plan.acts.length).padStart(2, "0")}
                  </span>
                </span>
              </span>
              <span className="scene-bar">
                <span ref={barRef} className="scene-bar-fill" />
              </span>

              {/* Instrumentation, not a dashboard: what part of the
                  system the walk is on, and how far through the case
                  study you are. Both come from the same scalar as
                  everything else, and both go blank rather than stale. */}
              <span className="scene-hud">
                <span ref={hudLabelRef} className="t-legend scene-hud-label" />
                <span ref={hudPctRef} className="t-mono scene-hud-pct">
                  00%
                </span>
              </span>
            </header>

            <div ref={actsRef} className="scene-acts">
              {plan.acts.map((a) => (
                <article key={a.id} data-act={a.id} className="scene-act">
                  <ActBody id={a.id} scene={scene} />
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---- end matter ----

          What does not belong in a cinematic frame but must not be
          lost: the decision records, with the rejected options kept.
          They sit in ordinary flow after the pin releases, which is
          also the beat that says this system is finished before the
          next one begins. */}
      <div className="scene-record">
        <div data-column="" className="mx-auto max-w-[var(--content-max)]">
          <div className="scene-record-inner">
            {scene.decisions.length > 0 ? (
              <>
                <Legend className="mb-4 block">
                  Decisions · {scene.decisions.length} recorded, rejected options kept
                </Legend>
                <Stagger className="flex flex-col gap-2">
                  {scene.decisions.map((d) => (
                    <div key={d.id} data-cell="">
                      <DecisionRecordItem record={d} />
                    </div>
                  ))}
                </Stagger>
              </>
            ) : null}

            <nav className="scene-jump" aria-label={`After ${scene.name}`}>
              <span className="t-legend" style={{ color: "var(--ink-lo)" }}>
                {String(scene.sceneNumber).padStart(2, "0")} · {scene.name} · complete ·{" "}
                {rungCount} stages
              </span>
              <span className="scene-jump-links">
                {prev ? <SceneJump slug={prev.slug} name={prev.name} dir="back" /> : null}
                {next ? <SceneJump slug={next.slug} name={next.name} dir="on" /> : null}
              </span>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}

function SceneJump({ slug, name, dir }: { slug: string; name: string; dir: "back" | "on" }) {
  const { scrollTo } = useLenis();
  return (
    <button
      type="button"
      onClick={() => scrollTo(`#scene-${slug}`)}
      className="t-legend rule-in scene-jump-link"
    >
      {dir === "back" ? <span aria-hidden="true">← </span> : null}
      {name}
      {dir === "on" ? <span aria-hidden="true"> →</span> : null}
      <span className="sr-only">{dir === "back" ? "Previous system" : "Next system"}</span>
    </button>
  );
}
