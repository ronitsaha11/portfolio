import type { Reading } from "./types";

const M = "2026-08-27";
const GH = "https://github.com/ronitsaha11";

/**
 * The four readings in the Position section — the site's opening claim,
 * stated as measurements rather than adjectives.
 */
export const positionReadings: Reading[] = [
  {
    id: "pos-depth",
    value: "562",
    label: "Files · one system · one author",
    detail:
      "TerraMind AI, built end to end alone: layered backend, job platform, model registry and a globe rendering engine.",
    confidence: "measured",
    samples: [
      { label: "ronitsaha11/TerramindAI", href: `${GH}/TerramindAI`, kind: "api", measuredAt: M },
      { label: "Contributors → one entry", href: `${GH}/TerramindAI/graphs/contributors`, kind: "api", measuredAt: M },
    ],
  },
  {
    id: "pos-specs",
    value: "9",
    label: "Specs written before the code",
    detail:
      "Architecture volumes committed first, then implemented against across thirteen phase-tagged commits.",
    confidence: "measured",
    samples: [
      { label: "Specification baseline commit", href: `${GH}/TerramindAI/commits/main`, kind: "commit", measuredAt: M },
      { label: "docs/living-earth/specifications", href: `${GH}/TerramindAI/tree/main/docs/living-earth/specifications`, kind: "doc", measuredAt: M },
    ],
  },
  {
    id: "pos-langs",
    value: "4",
    label: "Languages shipped in production code",
    detail:
      "Python, TypeScript, Kotlin and Java — each in a system that runs, not a tutorial.",
    confidence: "measured",
    samples: [
      { label: "TerramindAI · Python, TypeScript", href: `${GH}/TerramindAI`, kind: "code", measuredAt: M },
      { label: "HealthTrack · Kotlin", href: `${GH}/HealthTrack`, kind: "code", measuredAt: M },
      { label: "ecobites · Java, Spring Boot", href: `${GH}/ecobites-food-waste-management`, kind: "code", measuredAt: M },
    ],
  },
  {
    id: "pos-span",
    value: "20",
    label: "Months · static page to platform",
    detail:
      "First commit November 2024 was a static HTML page. July 2026 was a 562-file geospatial platform.",
    confidence: "measured",
    samples: [
      { label: "CARCRAFTERS · Nov 2024", href: `${GH}/CARCRAFTERS/commits/main`, kind: "commit", measuredAt: M },
      { label: "TerramindAI · Jul 2026", href: `${GH}/TerramindAI/commits/main`, kind: "commit", measuredAt: M },
    ],
  },
];
