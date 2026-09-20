import { Legend } from "@/components/primitives/Legend";
import { LinkButton } from "@/components/primitives/Button";
import { Reading } from "@/components/primitives/Reading";
import type { ActId } from "@/lib/motion";
import { scenes } from "@/data/scenes";
import type { ArchitectureLayer, Scene } from "@/data/types";

const SCENE_COUNT = scenes.length;

/**
 * THE ACTS — what the reader is looking at, act by act.
 *
 * ONE TREE, TWO LAYOUTS, AND THE DIFFERENCE IS CSS ONLY.
 *
 *   PACED   the case study owns the viewport and the reader walks
 *           through it. Sub-steps are lit one at a time and the
 *           detail for the current one is shown large in the slot.
 *   FLOW    the same markup as an ordinary document. Every act in
 *           order, every note inline beside the thing it describes,
 *           no state. This is the server's output, and it is what a
 *           reader gets with reduced motion on or scripting off.
 *
 * FLOW IS NOT A DEGRADED FALLBACK and PACED is not a second document:
 * nothing appears in one that is missing from the other. Pacing is a
 * way of *timing* a document, not of replacing it.
 *
 * THIS USED TO BE TWO REACT TREES, AND THAT WAS A REAL MISTAKE.
 *
 * The first version of this rebuild rendered a different component
 * per mode and switched after hydration. It measured badly:
 * Lighthouse put Style & Layout at 5.2 seconds and total blocking
 * time at 1.9 seconds, because every case study's content was built,
 * laid out, thrown away and built again a frame later, and the act
 * panels changed from static to absolute underneath it. One tree,
 * with the layout decided in CSS before the first paint, took both
 * back down. The lesson is narrow and worth keeping: a mode that
 * changes the DOM is a mode that costs a full relayout of the page.
 *
 * TWO KINDS OF MARK, AND THEY NEVER LAND ON THE SAME ELEMENT.
 *
 *   data-item   a thing the reader STEPS through. The stage writes
 *               `data-state` on it at a step boundary and CSS
 *               transitions the rest.
 *   data-in     a thing that ARRIVES, at `data-in-at` through the
 *               act, driven per frame from act progress. See
 *               `lib/motion/sequence.ts`.
 *
 * A stepped element uses a CSS transition; an arriving one is written
 * every frame. Putting both on one element means the transition and
 * the writer fight over the same transform, so where an act has both
 * — the overview stack — `data-item` is on the wrapper and `data-in`
 * is on its children.
 *
 * SUB-STEPS ARE MARKED, NOT DRIVEN. An act body puts `data-item` on
 * each thing the reader steps through and stops there. The stage
 * writes `data-state` onto those elements when the step changes — a
 * handful of attribute writes per act, never per frame — and CSS does
 * the rest. An act body holds no scroll logic at all and can be read
 * on its own.
 */

export interface ActProps {
  scene: Scene;
}

const linkLabel: Record<string, string> = {
  REPOSITORY: "Open the repository",
  LIVE: "Open the live site",
  SPECIFICATION: "Read the specification",
  DOCUMENTATION: "Read the documentation",
  BENCHMARK: "Read the benchmark report",
  ROADMAP: "Read the roadmap",
  COMMITS: "See the commits",
};

function tone(scene: Scene) {
  return scene.confidence === "attributed" ? "var(--attributed)" : "var(--measured)";
}

/* ---------------- the rung ----------------

   A row in a ladder the reader walks.

   The detail sits INSIDE the rung in the DOM, so a screen reader
   hears it attached to its own stage. It is clipped out of the visual
   flow when the page is paced, where the same text is shown large in
   the slot below; with reduced motion on, the clip is lifted and the
   slot is hidden, and the ladder becomes an ordinary annotated list.
   Same markup, both readings. */

interface Rung {
  key: string;
  label: string;
  note: string;
  gate: boolean;
  depth?: ArchitectureLayer["depth"];
  modules?: string[];
  kind: "stage" | "layer";
}

