import type { Principle } from "./types";

const TM = "https://github.com/ronitsaha11/TerramindAI";
const HT = "https://github.com/ronitsaha11/HealthTrack";
const PB = "https://github.com/ronitsaha11/pratibimb";
const CG = "https://github.com/Rexy-5097/cartograph";

/** TerraMind's specification baseline, pinned — see scenes/terramind.ts. */
const TM_SPECS = `${TM}/tree/9a623cb535e66f5d210879bdc776968d3278a17f/docs/living-earth/specifications`;

/** Four principles, each with the artifact that proves it. */
export const principles: Principle[] = [
  {
    id: "boundary",
    title: "Draw the boundary before you need it",
    body: "Repositories behind a unit of work, models behind a registry, renderers behind an adapter, a language model behind an evidence bundle it cannot write back through. Not to be clever — because the second implementation always arrives, and by then the code that assumed there would only ever be one is load-bearing.",
    provenBy: [
      { label: "unit_of_work.py", href: `${TM}/blob/main/apps/backend/src/unit_of_work.py` },
      { label: "ai/registry.py", href: `${TM}/blob/main/apps/backend/src/ai/registry.py` },
      { label: "ADR-0007 — no model in the graph", href: `${CG}/blob/main/docs/adr/ADR-0007-no-llm-graph-construction.md` },
    ],
  },
  {
    id: "spec",
    title: "Write the specification first",
    body: "Nine architecture volumes preceded TerraMind's globe engine, committed as their own baseline before a line of it existed. PratiBimb went further: a frozen constitution, twenty-five security invariants and a threat model were merged before the first product package. It is slower for a day and considerably faster after that.",
    provenBy: [
      { label: "Specification baseline, pinned", href: TM_SPECS },
      { label: "PratiBimb architecture constitution", href: `${PB}/blob/main/docs/architecture/constitution.md` },
      { label: "Security invariants INV-01..25", href: `${PB}/blob/main/docs/security/security-invariants.md` },
    ],
  },
  {
    id: "degrade",
    title: "Degrade, don't fail",
    body: "A subtree that renders its own failure beats a white page. A reminder that rebuilds its own schedule after a reboot beats one that quietly disappears. An answer with no model attached beats a feature that needs an API key to do anything at all. The interesting engineering is almost always in what happens when something goes wrong — and the honest version of this principle is that TerraMind has the weakest claim to it of the three, which is why its entry here is an error boundary rather than something grander.",
    provenBy: [
      { label: "ErrorFallback.tsx", href: `${TM}/blob/main/frontend/src/components/feedback/ErrorFallback.tsx` },
      { label: "RescheduleRemindersWorker.kt", href: `${HT}/blob/master/app/src/main/java/com/healthtrack/data/worker/RescheduleRemindersWorker.kt` },
      { label: "cartograph-ask — the degraded path", href: `${CG}/tree/main/crates/cartograph-ask` },
    ],
  },
  {
    id: "record",
    title: "Record the result that goes against you",
    body: "PratiBimb's test vehicle turned out to be blind to the send path it was supposed to be watching — a suite that would have passed while proving nothing. It was merged with the failing verdict attached, the quality gate was marked unsignable, and the blocker went on the repository's front page. A log a stranger cannot reconstruct the reasoning from is not finished, and one that only records the wins is worse than none.",
    provenBy: [
      { label: "agentos/state.md — the amber register", href: `${PB}/blob/main/agentos/state.md` },
      { label: "Confidence policy — priors, not probabilities", href: `${CG}/blob/main/docs/benchmarks/m08-confidence-policy.md` },
      { label: "116 commits, phase-tagged", href: `${TM}/commits/main` },
    ],
  },
];
