import { Legend } from "@/components/primitives/Legend";
import { registry } from "@/data/registry";
import { site } from "@/data/site";

/**
 * The colophon. How the site was built, and what it enforces about
 * itself — which turns the portfolio into its own last piece of
 * evidence.
 */
export function Footer() {
  const counts = [
    { k: "Systems", v: registry.scenes },
    { k: "Flagships", v: registry.flagships },
    { k: "Readings", v: registry.readings },
    { k: "Ground samples", v: registry.samples },
    { k: "Decisions recorded", v: registry.decisions },
    { k: "Marked attributed", v: registry.attributed },
  ];

  return (
    <footer
      className="mt-[var(--spacing-chapter)] pt-10 pb-16"
      style={{ borderTop: "1px solid var(--line)" }}
    >
      <div className="mx-auto max-w-[var(--content-max)]">
        <Legend className="mb-4 block">Colophon</Legend>

        <div className="grid gap-x-14 gap-y-6 lg:grid-cols-2">
          <p className="measure m-0 text-[0.92rem]" style={{ color: "var(--ink-md)" }}>
            Next.js, React and TypeScript, with Tailwind for tokens, Lenis for scroll and anime.js
            for every animation — one timeline language for the DOM and for the WebGL scene behind
            it, which is the only reason a second animation library is not here too. Type is
            Archivo, Instrument Sans and IBM Plex Mono. The lattice is one instanced mesh and one
            line buffer in a single shared canvas, and it never renders while the tab is hidden.
          </p>

          <p className="measure m-0 text-[0.92rem]" style={{ color: "var(--ink-md)" }}>
            Every figure here is a reading with at least one ground sample behind it, and two gates
            enforce it. <code className="t-mono text-[0.82rem]">assertReadings</code> fails the
            production build if a number ships without a source;{" "}
            <code className="t-mono text-[0.82rem]">verify:links</code> then requests every one of
            those {registry.samples} samples and fails if any of them has stopped resolving. The
            second gate exists because the first one was not enough — a specification directory was
            deleted from a repository months ago and this site went on rendering the figure it
            supported, linked to a 404.
          </p>
        </div>

        <dl
          className="grid-hair mt-8 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
          aria-label="What this site contains"
        >
          {counts.map((x) => (
            <div key={x.k} className="px-3 py-3">
              <dt className="t-legend mb-1" style={{ color: "var(--ink-lo)" }}>
                {x.k}
              </dt>
              <dd className="t-mono m-0 text-[1rem]" style={{ color: "var(--ink-hi)" }}>
                {x.v}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 flex flex-wrap items-baseline justify-between gap-4">
          <p className="m-0 text-[0.78rem]" style={{ color: "var(--ink-lo)" }}>
            <span className="t-mono">
              {site.name.toUpperCase()} · {site.lat}N {site.lon}E ·{" "}
              {new Date().getUTCFullYear()}
            </span>
          </p>
          <p className="m-0 text-[0.78rem]" style={{ color: "var(--ink-lo)" }}>
            <a
              href="https://github.com/ronitsaha11/portfolio"
              target="_blank"
              rel="noopener noreferrer"
              className="t-mono no-underline hover:underline"
            >
              Source for this site ↗
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