function RungDetail({ note, modules }: { note: string; modules?: string[] }) {
  return (
    <>
      {note ? <p className="m-0">{note}</p> : null}
      {modules && modules.length > 0 ? (
        <ul className="mt-2 mb-0 flex list-none flex-col gap-1 p-0">
          {modules.map((m) => (
            <li key={m} className="t-mono text-[0.72rem]" style={{ color: "var(--ink-lo)" }}>
              {m}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

/**
 * `connected` draws a spine through the marks.
 *
 * A list of layers says what the parts are. A list of layers joined
 * by a line says a request DESCENDS through them, which is the claim
 * the architecture act is actually making, and it is the one thing
 * the ladder was not saying on its own.
 */
function Ladder({
  rungs,
  offset = 0,
  connected = false,
}: {
  rungs: Rung[];
  offset?: number;
  connected?: boolean;
}) {
  return (
    <ol
      className={
        connected ? "act-ladder act-ladder-joined m-0 list-none p-0" : "act-ladder m-0 list-none p-0"
      }
    >
      {rungs.map((r, i) => (
        <li key={r.key} data-item="" className="act-item act-rung">
          <span className="t-mono act-rung-index">{String(offset + i + 1).padStart(2, "0")}</span>
          {r.depth === undefined ? (
            <span className="act-rung-mark" aria-hidden="true" data-gate={r.gate ? "" : undefined} />
          ) : (
            <span
              className="act-rung-depth"
              aria-hidden="true"
              style={{ background: `var(--el-${r.depth})` }}
            />
          )}
          <span className="act-rung-label">{r.label}</span>
          {r.gate ? <span className="t-legend act-rung-badge">Gate</span> : null}
          <div className="act-rung-detail">
            <RungDetail note={r.note} modules={r.modules} />
          </div>
        </li>
      ))}
    </ol>
  );
}

function Slot({ rungs }: { rungs: Rung[] }) {
  return (
    <div className="act-slot" aria-hidden="true">
      {rungs.map((r, i) => (
        <div key={r.key} data-slot={i} className="act-slot-note">
          <RungDetail note={r.note} modules={r.modules} />
        </div>
      ))}
    </div>
  );
}

/* ---------------- 01 · intro ---------------- */

function IntroAct({ scene }: ActProps) {
  const fg = tone(scene);
  return (
    <>
      {/* THE ENTRY MOMENT. The eyebrow is uncovered, the name is
          uncovered behind it and arrives from the left as it goes,
          the one-liner follows, and the metadata rises last. Four
          starts, no two at the same scroll position. */}
      <Legend rule className="mb-4 block" data-in="wipe" data-in-at="0.02">
        {scene.category} · {scene.year} · {scene.subtitle}
      </Legend>

      <h2
        id={`scene-${scene.slug}-title`}
        className="t-scene m-0"
        style={{ color: "var(--ink-hi)" }}
        data-in="clip"
        data-in-at="0.07"
      >
        {scene.name}
      </h2>

      <p className="t-lede measure mt-5 mb-0" data-in="up" data-in-at="0.2">
        {scene.oneLiner}
      </p>

      <div
        className="mt-6 grid gap-px sm:grid-cols-2"
        style={{ background: "var(--line)" }}
        data-in="rise"
        data-in-at="0.34"
      >
        <div className="px-4 py-3" style={{ background: "var(--bg-1)" }}>
          <Legend className="mb-1 block">
            <span style={{ color: fg }}>Status</span>
          </Legend>
          <p className="m-0 text-[0.88rem]" style={{ color: "var(--ink-md)" }}>
            {scene.status}
          </p>
        </div>
        <div className="px-4 py-3" style={{ background: "var(--bg-1)" }}>
          <Legend className="mb-1 block">
            <span style={{ color: fg }}>Ownership</span>
          </Legend>
          <p className="m-0 text-[0.88rem]" style={{ color: "var(--ink-md)" }}>
            {scene.ownership}
          </p>
        </div>
      </div>

      <ul className="mt-5 flex list-none flex-wrap gap-x-2 gap-y-2 p-0">
        {scene.stack.map((s, i) => (
          <li
            key={s}
            className="t-mono px-2 py-[0.2rem] text-[0.72rem]"
            style={{ border: "1px solid var(--line)", color: "var(--ink-lo)" }}
            data-in="rise"
            data-in-at={(0.42 + i * 0.012).toFixed(3)}
          >
            {s}
          </li>
        ))}
      </ul>
    </>
  );
}

/* ---------------- 02 · overview ---------------- */

function OverviewAct({ scene }: ActProps) {
  return (
    // A stack when paced: problem, invariant and approach each take
    // the frame in turn. Dimming them in place would need the height
    // of all three at once, and the longest approach paragraph on
    // this site does not leave room for that.
    <div className="act-stack flex flex-col gap-6">
      {[
        { label: "The problem", body: scene.problem, big: false },
        { label: "The invariant", body: scene.invariant, big: true },
        { label: "The approach", body: scene.approach, big: false },
      ].map((part, i) => (
        <div
          key={part.label}
          data-item=""
          className={part.big ? "act-item act-invariant" : "act-item"}
        >
          {/* The `at` values are the step window this part owns, so
              its label is uncovered and its paragraph rises exactly
              as the part takes the frame — not at the top of the
              act, which is where a single act-local offset would put
              all three of them. */}
          <Legend className="mb-2 block" data-in="wipe" data-in-at={(i / 3 + 0.012).toFixed(3)}>
            {part.label}
          </Legend>
          <p
            className={part.big ? "measure m-0 text-[1.02rem]" : "measure m-0 text-[0.98rem]"}
            style={{ color: part.big ? "var(--ink-hi)" : "var(--ink-md)" }}
            data-in="up"
            data-in-at={(i / 3 + 0.05).toFixed(3)}
          >
            {part.body}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ---------------- 03 · the system ---------------- */

/**
 * The rungs a scene's system act walks.
 *
 * A flagship walks its stages and gets a separate architecture act. A
 * supporting scene has less to say about each, so it descends the
 * stages and then the layers in one continuous run — the same data, a
 * different shape of narrative, and no project is given an act it
 * cannot fill.
 */
export function systemRungs(scene: Scene): Rung[] {
  const stages: Rung[] = scene.signature.stages.map((s) => ({
    key: `stage-${s.id}`,
    label: s.label,
    note: s.note,
    gate: s.boundary === true,
    kind: "stage",
  }));
  if (scene.tier === "flagship") return stages;
  return [...stages, ...layerRungs(scene)];
}

function layerRungs(scene: Scene): Rung[] {
  return scene.layers.map((l) => ({
    key: `layer-${l.id}`,
    label: l.name,
    note: l.role,
    gate: false,
    depth: l.depth,
    modules: l.modules,
    kind: "layer" as const,
  }));
}

function SystemAct({ scene }: ActProps) {
  const rungs = systemRungs(scene);
  const stages = rungs.filter((r) => r.kind === "stage");
  const layers = rungs.filter((r) => r.kind === "layer");

  // Two lists rather than one is not cosmetic: a supporting scene
  // often has a stage and a layer with the same name — Stealth
  // F.R.I.D.A.Y. has two of each — and a single run-on list of ten
  // rungs reads as a bug rather than as two views of one system.
  return (
    <div className="act-walk">
      <Legend className="mb-3 block" data-in="wipe" data-in-at="0.01">
        Path through the system
      </Legend>
      <div data-in="rise" data-in-at="0.03">
        <Ladder rungs={stages} connected />
      </div>

      {layers.length > 0 ? (
        <>
          <Legend className="mt-5 mb-2 block" data-in="wipe" data-in-at="0.06">
            Architecture
          </Legend>
          <div data-in="rise" data-in-at="0.08">
            <Ladder rungs={layers} offset={stages.length} connected />
          </div>
        </>
      ) : null}

      <Slot rungs={rungs} />
    </div>
  );
}

/* ---------------- 04 · architecture ---------------- */

function ArchitectureAct({ scene }: ActProps) {
  const repoHref = scene.links.find((l) => l.label === "REPOSITORY")?.href ?? "#";
  const rungs = layerRungs(scene);

  return (
    <div className="act-walk">
      <Legend className="mb-3 block" data-in="wipe" data-in-at="0.01">
        Architecture · {scene.layers.length} layers · request order, top to bottom
      </Legend>
      <div data-in="rise" data-in-at="0.03">
        <Ladder rungs={rungs} connected />
      </div>
      <Slot rungs={rungs} />

      <p className="mt-4 mb-0 text-[0.8rem]" data-in="rise" data-in-at="0.6">
        <a href={repoHref} className="rule-in" target="_blank" rel="noreferrer">
          Read these files in the repository
        </a>
      </p>
    </div>
  );
}

/* ---------------- 05 · the hard part ---------------- */

function ChallengeAct({ scene }: ActProps) {
  return (
    <div className={scene.tier === "flagship" ? "plate p-6 md:p-8" : "panel p-5 md:p-7"}>
      <Legend className="mb-2 block" data-in="wipe" data-in-at="0.03">
        The hard part
      </Legend>
      <h3 className="t-section mt-0 mb-4" data-in="clip" data-in-at="0.09">
        {scene.hardPart.title}
      </h3>
      <p
        className="m-0 max-w-[68ch] text-[0.97rem] leading-[1.6]"
        style={{ color: "var(--ink-md)" }}
        data-in="up"
        data-in-at="0.22"
      >
        {scene.hardPart.body}
      </p>
    </div>
  );
}

/* ---------------- 06 · evidence ---------------- */

function EvidenceAct({ scene }: ActProps) {
  const rungs: Rung[] = scene.readings.map((r) => ({
    key: r.id,
    label: r.label,
    note: r.detail ?? "",
    gate: false,
    kind: "stage",
  }));

  return (
    <div className="act-walk">
      <Legend className="mb-4 block" data-in="wipe" data-in-at="0.01">
        Readings · every figure links to what it was measured from
      </Legend>

      <ol className="act-readings m-0 list-none p-0" data-in="rise" data-in-at="0.04">
        {scene.readings.map((r) => (
          <li key={r.id} data-item="" className="act-item act-reading">
            <Reading reading={r} />
          </li>
        ))}
      </ol>

      {/* The detail for the current reading. Hidden from assistive
          technology because the same sentence is already inside the
          reading's own ground-sample popover, attached to the figure
          it belongs to. */}
      <Slot rungs={rungs} />
    </div>
  );
}

/* ---------------- 07 · resolution ---------------- */

function ResolutionAct({ scene }: ActProps) {
  return (
    <div className="flex flex-col gap-6">
      <div
        className="p-5 md:p-6"
        style={{ borderLeft: "2px solid var(--attributed)", background: "var(--attributed-bg)" }}
        data-in="up"
        data-in-at="0.05"
      >
        <Legend className="mb-2 block">
          <span style={{ color: "var(--attributed)" }}>What is wrong with it</span>
        </Legend>
        <p
          className="m-0 max-w-[68ch] text-[0.95rem] leading-[1.55]"
          style={{ color: "var(--ink-md)" }}
        >
          {scene.limitation}
        </p>
      </div>

      {scene.contribution ? (
        <details
          className="px-4 py-3"
          style={{ border: "1px solid var(--line)" }}
          data-in="rise"
          data-in-at="0.24"
        >
          <summary className="t-legend cursor-pointer" style={{ color: "var(--ink-lo)" }}>
            Exactly what is mine — {scene.contribution.length} items
          </summary>
          <ul className="mt-3 mb-0 flex list-none flex-col gap-2 p-0">
            {scene.contribution.map((c) => (
              <li key={c} className="flex gap-3 text-[0.88rem]" style={{ color: "var(--ink-md)" }}>
                <span
                  aria-hidden="true"
                  className="t-mono shrink-0"
                  style={{ color: "var(--mark)" }}
                >
                  ·
                </span>
                {c}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <div className="flex flex-wrap gap-3" data-in="depth" data-in-at="0.4">
        {scene.links.map((l, i) => (
          <LinkButton key={l.href} href={l.href} rank={i === 0 ? "primary" : "ghost"}>
            {linkLabel[l.label] ?? l.label}
          </LinkButton>
        ))}
      </div>

      {/* The exit beat. The last thing that happens inside a case
          study is the case study saying it is finished — which is
          also the moment the camera has finished pulling back and
          the lattice is whole again. */}
      <p
        className="t-legend m-0 flex items-center gap-3"
        style={{ color: "var(--measured)" }}
        data-in="wipe"
        data-in-at="0.62"
      >
        System complete
        <span aria-hidden="true" className="h-px flex-1" style={{ background: "var(--line)" }} />
        <span style={{ color: "var(--ink-lo)" }}>
          {String(scene.sceneNumber).padStart(2, "0")} / {String(SCENE_COUNT).padStart(2, "0")}
        </span>
      </p>
    </div>
  );
}

/* ---------------- the switch ---------------- */

const BODIES: Record<ActId, (p: ActProps) => React.ReactElement> = {
  intro: IntroAct,
  overview: OverviewAct,
  system: SystemAct,
  architecture: ArchitectureAct,
  challenge: ChallengeAct,
  evidence: EvidenceAct,
  resolution: ResolutionAct,
};

export function ActBody({ id, scene }: ActProps & { id: ActId }) {
  const Body = BODIES[id];
  return <Body scene={scene} />;
}
