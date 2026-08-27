import { Legend } from "@/components/primitives/Legend";
import { registry } from "@/data/registry";
import { site } from "@/data/site";

/**
 * The colophon. How the site was built, and what it enforces about
 * itself — turning the portfolio into its own last piece of evidence.
 */
export function Footer() {
  return (
    <footer
      className="mt-[clamp(5rem,12vw,10rem)] pt-8 pb-14"
      style={{ borderTop: "1px solid var(--line)" }}
    >
      <div className="mx-auto max-w-[var(--content-max)]">
        <Legend className="mb-3 block">Colophon</Legend>

        <p className="measure text-[0.9rem]" style={{ color: "var(--ink-md)" }}>
          Next.js, React and TypeScript, with Tailwind for tokens, Lenis for scroll and Motion for
          the five motion verbs. Type is Archivo, Instrument Sans and IBM Plex Mono. The globe is
          Canvas 2D, and its terminator is computed from the current UTC time rather than drawn.
        </p>

        <p className="measure text-[0.9rem]" style={{ color: "var(--ink-md)" }}>
          Every figure on this site is a reading with at least one ground sample behind it, and the
          production build fails if that stops being true — <code className="t-mono text-[0.8rem]">assertReadings</code>{" "}
          runs on every build and throws rather than rendering an unsourced number.
        </p>

        <dl
          className="mt-6 grid grid-cols-2 gap-px sm:grid-cols-4"
          style={{ background: "var(--line)", border: "1px solid var(--line)" }}
        >
          {[
            { k: "Scenes", v: registry.scenes },
            { k: "Readings", v: registry.readings },
            { k: "Ground samples", v: registry.samples },
            { k: "Marked attributed", v: registry.attributed },
          ].map((x) => (
            <div key={x.k} className="px-3 py-2" style={{ background: "var(--bg-1)" }}>
              <dt className="t-legend mb-1" style={{ color: "var(--ink-lo)" }}>
                {x.k}
              </dt>
              <dd className="t-mono m-0 text-[0.95rem]" style={{ color: "var(--ink-hi)" }}>
                {x.v}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-7 mb-0 text-[0.78rem]" style={{ color: "var(--ink-lo)" }}>
          <span className="t-mono">
            {site.name.toUpperCase()} · {site.lat}N {site.lon}E · {new Date().getUTCFullYear()}
          </span>
        </p>
      </div>
    </footer>
  );
}
