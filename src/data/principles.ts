import type { Principle } from "./types";

const TM = "https://github.com/ronitsaha11/TerramindAI";
const HT = "https://github.com/ronitsaha11/HealthTrack";

/** Four principles, each with the artifact that proves it. */
export const principles: Principle[] = [
  {
    id: "boundary",
    title: "Draw the boundary before you need it",
    body: "Repositories behind a unit of work, models behind a registry, renderers behind an adapter. Not to be clever — because the second implementation always arrives, and by then the code that assumed there would only ever be one is load-bearing.",
    provenBy: [
      { label: "unit_of_work.py", href: `${TM}/blob/main/apps/backend/src/unit_of_work.py` },
      { label: "ai/registry.py", href: `${TM}/blob/main/apps/backend/src/ai/registry.py` },
      { label: "RendererAdapter.ts", href: `${TM}/blob/main/frontend/src/features/rendering/RendererAdapter.ts` },
    ],
  },
  {
    id: "spec",
    title: "Write the specification first",
    body: "Nine architecture volumes preceded the globe engine, committed as their own baseline before a line of it existed. The implementation then took five days, because the thinking was already finished. It is slower for a day and considerably faster after that.",
    provenBy: [
      { label: "Specification baseline", href: `${TM}/tree/main/docs/living-earth/specifications` },
      { label: "ROADMAP.md", href: `${TM}/blob/main/ROADMAP.md` },
    ],
  },
  {
    id: "degrade",
    title: "Degrade, don't fail",
    body: "A governor that lowers visual quality beats a frame that drops. A reminder that rebuilds its own schedule after a reboot beats one that quietly disappears. The interesting engineering is almost always in what happens when something goes wrong.",
    provenBy: [
      { label: "PerformanceEngine.ts", href: `${TM}/blob/main/frontend/src/features/performance/PerformanceEngine.ts` },
      { label: "RescheduleRemindersWorker.kt", href: `${HT}/blob/master/app/src/main/java/com/healthtrack/data/worker/RescheduleRemindersWorker.kt` },
    ],
  },
  {
    id: "history",
    title: "Make the history readable",
    body: "Conventional commits mapped to a roadmap, with lint and type failures fixed in their own commits rather than amended away. If a stranger cannot reconstruct the reasoning from the log, the log is not finished.",
    provenBy: [
      { label: "90 commits, phase-tagged", href: `${TM}/commits/main` },
      { label: "CI: Ruff, mypy, ESLint", href: `${TM}/blob/main/.github/workflows/ci.yml` },
    ],
  },
];
