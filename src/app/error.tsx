"use client";

import { useEffect } from "react";
import { site } from "@/data/site";

/**
 * Route-level error boundary. Keeps the survey vocabulary rather than
 * dropping the visitor into a stack trace, and always offers the two
 * things that actually help: retry, and a way out.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ground-truth]", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-[var(--content-max)] flex-col justify-center px-[var(--spacing-page)]">
      <p className="t-legend m-0" style={{ color: "var(--mark)" }}>
        Instrument fault
      </p>
      <h1 className="t-scene mt-4 mb-0" style={{ color: "var(--ink-hi)" }}>
        This section failed to render
      </h1>
      <p className="measure mt-5 text-[1.02rem]" style={{ color: "var(--ink-md)" }}>
        Something went wrong on the page rather than in your browser. Retrying usually clears it.
      </p>

      {error.digest ? (
        <p className="t-mono mt-2 text-[0.72rem]" style={{ color: "var(--ink-lo)" }}>
          DIGEST {error.digest}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="cursor-pointer border px-[1.1rem] py-[0.62rem] font-[family-name:var(--font-display)] text-[0.8rem] font-semibold"
          style={{
            fontVariationSettings: '"wdth" 112',
            background: "var(--mark)",
            borderColor: "var(--mark)",
            color: "var(--mark-on)",
          }}
        >
          Retry
        </button>
        <a
          href={`mailto:${site.email}`}
          className="border px-[1.1rem] py-[0.62rem] font-[family-name:var(--font-display)] text-[0.8rem] font-semibold no-underline"
          style={{
            fontVariationSettings: '"wdth" 112',
            borderColor: "var(--line-strong)",
            color: "var(--ink-hi)",
          }}
        >
          Report it
        </a>
      </div>
    </main>
  );
}
