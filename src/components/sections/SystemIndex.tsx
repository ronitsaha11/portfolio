"use client";

import { Chapter } from "@/components/layout/Chapter";
import { Stagger } from "@/components/primitives/Stagger";
import { Legend } from "@/components/primitives/Legend";
import { Tilt } from "@/components/primitives/Tilt";
import { useLenis } from "@/components/providers/LenisProvider";
import { flagshipScenes, supportingScenes } from "@/data/scenes";
import { STAGGER } from "@/lib/motion";
import type { Scene } from "@/data/types";

/**
 * The index.
 *
 * TWO TIERS, AND THE DIFFERENCE IS COMPOSITION, NOT A BADGE. The three
 * flagships get a full-width row each, the project name at display
 * size, the status line and four readings; the three supporting
 * projects share a compact grid below a rule. Nothing is labelled
 * "best", nothing is ranked, and no number was invented to justify the
 * ordering — the split is simply which systems have an architecture
 * worth several screens and which do not.
 *
 * Every card is one hit target. A three-pixel text link inside a
 * hundred-pixel row is a hit-area failure, and the heading is still a
 * real button inside it for anyone navigating by heading.
 */

function statusTone(scene: Scene) {
  return scene.confidence === "attributed"
    ? { fg: "var(--attributed)", bg: "var(--attributed-bg)" }
    : { fg: "var(--measured)", bg: "var(--measured-bg)" };
}

function FlagshipRow({ scene }: { scene: Scene }) {
  const { scrollTo } = useLenis();
  const tone = statusTone(scene);

  return (
    <article
      data-cell=""
      onClick={() => scrollTo(`#scene-${scene.slug}`)}
      className="group relative grid cursor-pointer grid-cols-1 gap-x-10 gap-y-5 py-8 transition-transform duration-[var(--d-ui)] ease-[var(--e-settle)] md:grid-cols-[1fr_auto] md:items-start md:hover:translate-x-2"
      style={{ borderTop: "1px solid var(--line)" }}
    >
      {/* The rule draws itself across the row on hover — the same
          left-to-right sweep the reveals use, so a pointer arriving at
          a project reads as the same gesture as the page arriving. */}
      <span
        aria-hidden="true"
        className="absolute top-[-1px] left-0 h-px w-full origin-left scale-x-0 transition-transform duration-[var(--d-sweep)] ease-[var(--e-instr)] group-hover:scale-x-100"
        style={{ background: "var(--mark)" }}
      />

      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="t-mono text-[0.8rem] font-medium" style={{ color: "var(--mark)" }}>
            {String(scene.sceneNumber).padStart(2, "0")}
          </span>
          <Legend>{scene.category}</Legend>
          <Legend>{scene.year}</Legend>
        </div>

        <h3 className="m-0 mt-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              scrollTo(`#scene-${scene.slug}`);
            }}
            className="cursor-pointer border-0 bg-transparent p-0 text-left"
          >
            <span
              className="t-scene transition-colors group-hover:text-[var(--mark)]"
              style={{ color: "var(--ink-hi)", transitionDuration: "var(--d-tick)" }}
            >
              {scene.name}
            </span>
          </button>
        </h3>

        <p
          className="mt-3 mb-0 max-w-[62ch] text-[1rem] leading-[1.5]"
          style={{ color: "var(--ink-md)" }}
        >
          {scene.oneLiner}
        </p>

        <p
          className="t-mono mt-4 mb-0 max-w-[68ch] text-[0.76rem] leading-relaxed"
          style={{ color: "var(--ink-lo)" }}
        >
          <span
            className="mr-2 px-[0.4rem] py-[0.1rem]"
            style={{ color: tone.fg, background: tone.bg }}
          >
            STATUS
          </span>
          {scene.status}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-[0.32rem]">
          {scene.stack.slice(0, 6).map((t) => (
            <span
              key={t}
              className="t-mono px-[0.38rem] py-[0.12rem] text-[0.66rem]"
              style={{ color: "var(--ink-lo)", border: "1px solid var(--line)" }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* The readings, right-aligned on wide viewports so the eye lands
          on the figures without them competing with the headline. */}
      <dl className="grid shrink-0 grid-cols-2 gap-x-7 gap-y-4 md:w-[19rem]">
        {scene.readings.slice(0, 4).map((r) => (
          <div key={r.id}>
            <dt className="t-legend mb-[0.15rem]" style={{ color: "var(--ink-lo)" }}>
              {r.label}
            </dt>
            <dd
              className="t-mono m-0 text-[1.05rem] font-medium"
              style={{ color: "var(--ink-hi)" }}
            >
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function SupportingCard({ scene }: { scene: Scene }) {
  const { scrollTo } = useLenis();

  return (
    <Tilt className="h-full">
      <article
        data-cell=""
        onClick={() => scrollTo(`#scene-${scene.slug}`)}
        className="group flex h-full cursor-pointer flex-col px-5 py-5 transition-colors"
        style={{ background: "var(--bg-1)", transitionDuration: "var(--d-tick)" }}
      >
      <div className="flex items-baseline gap-3">
        <span className="t-mono text-[0.74rem] font-medium" style={{ color: "var(--mark)" }}>
          {String(scene.sceneNumber).padStart(2, "0")}
        </span>
        <Legend>{scene.category}</Legend>
      </div>

      <h3 className="m-0 mt-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            scrollTo(`#scene-${scene.slug}`);
          }}
          className="cursor-pointer border-0 bg-transparent p-0 text-left"
        >
          <span
            className="font-[family-name:var(--font-display)] text-[1.28rem] font-extrabold tracking-[-0.018em] transition-colors group-hover:text-[var(--mark)]"
            style={{
              fontVariationSettings: '"wdth" 96',
              color: "var(--ink-hi)",
              transitionDuration: "var(--d-tick)",
            }}
          >
            {scene.name}
          </span>
        </button>
      </h3>

      <p
        className="mt-2 mb-0 flex-1 text-[0.9rem] leading-[1.45]"
        style={{ color: "var(--ink-md)" }}
      >
        {scene.oneLiner}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-[0.3rem]">
        {scene.stack.slice(0, 4).map((t) => (
          <span
            key={t}
            className="t-mono px-[0.34rem] py-[0.1rem] text-[0.63rem]"
            style={{ color: "var(--ink-lo)", border: "1px solid var(--line)" }}
          >
            {t}
          </span>
        ))}
        {scene.confidence === "attributed" ? (
          <span
            className="t-mono px-[0.34rem] py-[0.1rem] text-[0.63rem]"
            style={{ color: "var(--attributed)", background: "var(--attributed-bg)" }}
          >
            shared
          </span>
          ) : null}
        </div>
      </article>
    </Tilt>
  );
}

export function SystemIndex() {
  return (
    <Chapter
      id="systems"
      station="02"
      title="Selected systems"
      lede="Six, in two tiers. The three at the top have an architecture worth several screens and get one each; the three below are real work that does not need that much room. Every one states what is wrong with it."
    >
      <Stagger className="flex flex-col" step={STAGGER.normal}>
        {flagshipScenes.map((s) => (
          <FlagshipRow key={s.slug} scene={s} />
        ))}
      </Stagger>

      <div className="mt-14">
        <Legend className="mb-4 block">Also in the record</Legend>
        <Stagger className="grid-hair sm:grid-cols-3" step={STAGGER.tight} depth>
          {supportingScenes.map((s) => (
            <SupportingCard key={s.slug} scene={s} />
          ))}
        </Stagger>
      </div>
    </Chapter>
  );
}
