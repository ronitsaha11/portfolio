import type { Reading } from "./types";

const M = "2026-09-20";
const GH = "https://github.com/ronitsaha11";

/**
 * The four readings in the Position section — the site's opening claim,
 * stated as measurements rather than adjectives.
 *
 * Two of the four are deliberately `attributed`. Most of the recent work
 * is shared, and an opening section that quietly counted team commits as
 * sole authorship would undercut the only thing this site is selling.
 */
export const positionReadings: Reading[] = [
  {
    id: "pos-depth",
    value: "464",
    label: "Files · one system · one author",
    detail:
      "TerraMind AI, built end to end alone: layered backend, job platform, model registry and a globe rendering engine. It was 562 files in August; a cleanup pass removed the rest.",
    confidence: "measured",
    samples: [
      { label: "ronitsaha11/TerramindAI", href: `${GH}/TerramindAI`, kind: "api", measuredAt: M },
      { label: "Contributors → one entry", href: `${GH}/TerramindAI/graphs/contributors`, kind: "api", measuredAt: M },
    ],
  },
  {
    id: "pos-langs",
    value: "5",
    label: "Languages shipped in production code",
    detail:
      "Python, TypeScript, Kotlin, Java and Rust — each in a system that runs, not a tutorial.",
    confidence: "measured",
    samples: [
      { label: "TerramindAI · Python, TypeScript", href: `${GH}/TerramindAI`, kind: "code", measuredAt: M },
      { label: "HealthTrack · Kotlin", href: `${GH}/HealthTrack`, kind: "code", measuredAt: M },
      { label: "ecobites · Java, Spring Boot", href: `${GH}/ecobites-food-waste-management`, kind: "code", measuredAt: M },
      { label: "Cartograph · Rust", href: "https://github.com/Rexy-5097/cartograph/commits/main?author=ronitsaha11", kind: "commit", measuredAt: M },
    ],
  },
  {
    id: "pos-review",
    value: "66 / 125",
    label: "Merged pull requests · reviewed work",
    detail:
      "Across PratiBimb and Cartograph, the two systems built with other people. Sixty-six of the merged pull requests on those repositories are mine — the rest are not, which is the point of showing the denominator.",
    confidence: "attributed",
    samples: [
      { label: "PratiBimb · merged PRs, mine", href: `${GH}/pratibimb/pulls?q=is%3Apr+is%3Amerged+author%3Aronitsaha11`, kind: "api", measuredAt: M },
      { label: "Cartograph · merged PRs, mine", href: "https://github.com/Rexy-5097/cartograph/pulls?q=is%3Apr+is%3Amerged+author%3Aronitsaha11", kind: "api", measuredAt: M },
    ],
  },
  {
    id: "pos-span",
    value: "22",
    label: "Months · static page to systems work",
    detail:
      "First commit November 2024 was a static HTML page. September 2026 is a Rust architecture engine and an on-device privacy pipeline.",
    confidence: "measured",
    samples: [
      { label: "CARCRAFTERS · Nov 2024", href: `${GH}/CARCRAFTERS/commits/main`, kind: "commit", measuredAt: M },
      { label: "PratiBimb · Sep 2026", href: `${GH}/pratibimb/commits/main`, kind: "commit", measuredAt: M },
    ],
  },
];
