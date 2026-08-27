"use client";

import { useLenis } from "@/components/providers/LenisProvider";
import { scenes } from "@/data/scenes";
import type { Scene } from "@/data/types";

/**
 * Orientation inside a long scene.
 *
 * Case studies run several screens; without this you lose track of which
 * one you are in halfway down. A compact marker sticks below the nav for
 * the length of the scene — sticky rather than fixed, so it appears and
 * leaves with its own section and never floats over unrelated content.
 */
export function SceneMarker({ scene }: { scene: Scene }) {
  const { scrollTo } = useLenis();
  const i = scenes.findIndex((s) => s.slug === scene.slug);
  const prev = i > 0 ? scenes[i - 1] : undefined;
  const next = i < scenes.length - 1 ? scenes[i + 1] : undefined;

  return (
    <div
      className="sticky top-[52px] z-30 -mx-[var(--spacing-page)] mb-8 px-[var(--spacing-page)] py-2 lg:mx-0 lg:px-0"
      style={{
        background: "color-mix(in srgb, var(--bg-0) 90%, transparent)",
        borderBottom: "1px solid var(--line)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="t-mono text-[0.7rem] font-semibold" style={{ color: "var(--mark)" }}>
            {String(scene.sceneNumber).padStart(2, "0")}
          </span>
          <span
            className="truncate font-[family-name:var(--font-display)] text-[0.9rem] font-bold"
            style={{ fontVariationSettings: '"wdth" 104', color: "var(--ink-hi)" }}
          >
            {scene.name}
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-1">
          {prev ? (
            <button
              type="button"
              onClick={() => scrollTo(`#scene-${prev.slug}`)}
              className="t-legend cursor-pointer border-0 bg-transparent px-2 py-2 transition-colors"
              style={{ color: "var(--ink-lo)", transitionDuration: "var(--d-tick)" }}
            >
              <span aria-hidden="true">←</span>
              <span className="sr-only">Previous scene: {prev.name}</span>
            </button>
          ) : null}
          {next ? (
            <button
              type="button"
              onClick={() => scrollTo(`#scene-${next.slug}`)}
              className="t-legend cursor-pointer border-0 bg-transparent px-2 py-2 transition-colors"
              style={{ color: "var(--ink-lo)", transitionDuration: "var(--d-tick)" }}
            >
              <span className="hidden sm:inline">{next.name}</span>
              <span aria-hidden="true"> →</span>
              <span className="sr-only">Next scene: {next.name}</span>
            </button>
          ) : null}
        </span>
      </div>
    </div>
  );
}
