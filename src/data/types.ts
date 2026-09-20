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
  | "ci" // a workflow definition or run
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

export type SceneLinkLabel =
  | "REPOSITORY"
  | "LIVE"
  | "SPECIFICATION"
  | "COMMITS"
  | "DOCUMENTATION"
  | "BENCHMARK"
  | "ROADMAP";

export interface SceneLink {
  label: SceneLinkLabel;
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

/**
 * Which lattice formation a scene owns.
 *
 * The single WebGL scene behind the page morphs between these as you
 * scroll, so a scene's formation is data rather than a hard-coded branch
 * inside the renderer. Adding a scene with `formation: "stack"` gets the
 * layer-stack treatment with no change to the 3D code at all.
 *
 *   stack       layers a request descends through
 *   pipeline    an ordered chain with a boundary partway along it
 *   crossstack  tiers joined by edges that cross a language boundary
 *   orbit       a core with satellites around it
 *   ledger      rows of durable records that survive a restart
 *   mesh        peers coordinating without a centre
 */
export type Formation = "stack" | "pipeline" | "crossstack" | "orbit" | "ledger" | "mesh";

/**
 * A scene's own visual identity.
 *
 * Every project reads differently because the system it describes is
 * different — not because the card was given another hue. `formation`
 * decides the 3D behaviour, `nodes` and `edges` its density, and
 * `stages` is the semantic fallback: the same structure as prose, always
 * present in the DOM whether or not WebGL ever loads.
 */
export interface SceneSignature {
  formation: Formation;
  /** Elevation-ramp index the scene's accents are drawn from. */
  ramp: 0 | 1 | 2 | 3 | 4;
  /** Node count at desktop density. Halved on mobile. */
  nodes: number;
  /**
   * The accessible reading of the 3D scene. Rendered as an ordered list
   * beside the canvas — never hidden, never a replacement shown only
   * when WebGL fails.
   */
  stages: { id: string; label: string; note: string; boundary?: boolean }[];
}

/** Where a project sits in the hierarchy. Composition follows from this. */
export type Tier = "flagship" | "supporting";

export interface Scene {
  slug: string;
  /** Scene number in the survey, 1-based. */
  sceneNumber: number;
  name: string;
  subtitle: string;
  /** One or two words. Drives the index filter chips. */
  category: string;
  tier: Tier;
  oneLiner: string;
  /**
   * Where the project actually is, in its own words. Never "complete"
   * unless the repository says so.
   */
  status: string;
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
  /**
   * What specifically is his, where ownership is partial. Omitted when
   * `ownership` already says "sole author" and there is nothing to split.
   */
  contribution?: string[];
  stack: string[];
  layers: ArchitectureLayer[];
  signature: SceneSignature;
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
