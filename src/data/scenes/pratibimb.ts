import type { Scene } from "../types";

/**
 * PratiBimb.
 *
 * Every claim below is traceable to the repository. Where the
 * repository's own prose is out of date — the README and `agentos/state.md`
 * both still say "no product code has been written", which stopped being
 * true around 2026-09-11 — the tree and the W2 bootstrap record are
 * treated as authoritative and the discrepancy is stated rather than
 * quietly resolved in the project's favour.
 */

const REPO = "https://github.com/ronitsaha11/pratibimb";
const BLOB = `${REPO}/blob/main`;
const TREE = `${REPO}/tree/main`;
const M = "2026-09-20";

export const pratibimb: Scene = {
  slug: "pratibimb",
  sceneNumber: 1,
  name: "PratiBimb",
  subtitle: "On-device visual perception for browser agents",
  category: "Privacy · Perception",
  tier: "flagship",

  oneLiner:
    "A browser agent that can see your screen and act on it without your screen ever reaching the server. Sensitive spans leave as typed placeholders; the client substitutes the real value at the instant of execution.",

  status:
    "Phase 1, week 2. Five TypeScript packages and an MV3 extension host exist and are tested; no model has been adopted and every cell of the feasibility matrix is still UNKNOWN.",

  problem:
    "The obvious build — screenshot, blur the faces, send it to a vision model — fails the moment you try to use it. Black out the user's phone number and the server can no longer instruct the agent to type the phone number. Privacy has eaten the product. Redaction that is merely destructive turns a working agent into a blind one, and that is the gap the problem statement actually leaves open.",

  invariant:
    "Nothing crosses the wire until the verifier passes, and nothing executes until both the allowlist and the freshness check pass. A literal that matches a value held in the vault is treated as a leak and halts the session.",

  approach:
    "A twelve-stage pipeline with two gates in it. Six local stages surround a single server call: observe, perceive, sanitize, verify — then the server reasons and plans — then validate, refresh, re-hydrate, act, verify the result. Stage 4 is the egress gate and stages 7 and 8 together are the execution gate; no stage may be removed, reordered or made conditional. Every sensitive span becomes a typed placeholder carrying the shape of the data without its content, so the server sees that there is a twelve-digit numeric field labelled Aadhaar at a known coordinate and can plan around it. The real value lives in a memory-only vault the client alone can read. Every model role sits behind a frozen typed interface, so a model is a replaceable component and the architecture is not wired around any particular one.",

  hardPart: {
    title: "The test vehicle was measurably blind to the send path",
    body:
      "The whole project rests on one claim: nothing leaves the machine unverified. Proving it needs a harness that can observe the extension's egress — and the spike that checked this returned a worse answer than the question. Playwright's `context.route()` does not cover the MV3 offscreen document, which the constitution makes the send path. Under a route handler set to abort everything, the offscreen POST still reached the wire, in three runs of three. A suite written that way would assert zero outbound requests, pass, and prove nothing at all. The finding was recorded as a blocker rather than worked around, the quality gate was marked unsignable on the existing plan, and the follow-up attached CDP to the offscreen target with an independent loopback collector — which observes, genuinely blocks, detects an unauthorised sender by absent provenance, and caught a tampered payload by recomputing its hash.",
  },

  limitation:
    "Nothing is proven about any model. All twenty cells of the feasibility matrix are UNKNOWN, no model has been downloaded or run, and every latency figure in the dossier is a budget rather than a measurement. The Firefox spike that gates cross-browser parity is still blocked. The README and `agentos/state.md` both describe a Phase 0 repository with no product code, which the tree contradicts — the docs are behind the code, and that is a real defect on a project whose entire argument is that claims must be checked.",

  ownership:
    "Two-person team. 168 of 274 commits and 25 merged pull requests are mine; Lakshya172 wrote the rest. I own the repository, the engineering governance layer and the review process, and I merge.",

  contribution: [
    "The AgentOS engineering layer: seven specialist reviewer contracts, four workflows, quality gates QG-01 to QG-06, and the model registry and feasibility matrix",
    "The frozen contracts — architecture constitution, twenty-five security invariants, threat model, coordinate contract, redaction manifest and action schema",
    "The W1 to W2 handoff: evidence index, artifact manifest, repository inventory, reproduction guide and the preflight verifier",
    "Repository CI — governance verification, secret and PII-shape scanning, dossier integrity, conventional-commit enforcement and the spike-phase guard on apps/ and packages/",
    "Review and merge of the perception, agent, security and transport packages",
  ],

  stack: [
    "TypeScript (strict)",
    "WXT · Chrome MV3",
    "ONNX Runtime Web",
    "WebGPU / WASM SIMD",
    "Vitest",
    "Playwright + CDP",
    "Python",
    "FastAPI",
    "vLLM · Qwen3-VL",
  ],

  layers: [
    {
      id: "perception",
      name: "Perception",
      role: "Capture, preprocessing, the UI detector head, the element graph and DOM/vision fusion. The largest package and the highest-risk interface in the project.",
      modules: [
        "packages/perception/src/capture.ts",
        "packages/perception/src/fusion.ts",
        "packages/perception/src/uiDetectorHead.ts",
      ],
      depth: 4,
    },
    {
      id: "security",
      name: "Security",
      role: "The CSP contract, the WASM capability gate and the ONNX Runtime pin — the runtime asset is hash-pinned and checked in CI.",
      modules: [
        "packages/security/src/csp.ts",
        "packages/security/src/wasmCapability.ts",
        "packages/security/src/ortRuntimePin.ts",
      ],
      depth: 3,
    },
    {
      id: "agent",
      name: "Agent",
      role: "The execution gate. Action freshness, hit-test agreement, the dispatch permit and result verification — nothing executes without all four.",
      modules: [
        "packages/agent/src/guardedAct.ts",
        "packages/agent/src/actionFreshness.ts",
        "packages/agent/src/permit.ts",
      ],
      depth: 2,
    },
    {
      id: "transport",
      name: "Transport",
      role: "Typed page-transport contracts, a stateless service-worker router, and observation bound to one attested document.",
      modules: [
        "packages/extension-transport/src/swRouter.ts",
        "packages/extension-transport/src/pageAgent.ts",
        "packages/extension-transport/src/coreTransport.ts",
      ],
      depth: 1,
    },
    {
      id: "evaluation",
      name: "Evaluation",
      role: "The measurement harness — dataset, generator, labels, baselines and the threshold rule. Built in week two, as the principles require, not week six.",
      modules: [
        "packages/evaluation/src/evaluator.ts",
        "packages/evaluation/src/dataset.ts",
        "packages/evaluation/src/baselines.ts",
      ],
      depth: 0,
    },
  ],

  signature: {
    formation: "pipeline",
    ramp: 0,
    nodes: 168,
    stages: [
      { id: "observe", label: "Observe", note: "Capture the visible tab plus the DOM." },
      { id: "perceive", label: "Perceive", note: "Elements, roles and faces, on the device." },
      { id: "sanitize", label: "Sanitize", note: "Detect sensitive spans and replace each with a typed placeholder." },
      {
        id: "verify",
        label: "Verify",
        note: "The egress gate. Fail-closed — the verifier can block a send, and is never advisory.",
        boundary: true,
      },
      { id: "reason", label: "Reason", note: "The server plans over a redacted frame. Untrusted with respect to PII." },
      { id: "plan", label: "Plan", note: "An action returned as JSON, addressed in placeholders." },
      { id: "validate", label: "Validate", note: "Checked against a local allowlist. The client never trusts the server." },
      { id: "refresh", label: "Refresh", note: "Is the target still real? Role, name, visibility and position re-checked against the live page." },
      { id: "rehydrate", label: "Re-hydrate", note: "The vault substitutes the real value. Memory-only, destroyed on origin change." },
      { id: "act", label: "Act", note: "Execute against the page." },
      { id: "verify-result", label: "Verify result", note: "Confirm the postcondition held." },
      { id: "repeat", label: "Repeat or ask", note: "Continue, or stop and ask the user." },
    ],
  },

  readings: [
    {
      id: "pb-commits",
      value: "168 / 274",
      label: "Commits · attributed",
      detail:
        "A two-person team. The interval stays wide because the ownership genuinely is partial — Lakshya172 wrote the other 106.",
      confidence: "attributed",
      samples: [
        { label: "Contributors — two entries", href: `${REPO}/graphs/contributors`, kind: "api", measuredAt: M },
        { label: "My commits, filtered", href: `${REPO}/commits/main?author=ronitsaha11`, kind: "commit", measuredAt: M },
      ],
    },
    {
      id: "pb-tests",
      value: "806",
      label: "Tests passing · two machines",
      detail:
        "41 files, 806 passed, 0 failed, 15 skipped at commit 59ead68 — reproduced in count on a second workstation with a different Node version, which is the only reason the number is worth stating.",
      confidence: "measured",
      samples: [
        {
          label: "W2 bootstrap — independent verification",
          href: `${BLOB}/docs/handoff/w2-bootstrap/2026-09-13-bootstrap.md`,
          kind: "doc",
          measuredAt: M,
        },
        { label: "W1 → W2 handoff evidence index", href: `${BLOB}/docs/handoff/w1-to-w2/evidence-index.md`, kind: "doc", measuredAt: M },
      ],
    },
    {
      id: "pb-invariants",
      value: "25",
      label: "Frozen security invariants",
      detail:
        "INV-01 to INV-25 plus Invariant E, written before the code they constrain and changeable only by an approved ADR.",
      confidence: "measured",
      samples: [
        { label: "docs/security/security-invariants.md", href: `${BLOB}/docs/security/security-invariants.md`, kind: "doc", measuredAt: M },
        { label: "Architecture constitution", href: `${BLOB}/docs/architecture/constitution.md`, kind: "doc", measuredAt: M },
      ],
    },
    {
      id: "pb-experiments",
      value: "44",
      label: "Recorded experiments",
      detail:
        "Every spike pre-registers its protocol and accept/reject criteria before any data exists, and records the verdict even when the verdict is that there is no result.",
      confidence: "measured",
      samples: [{ label: "artifacts/experiments", href: `${TREE}/artifacts/experiments`, kind: "code", measuredAt: M }],
    },
    {
      id: "pb-unknown",
      value: "0 / 20",
      label: "Feasibility cells proven",
      detail:
        "No model has been downloaded or run. All twenty cells are UNKNOWN, and the repository says so on its own front page rather than in a footnote.",
      confidence: "measured",
      samples: [
        { label: "agentos/registry/feasibility-matrix.md", href: `${BLOB}/agentos/registry/feasibility-matrix.md`, kind: "doc", measuredAt: M },
        { label: "agentos/state.md", href: `${BLOB}/agentos/state.md`, kind: "doc", measuredAt: M },
      ],
    },
  ],

  decisions: [
    {
      id: "pb-adr-placeholder",
      title: "Typed placeholders, not destructive redaction",
      context:
        "The problem statement requires that only anonymised data is transmitted, and that the server returns an action the browser agent executes. Those two requirements pull in opposite directions: an agent cannot be told to type a value the server was never shown.",
      options: [
        {
          option: "Black out the sensitive region and send the image",
          rejected: true,
          reason: "The server can no longer address the field it cannot see. Privacy holds and the product stops working.",
        },
        {
          option: "Send the values and trust the server to discard them",
          rejected: true,
          reason: "Makes the privacy claim a policy promise rather than an architectural property. Unverifiable from the client.",
        },
        {
          option: "Replace each span with a typed placeholder and keep the real value client-side",
          rejected: false,
          reason: "The server keeps enough structure to plan and never enough content to identify.",
        },
      ],
      decision:
        "Every sensitive span becomes a placeholder carrying its class and index — the shape of the data, never its content. A memory-only vault holds the real values, and the client substitutes at the instant of execution.",
      consequence:
        "The server is functionally complete and structurally blind. The cost is a re-hydration step that must never run before validation and freshness have both passed, which is why those are separate stages rather than one check.",
    },
    {
      id: "pb-adr-freshness",
      title: "Re-check the target after the screenshot and before the click",
      context:
        "A plan is made from a frame captured some milliseconds ago. Between the capture and the click, the page can swap a benign control for a harmful one, and the coordinates would still be correct.",
      options: [
        {
          option: "Trust the coordinates from the frame the plan was made on",
          rejected: true,
          reason: "Leaves an exploitable window in which the page rewrites the target under a valid plan.",
        },
        {
          option: "Re-capture and re-plan before every action",
          rejected: true,
          reason: "Doubles the server round trips and the latency budget, for a check that is local and cheap.",
        },
        {
          option: "Re-validate the target against the live DOM immediately before dispatch",
          rejected: false,
          reason: "Local, fast, and it closes the window without another model call.",
        },
      ],
      decision:
        "Stage 8 re-checks that the element still exists, that its role and accessible name still match what was reported to the server, that it is visible and enabled, and that its bounding box has not moved beyond tolerance. A failure discards the plan and re-observes.",
      consequence:
        "The agent occasionally throws away a valid plan and starts again. It never guesses, and it never clicks a control that was substituted after the frame was taken.",
    },
    {
      id: "pb-adr-harness",
      title: "Record the spike that invalidated the test plan",
      context:
        "S-01b asked whether Playwright could observe extension egress. The answer was that it cannot see the MV3 offscreen document — the exact path the constitution designates for sending — so the planned test vehicle could not prove the project's central claim.",
      options: [
        {
          option: "Keep the Playwright suite; it passes",
          rejected: true,
          reason: "It passes by not observing anything. A green suite that cannot fail is worse than no suite, because it stops people looking.",
        },
        {
          option: "Move the send path somewhere Playwright can see",
          rejected: true,
          reason: "Changing frozen architecture to suit a test tool is the wrong direction of causation.",
        },
        {
          option: "Record it as a blocker, mark the gate unsignable, and find an instrument that can see the real path",
          rejected: false,
          reason: "The claim is the product. An instrument that cannot measure it has to be replaced, not accommodated.",
        },
      ],
      decision:
        "S-01b was merged with a CONDITIONAL verdict, QG-04 was marked unsignable on the existing enforcement plan, and B-02 was opened. The replacement attaches CDP to the offscreen target with an independent loopback collector.",
      consequence:
        "The project carries a visible amber blocker instead of a green test suite. That is the accurate state, and the register says so on the front page.",
    },
  ],

  links: [
    { label: "REPOSITORY", href: REPO },
    { label: "SPECIFICATION", href: `${BLOB}/docs/architecture/constitution.md` },
    { label: "DOCUMENTATION", href: `${BLOB}/docs/security/security-invariants.md` },
    { label: "COMMITS", href: `${REPO}/commits/main?author=ronitsaha11` },
  ],

  year: "2026",
  confidence: "attributed",
};
