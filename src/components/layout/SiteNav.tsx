"use client";

import { useLenis } from "@/components/providers/LenisProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { StationSheet } from "./StationSheet";
import { site } from "@/data/site";

const passLabel = { light: "DAY", dark: "NIGHT" } as const;

export function SiteNav() {
  const { scrollTo } = useLenis();
  const { pass, cycle } = useTheme();

  return (
    <header
      className="fixed top-0 right-0 left-0 z-50 lg:left-[var(--spacing-rail)]"
      style={{
        background: "color-mix(in srgb, var(--bg-0) 88%, transparent)",
        borderBottom: "1px solid var(--line)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="mx-auto flex h-[52px] max-w-[var(--content-max)] items-center justify-between gap-4 px-[var(--spacing-page)]">
        <button
          type="button"
          onClick={() => scrollTo("#top")}
          className="cursor-pointer border-0 bg-transparent p-0 text-left"
        >
          <span
            className="font-[family-name:var(--font-display)] text-[0.95rem] font-extrabold tracking-[-0.015em]"
            style={{ fontVariationSettings: '"wdth" 92', color: "var(--ink-hi)" }}
          >
            {site.name}
          </span>
          <span className="t-legend ml-2 hidden sm:inline" style={{ color: "var(--ink-lo)" }}>
            {site.concept}
          </span>
        </button>

        <div className="flex items-center gap-1">
          <StationSheet />
          <button
            type="button"
            onClick={() => scrollTo("#scenes")}
            className="t-legend hidden cursor-pointer border-0 bg-transparent px-3 py-2 transition-colors lg:block"
            style={{ color: "var(--ink-md)", transitionDuration: "var(--d-tick)" }}
          >
            Scenes
          </button>
          <button
            type="button"
            onClick={() => scrollTo("#contact")}
            className="t-legend cursor-pointer border-0 bg-transparent px-3 py-2 transition-colors"
            style={{ color: "var(--ink-md)", transitionDuration: "var(--d-tick)" }}
          >
            Contact
          </button>
          {/* The accessible name must contain the visible text, or
              speech-input users cannot say what they can see. So the
              visible label is the name, and the rest is appended. */}
          <button
            type="button"
            onClick={cycle}
            className="t-legend cursor-pointer px-3 py-[0.4rem] transition-colors"
            style={{
              border: "1px solid var(--line-strong)",
              color: "var(--ink-hi)",
              transitionDuration: "var(--d-tick)",
            }}
          >
            {passLabel[pass]} PASS
            <span className="sr-only"> — change colour pass</span>
          </button>
        </div>
      </div>
    </header>
  );
}
