# Ground Truth

The portfolio of Ronit Saha. Every figure on the site is a **reading** with at least one
**ground sample** behind it, and the production build fails if that stops being true.

> Ground truth is the remote-sensing term for measured reality — the samples you collect on the
> ground to check what the satellite claimed from orbit.

## The one rule

`src/data/assert.ts` throws if a reading ships without a source. It is imported by
`src/app/sitemap.ts`, which Next evaluates on every production build, so an unsourced number
fails CI rather than reaching the page.

```
Error: [ground-truth] Reading "pos-depth" in site build has no ground sample.
Every number on this site must link to the artifact it was measured from.
```

Verified: emptying any `samples: []` array breaks `pnpm build`.

## Running it

```bash
pnpm install
```

```bash
pnpm dev
```

```bash
pnpm build
```

`pnpm typecheck` runs `tsc --noEmit` with `strict` and `noUncheckedIndexedAccess`.

## Structure

```
src/
  app/            route handlers, metadata, sitemap (the evidence gate), OG image
  components/
    providers/    motion prefs, Lenis scroll, day/night pass
    primitives/   Reading, Sample, Plate, Button, Legend, Reveal, ElevationBar
    layout/       ContourRail, SiteNav, Section, Footer
    scenes/       SceneShell, ArchitectureDiagram, DecisionRecordItem
    sections/     Hero, Position, SceneIndex, Method, SourceReading, Instruments, Traverse, Contact
    hero/         Globe — Canvas 2D, real terminator
  data/
    types.ts      the evidence layer
    assert.ts     the build gate
    registry.ts   counts derived from data, never typed by hand
    scenes/       one file per scene
  lib/            cn, motion verbs, formatting
  hooks/          useInViewOnce
```

## Design system

Tokens live in `src/app/globals.css` and nowhere else. Day pass is the default; night pass is a
second design rather than an inversion. Reduced motion zeroes every duration at the token level,
so a component cannot opt out by accident.

- **Type** — Archivo (variable width, carries hierarchy), Instrument Sans, IBM Plex Mono
- **Colour** — bone ground, graphite ink, one accent (`--mark`, survey orange), an elevation ramp
  used only to encode values
- **Motion** — five verbs: `tick`, `ui`, `measure`, `sweep`, `pass`. Components import a verb,
  never a duration.

## The globe

`src/components/hero/Globe.tsx` computes the subsolar point from the current UTC time using solar
declination and the equation of time — the same maths as `SunLightingMath.ts` in TerraMind. The
terminator is correct for right now. Canvas 2D, capped at 2× DPR, stops entirely when the tab is
hidden, and renders one static frame under reduced motion.

## Audit

```bash
pnpm build && pnpm start
```

```bash
pnpm audit
```

`scripts/audit.mjs` runs Lighthouse N times (`AUDIT_RUNS`, default 3) and reports the **median**,
because a single pass on a laptop is worthless — five consecutive runs of an identical build here
produced total-blocking-time between 105 ms and 2997 ms.

Current results:

| Category | Score |
|---|---|
| Accessibility | **100** |
| Best Practices | **100** |
| SEO | **100** |
| Performance | 71–91 median, run-dependent |

Accessibility, best practices and SEO are stable across every run. Performance is not measurable
on a machine with background load; run it against the Vercel deployment or PageSpeed Insights for
a number worth acting on.

Fixed during the accessibility pass, each verified by computing the ratio rather than eyeballing it:

- `--ink-lo` 3.41:1 → 4.72:1 (carries the 0.66rem legends — the tightest constraint on the page)
- `--mark` 3.86:1 → 4.66:1 as link text, and 4.33:1 → 5.22:1 for white on it as a button
- `--attributed` 3.30:1 → 5.06:1
- night-pass `--ink-lo` 4.39:1 → 4.90:1

Also fixed: an explicit `<head>` element in `app/layout.tsx` was silently suppressing the **entire**
Metadata API output — no description, no Open Graph, no canonical. In the App Router the scripts
belong at the top of `<body>` instead.

## Attribution

Structural patterns — the build-time evidence gate, the derived registry, the typed evidence
layer, named motion verbs, SSR-truthful animation and the Lenis provider — are adapted with
permission from [Rexy-5097/proof-of-work](https://github.com/Rexy-5097/proof-of-work) by
Soumyadeb Tripathy. The concept, visual identity, copy and components are original.

## Deployment

Live at <https://proof-navy.vercel.app>.

Pushes to `main` deploy automatically via the Vercel GitHub integration.
`src/data/site.ts` holds the canonical URL — change it there **before**
adding a custom domain, or the deployed pages will point search engines
at an address that does not resolve.
