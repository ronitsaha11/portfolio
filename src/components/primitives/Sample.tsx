"use client";

import { formatMeasuredAt } from "@/lib/format";
import type { Reading, Confidence } from "@/data/types";

const stateStyle: Record<Confidence, { fg: string; bg: string; word: string }> = {
  measured: { fg: "var(--measured)", bg: "var(--measured-bg)", word: "Measured" },
  attributed: { fg: "var(--attributed)", bg: "var(--attributed-bg)", word: "Attributed" },
  archived: { fg: "var(--archived)", bg: "var(--archived-bg)", word: "Archived" },
};

/**
 * The ground sample card inside a Reading's popover.
 * Every card contains at least one real link — enforced upstream by
 * assertReadings, which fails the build rather than rendering an empty one.
 */
export function Sample({ reading }: { reading: Reading }) {
  const s = stateStyle[reading.confidence];
  const latest = reading.samples
    .map((x) => x.measuredAt)
    .sort()
    .at(-1);

  return (
    <div
      className="w-[min(360px,calc(100vw-32px))] p-4 font-mono text-[0.76rem]"
      style={{
        background: "var(--bg-3)",
        border: "1px solid var(--line)",
        boxShadow: "var(--lift-3)",
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="t-legend" style={{ color: "var(--ink-lo)" }}>
          Ground sample
        </span>
        <span
          className="px-[0.4rem] py-[0.15rem] text-[0.6rem] uppercase tracking-[0.12em]"
          style={{ color: s.fg, background: s.bg }}
        >
          {s.word}
        </span>
      </div>

      <p className="m-0 text-[1.05rem] font-semibold" style={{ color: "var(--ink-hi)" }}>
        {reading.value}
      </p>

      {reading.detail ? (
        <p
          className="mt-1 mb-0 font-[family-name:var(--font-body)] text-[0.72rem] leading-relaxed"
          style={{ color: "var(--ink-md)" }}
        >
          {reading.detail}
        </p>
      ) : null}

      <ul className="mt-3 mb-0 flex list-none flex-col gap-[0.34rem] p-0">
        {reading.samples.map((sample) => (
          <li key={sample.href} className="flex items-baseline gap-2">
            <span
              className="shrink-0 text-[0.6rem] uppercase tracking-[0.1em]"
              style={{ color: "var(--ink-lo)" }}
            >
              {sample.kind}
            </span>
            <a
              href={sample.href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-[var(--mark-line)] underline-offset-2 hover:decoration-[var(--mark)]"
            >
              {sample.label}
              <span aria-hidden="true"> ↗</span>
            </a>
          </li>
        ))}
      </ul>

      {latest ? (
        <p
          className="mt-3 mb-0 pt-2 text-[0.62rem] tracking-[0.08em]"
          style={{ borderTop: "1px solid var(--line)", color: "var(--ink-lo)" }}
        >
          MEASURED {formatMeasuredAt(latest)}
        </p>
      ) : null}
    </div>
  );
}
