/**
 * The evidence layer.
 *
 * Every number rendered on this site flows through these types, and
 * `assertReadings` (data/assert.ts) fails the production build if a
 * reading ships without at least one ground sample behind it.
 *
 * Vocabulary is remote-sensing, deliberately: a READING is a measured
 * figure, a SAMPLE is the artifact it was measured from, and CONFIDENCE
 * is how much of it is honestly Ronit's.
 */

export type SampleKind =
  | "code" // a file in a repository
  | "commit" // a specific commit or range
  | "api" // a GitHub REST response
  | "ci" // a workflow definition
  | "doc" // a README, ADR or specification
  | "deploy" // a live deployment
  | "cert"; // a certification record

export interface Sample {
  label: string;
  href: string;
  kind: SampleKind;
  /** ISO date the link and figure were last re-checked by hand. */
  measuredAt: string;
}

/**
 * How much of the reading is Ronit's own work.
 *  measured   — counted directly from work he authored alone
 *  attributed — real but shared; the interval stays visibly wide
 *  archived   — true, but superseded by later work
 */
export type Confidence = "measured" | "attributed" | "archived";

export interface Reading {
  id: string;
  /** Always rendered in mono, tabular. e.g. "90", "8 / 49", "562" */
  value: string;
  /** Wide + tiny legend beneath the interval. e.g. "COMMITS · SOLE AUTHOR" */
  label: string;
  /** One plain-language line shown inside the sample card. */
  detail?: string;
  confidence: Confidence;
  /** Non-empty. Enforced at build time. */
  samples: Sample[];
}

export interface SceneLink {
  label: "REPOSITORY" | "LIVE" | "SPECIFICATION" | "COMMITS";
  href: string;
}

export interface DecisionRecord {
  id: string;
  title: string;
  context: string;
  options: { option: string; rejected: boolean; reason: string }[];
  decision: string;
  consequence: string;
}

export interface ArchitectureLayer {
  id: string;
  name: string;
  role: string;
  /** Files that actually implement this layer. */
  modules: string[];
  /** Index into the elevation ramp, 0–4. Encodes depth, not decoration. */
  depth: 0 | 1 | 2 | 3 | 4;
}

export interface Scene {
  slug: string;
  /** Scene number in the survey, 1-based. */
  sceneNumber: number;
  name: string;
  subtitle: string;
  oneLiner: string;
  /** The problem, stated before any solution. */
  problem: string;
  /** The single invariant the system had to hold. */
  invariant: string;
  /** How it was approached, one paragraph. */
  approach: string;
  /** The hardest part, and why it was hard. */
  hardPart: { title: string; body: string };
  /** Stated plainly. Every scene has one. */
  limitation: string;
  /** Ownership, in Ronit's own words. Non-negotiable on team work. */
  ownership: string;
  stack: string[];
  layers: ArchitectureLayer[];
  readings: Reading[];
  decisions: DecisionRecord[];
  links: SceneLink[];
  year: string;
  confidence: Confidence;
}

export interface Station {
  date: string;
  title: string;
  detail: string;
  /** Elevation ramp index — encodes the step up in complexity. */
  depth: 0 | 1 | 2 | 3 | 4;
}

export interface Capability {
  group: string;
  items: { name: string; note: string; href: string }[];
}

export interface Principle {
  id: string;
  title: string;
  body: string;
  provenBy: { label: string; href: string }[];
}
