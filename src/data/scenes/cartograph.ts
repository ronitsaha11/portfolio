import type { Scene } from "../types";

/**
 * Cartograph.
 *
 * Ronit's repository is a fork; `Rexy-5097/cartograph` is upstream and
 * canonical, and both point at the same commit. Every link below goes to
 * upstream, because that is where the code lives and where a reader
 * should check it. The milestone split is the honest unit of ownership
 * here: the engine is Soumyadeb Tripathy's, and every surface a human or
 * an agent touches is Ronit's.
 */

const REPO = "https://github.com/Rexy-5097/cartograph";
const FORK = "https://github.com/ronitsaha11/Cartograph";
const BLOB = `${REPO}/blob/main`;
const TREE = `${REPO}/tree/main`;
const M = "2026-09-20";

export const cartograph: Scene = {
  slug: "cartograph",
  sceneNumber: 2,
  name: "Cartograph",
  subtitle: "Architectural intelligence engine",
  category: "Static analysis · Graphs",
  tier: "flagship",

  oneLiner:
    "Follow a TypeScript click handler across an HTTP boundary into a Python route, through an ORM model, to the database table it writes — with the evidence for every hop attached to the edge.",

  status:
    "v0.1.0 public, milestone M15 accepted. CLI, desktop app, blast radius, structural diff, the GitHub PR reviewer and the MCP server all ship; M16 — explanation over subgraph evidence — is in progress.",

  problem:
    "Every tool in this category draws a file-level import graph and calls it architecture. Ask one what a checkout button touches and it answers with the files that import each other. That is a lexical fact, and the question was a causal one. The gap between them is where production incidents live — and closing it means partially evaluating dynamically constructed URLs, normalising four route-declaration dialects and resolving ORM models to tables, which are compiler problems no API call can answer.",

  invariant:
    "No edge exists without the evidence for it. `Edge` has no `Default`, no public fields and one constructor that requires source, target, kind, confidence, provenance, evidence, source location and commit — so an unevidenced relationship cannot be constructed, let alone stored.",

  approach:
    "One Rust core, three clients. The core owns the domain model, the graph, tree-sitter extraction and the resolver; the CLI, the desktop app and the MCP server are peers that hold no analysis logic, which is checked by a quality gate rather than left to discipline. My work is the client half and the AI boundary: I built the desktop application on Tauri v2 with the graph rendered by Sigma over Graphology, then blast radius and structural diff as core traversals surfaced identically through CLI and desktop, then the GitHub Action that posts an architecture review on pull requests, then the MCP server over stdio with a session authorization boundary — and then the ASK boundary, where an evidence bundle, a degraded path that answers with no model at all, tracing-layer redaction and a per-repository opt-in all exist before any provider does.",

  hardPart: {
    title: "Giving a language model a seat that cannot reach the graph",
    body:
      "ADR-0007 makes it immutable that no model ever constructs graph structure. A model may explain a subgraph after static analysis has produced it; it may never propose an edge. Honouring that while still shipping an AI feature means the interesting work is all boundary design rather than prompting. ASK receives an evidence bundle assembled from the graph, not the repository, so there is no path by which a provider can see source it was not given. The degraded answer — the response with no model attached — was built in the first slice, before any provider existed, so the feature is useful with no API key and the model is genuinely optional rather than nominally so. Redaction sits in the tracing layer, so a value cannot be logged by a call site that forgot; credentials live in the OS keychain and reach the process as a grant in argv rather than a file on disk; and the provider transport is a seam, so the Groq wire types are an implementation behind it instead of the shape of the feature.",
  },

  limitation:
    "The accuracy figures are upper bounds and the report says so: 24.9% of edges could not be verified from source, and that quarter concentrates where the evidence is weakest rather than falling randomly. Confidence values are uncalibrated priors, not probabilities, and must not be thresholded as if they were — calibration error runs at 0.18 toward under-confidence. Only TypeScript, TSX and Python are extracted. The desktop shell is outside the cargo workspace and so outside `cargo test --workspace`, and its CI job runs on Linux and macOS only, which is the price of keeping the gates buildable without a system webview.",

  ownership:
    "Contributor to a project led by Soumyadeb Tripathy. 57 of 217 commits and 41 of 58 merged pull requests are mine. The analysis engine — parser, resolver, graph and calibration, milestones M00 to M10 — is not mine; milestones M11 to M16 are.",

  contribution: [
    "M11 — the Tauri v2 desktop application: the Rust layout contract, repository lifecycle, the Sigma-over-Graphology renderer and edge evidence inspection",
    "M12 — blast radius: the core traversal, the CLI command and the desktop surface",
    "M13 — structural diff branch against branch, stable cross-run node identity and a mental-map-stable layout",
    "M14 — the GitHub Action that renders an architecture review as Markdown and posts it on pull requests",
    "M15 — the MCP server over stdio, the session authorization boundary, and extracting trace traversal into the graph crate",
    "M16 — the ASK boundary: the evidence bundle, the degraded answer with no model, tracing-layer redaction, the per-repository opt-in and credential boundary, and the provider transport seam",
  ],

  stack: [
    "Rust 1.97",
    "tree-sitter",
    "petgraph",
    "redb",
    "Tauri v2",
    "React 19",
    "Sigma.js · Graphology",
    "TypeScript",
    "Model Context Protocol",
    "criterion",
    "GitHub Actions",
  ],

  layers: [
    {
      id: "clients",
      name: "Clients",
      role: "Mine, except the CLI. Desktop (M11), MCP server (M15) and the GitHub reviewer (M14) are peers of one graph API and hold no analysis logic — enforced by QG-006, not by convention.",
      modules: ["crates/cartograph-desktop", "crates/cartograph-mcp", "desktop/src/GraphView.tsx"],
      depth: 4,
    },
    {
      id: "ask",
      name: "ASK boundary",
      role: "Mine. Evidence bundle, the degraded answer, the credential boundary and the provider transport seam. No model may propose an edge — ever.",
      modules: ["crates/cartograph-ask", "desktop/src/ask.ts"],
      depth: 3,
    },
    {
      id: "graph",
      name: "Graph",
      role: "The architecture graph over petgraph, traversal, layout, blast radius and structural diff. The crate is shared; M12 and M13 within it are mine.",
      modules: ["crates/cartograph-graph", "crates/cartograph-pipeline"],
      depth: 2,
    },
    {
      id: "resolver",
      name: "Resolver",
      role: "Not mine. Canonical routes, route matching, partial evaluation of dynamic URLs and ORM model resolution — the compiler problems the product exists to solve.",
      modules: ["crates/cartograph-resolver"],
      depth: 1,
    },
    {
      id: "core",
      name: "Core and parser",
      role: "Not mine. The domain model — nodes, edges, evidence, provenance, confidence — and tree-sitter extraction for TypeScript, TSX and Python.",
      modules: ["crates/cartograph-core", "crates/cartograph-parser"],
      depth: 0,
    },
  ],

  signature: {
    formation: "crossstack",
    ramp: 2,
    nodes: 217,
    stages: [
      { id: "source", label: "Source", note: "A TypeScript call site. tree-sitter reports observed syntax, never a resolved relationship." },
      { id: "symbol", label: "Symbol graph", note: "Symbols, imports, call sites and template structure, per language." },
      { id: "canonical", label: "Canonical route", note: "/orders/:id, /orders/{id} and /orders/<int:id> all become the shape /orders/{*}." },
      {
        id: "http",
        label: "HTTP boundary",
        note: "The cross-language join. Ambiguous candidates produce no edge rather than a guess.",
        boundary: true,
      },
      { id: "handler", label: "Handler", note: "The Python route that answers it, matched on method and every path segment." },
      { id: "orm", label: "ORM model", note: "Model construction resolved back to the class that declares the mapping." },
      { id: "table", label: "Table", note: "The database table the model writes. Three domains crossed: code, HTTP and data." },
    ],
  },

  readings: [
    {
      id: "cg-commits",
      value: "57 / 217",
      label: "Commits · attributed",
      detail:
        "The interval stays wide. Measured against upstream, which my repository is a fork of and currently identical to.",
      confidence: "attributed",
      samples: [
        { label: "Contributors — three entries", href: `${REPO}/graphs/contributors`, kind: "api", measuredAt: M },
        { label: "My commits, filtered", href: `${REPO}/commits/main?author=ronitsaha11`, kind: "commit", measuredAt: M },
      ],
    },
    {
      id: "cg-milestones",
      value: "M11–M16",
      label: "Milestones · mine",
      detail:
        "Desktop, blast radius, structural diff, the GitHub reviewer, the MCP server and the ASK boundary. Each has a gate, a pull request and an immutable acceptance tag.",
      confidence: "attributed",
      samples: [
        { label: "ROADMAP — milestone status table", href: `${BLOB}/ROADMAP.md`, kind: "doc", measuredAt: M },
        { label: "project-state.yaml — the authoritative record", href: `${BLOB}/agentos/artifacts/project-state.yaml`, kind: "doc", measuredAt: M },
      ],
    },
    {
      id: "cg-prs",
      value: "41 / 58",
      label: "Merged pull requests",
      detail:
        "Every milestone I own landed as a reviewed pull request with a gate, not as a direct push.",
      confidence: "attributed",
      samples: [
        { label: "Merged PRs, filtered to me", href: `${REPO}/pulls?q=is%3Apr+is%3Amerged+author%3Aronitsaha11`, kind: "api", measuredAt: M },
      ],
    },
    {
      id: "cg-edges",
      value: "14932",
      label: "Edges measured · 7 repositories",
      detail:
        "Superset, PostHog, Zulip, Onyx, Airflow, AutoGPT and the FastAPI full-stack template, pinned at fixed commits. One false positive among 11,221 independently verified edges — and 24.9% that could not be verified at all.",
      confidence: "attributed",
      samples: [
        { label: "M08 calibration report", href: `${BLOB}/docs/benchmarks/m08-report.md`, kind: "doc", measuredAt: M },
        { label: "Confidence policy — priors, not probabilities", href: `${BLOB}/docs/benchmarks/m08-confidence-policy.md`, kind: "doc", measuredAt: M },
      ],
    },
    {
      id: "cg-adrs",
      value: "21",
      label: "Architecture decision records",
      detail:
        "Including ADR-0007, which makes it immutable that no language model ever constructs graph structure.",
      confidence: "attributed",
      samples: [{ label: "docs/adr", href: `${TREE}/docs/adr`, kind: "doc", measuredAt: M }],
    },
  ],

  decisions: [
    {
      id: "cg-adr-noedge",
      title: "The model explains the graph; it never proposes an edge",
      context:
        "Cartograph's differentiator is that every relationship carries evidence. A language model can produce a plausible edge with no evidence at all, and a single such edge would make the whole graph's evidence claim meaningless.",
      options: [
        {
          option: "Let the model propose edges the resolver could not find",
          rejected: true,
          reason: "Recall would improve and the product's one claim would be destroyed. An unevidenced edge is indistinguishable from a wrong one.",
        },
        {
          option: "Let it propose edges, flagged as low confidence",
          rejected: true,
          reason: "A flag is a convention. Conventions get dropped downstream, and the confidence values are already documented as uncalibrated priors.",
        },
        {
          option: "Deterministic analysis first, evidence second, inference third, the model last and never in the graph",
          rejected: false,
          reason: "Makes it structural. The model reads an evidence bundle assembled from the graph and cannot write back to it.",
        },
      ],
      decision:
        "ADR-0007 states it as an immutable architectural principle rather than a current limitation. ASK is downstream of the graph by construction.",
      consequence:
        "The AI feature is strictly explanatory and the graph stays checkable. The upside is that answering with no model is a legitimate mode, which is why the degraded path was the first slice built rather than a fallback added later.",
    },
    {
      id: "cg-adr-desktop",
      title: "The desktop shell sits outside the cargo workspace",
      context:
        "Tauri links a system webview. No milestone from M00 to M10 had ever needed GUI libraries to be present for the gates to run, and the gates are what make a milestone complete.",
      options: [
        {
          option: "Add the Tauri crate to the workspace",
          rejected: true,
          reason: "Every existing gate would then need a webview installed to build. Ten milestones of CI would become dependent on a GUI toolchain.",
        },
        {
          option: "Put the analysis logic in the shell so it has something to test",
          rejected: true,
          reason: "Directly violates the rule that clients hold no analysis logic, and would have been the third copy of it.",
        },
        {
          option: "Keep the shell outside, and make it short enough that the gap does not matter",
          rejected: false,
          reason: "`cartograph-desktop` holds validation, orchestration and the error contract with no Tauri dependency, so the workspace gates still cover the logic.",
        },
      ],
      decision:
        "ADR-0016 draws the boundary: the shell is two commands long, the logic lives in a Tauri-free crate inside the workspace, and a separate CI job builds the shell on Linux and macOS.",
      consequence:
        "The shell is not covered by `cargo test --workspace`, and Windows is not covered by its CI job. Both are stated in the changelog rather than left for someone to discover.",
    },
    {
      id: "cg-adr-grant",
      title: "Identity arrives as a grant in argv, not from the environment",
      context:
        "The MCP server is launched by an agent host and asked to answer questions about a repository. It has to know which repository it is authorised for, and it must not be persuadable by anything it reads.",
      options: [
        {
          option: "Infer the repository from the working directory",
          rejected: true,
          reason: "The process's own cwd is not an authorisation. Whoever launched it decides, not wherever it happens to be standing.",
        },
        {
          option: "Read a credential file from disk",
          rejected: true,
          reason: "Puts a secret on disk for a process whose privacy claim is that nothing leaves the machine. Credentials belong in the OS keychain.",
        },
        {
          option: "Require an explicit grant at launch",
          rejected: false,
          reason: "The authorisation is supplied by the launcher, is visible in the process's own arguments, and a tree that was not granted is refused.",
        },
      ],
      decision:
        "A session authorization boundary takes a grant in argv. A repository this session was not granted is refused, and identity is grant-supplied rather than derived.",
      consequence:
        "The host has to be explicit, which is slightly more configuration. In exchange, there is no ambient state from which the server can be talked into answering about the wrong tree.",
    },
  ],

  links: [
    { label: "REPOSITORY", href: REPO },
    { label: "BENCHMARK", href: `${BLOB}/docs/benchmarks/m08-report.md` },
    { label: "ROADMAP", href: `${BLOB}/ROADMAP.md` },
    { label: "COMMITS", href: `${REPO}/commits/main?author=ronitsaha11` },
  ],

  year: "2026",
  confidence: "attributed",
};

/** Ronit's fork. Same commit as upstream; kept so the link resolves. */
export const cartographFork = FORK;
