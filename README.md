# Ground Truth

The portfolio of Ronit Saha. Every figure on the site is a **reading** with at least one
**ground sample** behind it, and two gates keep it that way.

> Ground truth is the remote-sensing term for measured reality — the samples you collect on the
> ground to check what the satellite claimed from orbit.

## The two gates

**1. A reading without a source does not build.**

`src/data/assert.ts` throws if a reading ships with no sample. It is imported by
`src/app/sitemap.ts`, which Next evaluates on every production build, so an unsourced number
fails CI rather than reaching the page.

```
Error: [ground-truth] Reading "pos-depth" in site build has no ground sample.
Every number on this site must link to the artifact it was measured from.
```

**2. A source that no longer resolves does not ship.**

```bash
pnpm verify:links
```

`scripts/verify-links.mjs` requests all 104 evidence links and fails on anything that is not a
200. The first gate proves a figure *has* an artifact; only the second proves the artifact is
still there, and the difference is not academic:

- TerraMind's nine specification volumes were linked at `tree/main/docs/…`. The directory was
  later removed from the default branch, and this site went on rendering the **9** for weeks with
  its evidence pointing at a 404.
- Seven capability entries linked to files under `frontend/src/features/…` that had **never
  existed** on that repository's main branch. They were plausible paths written from memory, and
  nothing had ever checked them.

Both were found the first time the gate ran. The lesson is in the fix as much as the check:
**evidence that has to survive is pinned to a commit, never to a branch.** `tree/main/...` is a
promise nobody is keeping.

Verified: emptying any `samples: []` array breaks `pnpm build`; breaking any href breaks
`pnpm verify:links`.

## Running it

```bash
pnpm install
```

```bash
pnpm dev
```

```bash
pnpm verify
```

`pnpm verify` runs `typecheck`, `lint` and `verify:links` in sequence. `pnpm typecheck` is
`tsc --noEmit` with `strict` and `noUncheckedIndexedAccess`.

## Structure

```
src/
  app/            routes, metadata, sitemap (the evidence gate), OG image
  components/
    providers/    motion preferences, Lenis scroll
    primitives/   Reading, Sample, Reveal, Stagger, Magnetic, Tilt, Button
    lattice/      the single 3D system — one canvas, five programs
    layout/       Chapter, SiteNav, CommandPalette, ChapterRail, MobileNav, Footer
    scenes/       SceneStage (the paced case study), SceneActs, DecisionRecordItem
    sections/     Hero, Position, SystemIndex, Method, SourceReading, …
  data/
    types.ts      the evidence layer
    assert.ts     the build gate
    evidence.ts   the link manifest the second gate walks
    registry.ts   counts derived from data, never typed by hand
    scenes/       one file per system
  lib/motion/
    tokens.ts       five durations, three curves
    verbs.ts        six reveal verbs, and choosing between them is the job
    scrollEngine.ts ONE scroll loop for the page — see below
    scroll.ts       the SSR and reduced-motion guards over it
    acts.ts         the project state machine
    sequence.ts     what happens INSIDE an act, element by element
  lib/quality.ts  the four quality tiers and how one is chosen
  hooks/          useReveal, useInViewOnce, useScrollParallax
```

## Design system

Tokens live in `src/app/globals.css` and nowhere else. A component reads a token; it never writes
a colour, a duration or an easing curve. Reduced motion zeroes every duration at the token level,
so a component cannot opt out by accident.

**There is one palette.** A second full design is a second full set of contrast decisions to keep
true, and the lattice only really works against a ground darker than anything drawn on it. One
ground, verified once — which also removed the pre-paint script that used to stamp a stored
choice, and with it the window where the browser chrome and the page disagreed.

- **Type** — Archivo (variable `wdth` axis, and the width is what carries hierarchy),
  Instrument Sans, IBM Plex Mono
- **Colour** — near-black ground, off-white ink, one accent (`--mark`), an elevation ramp used
  only to encode values. Every ink value is chosen by computing its contrast ratio against
  **every** ground it appears on, not just the page ground — see the note in `globals.css`.
- **Motion** — five durations and three curves, in `src/lib/motion/tokens.ts`, mirrored as
  `--d-*` / `--e-*` in CSS so a JS tween and a CSS transition on the same element agree.

## The animation system

Five layers, and nothing skips one:

```
tokens  →  verbs  →  component animations  →  scene timelines  →  scroll orchestration
```

Everything is [anime.js](https://animejs.com) v4 — one timeline language for the DOM *and* the
WebGL scene, which is the only reason a second animation library is not here too.

The join between the two is one plain mutable object. anime tweens its fields; the render loop
reads them. Nothing in the 3D scene is a React value, so a scroll-linked camera move does not
re-render the page, and anime never touches a three.js object directly — which means the
formation morph, a panel arriving and a button's hover all come from the same five durations and
three curves.

### One scroll loop

`src/lib/motion/scrollEngine.ts` owns scroll for the whole page: **one listener, one
`requestAnimationFrame` loop, one measurement pass.** Chapter poses, the case-study acts,
reveals, parallax, the rail, the masthead and the lattice's own input sampling are all
subscribers to it.

It replaced five independent systems — about forty anime.js `ScrollObserver`s, a rAF sampler
inside the lattice input module, a scroll listener in the rail that called `setState` on every
frame, another in the masthead, and Lenis's own loop. They did not coordinate, they measured
the same elements repeatedly, and two of them drove React state at frame rate.

Three rules, and they are the whole point:

1. **Layout is read in one pass and never in the loop.** `measure()` takes every rect back to
   back, before anything writes, on resize, on orientation change, once the fonts have loaded,
   and when the body's own box changes. The frame loop afterwards touches only cached numbers,
   so it cannot trigger a layout → style → layout cycle however many subscribers there are.
2. **`window.scrollY` is read once per frame**, at the top, before any subscriber has written
   anything. Read after a write it forces a reflow; read first it is free.
3. **A track that has not moved costs nothing.** Progress is compared against the last value it
   dispatched, so a page at rest runs the loop and dispatches to nobody.

Two kinds of link, and the split is deliberate:

- **progress-linked** (`linkRange`) — the playhead *is* the scroll position. Used for the acts,
  the camera, the station numerals that travel against the page, and the traverse spine.
- **triggered** (`onceInView`) — runs once at its own speed. Used for arrivals in the editorial
  sections, and for the formation changes: being 40% of the way from a pipeline to a
  constellation under manual control is meaningless, and scrubbing it back and forth looks like
  a fault.

### Inside an act, nothing starts at the same moment

The act machine says which act is on screen. `lib/motion/sequence.ts` says what happens inside
it. An element declares two things and nothing else:

```html
<h2 data-in="clip" data-in-at="0.07">
<p  data-in="up"   data-in-at="0.2">
```

`clip` uncovers left to right and arrives from the left as it goes — a heading is a line
resolving. `wipe` uncovers and does not move — an eyebrow or a rule. `up` is running copy.
`depth` comes forward out of the page — the thing you are meant to reach for. `rise` is the
shortest travel on the page and carries metadata. Picking by taste rather than by content is how
a page ends up with fourteen identical slide-ups.

It is a **pure function of progress**, not a triggered animation: one number in, one transform
out, no playhead and no animation instance. Scroll back and the title re-covers itself in step
with the reader.

**How long each element takes shrinks with scroll speed.** At reading pace an element takes about
a fifth of its act to arrive; on a fast flick that compresses to well under a tenth, so the text
has caught up by the time the reader stops rather than trailing them down the page. That is the
whole of the velocity response, and it costs one multiply.

**The opening act does not wait for the pin.** Pin progress is clamped to 0 until the section
reaches the top of the viewport, so a project header driven by it alone would sit blank for a
whole screen while the section rises into view. The opening act is driven by the section
*entering* instead, and the two meet exactly where the pin begins.

Two kinds of mark, and they never land on the same element: `data-item` is a thing the reader
**steps** through (an attribute write at a step boundary, then a CSS transition), `data-in` is a
thing that **arrives** (written every frame). Put both on one element and the transition and the
writer fight over the same transform.

### Six reveal verbs

`up`, `clip`, `fade`, `depth`, `scale`, `split` — and choosing between them is the job. A
headline is *uncovered* because a headline is a line being resolved; a module path slides out of
*depth* because it is a thing behind the surface being brought forward; a metric *scales* up
because a figure resolving is a needle settling. Same tokens, different meaning.

No per-character stagger anywhere. Letters arriving one at a time is the most common
premium-portfolio tell, it delays the reader getting the sentence, and it has nothing to do with
measurement. `clip` keeps the text as one DOM node, so it stays selectable and screen-readable.

**Every reveal arms a failsafe.** Hiding content and relying on an observer to restore it is the
one genuinely dangerous pattern here: if the observer never fires, the section is blank forever.
So if the animation has not begun by the time a timer expires, `useReveal` puts the content back
itself and gives up on the effect. Losing an animation is free; losing a paragraph is not.

## The scroll narrative

A case study is not a section you scroll past. It is a tall section with one `position: sticky`
child, and how far into it you are decides what it shows.

```
browser scroll
  → the engine's `pin` range for this section
    → ONE number, 0..1
      ├─ the act machine   → which paragraph is on screen
      ├─ the act timeline  → where the camera is
      ├─ the step cursor   → which band of the lattice is lit
      └─ the readout       → "04 / 07 · Architecture"
```

There is one number and there are no second clocks. That is the whole answer to "the 3D reacts
but the DOM does not feel connected": they are not two systems being kept in sync, they are two
consumers of the same scalar.

**The scroll is not hijacked.** The wheel, the trackpad, the scrollbar, Page Down, Home, End, a
touch flick and a screen reader's virtual cursor all behave exactly as they do anywhere else,
because nothing calls `preventDefault` and nothing snaps. The one place scroll position is
written is when keyboard focus lands in an act that is off screen — and that is a correction,
not a lock.

### The acts are derived, not authored per project

There is no `if (slug === "pratibimb")` anywhere in the system. `lib/motion/acts.ts` turns a
scene into a sequence, and the sequence comes from what the scene actually has:

| | flagship | supporting |
|---|---|---|
| acts | intro · overview · system · architecture · challenge · evidence · resolution | intro · overview · system · challenge · resolution |
| the system act walks | its stages | its stages, then its layers |
| beats | `1 + stages × 0.55` for the system act alone | `1 + (stages + layers) × 0.5` |

So PratiBimb's twelve pipeline stages make its system act long and put the gate two thirds of
the way through it; Cartograph's nine stages cross a language boundary; EcoShare has five stages
and four layers and a different act set entirely. Six projects, six shapes of narrative, one
machine — and a seventh project needs no code.

**The height is derived too.** A beat is one thing to look at, worth `--act-beat` (a quarter of
a viewport; less on a phone), and a track is `100svh + beats × --act-beat`. Nobody types a number
of viewport heights. Measured at 1440×900:

| | screens | acts |
|---|---|---|
| PratiBimb | 6.4 | 7 |
| Cartograph | 5.7 | 7 |
| TerraMind | 5.6 | 7 |
| Stealth F.R.I.D.A.Y. | 3.8 | 5 |
| HealthTrack · EcoShare | 3.6 | 5 |
| **whole page** | **43.3** | |

The beat was a third of a viewport and is now a quarter. At a third the six case studies came to
thirty thousand pixels between them and there were stretches where the only thing changing was
the camera, which is the one thing a long page cannot afford.

### The camera is a paused anime timeline

`sceneShots.ts` builds one timeline per scene, once, with explicit `[from, to]` pairs on every
tween so it is seekable from any position. Per frame the stage calls `seek(progress × duration)`
and anime does the interpolation, the easing and the ordering.

The waypoints sit at act *centres*, not on act boundaries: a waypoint on a leading edge means
the camera arrives as the act begins and then holds still while the reader reads it, so the
scene stops every time the text starts.

**The system act is different per formation, and the geometry decides.** A pipeline runs along
x, so it gets a tracking shot with the look target travelling beside the camera — pinned at the
origin the camera would orbit the pipeline instead of going along it. A cross-stack is tiers on
y, so it descends. Sheets are looked down on, so the camera drops through them. An orbit sweeps.
None of that is a style choice per project; it is read off where `formations.ts` puts the nodes.

### The instrument reading

Two numbers sit under the progress rule: which part of the system the walk is on, and how far
through the case study you are. Both come from the same scalar as everything else, and both go
**blank or zero rather than stale** — a readout showing the previous act is worse than an empty
one. That is the whole HUD. A portfolio that turns into a dashboard has stopped being about the
work.

The architecture ladder draws a **spine** through its marks. A list of layers says what the parts
are; a list of layers joined by a line says a request *descends* through them, which is the claim
the architecture act is actually making and the one thing the ladder was not saying on its own.
It is one line for the whole ladder rather than a segment per rung, and its x is why the ladder's
first two grid columns are fixed widths: a connector that stops short of its nodes reads as a
rendering fault.

### Moving from one system into the next

When the reader crosses a boundary the outgoing scene's camera is wherever its resolution act
left it, and the incoming scene's timeline starts at its own intro. Seeking straight there is a
cut. So the incoming stage snapshots the rig at the moment it takes over and blends out of it
across one PASS — which is also exactly how long the formation morph takes, so the camera
settles into the new system while the lattice is still becoming it.

### One document, two layouts

`html[data-motion="on"]` is set by a four-line inline script in the document head, before the
first paint, when the reader has not asked for reduced motion. Everything about the paced layout
hangs off that one attribute.

The **default** is the document: every act in order, every note inline beside the stage it
describes, no fixed heights, no state. That is what a reader gets with JavaScript off and what a
reader gets with reduced motion on. Nothing appears in one layout that is missing from the
other — pacing is a way of *timing* a document, not of replacing it.

Deciding it in CSS rather than in a React effect is worth about 1.9 seconds of total blocking
time. The first version of this rebuild flipped a `mode` state after hydration and rendered a
different component tree per mode; rebuilding and re-laying-out every case study one frame after
building it put Style & Layout at 5.2 s. **A mode that changes the DOM is a mode that costs a
full relayout of the page.**

An act that is not on screen is `opacity: 0` and nothing more. `visibility: hidden` and
`display: none` both remove content from the accessibility tree, and an act removed from the
accessibility tree cannot be reached by a virtual cursor at all.

## The lattice

One WebGL canvas for the entire page, and it is the defining element of the
design rather than a texture behind it.

Every system on this site is a graph — Cartograph's symbol graph, PratiBimb's
twelve-stage pipeline, TerraMind's layer stack, and this site's own
reading-to-sample model. So the object behind the page *is* that graph, and
scrolling reorganises it into whichever shape the current chapter is about.
Node `i` is the same node in every formation: it travels rather than fading out
and in, which is the difference between a reorganisation and a crossfade.

Nine formations, one per chapter kind, and each is a shape you can name:

| formation | what it is | who uses it |
|---|---|---|
| `field` | a jittered crystal in slabs | the hero |
| `constellation` | one cluster per system | the index |
| `pipeline` | a chain of stations with a gate | PratiBimb |
| `crossstack` | tiers joined across a language boundary | Cartograph |
| `stack` | tiled sheets seen from above | TerraMind |
| `orbit` | a core with inclined rings | Stealth F.R.I.D.A.Y. |
| `ledger` | durable rows receding in depth | HealthTrack, Method, Traverse |
| `mesh` | peers with no centre | EcoShare, Instruments |
| `converge` | everything drawn into one helix | Contact |

**One edge list, and it is the successor relation.** Node `i` joins `i+1` plus
two braiding strides. That is not a simplification of a graph — it is the graph,
because the node index is the system's own ordering in every formation: stage
after stage, tile after tile, row after row. Edges are therefore short by
construction in all nine, which is why the scene reads as a built object instead
of a ball of wool.

### What is actually moving

| | driven by |
|---|---|
| the act on screen | how far into the case study you are |
| formation | which chapter you are in |
| camera dolly and yaw | how far through the chapter you have scrolled |
| ambient yaw and drift | time, and it speeds up once you stop |
| node lean and brightness | where your pointer is |
| the key light | where your pointer is |
| edge waves | the direction of the system |
| packets | the edges they ride, and the gate they cross |
| backdrop | two noise fields at different rates, plus page position |
| the lit band | which stage the act walk is on — the same index as the DOM highlight |

Every one of those has a cause the reader can find. Nothing loops just to loop.

### The gate

Where a formation has a boundary stage, a membrane is drawn at it, and packets
crossing are visibly changed: they snap to a lattice for the width of the
membrane and come out the other side in the measured colour. That is a picture
of a documented architecture — a stage that rewrites what passes through it —
and not a claim that anything is running.

### Five programs, five draw calls

A backdrop triangle, the edge web, the node field, the packets, the gate. The
nodes are **lit sphere impostors on billboards**: two triangles each, with the
normal reconstructed in the fragment shader, which gives an exact sphere with
real per-pixel lighting at a fraction of the cost of sphere geometry. The
lighting model is a key that follows the pointer, a fill and a rim, written out
as three dot products rather than dragged in with a PBR material the rest of the
scene has no use for.

### The corridor

The reading column is measured from the DOM on every resize and handed to all
four shaders in normalised device coordinates. Inside that band the scene thins;
outside it — the margins, above the fold, behind the rail — it runs at full
strength. That is what lets the lattice be bright at all. A single global dim is
how the first attempt ended up accessible and dead.

Type gets a **legibility halo** (`text-shadow` in the page ground colour) as the
second half of the same problem. It is invisible against a flat background and
worth several points of contrast under an accent node. Opaque panels switch it
off, because nothing is behind them.

### Quality tiers

| | nodes | packets | DPR | bloom |
|---|---|---|---|---|
| `high` | 220 | 180 | 2 | yes |
| `balanced` | 150 | 105 | 1.5 | no |
| `low` | 132 | 66 | 1.35 | no |
| `off` | — | — | — | — |

The starting tier comes from the viewport and two weak platform hints, and a
frame monitor has the last word: sustained low frames step down, a sustained
healthy stretch steps back up, and after two changes of direction it freezes on
the lower tier. It ignores the first 2.6 seconds entirely — measured during
shader compilation and hydration, every machine looks slow, and the first
version of this monitor took a 138fps laptop down two tiers before a single
representative frame had been drawn.

`?lattice=high|balanced|low|off` pins a tier and disables the monitor, which is the
only way to see the other tiers on hardware that would not choose them. The pin is
remembered; `?lattice=auto` clears it.

**A phone gets a real scene**, not a switch. The previous build refused to mount
below 768px, which meant the page went flat on the device most visitors will
open it on. `off` now means one of exactly two things: the reader asked for
reduced motion, or the browser cannot give us a context.

**Portrait compensation.** Every camera distance in the shot list was chosen
against a landscape frame, and a perspective camera's *horizontal* field of view
shrinks with the aspect ratio — so the same distance on a phone held upright
shows about a quarter of a pipeline that runs nineteen world units along x. The
camera backs off by the aspect ratio, clamped, so a phone sees a wider slice
than a monitor rather than a handful of dots.

Other protections: mounted only after the `load` event **and** then on an idle
callback, so three.js is never in the critical path and never competes with
hydration; the render loop stops entirely when the tab is hidden; no allocation
inside the frame loop.

**Every formation has a matching ordered list, always present in the DOM.** The
ladder the reader walks in the system act is that list: every rung carries its
own note, in the accessibility tree, attached to the stage it describes. It is
not a fallback shown when WebGL fails — it is the primary reading, and the
canvas is a second view for people who can see it and want it. A portfolio
whose architecture is only legible as a rotating object excludes everyone on a
screen reader, on reduced motion, or with a busy GPU.

## Audit

```bash
pnpm build && pnpm start
```

```bash
pnpm audit
```

`scripts/audit.mjs` runs Lighthouse N times (`AUDIT_RUNS`, default 3) and reports the **median**,
because a single pass on a laptop is worthless.

Measured on this machine against `pnpm start`, and reported **twice**, because the two numbers
answer different questions.

**With the 3D running** — median of 9, Lighthouse's headless Chrome with a real GPU:

| Category | Score |
|---|---|
| Accessibility | **100** |
| Best Practices | **100** |
| SEO | **100** |
| Performance | 78 median, range 75–81 |

FCP 2.26 s · LCP 3.76 s · **TBT 373 ms** (range 331–442) · CLS 0.024.

**Without the 3D** — median of 7, `--disable-gpu`, so the mount policy sees a software rasteriser
and refuses the scene:

| Category | Score |
|---|---|
| Performance | 90 median, range 85–92 |

LCP 3.16 s · **TBT 90 ms** (range 72–117) · CLS 0.024.

The second table is the like-for-like comparison with earlier audits, which is the one worth
tracking:

| | Performance | TBT |
|---|---|---|
| before the scroll rebuild | 83 | 269 ms |
| after the scroll rebuild | 84 | 160 ms |
| **after the pacing pass** | **90** | **90 ms** |

Six pinned case studies, an act state machine, a paused camera timeline per project and a
per-element sequencer, and the document side of the page is three times cheaper than it was
before any of it existed. One scroll loop instead of five is most of that; a page that is five
screens shorter is the rest.

The gap between the two tables — 12 points and about 280 ms — is what loading three.js, compiling
five shader programs and creating a WebGL context costs under a 4× CPU throttle. It is paid once,
after the `load` event, on an idle callback, on a page that is already complete and readable.

### Frames, which is what actually matters here

Lighthouse measures a page arriving. The thing to measure on a scroll-driven page is a page being
*scrolled* — with the camera, the formation, the lighting, the particle field and every element
of the current act all being driven from the scroll position at once. Scrolling PratiBimb end to
end at 900 px/s, sampling every frame, on the integrated GPU rather than the discrete card:

| | mean fps | median | worst 5% | frames > 33 ms |
|---|---|---|---|---|
| desktop `high` — 220 nodes, 180 packets, bloom | **74.5** | 82 | 48 | 2 / 447 |
| desktop `balanced` — 150 nodes, no bloom | **148** | 164 | 83 | 2 / 890 |
| desktop, scene off (control) | 163 | 164 | 160 | 1 / 980 |
| mobile `low` — 390×844, 132 nodes | **163** | 164 | 159 | 1 / 976 |
| mobile, scene off (control) | 163 | 164 | 160 | 1 / 980 |

Two passes, averaged, with the control back at the display cap both times. Read it as: the DOM
side of the scroll narrative costs **nothing measurable** — `low` and its control are the same
number — `balanced` costs about 9%, and `high` costs the rest, essentially all of it the
full-screen bloom pass on an integrated GPU. 82 fps median while scrubbing a whole system is
comfortably above the refresh rate of the screens this will be read on.

JS payload: **212 kB first load**, of which three.js, five shaders and post-processing are a few
kB — the rest is loaded after `load`, on an idle callback, and only when the GPU is real.

**Performance is not measurable on a machine with background load**, and this pass proved it
twice. The same build measured TBT 779 ms and then 1063 ms an hour apart, and one nine-run set
came out bimodal at 331–5796 ms because a browser with forty-five processes was open beside it.
Every number above is from a set where the run-to-run spread closed. Run against the Vercel
deployment or PageSpeed Insights for a number worth acting on.

### Found by measuring rather than by looking

Each of these was a real defect, and none of them was visible by inspection.

- **Initial state written after the first layout instead of before it.** The act sequencer has
  to hide everything marked `data-in` before it can play. Two attempts to make that cheaper —
  priming only the opening act, then moving the starting state into CSS behind an attribute —
  both deferred the inline writes to the first animation frame, and both were **four times
  worse**: TBT 4.3 s against 1.1 s, Style & Layout 6.2 s against 3.1 s, reproducibly, seven runs
  each. A style write before the first layout is free; the same write after it invalidates
  forty-two act subtrees and buys a second full layout pass. Writing it in the effect also makes
  the first frame free, because a style set to the value it already has is not an invalidation.
  Both "optimisations" were reverted and the finding is commented where it happened.
- **A mode flip that rebuilt the page.** The first version of the scroll rebuild rendered a
  different React tree per layout mode and switched after hydration. Style & Layout: 5.2 s. TBT:
  1.9 s. One tree with the layout chosen in CSS before the first paint fixed it. A mode that
  changes the DOM is a mode that costs a full relayout.
- **`a { color: … }` written outside a cascade layer.** Tailwind v4 emits utilities inside
  `@layer utilities`, and an unlayered rule beats every layered one. The base anchor colour was
  therefore overriding `text-[var(--mark-on)]`, so **every primary link-button rendered the
  accent on the accent and its label was invisible** — 1.52:1, and it had been shipping. Element
  defaults now live in `@layer base`.
- **A forced reflow every animation frame.** The scroll sampler read
  `documentElement.scrollHeight` per frame, which reflows a thirty-thousand-pixel document sixty
  times a second. That whole sampler is gone; the engine measures once per resize.
- **Inverted scroll thresholds.** anime reads a threshold as `"<container edge> <target edge>"`.
  Written the other way round the offsets come out reversed, `distance` clamps to zero and the
  observer never fires — no error, no warning, and the lattice held its opening pose for the
  whole page in two consecutive builds. The engine has no threshold strings at all now, which is
  one way to make a bug impossible.
- **Two text shadows where one would do.** The legibility halo was drawn twice, at 10px and
  26px, on every glyph in the document, for a difference invisible side by side.

Contrast fixed during this pass, verified by computing the ratio rather than eyeballing it:

- `--ink-lo` was 4.35:1 on `--bg-2`, which is where the annotated source table puts its line
  numbers. Measuring an ink against the page ground alone does not surface this: the same token
  read 4.90:1 against `--bg-0` and passed every check that only looked there.
  `#7A8484` → `#879191`, now 4.78:1 worst case across `bg-0`–`bg-3`.

## Attribution

Structural patterns — the build-time evidence gate, the derived registry, the typed evidence
layer, named motion verbs, SSR-truthful animation and the Lenis provider — are adapted with
permission from [Rexy-5097/proof-of-work](https://github.com/Rexy-5097/proof-of-work) by
Soumyadeb Tripathy. The concept, visual identity, copy and components are original.

Two of the systems documented here are shared work and say so on the page: **Cartograph** is
Soumyadeb Tripathy's project, where Ronit owns milestones M11–M16, and **PratiBimb** is a
two-person team with Lakshya172. Their readings are marked `attributed` and their confidence
intervals stay visibly wide.

## Deployment

Live at <https://proof-navy.vercel.app> — repository: <https://github.com/ronitsaha11/portfolio>.

Pushes to `main` deploy automatically via the Vercel GitHub integration.
`src/data/site.ts` holds the canonical URL — change it there **before**
adding a custom domain, or the deployed pages will point search engines
at an address that does not resolve.

`site.resume` points at `/resume.pdf`, the file is committed, and five places read that one
value: the hero action, the masthead, the mobile sheet, the contact section and the command
palette. A `.pdf` href opens in its own tab wherever it appears — see `public/README.md` for why,
and for how to serve it from somewhere else instead.
